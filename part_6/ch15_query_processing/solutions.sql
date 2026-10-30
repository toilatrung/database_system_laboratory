-- =====================================================================
-- CS4420 · Chương 15 — Xử lý truy vấn (Query Processing)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH15.01  [PE 15.1 tạo run]  ★★☆
-- Đề gốc: Exercise 15.1. For simplicity, assume that a block holds exactly one tuple and that memory can hold at most three blocks. Sort the following tuples on their first attribute with the external sort-merge algorithm, and show the runs produced in every pass: (kangaroo, 17), (wallaby, 21), (emu, 1), (wombat, 13), (platypus, 3), (lion, 8), (warthog, 4), (zebra, 11), (meerkat, 6), (hyena, 9), (hornbill, 2), (baboon, 12).
--
-- Bảng `qp_sort_input(pos, name, num)` chứa 12 tuple của PE 15.1, `pos` là thứ tự trong file. Mỗi block một tuple, M = 3. Mô phỏng bước tạo run: mỗi lần đọc 3 tuple liên tiếp (pos 1–3, 4–6, …), sắp theo `name`.
--
-- Trả về `run` (1, 2, …), `k` (vị trí trong run, từ 1) và `name`, sắp theo run, k.
-- Gợi ý: Run của tuple là (pos − 1) / 3 + 1 (chia nguyên); vị trí trong run: row_number() over (partition by … order by name).
-- (Thứ tự dòng được chấm.)
select (pos - 1) / 3 + 1 as run,
       row_number() over (partition by (pos - 1) / 3 order by name) as k,
       name
from qp_sort_input
order by run, k;

-- @ex CH15.02  [PE 15.1 pass merge]  ★★☆
-- Đề gốc: Exercise 15.1. For simplicity, assume that a block holds exactly one tuple and that memory can hold at most three blocks. Sort the following tuples on their first attribute with the external sort-merge algorithm, and show the runs produced in every pass: (kangaroo, 17), (wallaby, 21), (emu, 1), (wombat, 13), (platypus, 3), (lion, 8), (warthog, 4), (zebra, 11), (meerkat, 6), (hyena, 9), (hornbill, 2), (baboon, 12).
--
-- Tiếp CH15.01. Pass merge thứ nhất trộn M − 1 = 2 run liên tiếp (run 1 với 2, run 3 với 4) thành một run mới. Trả về `run`, `k`, `name` của các run sau pass 1, sắp theo run, k.
-- Gợi ý: Run sau pass 1 = ((pos − 1) / 3) / 2 + 1.
-- (Thứ tự dòng được chấm.)
select ((pos - 1) / 3) / 2 + 1 as run,
       row_number() over (partition by ((pos - 1) / 3) / 2 order by name) as k,
       name
from qp_sort_input
order by run, k;

-- @ex CH15.03  [chi phí external sort]  ★★★
-- Bảng `qp_sort_params(case_id, b_r, m, bb)`. Với mỗi case tính chi phí external sort-merge:
-- - `initial_runs` = ⌈b_r / m⌉
-- - `merge_passes`: số pass cần để còn 1 run, mỗi pass trộn tối đa ⌊m / bb⌋ − 1 run (tính chính xác bằng cách lặp, không dùng log số thực)
-- - `transfers` = b_r · (2 · merge_passes + 1)
-- - `seeks` = 2 · ⌈b_r / m⌉ + ⌈b_r / bb⌉ · (2 · merge_passes − 1)
--
-- Trả về case_id, initial_runs, merge_passes, transfers, seeks.
-- Gợi ý: with recursive: bắt đầu với số run ban đầu, mỗi bước runs := ⌈runs / fan_in⌉ cho tới khi runs = 1; merge_passes = số bước.
with recursive merge(case_id, pass, runs, fan_in) as (
  select case_id, 0, ceil(b_r::numeric / m)::int, m / bb - 1 from qp_sort_params
  union all
  select case_id, pass + 1, ceil(runs::numeric / fan_in)::int, fan_in from merge where runs > 1
)
select p.case_id,
       ceil(p.b_r::numeric / p.m)::int as initial_runs,
       max(g.pass) as merge_passes,
       p.b_r * (2 * max(g.pass) + 1) as transfers,
       2 * ceil(p.b_r::numeric / p.m)::int + ceil(p.b_r::numeric / p.bb)::int * (2 * max(g.pass) - 1) as seeks
