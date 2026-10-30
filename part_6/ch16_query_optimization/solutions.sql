-- =====================================================================
-- CS4420 · Chương 16 — Tối ưu truy vấn (Query Optimization)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH16.01  [PE 16.3a phản ví dụ]  ★★☆
-- Đề gốc: Exercise 16.3 (a). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.
--
-- a. Π[A](r − s) and Π[A](r) − Π[A](s).
--
-- Tạo hai bảng `qp_x_r(a int, b int)`, `qp_x_s(a int, b int)` và chèn dữ liệu sao cho Π[A](r − s) khác Π[A](r) − Π[A](s). Hệ thống tính hai vế (dùng `except`) và trả về `differ`.
create table qp_x_r (a int, b int);
create table qp_x_s (a int, b int);
insert into qp_x_r values (1, 2);
insert into qp_x_s values (1, 3);

-- Câu truy vấn hệ thống dùng để chấm:
--   with lhs as (select a from (select * from qp_x_r except select * from qp_x_s) d),
--        rhs as (select a from qp_x_r except select a from qp_x_s)
--   select exists (select * from lhs except select * from rhs)
--       or exists (select * from rhs except select * from lhs) as differ;

-- @ex CH16.02  [PE 16.3b phản ví dụ]  ★★☆
-- Đề gốc: Exercise 16.3 (b). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.
--
-- b. σ[B<4]([A]γ[max(B) as B](r)) and [A]γ[max(B) as B](σ[B<4](r)).
--
-- Tạo `qp_x_m(a int, b int)` với dữ liệu sao cho σ[B<4]([A]γ[max(B) as B](r)) khác [A]γ[max(B) as B](σ[B<4](r)). Hệ thống so sánh hai vế và trả về `differ`.
create table qp_x_m (a int, b int);
insert into qp_x_m values (1, 2), (1, 5);

-- Câu truy vấn hệ thống dùng để chấm:
--   with lhs as (select a, max(b) as b from qp_x_m group by a having max(b) < 4),
--        rhs as (select a, max(b) as b from qp_x_m where b < 4 group by a)
--   select exists (select * from lhs except select * from rhs)
--       or exists (select * from rhs except select * from lhs) as differ;

-- @ex CH16.03  [PE 16.3d right outer join]  ★★★
-- Đề gốc: Exercise 16.3 (d). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.
--
-- d. (r ⟖ s) ⟖ t and r ⟖ (s ⟖ t). In other words, the natural right outer join is not associative.
--
-- Tạo `qp_x_r(a int, b int)`, `qp_x_s(b int, c int)`, `qp_x_t(a int, d int)` và chèn dữ liệu sao cho `(qp_x_r natural right join qp_x_s) natural right join qp_x_t` khác `qp_x_r natural right join (qp_x_s natural right join qp_x_t)` (so sánh trên các cột a, b, c, d). Hệ thống trả về `differ`.
-- Gợi ý: Cho một tuple của s không khớp r, để vế trái sinh a = null rồi không khớp t.
create table qp_x_r (a int, b int);
create table qp_x_s (b int, c int);
create table qp_x_t (a int, d int);
insert into qp_x_r values (1, 2);
insert into qp_x_s values (5, 3);
insert into qp_x_t values (1, 4);

-- Câu truy vấn hệ thống dùng để chấm:
--   with lhs as (select a, b, c, d from ((qp_x_r natural right join qp_x_s) natural right join qp_x_t) x),
--        rhs as (select a, b, c, d from (qp_x_r natural right join (qp_x_s natural right join qp_x_t)) y)
--   select exists (select * from lhs except select * from rhs)
--       or exists (select * from rhs except select * from lhs) as differ;

