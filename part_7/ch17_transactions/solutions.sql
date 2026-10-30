-- =====================================================================
-- CS4420 · Chương 17 — Giao tác (Transactions) (Transactions)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH17.01  [commit]  ★☆☆
-- Viết một transaction chuyển 100 từ tài khoản `A-101` sang `A-102` (bảng `tx_account`) rồi commit. *(Bài này chạy trên CSDL mới, được dùng begin/commit.)*
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
begin;
update tx_account set balance = balance - 100 where acc_id = 'A-101';
update tx_account set balance = balance + 100 where acc_id = 'A-102';
commit;

-- Câu truy vấn hệ thống dùng để chấm:
--   select acc_id, balance from tx_account order by acc_id;

-- @ex CH17.02  [atomicity]  ★★★
-- Viết hàm PL/pgSQL `tx_transfer(src varchar, dst varchar, amt numeric) returns text` chuyển `amt` từ `src` sang `dst` trong `tx_account`: cộng vào dst trước, trừ src sau. Nếu việc trừ vi phạm `check (balance >= 0)` thì không được để lại thay đổi nào (kể cả phần đã cộng vào dst) và trả về `'FAILED'`; thành công trả về `'OK'`.
-- Khi chấm, hệ thống gọi `tx_transfer('A-101', 'A-102', 100)` và `tx_transfer('A-102', 'A-301', 1000)` rồi đọc số dư.
-- Gợi ý: Khối begin … exception when check_violation then … end trong PL/pgSQL là một subtransaction: lỗi trong khối làm huỷ mọi thay đổi của khối.
create function tx_transfer(src varchar, dst varchar, amt numeric) returns text as $$
begin
  update tx_account set balance = balance + amt where acc_id = dst;
  update tx_account set balance = balance - amt where acc_id = src;
  return 'OK';
exception when check_violation then
  return 'FAILED';
end;
$$ language plpgsql;

-- Câu truy vấn hệ thống dùng để chấm:
--   select tx_transfer('A-101', 'A-102', 100) as first_call,
--          tx_transfer('A-102', 'A-301', 1000) as second_call,
--          sql_value($$select string_agg(acc_id || '=' || balance, ', ' order by acc_id) from tx_account$$) as balances;

-- @ex CH17.03  [savepoint]  ★★☆
-- Trong một transaction: cộng 50 vào `A-201`; tạo `savepoint s1`; đặt số dư mọi tài khoản của `Bob` về 0; rollback về s1; cộng 25 vào `A-301`; commit.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
begin;
update tx_account set balance = balance + 50 where acc_id = 'A-201';
savepoint s1;
update tx_account set balance = 0 where owner = 'Bob';
rollback to savepoint s1;
update tx_account set balance = balance + 25 where acc_id = 'A-301';
commit;

-- Câu truy vấn hệ thống dùng để chấm:
--   select acc_id, balance from tx_account order by acc_id;

-- @ex CH17.04  [conflicting operations]  ★★☆
-- `tx_sched(sched_id, step, txn, op, item)` lưu các schedule (op: R, W, C = commit, A = abort). Liệt kê mọi cặp lệnh xung đột của schedule `S1`: `step1, step2, txn1, txn2, item` với step1 < step2.
-- Gợi ý: Cùng item, khác transaction, ít nhất một W; bỏ C/A.
select a.step as step1, b.step as step2, a.txn as txn1, b.txn as txn2, a.item
from tx_sched a
     join tx_sched b on b.sched_id = a.sched_id and b.item = a.item
                    and a.step < b.step and a.txn <> b.txn
where a.sched_id = 'S1' and 'W' in (a.op, b.op);

-- @ex CH17.05  [precedence graph]  ★★☆
-- Trả về các cạnh `src, dst` (không trùng) của precedence graph của schedule `S6`.
select distinct a.txn as src, b.txn as dst
from tx_sched a
     join tx_sched b on b.sched_id = a.sched_id and b.item = a.item
                    and a.step < b.step and a.txn <> b.txn
where a.sched_id = 'S6' and 'W' in (a.op, b.op);

-- @ex CH17.06  [cycle detection]  ★★★
-- Với mỗi schedule trong `tx_sched`, cho biết có conflict serializable không: `sched_id, conflict_serializable` (boolean). Dùng recursive CTE tìm chu trình trên precedence graph.
-- Gợi ý: Tính bao đóng bắc cầu reach(src, dst); có chu trình ⇔ tồn tại reach(T, T).
with recursive e as (
  select distinct a.sched_id, a.txn as src, b.txn as dst
  from tx_sched a
       join tx_sched b on b.sched_id = a.sched_id and b.item = a.item
                      and a.step < b.step and a.txn <> b.txn
  where 'W' in (a.op, b.op)
), reach (sched_id, src, dst) as (
  select sched_id, src, dst from e
  union
  select r.sched_id, r.src, e.dst
  from reach r join e on e.sched_id = r.sched_id and e.src = r.dst
)
select s.sched_id,
       not exists (select 1 from reach r where r.sched_id = s.sched_id and r.src = r.dst) as conflict_serializable
from (select distinct sched_id from tx_sched) s;

