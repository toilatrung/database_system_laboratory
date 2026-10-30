-- =====================================================================
-- CS4420 · Chương 22 — Xử lý truy vấn song song và phân tán (Parallel and Distributed Query Processing)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch22
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH22.01  [repartition: số tuple phải chuyển]  ★☆☆
-- `pd_emp(emp_id, dept_id, salary, node)` đang được chia round-robin trên 3 node (0–2); `pd_dept(dept_id, dname, node)` được chia theo `dept_id % 3`. Để làm partitioned join theo dept_id, ta repartition pd_emp bằng cùng hàm `dept_id % 3`. Trả về một số `moved`: số tuple của pd_emp phải chuyển sang node khác.




-- @ex CH22.02  [partitioned join: join cục bộ]  ★★☆
-- Sau khi repartition pd_emp theo `dept_id % 3`, mỗi node join phần pd_emp của nó với phần pd_dept của nó (pd_dept.node). Trả về `node` và `local_results` (số dòng kết quả join ở node đó), cho cả 3 node 0–2 (kể cả node không có kết quả), sắp theo node. Tổng các local_results phải bằng số dòng của `pd_emp natural join pd_dept`.
-- Gợi ý: generate_series(0, 2) left join.
-- (Thứ tự dòng được chấm.)




-- @ex CH22.03  [repartition vs broadcast]  ★★☆
-- So sánh hai chiến lược cho join pd_emp với pd_dept trên 3 node: (1) repartition pd_emp theo dept_id % 3 (pd_dept đã đúng chỗ) — chi phí là số tuple pd_emp phải chuyển; (2) broadcast pd_dept tới mọi node (giữ nguyên pd_emp) — mỗi tuple pd_dept phải gửi tới 2 node còn lại. Trả về một dòng: `repartition_cost`, `broadcast_cost`, `cheaper` (`repartition` hoặc `broadcast`; nếu bằng nhau ghi `tie`).




-- @ex CH22.04  [partial aggregation: avg]  ★★☆
-- Đề gốc: Exercise 22.2. Describe how partial aggregation can be implemented for the count and avg aggregate functions so as to reduce data transfer.
--
-- Tính lương trung bình mỗi dept_id theo partial aggregation: bước 1, mỗi node (cột `node` hiện tại của pd_emp) tính (dept_id, sum, count) cục bộ; bước 2, gộp các kết quả cục bộ thành avg toàn cục = tổng các sum / tổng các count. Trả về dept_id, `avg_salary` làm tròn 2, sắp theo dept_id. (Kết quả phải giống `avg(salary)` trực tiếp.)
-- (Thứ tự dòng được chấm.)




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




-- @ex CH22.06  [skew sau repartition]  ★★☆
-- Sau khi repartition pd_emp theo `dept_id % 3`, mỗi node nhận bao nhiêu tuple? Trả về một dòng: `max_load` (node nhiều nhất), `min_load` (node ít nhất, tính cả node 0 tuple trong 3 node) và `skew` = max_load / (số tuple / 3), làm tròn 2. Phòng nào gây skew?




-- @ex CH22.07  [band join]  ★★★
-- Đề gốc: Exercise 22.4. Consider join processing with symmetric fragment-and-replicate using range partitioning. How can the evaluation be optimized when the join condition has the form |r.A − s.B| ≤ k, with k a small constant? (|x| is the absolute value of x.) A join with such a condition is called a *band join*.
--
-- `pd_band_r(a)` và `pd_band_s(b)` được range-partition cùng một vector: giá trị 1–10 → mảnh 0, 11–20 → mảnh 1, 21–30 → mảnh 2 (mảnh = `(x − 1) / 10`). Tính band join `|a − b| <= 2`. Trả về các cặp mảnh `(r_part, s_part)` có ít nhất một cặp khớp, cùng số cặp khớp `matches`, sắp theo r_part, s_part. Kiểm tra: |r_part − s_part| luôn ≤ 1.
-- (Thứ tự dòng được chấm.)




-- @ex CH22.08  [Bloom filter]  ★★★
-- Đề gốc: Exercise 22.6. Relation r is stored partitioned and indexed on A, and s is stored partitioned and indexed on B. Consider the join r ⋈[r.B=s.B] s. Relation s is fairly small, but not small enough for asymmetric fragment-and-replicate to be the best choice; r is large, and most r tuples match no s tuple. A hash join can be used, with a semijoin filter to cut down data transfer. Explain how semijoin filtering with Bloom filters would work in this parallel join.
--
-- Mô phỏng semijoin filter bằng Bloom filter 16 bit với hai hàm hash h1(x) = x % 16 và h2(x) = (x * 7) % 16. Bit được bật là mọi h1(b), h2(b) với b trong `pd_bloom_s(b)`. Một tuple của `pd_bloom_r(id, b)` qua bộ lọc nếu cả h1(r.b) và h2(r.b) đều là bit đã bật. Trả về một dòng: `passed` (số tuple r qua bộ lọc — phải gửi đi), `true_matches` (số tuple r thực sự khớp một s.b), `false_positives` (= passed − true_matches) và `total_r`.




-- @ex CH22.09  [outer join song song]  ★★☆
-- Đề gốc: Exercise 22.7 (b). We want to compute the left outer join r ⟕[r.A=s.A] s.
--
-- b. Now r is small and s is a large relation stored partitioned on s.B. Give an efficient parallel algorithm for the same left outer join.
--
-- `pd_lo_r(a, label)` nhỏ được replicate tới mọi node; `pd_lo_s(id, a, val, node)` lớn, đã chia trên 3 node. Theo PE 22.7b: mỗi node tính r ⋈ s[node] và báo về các r.a đã khớp; tuple r không khớp ở node nào thì bù null. Viết truy vấn trả về đúng các tuple được bù null: a, label, và `val` = null. Không dùng outer join: lấy hợp các r.a đã khớp ở từng node rồi loại.




-- @ex CH22.10  [group by không cần repartition]  ★★☆
-- Đề gốc: Exercise 22.8. We want to compute [A,B]γ[sum(C)] on a relation s that is stored partitioned on s.B. The number of distinct s.B values is large and the number of tuples per s.B value is fairly uniform. Explain how to compute it efficiently while minimizing or avoiding repartitioning.
--
-- `pd_sab(id, a, b, c, node)` đang được chia theo b (node = b % 3). Trả về một dòng: `ab_groups_split` — số nhóm (a, b) có tuple nằm trên hơn một node; `a_groups_split` — số nhóm chỉ theo a có tuple nằm trên hơn một node. Từ đó, group by a, b có cần repartition không? group by a thì sao?




-- @ex CH22.11  [MapReduce word count]  ★★☆
-- Mô phỏng MapReduce đếm từ trên `pd_doc(doc_id, body)`. Map: tách body thành các từ (chuyển chữ thường, tách theo mọi ký tự không phải chữ cái a–z), bỏ chuỗi rỗng, phát (word, 1). Reduce: cộng theo word. Trả về word và `cnt`, chỉ các từ xuất hiện ít nhất 2 lần, sắp theo cnt giảm dần rồi word.
-- Gợi ý: regexp_split_to_table(lower(body), '[^a-z]+').
-- (Thứ tự dòng được chấm.)