-- @ex CH16.04  [PE 16.3e selection & outer join]  ★★☆
-- Đề gốc: Exercise 16.3 (e). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.
--
-- e. σ[θ](E[1] ⟕ E[2]) and E[1] ⟕ σ[θ](E[2]), where θ uses only attributes of E[2].
--
-- Tạo `qp_x_e1(a int, b int)`, `qp_x_e2(a int, c int)` với dữ liệu sao cho σ[c = 1](E₁ ⟕ E₂) khác E₁ ⟕ σ[c = 1](E₂) (natural left join trên a). Hệ thống trả về `differ`.
create table qp_x_e1 (a int, b int);
create table qp_x_e2 (a int, c int);
insert into qp_x_e1 values (1, 2);
insert into qp_x_e2 values (2, 3);

-- Câu truy vấn hệ thống dùng để chấm:
--   with lhs as (select a, b, c from qp_x_e1 natural left join qp_x_e2 where c = 1),
--        rhs as (select a, b, c from qp_x_e1 natural left join (select * from qp_x_e2 where c = 1) e)
--   select exists (select * from lhs except select * from rhs)
--       or exists (select * from rhs except select * from lhs) as differ;

-- @ex CH16.05  [PE 16.3c min vs max]  ★★☆
-- Đề gốc: Exercise 16.3 (b, c). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.
--
-- b. σ[B<4]([A]γ[max(B) as B](r)) and [A]γ[max(B) as B](σ[B<4](r)).
--
-- c. If both occurrences of max in the previous expressions were replaced by min, would the expressions be equivalent?
--
-- Trên `qp_emp(id, dept, salary)` với ngưỡng 30000: so sánh "aggregate rồi lọc" với "lọc rồi aggregate" theo dept. Trả về một dòng hai cột boolean:
-- - `min_same`: `select dept, min(salary) … group by dept having min(salary) < 30000` có cùng kết quả với `… where salary < 30000 group by dept` không;
-- - `max_same`: câu hỏi tương tự với max.
with lmin as (select dept, min(salary) as v from qp_emp group by dept having min(salary) < 30000),
     rmin as (select dept, min(salary) as v from qp_emp where salary < 30000 group by dept),
     lmax as (select dept, max(salary) as v from qp_emp group by dept having max(salary) < 30000),
     rmax as (select dept, max(salary) as v from qp_emp where salary < 30000 group by dept)
select not exists ((select * from lmin except select * from rmin) union (select * from rmin except select * from lmin)) as min_same,
       not exists ((select * from lmax except select * from rmax) union (select * from rmax except select * from lmax)) as max_same;

-- @ex CH16.06  [PE 16.2b having → where]  ★☆☆
-- Đề gốc: Exercise 16.2 (b). Prove the following equivalences, and explain how each can be used to make certain queries more efficient:
--
-- b. σ[θ]([A]γ[F](E)) ≡ [A]γ[F](σ[θ](E)), where θ uses only attributes of A.
--
-- Truy vấn sau tính lương trung bình mọi khoa rồi mới lọc:
-- ```sql
-- select dept_name, avg(salary) from instructor group by dept_name
-- having dept_name in ('Comp. Sci.', 'Physics', 'Finance');
-- ```
-- Viết lại theo luật PE 16.2b: lọc trước khi aggregate (không dùng having). Trả về dept_name, avg_salary (làm tròn 2 chữ số).
select dept_name, round(avg(salary), 2) as avg_salary
from instructor
where dept_name in ('Comp. Sci.', 'Physics', 'Finance')
group by dept_name;