-- @ex CH17.07  [topological order]  ★★★
-- Đề gốc: Exercise 17.6. Look at the precedence graph of Figure 17.16. Is the schedule it corresponds to conflict serializable? Justify your answer.
--
-- *Figure 17.16 — Precedence graph for Practice Exercise 17.6* (nodes T1–T5, edges):
--
-- T1 → T2, T1 → T3, T1 → T4, T2 → T3, T2 → T4, T3 → T5, T4 → T5
--
-- `tx_pg_edge(graph, src, dst)` chứa precedence graph `F17.16` của Figure 17.16. Tính thứ tự serial tương đương: mỗi transaction cùng `level` = độ dài đường đi dài nhất từ một đỉnh không có cạnh vào. Trả về `txn, level`, sắp theo level rồi txn.
-- (Thứ tự dòng được chấm.)
with recursive lvl (txn, level) as (
  select g.src, 0 from tx_pg_edge g
  where g.graph = 'F17.16'
    and not exists (select 1 from tx_pg_edge h where h.graph = g.graph and h.dst = g.src)
  union
  select e.dst, l.level + 1
  from lvl l join tx_pg_edge e on e.graph = 'F17.16' and e.src = l.txn
)
select txn, max(level) as level
from lvl
group by txn
order by level, txn;

-- @ex CH17.08  [reads-from]  ★★☆
-- Quan hệ reads-from của schedule `S4`: với mỗi lệnh R, trả về `step, reader, item, writer` — writer là transaction thực hiện lệnh W gần nhất trước đó trên cùng item, hoặc `initial` nếu chưa có ai ghi.
select r.step, r.txn as reader, r.item,
       coalesce((select w.txn from tx_sched w
                 where w.sched_id = r.sched_id and w.item = r.item and w.op = 'W' and w.step < r.step
                 order by w.step desc limit 1), 'initial') as writer
from tx_sched r
where r.sched_id = 'S4' and r.op = 'R';

-- @ex CH17.09  [recoverable / cascadeless]  ★★★
-- Đề gốc: Exercise 17.7. What is a cascadeless schedule? Why is it desirable for schedules to be cascadeless? Are there situations in which allowing noncascadeless schedules would be preferable? Explain.
--
-- Với mỗi schedule, trả về `sched_id, recoverable, cascadeless` (boolean). Dùng quan hệ reads-from ở CH17.08 (bỏ trường hợp đọc giá trị ban đầu hoặc đọc chính dữ liệu mình ghi). Recoverable: reader đã commit thì writer phải commit trước reader. Cascadeless: writer phải commit trước lệnh read.
with rf as (
  select r.sched_id, r.step as read_step, r.txn as reader,
         (select w.txn from tx_sched w
          where w.sched_id = r.sched_id and w.item = r.item and w.op = 'W' and w.step < r.step
          order by w.step desc limit 1) as writer
  from tx_sched r
  where r.op = 'R'
), d as (
  select rf.*,
         (select step from tx_sched c where c.sched_id = rf.sched_id and c.txn = rf.writer and c.op = 'C') as writer_commit,
         (select step from tx_sched c where c.sched_id = rf.sched_id and c.txn = rf.reader and c.op = 'C') as reader_commit
  from rf
  where writer is not null and writer <> reader
)
select s.sched_id,
       not exists (select 1 from d where d.sched_id = s.sched_id and d.reader_commit is not null
                     and (d.writer_commit is null or d.writer_commit > d.reader_commit)) as recoverable,
       not exists (select 1 from d where d.sched_id = s.sched_id
                     and (d.writer_commit is null or d.writer_commit > d.read_step)) as cascadeless
from (select distinct sched_id from tx_sched) s;

-- @ex CH17.10  [lost update]  ★★★
-- Đề gốc: Exercise 17.8 (a). A *lost update* anomaly happens when a transaction T[j] reads a data item, another transaction T[k] then writes that item (possibly based on an earlier read), and afterwards T[j] writes the item. The update made by T[k] is lost, because T[j]'s update did not take into account the value T[k] wrote.
--
-- a. Give a schedule that exhibits the lost update anomaly.
--
-- Tìm lost update trong schedule `S2`: T[j] đọc X, sau đó T[k] (khác T[j]) ghi X, sau đó T[j] ghi X. Trả về `lost_txn` (T[k], người bị mất cập nhật), `overwriting_txn` (T[j]), `item`.
select distinct k.txn as lost_txn, j.txn as overwriting_txn, r.item
from tx_sched r
     join tx_sched k on k.sched_id = r.sched_id and k.item = r.item and k.op = 'W'
                    and k.txn <> r.txn and k.step > r.step
     join tx_sched j on j.sched_id = r.sched_id and j.txn = r.txn and j.item = r.item
                    and j.op = 'W' and j.step > k.step
where r.sched_id = 'S2' and r.op = 'R';

-- @ex CH17.11  [serial schedule]  ★★☆
-- Với mỗi schedule, cho biết có phải serial schedule không (mọi lệnh của mỗi transaction nằm liền nhau): `sched_id, is_serial`.
-- Gợi ý: step − row_number() over (partition by sched_id, txn order by step) không đổi trên một đoạn liền nhau.
select sched_id, bool_and(groups = 1) as is_serial
from (select sched_id, txn, count(distinct grp) as groups
      from (select sched_id, txn,
                   step - row_number() over (partition by sched_id, txn order by step) as grp
            from tx_sched) x
      group by sched_id, txn) y
group by sched_id;

-- @ex CH17.12  [final write]  ★★☆
-- Điều kiện thứ 3 của view equivalence dùng final write. Với mỗi schedule và mỗi item, trả về transaction ghi item đó lần cuối: `sched_id, item, final_writer`.
select distinct on (sched_id, item) sched_id, item, txn as final_writer
from tx_sched
where op = 'W'
order by sched_id, item, step desc;

-- @ex CH17.13  [cycle members]  ★★★
-- Trong `tx_pg_edge`, đồ thị `G2` có chu trình. Trả về các transaction nằm trên một chu trình (`txn`) — đó là các transaction không thể xếp vào thứ tự serial.
with recursive reach (src, dst) as (
  select src, dst from tx_pg_edge where graph = 'G2'
  union
  select r.src, e.dst from reach r join tx_pg_edge e on e.graph = 'G2' and e.src = r.dst
)
select src as txn from reach where src = dst;
