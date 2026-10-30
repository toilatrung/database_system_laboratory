-- =====================================================================
-- CS4420 · Chương 25 — Phát triển ứng dụng nâng cao (Advanced Application Development)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH25.01  [tuning: thiếu index]  ★★☆
-- Từ workload `at_workload` và danh sách index đang có `at_index`, tìm các ứng viên index còn thiếu: mẫu truy vấn trên cột chưa có index và có độ chọn lọc rows_returned / rows_scanned dưới 0.05. Trả về `table_name`, `column_name`, `calls_per_hour`.
-- Gợi ý: not exists trong at_index; chú ý chia số nguyên — dùng 1.0 * ...
select w.table_name, w.column_name, w.calls_per_hour
from at_workload w
where 1.0 * w.rows_returned / w.rows_scanned < 0.05
  and not exists (select * from at_index i
                  where i.table_name = w.table_name and i.column_name = w.column_name);

-- @ex CH25.02  [tuning: bảng nóng]  ★☆☆
-- Với mỗi bảng trong `at_workload`, tính tổng số dòng phải đọc mỗi giờ (calls_per_hour × rows_scanned, đặt tên `rows_per_hour`). Sắp xếp giảm dần.
-- (Thứ tự dòng được chấm.)
select table_name, sum(calls_per_hour::bigint * rows_scanned) as rows_per_hour
from at_workload
group by table_name
order by rows_per_hour desc;

-- @ex CH25.03  [throughput theo mix]  ★★☆
-- Đề gốc: Exercise 25.6 (a). A system runs three types of transactions. Type A transactions run at 50 per second, type B at 100 per second, and type C at 200 per second. The transaction mix is 25 percent type A, 25 percent type B, and 50 percent type C.
--
-- a. Assuming no interference between transactions, what is the average transaction throughput of the system?
--
-- Từ `at_txn_type(txn_type, rate_per_sec, mix_pct)`, tính throughput trung bình của hệ thống khi không có xung đột: 1 / Σ(mix[i] / rate[i]) với mix là tỉ lệ (mix_pct / 100). Trả về `throughput` làm tròn 2 chữ số, và `naive_avg` — trung bình cộng có trọng số Σ mix[i] × rate[i] (sai) để so sánh.
select round(1 / sum(mix_pct / 100 / rate_per_sec), 2) as throughput,
       round(sum(mix_pct / 100 * rate_per_sec), 2) as naive_avg
from at_txn_type;

-- @ex CH25.04  [lock hot spot]  ★★☆
-- Từ `at_lock_wait`, tìm các tài nguyên "nóng": thời gian chờ trung bình mỗi lần (total_wait_ms / waits) lớn hơn thời gian chờ trung bình chung của mọi lần chờ (tổng total_wait_ms / tổng waits). Trả về `resource`, `avg_wait_ms` (làm tròn 1 chữ số).
select resource, round(1.0 * total_wait_ms / waits, 1) as avg_wait_ms
from at_lock_wait
where 1.0 * total_wait_ms / waits > (select 1.0 * sum(total_wait_ms) / sum(waits) from at_lock_wait);

-- @ex CH25.05  [sequence gaps]  ★★☆
-- Đề gốc: Exercise 25.2. Many applications need to generate a sequence number for every transaction.
--
-- a. If a sequence counter is locked in a two-phase manner, it can become a concurrency bottleneck. Explain why.
--
-- b. Many database systems offer built-in sequence counters that are not locked two-phase: when a transaction asks for a sequence number, the counter is locked, incremented, and immediately unlocked.
--
-- 1. Explain how such counters can improve concurrency.
-- 2. Explain why the sequence numbers of the transactions that finally commit may contain gaps.
--
-- Bảng `at_txn` ghi số thứ tự `seq_no` mà mỗi transaction đã lấy và trạng thái cuối. Xét các transaction đã commit: trả về các số thứ tự bị thiếu (cột `missing_seq`) trong khoảng từ seq_no nhỏ nhất tới lớn nhất của chúng.
-- Gợi ý: generate_series(min, max) except ...
select g as missing_seq
from generate_series((select min(seq_no) from at_txn where status = 'commit'),
                     (select max(seq_no) from at_txn where status = 'commit')) as g
except
select seq_no from at_txn where status = 'commit';

-- @ex CH25.06  [sequence không rollback]  ★★☆
-- Đề gốc: Exercise 25.2 (b). Many applications need to generate a sequence number for every transaction.
--
-- b. Many database systems offer built-in sequence counters that are not locked two-phase: when a transaction asks for a sequence number, the counter is locked, incremented, and immediately unlocked.
--
-- 1. Explain how such counters can improve concurrency.
-- 2. Explain why the sequence numbers of the transactions that finally commit may contain gaps.
--
-- Chứng minh sequence không bị rollback: tạo sequence `at_order_seq` và commit; mở transaction mới, gọi `nextval` hai lần, rồi rollback; sau đó gọi `nextval` lần nữa. Câu cuối trả về giá trị nhận được (cột `next_value`). (Bài chạy trên database mới, được dùng begin/rollback.)
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
begin;
create sequence at_order_seq;
commit;
begin;
select nextval('at_order_seq');
select nextval('at_order_seq');
rollback;
select nextval('at_order_seq') as next_value;