-- @ex CH16.07  [PE 16.6 ước lượng join]  ★★☆
-- Đề gốc: Exercise 16.6. Take the relations r[1](A, B, C), r[2](C, D, E), and r[3](E, F) of Practice Exercise 16.5, but assume now that the only primary key of each relation is its whole schema. Let V(C, r[1]) = 900, V(C, r[2]) = 1100, V(E, r[2]) = 50, and V(E, r[3]) = 100, with r[1] having 1000 tuples, r[2] 1500 tuples, and r[3] 750 tuples. Estimate the size of r[1] ⋈ r[2] ⋈ r[3] and give an efficient strategy for computing the join.
--
-- Bảng `qp_card(rel, n)` và `qp_vstats(rel, attr, v)` chứa số liệu PE 16.6. Tính:
-- - `est_r1_r2` = n[r1] · n[r2] / max(V(C, r1), V(C, r2)), làm tròn 1 chữ số;
-- - `est_all` = est_r1_r2 (chưa làm tròn) · n[r3] / max(V(E, r2), V(E, r3)), làm tròn tới số nguyên.
with n as (select max(n) filter (where rel = 'r1') as n1, max(n) filter (where rel = 'r2') as n2,
                  max(n) filter (where rel = 'r3') as n3 from qp_card),
     v as (select max(v) filter (where rel = 'r1' and attr = 'C') as c1, max(v) filter (where rel = 'r2' and attr = 'C') as c2,
                  max(v) filter (where rel = 'r2' and attr = 'E') as e2, max(v) filter (where rel = 'r3' and attr = 'E') as e3
           from qp_vstats),
     j as (select n1::numeric * n2 / greatest(c1, c2) as e12, n3, e2, e3 from n, v)
select round(e12, 1) as est_r1_r2, round(e12 * n3 / greatest(e2, e3)) as est_all from j;

-- @ex CH16.08  [PE 16.6 chọn join đầu tiên]  ★★☆
-- Đề gốc: Exercise 16.6. Take the relations r[1](A, B, C), r[2](C, D, E), and r[3](E, F) of Practice Exercise 16.5, but assume now that the only primary key of each relation is its whole schema. Let V(C, r[1]) = 900, V(C, r[2]) = 1100, V(E, r[2]) = 50, and V(E, r[3]) = 100, with r[1] having 1000 tuples, r[2] 1500 tuples, and r[3] 750 tuples. Estimate the size of r[1] ⋈ r[2] ⋈ r[3] and give an efficient strategy for computing the join.
--
-- Vẫn số liệu PE 16.6. Ước lượng kích thước kết quả trung gian cho ba cách chọn cặp join đầu tiên: `r1⋈r2` (trên C), `r2⋈r3` (trên E), `r1⋈r3` (không có thuộc tính chung → tích Descartes). Trả về `pair` (đúng ba chuỗi trên) và `est` (làm tròn tới số nguyên), sắp theo est tăng dần.
-- (Thứ tự dòng được chấm.)
with n as (select max(n) filter (where rel = 'r1') as n1, max(n) filter (where rel = 'r2') as n2,
                  max(n) filter (where rel = 'r3') as n3 from qp_card),
     v as (select max(v) filter (where rel = 'r1' and attr = 'C') as c1, max(v) filter (where rel = 'r2' and attr = 'C') as c2,
                  max(v) filter (where rel = 'r2' and attr = 'E') as e2, max(v) filter (where rel = 'r3' and attr = 'E') as e3
           from qp_vstats)
select pair, round(est) as est from (
  select 'r1⋈r2' as pair, n1::numeric * n2 / greatest(c1, c2) as est from n, v
  union all select 'r2⋈r3', n2::numeric * n3 / greatest(e2, e3) from n, v
  union all select 'r1⋈r3', n1::numeric * n3 from n, v) t
order by est;

-- @ex CH16.09  [ước lượng σ A ≤ v]  ★★☆
-- Ước lượng số instructor có salary ≤ 70000 bằng công thức n[r] · (v − min) / (max − min) (min, max, n[r] lấy từ bảng instructor), rồi so với số thực tế. Trả về `estimate` (làm tròn 2 chữ số) và `actual`.
select round(count(*) * (70000 - min(salary)) / (max(salary) - min(salary)), 2) as estimate,
       count(*) filter (where salary <= 70000) as actual
from instructor;

-- @ex CH16.10  [histogram equi-width]  ★★☆
-- Dựng histogram equi-width 4 bucket cho `qp_emp.salary` trên khoảng [20000, 100000) (mỗi bucket rộng 20000). Trả về `bucket` (1–4), `lo`, `hi` (biên dưới, biên trên của bucket) và `cnt`, sắp theo bucket.
-- Gợi ý: width_bucket(salary, 20000, 100000, 4).
-- (Thứ tự dòng được chấm.)
select width_bucket(salary, 20000, 100000, 4) as bucket,
       20000 + (width_bucket(salary, 20000, 100000, 4) - 1) * 20000 as lo,
       20000 + width_bucket(salary, 20000, 100000, 4) * 20000 as hi,
       count(*) as cnt