from qp_sort_params p join merge g using (case_id)
group by p.case_id, p.b_r, p.m, p.bb;

-- @ex CH15.04  [PE 15.3a nested-loop]  ★☆☆
-- Đề gốc: Exercise 15.3 (a). Relations r[1](A, B, C) and r[2](C, D, E) have these properties: r[1] contains 20,000 tuples and r[2] contains 45,000 tuples; one block holds 25 tuples of r[1] or 30 tuples of r[2]. For r[1] ⋈ r[2], estimate the number of block transfers and seeks needed by each join strategy below:
--
-- a. Nested-loop join.
--
-- Bảng `qp_rel_stats(rel, n_tuples, tuples_per_block)` chứa r1, r2 của PE 15.3. Với cả hai cách chọn outer, tính chi phí nested-loop join trường hợp xấu nhất: `transfers` = n[outer] · b[inner] + b[outer], `seeks` = n[outer] + b[outer], với b = ⌈n_tuples / tuples_per_block⌉.
--
-- Trả về outer_rel, inner_rel, transfers, seeks (kiểu số nguyên).
select o.rel as outer_rel, i.rel as inner_rel,
       (o.n_tuples::bigint * ceil(i.n_tuples::numeric / i.tuples_per_block)
          + ceil(o.n_tuples::numeric / o.tuples_per_block))::bigint as transfers,
       (o.n_tuples + ceil(o.n_tuples::numeric / o.tuples_per_block))::bigint as seeks
from qp_rel_stats o join qp_rel_stats i on o.rel <> i.rel;

-- @ex CH15.05  [PE 15.3b block nested-loop]  ★★☆
-- Đề gốc: Exercise 15.3 (b). Relations r[1](A, B, C) and r[2](C, D, E) have these properties: r[1] contains 20,000 tuples and r[2] contains 45,000 tuples; one block holds 25 tuples of r[1] or 30 tuples of r[2]. For r[1] ⋈ r[2], estimate the number of block transfers and seeks needed by each join strategy below:
--
-- b. Block nested-loop join.
--
-- Với r1 làm outer, r2 làm inner (bảng `qp_rel_stats`) và mỗi kích thước bộ nhớ M trong `qp_memory(m)`, tính chi phí block nested-loop join: `transfers` = ⌈b[r1] / (M − 2)⌉ · b[r2] + b[r1], `seeks` = 2 · ⌈b[r1] / (M − 2)⌉.
--
-- Trả về m, transfers, seeks (số nguyên).
with b as (
  select max(ceil(n_tuples::numeric / tuples_per_block)) filter (where rel = 'r1') as b1,
         max(ceil(n_tuples::numeric / tuples_per_block)) filter (where rel = 'r2') as b2
  from qp_rel_stats)
select m,
       (ceil(b1 / (m - 2)) * b2 + b1)::bigint as transfers,
       (2 * ceil(b1 / (m - 2)))::bigint as seeks
from qp_memory, b;

-- @ex CH15.06  [PE 15.3d hash join]  ★★★
-- Đề gốc: Exercise 15.3 (d). Relations r[1](A, B, C) and r[2](C, D, E) have these properties: r[1] contains 20,000 tuples and r[2] contains 45,000 tuples; one block holds 25 tuples of r[1] or 30 tuples of r[2]. For r[1] ⋈ r[2], estimate the number of block transfers and seeks needed by each join strategy below:
--
-- d. Hash join.
--
-- Hash join r1 ⋈ r2 với r1 làm build (nhỏ hơn). Với mỗi M trong `qp_memory`:
-- - `n_h` = ⌈b[r1] / M⌉
-- - `recursive` = true nếu n_h + 1 > M (phải chia partition đệ quy)
-- - `transfers`: nếu không đệ quy = 3(b[r1] + b[r2]) + 4·n_h; nếu đệ quy = 2(b[r1] + b[r2])·⌈log[M−1](b[r1]) − 1⌉ + b[r1] + b[r2]
--
-- Trả về m, n_h, recursive, transfers (số nguyên).
-- Gợi ý: log cơ số M − 1 của x = ln(x) / ln(M − 1).
with b as (
  select max(ceil(n_tuples::numeric / tuples_per_block)) filter (where rel = 'r1') as b1,
         max(ceil(n_tuples::numeric / tuples_per_block)) filter (where rel = 'r2') as b2
  from qp_rel_stats),