-- @ex CH25.07  [test bắt lỗi join]  ★★☆
-- Đề gốc: Exercise 25.7. An application programmer was supposed to write the query
--
-- ```sql
-- select *
-- from r natural left outer join s;
-- ```
--
-- on relations r(A, B) and s(B, C), but wrote instead
--
-- ```sql
-- select *
-- from r natural join s;
-- ```
--
-- a. Give sample data for r and s on which the two queries produce the same result.
--
-- b. Give sample data for r and s on which the two queries produce different results, thereby exposing the mistake.
--
-- Với `at_r(a, b)` và `at_s(b, c)`: trả về các dòng có trong kết quả `at_r natural left outer join at_s` nhưng không có trong `at_r natural join at_s` — chính là các dòng làm lộ lỗi viết nhầm join. Cột b, a, c.
select * from at_r natural left outer join at_s
except
select * from at_r natural join at_s;

-- @ex CH25.08  [regression test]  ★★★
-- Regression test: `at_expected(dept_name, num_instructors)` là kết quả mong đợi của truy vấn "số instructor mỗi khoa (chỉ khoa có instructor)". Chạy truy vấn thật trên bảng instructor và so sánh hai chiều. Trả về `side` ('missing' = có trong mong đợi nhưng không có trong kết quả thật, 'unexpected' = ngược lại), `dept_name`, `num_instructors`.
with actual as (
  select dept_name, count(*)::int as num_instructors from instructor group by dept_name)
(select 'missing' as side, * from (select * from at_expected except select * from actual) as m)
union all
(select 'unexpected', * from (select * from actual except select * from at_expected) as u);

-- @ex CH25.09  [materialized view]  ★★☆
-- Đề gốc: Exercise 25.5. A database application seems to have no single bottleneck: CPU and disk utilization are both high and all database queues are roughly balanced. Does this mean the application cannot be tuned any further? Explain.
--
-- Tuning bằng materialized view: tạo materialized view `at_dept_payroll(dept_name, total_salary, num_instructors)` tổng lương và số instructor mỗi khoa. Hệ thống tăng lương mọi instructor khoa Music thêm 1000 sau khi tạo view, rồi so sánh tổng lương Music trong view trước và sau `refresh materialized view`.
create materialized view at_dept_payroll as
select dept_name, sum(salary) as total_salary, count(*) as num_instructors
from instructor
group by dept_name;

-- Câu truy vấn hệ thống dùng để chấm:
--   update instructor set salary = salary + 1000 where dept_name = 'Music';
--   create temp table at_snap as select total_salary as before_refresh from at_dept_payroll where dept_name = 'Music';
--   refresh materialized view at_dept_payroll;
--   select s.before_refresh, p.total_salary as after_refresh
--   from at_snap s, at_dept_payroll p where p.dept_name = 'Music';

-- @ex CH25.10  [chọn loại index]  ★★☆
-- Đề gốc: Exercise 25.3. You are given a relation r(a, b, c).
--
-- a. Give an example of a situation in which the performance of equality selection queries on attribute a depends greatly on how r is clustered.
--
-- b. Suppose there are also range selection queries on attribute b. Can r be clustered so that both the equality selections on r.a and the range selections on r.b are answered efficiently? Explain.
--
-- c. If such a clustering is not possible, suggest how both kinds of queries can be executed efficiently by choosing suitable indices.
--
-- Bảng `at_sale(sale_id, a, b, c)` có truy vấn bằng trên a và truy vấn khoảng trên b. Tạo index `at_sale_a_idx` kiểu hash trên a và `at_sale_b_idx` kiểu B+-tree (btree) trên b. Hệ thống đọc `pg_indexes`.
create index at_sale_a_idx on at_sale using hash (a);
create index at_sale_b_idx on at_sale using btree (b);

-- Câu truy vấn hệ thống dùng để chấm:
--   select indexname, substring(indexdef from 'USING (\w+)') as method
--   from pg_indexes where tablename = 'at_sale' and indexname <> 'at_sale_pkey';

-- @ex CH25.11  [LDAP DN]  ★★★
-- Đề gốc: Exercise 25.9. Describe how LDAP can provide several hierarchical views of the same data without replicating the base-level data.
--
-- Cây thư mục `at_ldap(node_id, parent_id, rdn, person_id)`. Với mỗi entry là một người (person_id khác null), trả về `person_id` và `dn` — distinguished name ghép các RDN từ lá lên gốc, ngăn cách bởi ', ' (ví dụ 'cn=Lan, ou=Sales, ou=Hanoi, o=Acme').
-- Gợi ý: with recursive đi từ lá lên cha.
with recursive up (person_id, node_id, dn) as (
  select person_id, parent_id, rdn::text from at_ldap where person_id is not null
  union all
  select u.person_id, l.parent_id, u.dn || ', ' || l.rdn
  from up u join at_ldap l on l.node_id = u.node_id)
select person_id, dn from up where node_id is null;

-- @ex CH25.12  [benchmark TPC]  ★★☆
-- Từ `at_bench(system, txns_completed, seconds, total_cost_usd)`, tính cho mỗi hệ thống: `tps` = txns_completed / seconds (làm tròn 1), `price_per_tps` = total_cost_usd / tps (làm tròn 2). Sắp theo price_per_tps tăng dần (hệ thống "đáng tiền" nhất trước).
-- (Thứ tự dòng được chấm.)
select system,
       round(1.0 * txns_completed / seconds, 1) as tps,
       round(total_cost_usd / (1.0 * txns_completed / seconds), 2) as price_per_tps
from at_bench
order by price_per_tps;