from qp_emp
group by 1
order by 1;

-- @ex CH16.11  [ước lượng bằng histogram]  ★★★
-- Dùng histogram của CH16.10 (giả sử phân bố đều trong mỗi bucket) để ước lượng số nhân viên có salary < 45000: toàn bộ bucket [20000, 40000) cộng với phần (45000 − 40000)/20000 của bucket [40000, 60000). Trả về `estimate` (làm tròn 1 chữ số) và `actual`.
with h as (select width_bucket(salary, 20000, 100000, 4) as bucket, count(*) as cnt from qp_emp group by 1)
select round(sum(case when bucket = 1 then cnt when bucket = 2 then cnt * (45000 - 40000) / 20000.0 else 0 end), 1) as estimate,
       (select count(*) from qp_emp where salary < 45000) as actual
from h;

-- @ex CH16.12  [PE 16.12 số thứ tự join]  ★☆☆
-- Đề gốc: Exercise 16.12. Show that n relations have (2(n − 1))!/(n − 1)! different join orders.
--
-- Hint: a *complete binary tree* is one in which every internal node has exactly two children. Use the fact that the number of different complete binary trees with n leaf nodes is (1/n)·C(2(n − 1), n − 1), where C denotes the binomial coefficient. If you like, derive this from the number of binary trees with n nodes, which is (1/(n + 1))·C(2n, n) — the Catalan number, derived in standard data-structures or algorithms textbooks.
--
-- Với n = 1 … 8, trả về `n`, `all_orders` = (2(n − 1))! / (n − 1)! (mọi cây join) và `left_deep` = n! (chỉ left-deep), kiểu số nguyên, sắp theo n.
-- (Thứ tự dòng được chấm.)
select n,
       (factorial(2 * (n - 1)) / factorial(n - 1))::bigint as all_orders,
       factorial(n)::bigint as left_deep
from generate_series(1, 8) as n
order by n;

-- @ex CH16.13  [thứ tự join left-deep tốt nhất]  ★★★
-- `qp_jrel(id, name, n)`: 4 quan hệ A, B, C, D (id 0–3). `qp_jpred(r1, r2, sel)`: điều kiện join giữa hai quan hệ và selectivity (cặp không có trong bảng là tích Descartes, sel = 1). Liệt kê mọi left-deep order (thứ tự thêm quan hệ, ví dụ `'B C D A'`). Khi thêm quan hệ R vào kết quả hiện có kích thước s: kích thước mới = s · n[R] · tích các sel của điều kiện nối R với các quan hệ đã có. Chi phí của một order = tổng kích thước mọi kết quả join (kể cả kết quả cuối).
--
-- Trả về `best_cost` (chi phí nhỏ nhất, làm tròn số nguyên) và `orders`: các order đạt chi phí đó, nối bằng `', '` theo thứ tự chữ cái.
-- Gợi ý: with recursive trên bitmask (1 << id); tích các sel = exp(sum(ln(sel))); làm tròn kích thước mỗi bước tới 4 chữ số để tránh sai số.
with recursive plan(mask, ord, size, cost) as (
  select 1 << id, name::text, n::numeric, 0::numeric from qp_jrel
  union all
  select p.mask | (1 << r.id), p.ord || ' ' || r.name, x.s, p.cost + x.s
  from plan p
  join qp_jrel r on p.mask & (1 << r.id) = 0
  cross join lateral (
    select round(p.size * r.n * coalesce(
             (select exp(sum(ln(j.sel))) from qp_jpred j
              where (j.r1 = r.id and p.mask & (1 << j.r2) <> 0)
                 or (j.r2 = r.id and p.mask & (1 << j.r1) <> 0)), 1), 4) as s) x
),
full_plans as (select ord, round(cost) as cost from plan where mask = 15)
select cost as best_cost, string_agg(ord, ', ' order by ord) as orders
from full_plans
where cost = (select min(cost) from full_plans)
group by cost;

