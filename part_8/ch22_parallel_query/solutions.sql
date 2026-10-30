-- =====================================================================
-- CS4420 · Chương 22 — Xử lý truy vấn song song và phân tán (Parallel and Distributed Query Processing)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH22.01  [repartition: số tuple phải chuyển]  ★☆☆
-- `pd_emp(emp_id, dept_id, salary, node)` đang được chia round-robin trên 3 node (0–2); `pd_dept(dept_id, dname, node)` được chia theo `dept_id % 3`. Để làm partitioned join theo dept_id, ta repartition pd_emp bằng cùng hàm `dept_id % 3`. Trả về một số `moved`: số tuple của pd_emp phải chuyển sang node khác.
select count(*) as moved from pd_emp where node <> dept_id % 3;

-- @ex CH22.02  [partitioned join: join cục bộ]  ★★☆
-- Sau khi repartition pd_emp theo `dept_id % 3`, mỗi node join phần pd_emp của nó với phần pd_dept của nó (pd_dept.node). Trả về `node` và `local_results` (số dòng kết quả join ở node đó), cho cả 3 node 0–2 (kể cả node không có kết quả), sắp theo node. Tổng các local_results phải bằng số dòng của `pd_emp natural join pd_dept`.
-- Gợi ý: generate_series(0, 2) left join.
-- (Thứ tự dòng được chấm.)
select n.node, count(e.emp_id) as local_results
from generate_series(0, 2) as n(node)
left join (pd_emp e join pd_dept d on d.dept_id = e.dept_id) on d.node = n.node and e.dept_id % 3 = n.node
group by n.node
order by n.node;

-- @ex CH22.03  [repartition vs broadcast]  ★★☆
-- So sánh hai chiến lược cho join pd_emp với pd_dept trên 3 node: (1) repartition pd_emp theo dept_id % 3 (pd_dept đã đúng chỗ) — chi phí là số tuple pd_emp phải chuyển; (2) broadcast pd_dept tới mọi node (giữ nguyên pd_emp) — mỗi tuple pd_dept phải gửi tới 2 node còn lại. Trả về một dòng: `repartition_cost`, `broadcast_cost`, `cheaper` (`repartition` hoặc `broadcast`; nếu bằng nhau ghi `tie`).
with c as (
  select (select count(*) from pd_emp where node <> dept_id % 3) as repartition_cost,
         (select count(*) * 2 from pd_dept) as broadcast_cost
)
select repartition_cost, broadcast_cost,
       case when repartition_cost < broadcast_cost then 'repartition'
            when repartition_cost > broadcast_cost then 'broadcast' else 'tie' end as cheaper
from c;

-- @ex CH22.04  [partial aggregation: avg]  ★★☆
-- Đề gốc: Exercise 22.2. Describe how partial aggregation can be implemented for the count and avg aggregate functions so as to reduce data transfer.
--
-- Tính lương trung bình mỗi dept_id theo partial aggregation: bước 1, mỗi node (cột `node` hiện tại của pd_emp) tính (dept_id, sum, count) cục bộ; bước 2, gộp các kết quả cục bộ thành avg toàn cục = tổng các sum / tổng các count. Trả về dept_id, `avg_salary` làm tròn 2, sắp theo dept_id. (Kết quả phải giống `avg(salary)` trực tiếp.)
-- (Thứ tự dòng được chấm.)
with local_agg as (
  select node, dept_id, sum(salary) as s, count(*) as c
  from pd_emp group by node, dept_id
)
select dept_id, round(sum(s)::numeric / sum(c), 2) as avg_salary
from local_agg
group by dept_id
order by dept_id;

-- @ex CH22.05  [pre-aggregation giảm truyền]  ★★☆
-- Đề gốc: Exercise 22.5. Relation r is stored partitioned and indexed on A, and s is stored partitioned and indexed on B. Consider the query
--
-- [r.C]γ[count(s.D)]((σ[A>5](r)) ⋈[r.B=s.B] s)
--
-- a. Using the exchange operator, give a parallel query plan for the part of the query that contains only the select and join operators.
--
-- b. Extend this plan to compute the aggregate as well, using pre-aggregation to keep data transfer as small as possible.
--
-- c. Skew during aggregation is a serious problem. Explain how the pre-aggregation above can also greatly reduce the effect of skew during aggregation.
--
-- Tính `count(*)` mỗi dept_id, trong đó nhóm của dept_id được tính ở node `dept_id % 3`. Trả về một dòng: `without_preagg` — số tuple phải gửi nếu mỗi node gửi nguyên tuple (các tuple có node ≠ dept_id % 3); `with_preagg` — số tuple phải gửi nếu mỗi node gửi một tuple (dept_id, count cục bộ) cho mỗi dept_id nó có (chỉ tính các cặp (node, dept_id) có node ≠ dept_id % 3).
select (select count(*) from pd_emp where node <> dept_id % 3) as without_preagg,
       (select count(*) from (select distinct node, dept_id from pd_emp) g where node <> dept_id % 3) as with_preagg;

-- @ex CH22.06  [skew sau repartition]  ★★☆
-- Sau khi repartition pd_emp theo `dept_id % 3`, mỗi node nhận bao nhiêu tuple? Trả về một dòng: `max_load` (node nhiều nhất), `min_load` (node ít nhất, tính cả node 0 tuple trong 3 node) và `skew` = max_load / (số tuple / 3), làm tròn 2. Phòng nào gây skew?
with load as (
  select n.node, count(e.emp_id) as cnt
  from generate_series(0, 2) as n(node) left join pd_emp e on e.dept_id % 3 = n.node
  group by n.node
)
select max(cnt) as max_load, min(cnt) as min_load,
       round(max(cnt) / ((select count(*) from pd_emp) / 3.0), 2) as skew