h as (select m, ceil(b1 / m)::int as n_h, b1, b2 from qp_memory, b)
select m, n_h, n_h + 1 > m as recursive,
       case when n_h + 1 > m
            then 2 * (b1 + b2) * ceil(ln(b1) / ln(m - 1) - 1) + b1 + b2
            else 3 * (b1 + b2) + 4 * n_h end::bigint as transfers
from h;

-- @ex CH15.07  [PE 15.2 bỏ theta join]  ★★☆
-- Đề gốc: Exercise 15.2. Using the bank database of Figure 15.14 (primary keys underlined), consider the SQL query
--
-- ```sql
-- select T.branch_name
-- from branch T, branch S
-- where T.assets > S.assets and S.branch_city = 'Brooklyn'
-- ```
--
-- Give an efficient relational-algebra expression equivalent to this query, and justify why you chose it.
--
-- *Figure 15.14 — Bank database* (primary keys underlined):
--
-- - branch (branch_name, branch_city, assets)
-- - customer (customer_name, customer_street, customer_city)
-- - loan (loan_number, branch_name, amount)
-- - borrower (customer_name, loan_number)
-- - account (account_number, branch_name, balance)
-- - depositor (customer_name, account_number)
--
-- Bảng `qp_branch(branch_name, branch_city, assets)`. Viết truy vấn tương đương PE 15.2 nhưng không dùng self-join: tên các branch có assets lớn hơn assets của ít nhất một branch ở Brooklyn, mỗi tên một lần.
-- Gợi ý: Lớn hơn ít nhất một giá trị ⇔ lớn hơn giá trị nhỏ nhất.
select branch_name from qp_branch
where assets > (select min(assets) from qp_branch where branch_city = 'Brooklyn');