-- @ex CH16.14  [PE 16.15a truy vấn lồng]  ★★☆
-- Đề gốc: Exercise 16.15 (a). Using the bank database of Figure 16.9 (primary keys underlined), write the following:
--
-- a. A nested query on relation *account* that finds, for every branch whose name begins with “B”, all accounts having the maximum balance at that branch.
--
-- *Figure 16.9 — Banking database* (primary keys underlined):
--
-- - branch (branch_name, branch_city, assets)
-- - customer (customer_name, customer_street, customer_city)
-- - loan (loan_number, branch_name, amount)
-- - borrower (customer_name, loan_number)
-- - account (account_number, branch_name, balance)
-- - depositor (customer_name, account_number)
--
-- Trên `qp_account(account_number, branch_name, balance)`: viết truy vấn lồng có tương quan tìm, với mỗi branch có tên bắt đầu bằng `B`, mọi account có balance lớn nhất ở branch đó. Trả về account_number, branch_name.
select S.account_number, S.branch_name
from qp_account S
where S.branch_name like 'B%'
  and S.balance = (select max(T.balance) from qp_account T where T.branch_name = S.branch_name);

-- @ex CH16.15  [PE 16.15b khử tương quan]  ★★☆
-- Đề gốc: Exercise 16.15 (b). Using the bank database of Figure 16.9 (primary keys underlined), write the following:
--
-- b. The same query rewritten without a nested subquery — that is, decorrelated, but still in SQL.
--
-- *Figure 16.9 — Banking database* (primary keys underlined):
--
-- - branch (branch_name, branch_city, assets)
-- - customer (customer_name, customer_street, customer_city)
-- - loan (loan_number, branch_name, amount)
-- - borrower (customer_name, loan_number)
-- - account (account_number, branch_name, balance)
-- - depositor (customer_name, account_number)
--
-- Viết lại CH16.14 không có subquery tương quan: tính max balance của mỗi branch một lần (with hoặc derived table + group by) rồi join. Trả về account_number, branch_name.
with t1 as (
  select branch_name, max(balance) as max_balance
  from qp_account where branch_name like 'B%'
  group by branch_name)
select a.account_number, a.branch_name
from qp_account a join t1 on a.branch_name = t1.branch_name and a.balance = t1.max_balance;

-- @ex CH16.16  [not exists → anti-join]  ★★☆
-- Tìm các branch không có account nào, viết bằng left outer join … is null (anti-join) thay cho `not exists`. Trả về branch_name, branch_city.
select b.branch_name, b.branch_city
from qp_branch b left join qp_account a on a.branch_name = b.branch_name
where a.account_number is null;

-- @ex CH16.17  [PE 16.8 join trên upper()]  ★☆☆
-- Đề gốc: Exercise 16.8. Consider the query
--
-- ```sql
-- select *
-- from r, s
-- where upper(r.A) = upper(s.A);
-- ```
--
-- where *upper* returns its argument with every lowercase letter replaced by the corresponding uppercase letter.
--
-- a. Find out which plan your database system generates for this query.
--
-- b. Some database systems evaluate this query with a (block) nested-loop join, which can be very slow. Briefly explain how a hash join or a merge join could be used instead.
--
-- Join `qp_names_r(id, name)` với `qp_names_s(code, name)` theo tên không phân biệt hoa thường (dùng upper). Trả về id, r_name, code.
select r.id, r.name as r_name, s.code
from qp_names_r r join qp_names_s s on upper(r.name) = upper(s.name);