from load;

-- @ex CH22.07  [band join]  ★★★
-- Đề gốc: Exercise 22.4. Consider join processing with symmetric fragment-and-replicate using range partitioning. How can the evaluation be optimized when the join condition has the form |r.A − s.B| ≤ k, with k a small constant? (|x| is the absolute value of x.) A join with such a condition is called a *band join*.
--
-- `pd_band_r(a)` và `pd_band_s(b)` được range-partition cùng một vector: giá trị 1–10 → mảnh 0, 11–20 → mảnh 1, 21–30 → mảnh 2 (mảnh = `(x − 1) / 10`). Tính band join `|a − b| <= 2`. Trả về các cặp mảnh `(r_part, s_part)` có ít nhất một cặp khớp, cùng số cặp khớp `matches`, sắp theo r_part, s_part. Kiểm tra: |r_part − s_part| luôn ≤ 1.
-- (Thứ tự dòng được chấm.)
select (r.a - 1) / 10 as r_part, (s.b - 1) / 10 as s_part, count(*) as matches
from pd_band_r r join pd_band_s s on abs(r.a - s.b) <= 2
group by 1, 2
order by 1, 2;

-- @ex CH22.08  [Bloom filter]  ★★★
-- Đề gốc: Exercise 22.6. Relation r is stored partitioned and indexed on A, and s is stored partitioned and indexed on B. Consider the join r ⋈[r.B=s.B] s. Relation s is fairly small, but not small enough for asymmetric fragment-and-replicate to be the best choice; r is large, and most r tuples match no s tuple. A hash join can be used, with a semijoin filter to cut down data transfer. Explain how semijoin filtering with Bloom filters would work in this parallel join.
--
-- Mô phỏng semijoin filter bằng Bloom filter 16 bit với hai hàm hash h1(x) = x % 16 và h2(x) = (x * 7) % 16. Bit được bật là mọi h1(b), h2(b) với b trong `pd_bloom_s(b)`. Một tuple của `pd_bloom_r(id, b)` qua bộ lọc nếu cả h1(r.b) và h2(r.b) đều là bit đã bật. Trả về một dòng: `passed` (số tuple r qua bộ lọc — phải gửi đi), `true_matches` (số tuple r thực sự khớp một s.b), `false_positives` (= passed − true_matches) và `total_r`.
with bits as (
  select b % 16 as bit from pd_bloom_s
  union
  select (b * 7) % 16 from pd_bloom_s
)
select count(*) filter (where b % 16 in (select bit from bits) and (b * 7) % 16 in (select bit from bits)) as passed,
       count(*) filter (where b in (select b from pd_bloom_s)) as true_matches,
       count(*) filter (where b % 16 in (select bit from bits) and (b * 7) % 16 in (select bit from bits))
         - count(*) filter (where b in (select b from pd_bloom_s)) as false_positives,
       count(*) as total_r
from pd_bloom_r;

-- @ex CH22.09  [outer join song song]  ★★☆
-- Đề gốc: Exercise 22.7 (b). We want to compute the left outer join r ⟕[r.A=s.A] s.
--
-- b. Now r is small and s is a large relation stored partitioned on s.B. Give an efficient parallel algorithm for the same left outer join.
--
-- `pd_lo_r(a, label)` nhỏ được replicate tới mọi node; `pd_lo_s(id, a, val, node)` lớn, đã chia trên 3 node. Theo PE 22.7b: mỗi node tính r ⋈ s[node] và báo về các r.a đã khớp; tuple r không khớp ở node nào thì bù null. Viết truy vấn trả về đúng các tuple được bù null: a, label, và `val` = null. Không dùng outer join: lấy hợp các r.a đã khớp ở từng node rồi loại.
select r.a, r.label, null::varchar as val
from pd_lo_r r
where r.a not in (select distinct r2.a
                  from pd_lo_r r2 join pd_lo_s s on s.a = r2.a
                  group by s.node, r2.a);

-- @ex CH22.10  [group by không cần repartition]  ★★☆
-- Đề gốc: Exercise 22.8. We want to compute [A,B]γ[sum(C)] on a relation s that is stored partitioned on s.B. The number of distinct s.B values is large and the number of tuples per s.B value is fairly uniform. Explain how to compute it efficiently while minimizing or avoiding repartitioning.
--
-- `pd_sab(id, a, b, c, node)` đang được chia theo b (node = b % 3). Trả về một dòng: `ab_groups_split` — số nhóm (a, b) có tuple nằm trên hơn một node; `a_groups_split` — số nhóm chỉ theo a có tuple nằm trên hơn một node. Từ đó, group by a, b có cần repartition không? group by a thì sao?
select (select count(*) from (select a, b from pd_sab group by a, b having count(distinct node) > 1) t) as ab_groups_split,
       (select count(*) from (select a from pd_sab group by a having count(distinct node) > 1) t) as a_groups_split;

-- @ex CH22.11  [MapReduce word count]  ★★☆
-- Mô phỏng MapReduce đếm từ trên `pd_doc(doc_id, body)`. Map: tách body thành các từ (chuyển chữ thường, tách theo mọi ký tự không phải chữ cái a–z), bỏ chuỗi rỗng, phát (word, 1). Reduce: cộng theo word. Trả về word và `cnt`, chỉ các từ xuất hiện ít nhất 2 lần, sắp theo cnt giảm dần rồi word.
-- Gợi ý: regexp_split_to_table(lower(body), '[^a-z]+').
-- (Thứ tự dòng được chấm.)
with mapped as (
  select w as word, 1 as one
  from pd_doc, regexp_split_to_table(lower(body), '[^a-z]+') as w
  where w <> ''
)
select word, sum(one) as cnt
from mapped
group by word
having sum(one) >= 2
order by cnt desc, word;