-- @ex CH15.08  [PE 15.6c phủ định]  ★☆☆
-- Đề gốc: Exercise 15.6 (c). Using the bank database of Figure 15.14 (primary keys underlined), suppose relation *branch* has a B+-tree index on *branch_city* and no other index. List the different ways of evaluating each of the following selections that contain negation:
--
-- c. σ[¬(branch_city branch_name, branch_city, assets)
-- - customer (customer_name, customer_street, customer_city)
-- - loan (loan_number, branch_name, amount)
-- - borrower (customer_name, loan_number)
-- - account (account_number, branch_name, balance)
-- - depositor (customer_name, account_number)
--
-- Viết σ[¬(branch_city < 'Brooklyn' ∨ assets < 5000)](qp_branch) không dùng `not` (áp dụng De Morgan để điều kiện trên branch_city có dạng dùng được B⁺-tree). Trả về branch_name, branch_city, assets.
select branch_name, branch_city, assets
from qp_branch
where branch_city >= 'Brooklyn' and assets >= 5000;

-- @ex CH15.09  [PE 15.10a semijoin]  ★★☆
-- Đề gốc: Exercise 15.10 (a). Consider the extended relational-algebra operators below. For each one, explain how it can be implemented with sorting and with hashing.
--
-- a. Semijoin (⋉[θ]): in the multiset semijoin r ⋉[θ] s, a tuple r[i] occurring n times in r occurs n times in the result if at least one tuple s[j] exists such that r[i] and s[j] satisfy θ; otherwise r[i] does not occur in the result.
--
-- Multiset semijoin `qp_orders ⋉ qp_vip` theo điều kiện `qp_orders.cust = qp_vip.cust`. Cả hai bảng có dòng trùng: kết quả phải giữ đúng số lần lặp của mỗi dòng qp_orders (không bị nhân lên theo số dòng khớp của qp_vip). Trả về cust, item.
-- Gợi ý: Join thường nhân dòng; where exists thì không.
select o.cust, o.item
from qp_orders o
where exists (select * from qp_vip v where v.cust = o.cust);

-- @ex CH15.10  [PE 15.10b anti-semijoin]  ★★☆
-- Đề gốc: Exercise 15.10 (b). Consider the extended relational-algebra operators below. For each one, explain how it can be implemented with sorting and with hashing.
--
-- b. Anti-semijoin (⊳̄[θ]): in the multiset anti-semijoin of r and s, a tuple r[i] occurring n times in r occurs n times in the result if no tuple s[j] of s satisfies θ together with r[i]; otherwise r[i] does not occur in the result.
--
-- Multiset anti-semijoin của `qp_orders` với `qp_blocked` theo điều kiện `qp_orders.cust = qp_blocked.cust`: giữ (đúng số lần) mọi dòng qp_orders mà không có dòng nào của qp_blocked thoả điều kiện. Lưu ý qp_blocked chứa null và qp_orders có một dòng cust null. Trả về cust, item.
-- Gợi ý: Thử `cust not in (select cust from qp_blocked)` để thấy vì sao sai.
select o.cust, o.item
from qp_orders o
where not exists (select * from qp_blocked b where b.cust = o.cust);

-- @ex CH15.11  [PE 15.8 division (hash)]  ★★☆
-- Đề gốc: Exercise 15.8. Design one sorting-based and one hashing-based algorithm for computing the relational division operation (Practice Exercise 2.9 defines division).
--
-- Phép chia `qp_supply(supplier, part) ÷ qp_req_part(part)`: các supplier cung cấp mọi part trong qp_req_part. qp_supply có dòng trùng và có part ngoài danh sách. Viết theo kiểu hash-based: nhóm theo supplier và đếm số part khác nhau thuộc danh sách.
select supplier
from qp_supply
where part in (select part from qp_req_part)
group by supplier
having count(distinct part) = (select count(*) from qp_req_part);

-- @ex CH15.12  [loại trùng bằng sort]  ★★☆
-- Loại trùng theo kiểu sort-based: trả về các cặp (cust, item) khác nhau của `qp_orders` (kể cả dòng cust null) không dùng `distinct`, `group by` hay `union` — sắp theo (cust, item) và chỉ giữ dòng đầu tiên của mỗi nhóm giống nhau.
-- Gợi ý: row_number() over (partition by cust, item) = 1. partition by coi các null là bằng nhau.
select cust, item
from (select cust, item,
             row_number() over (partition by cust, item order by cust, item) as k
      from qp_orders) t
where k = 1;

-- @ex CH15.13  [PE 15.13 ≥ k keyword]  ★★☆
-- Đề gốc: Exercise 15.13. You need the documents that contain at least k of a given set of n keywords. A keyword index is available that returns, for a given keyword, a sorted list of the identifiers of the documents containing it. Give an efficient algorithm that finds the required documents.
--
-- `qp_doc_kw(doc_id, keyword)` là keyword index, `qp_query_kw(keyword)` là n keyword cần tìm. Tìm các document chứa ít nhất k = 3 keyword trong qp_query_kw. Trả về doc_id và `matched` (số keyword khớp).
select d.doc_id, count(*) as matched
from qp_doc_kw d join qp_query_kw q on q.keyword = d.keyword
group by d.doc_id
having count(*) >= 3;

-- @ex CH15.14  [top-K với hoà]  ★☆☆
-- Lấy các account có balance thuộc 2 giá trị cao nhất đầu tiên theo thứ tự của `qp_account` — tức 2 dòng balance cao nhất, nhưng nếu dòng cuối hoà với các dòng sau thì lấy cả các dòng hoà đó. Trả về account_number, balance. (Dùng cú pháp chuẩn SQL cho top-K có hoà.)
-- Gợi ý: order by balance desc fetch first 2 rows with ties.
select account_number, balance
from qp_account
order by balance desc
fetch first 2 rows with ties;

-- @ex CH15.15  [indexed nested-loop]  ★☆☆
-- Indexed nested-loop join r1 ⋈ r2 với r1 làm outer; r2 có B⁺-tree primary index trên thuộc tính join (mỗi tuple r1 khớp tối đa một tuple r2), chiều cao h = 3, nên mỗi lần tra c = h + 1 = 4 block transfer và 4 seek. Từ `qp_rel_stats`, tính `transfers` = b[r1] + n[r1] · 4 và `seeks` = b[r1] + n[r1] · 4 (đọc mỗi block outer cũng tốn một seek trong trường hợp xấu nhất). Trả về một dòng hai cột.
select (ceil(n_tuples::numeric / tuples_per_block) + n_tuples * 4)::bigint as transfers,
       (ceil(n_tuples::numeric / tuples_per_block) + n_tuples * 4)::bigint as seeks
from qp_rel_stats where rel = 'r1';