-- @ex CH16.18  [expression index]  ★★☆
-- Đề gốc: Exercise 16.8. Consider the query
--
-- ```sql
-- select *
-- from r, s
-- where upper(r.A) = upper(s.A);
-- ```
--
-- where *upper* returns its argument with every lowercase letter replaced by the corresponding uppercase letter.
--
-- a. Find out which plan your database system generates for this query.
--
-- b. Some database systems evaluate this query with a (block) nested-loop join, which can be very slow. Briefly explain how a hash join or a merge join could be used instead.
--
-- Tạo expression index trên `qp_names_s` theo `upper(name)` để join của CH16.17 dùng được index (indexed nested-loop) và optimizer có thống kê. Hệ thống kiểm tra trong `pg_indexes` có index của qp_names_s mà định nghĩa chứa `upper`.
create index qp_names_s_upper on qp_names_s (upper(name));

-- Câu truy vấn hệ thống dùng để chấm:
--   select count(*) > 0 as has_upper_index
--   from pg_indexes
--   where tablename = 'qp_names_s' and indexdef ilike '%upper(%';

-- @ex CH16.19  [PE 16.9 đẩy aggregate qua join]  ★★★
-- Đề gốc: Exercise 16.9. State conditions under which the expressions
--
-- [A,B]γ[agg(C)](E[1] ⋈ E[2]) and ([A]γ[agg(C)](E[1])) ⋈ E[2]
--
-- are equivalent, where agg is any aggregation operation. How can these conditions be relaxed when agg is min or max?
--
-- Tạo `qp_x_e1(a int, c int)` và `qp_x_e2(a int, b text)` với dữ liệu sao cho [A,B]γ[sum(C)](E₁ ⋈ E₂) khác ([A]γ[sum(C)](E₁)) ⋈ E₂ (natural join trên a; so sánh trên các cột a, b, tổng). Hệ thống trả về `differ`.
-- Gợi ý: Cho E₂ chứa cùng một tuple (a, b) hai lần.
create table qp_x_e1 (a int, c int);
create table qp_x_e2 (a int, b text);
insert into qp_x_e1 values (1, 10), (1, 20);
insert into qp_x_e2 values (1, 'x'), (1, 'x');

-- Câu truy vấn hệ thống dùng để chấm:
--   with lhs as (select a, b, sum(c) as total from qp_x_e1 natural join qp_x_e2 group by a, b),
--        rhs as (select a, b, total from (select a, sum(c) as total from qp_x_e1 group by a) g natural join qp_x_e2)
--   select exists (select * from lhs except all select * from rhs)
--       or exists (select * from rhs except all select * from lhs) as differ;

-- @ex CH16.20  [bảo trì materialized view]  ★★★
-- Hiện thực một materialized view được bảo trì incremental (immediate, bằng trigger):
-- 1. Tạo bảng `qp_branch_total(branch_name varchar(20) primary key, total numeric(12,2), num_accounts integer)` và nạp sẵn tổng balance, số account của mỗi branch từ `qp_account` (chỉ các branch có account).
-- 2. Tạo trigger after insert trên `qp_account` (for each row, plpgsql) cộng balance và tăng num_accounts cho branch tương ứng — nếu branch chưa có trong qp_branch_total thì thêm dòng mới.
--
-- Hệ thống chèn hai account (`('A-900', 'Austin', 100)`, `('A-901', 'Brighton', 50)`) rồi đọc qp_branch_total.
-- Gợi ý: insert … on conflict (branch_name) do update set total = qp_branch_total.total + excluded.total, …
create table qp_branch_total (
  branch_name   varchar(20) primary key,
  total         numeric(12,2),
  num_accounts  integer
);
insert into qp_branch_total
select branch_name, sum(balance), count(*) from qp_account group by branch_name;

create function qp_branch_total_ins() returns trigger language plpgsql as $$
begin
  insert into qp_branch_total values (new.branch_name, new.balance, 1)
  on conflict (branch_name) do update
    set total = qp_branch_total.total + excluded.total,
        num_accounts = qp_branch_total.num_accounts + 1;
  return new;
end $$;

create trigger qp_account_ins after insert on qp_account
for each row execute function qp_branch_total_ins();

-- Câu truy vấn hệ thống dùng để chấm:
--   insert into qp_account values ('A-900', 'Austin', 100), ('A-901', 'Brighton', 50);
--   select * from qp_branch_total;
