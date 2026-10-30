-- =====================================================================
-- CS4420 · Chương 19 — Phục hồi (Recovery System) (Recovery System)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH19.01  [transaction status]  ★☆☆
-- `tx_log(log_id, lsn, txn, kind, item, old_val, new_val, active)` lưu các log (hệ thống crash ngay sau bản ghi cuối). Với `LOG1`, trả về `txn, status`: `committed`, `aborted` hoặc `incomplete`.
select txn,
       case when bool_or(kind = 'commit') then 'committed'
            when bool_or(kind = 'abort') then 'aborted'
            else 'incomplete' end as status
from tx_log
where log_id = 'LOG1' and txn is not null
group by txn;

-- @ex CH19.02  [values after recovery]  ★★★
-- Tính giá trị của mỗi item sau khi phục hồi `LOG1` bằng thuật toán Section 19.4: redo mọi bản ghi update/clr theo thứ tự, rồi undo (ngược) mọi update của transaction incomplete. Trả về `item, value`.
-- Gợi ý quy tắc: nếu item có update của transaction incomplete thì giá trị cuối là old_val của update sớm nhất trong số đó; ngược lại là giá trị (new_val) của bản ghi update/clr cuối cùng.
with undo_list as (
  select txn from tx_log
  where log_id = 'LOG1' and txn is not null
  group by txn
  having not bool_or(kind in ('commit', 'abort'))
), w as (
  select * from tx_log where log_id = 'LOG1' and kind in ('update', 'clr')
)
select i.item,
       coalesce((select u.old_val from w u
                 where u.item = i.item and u.kind = 'update' and u.txn in (select txn from undo_list)
                 order by u.lsn limit 1),
                (select u.new_val from w u where u.item = i.item order by u.lsn desc limit 1)) as value
from (select distinct item from w) i;

-- @ex CH19.03  [undo-list from checkpoint]  ★★☆
-- `LOG2` có bản ghi `checkpoint` (cột `active` = danh sách L). Theo pha redo của Section 19.4: undo-list khởi tạo bằng L của checkpoint cuối cùng, thêm transaction có `start` sau checkpoint, bỏ transaction có `commit`/`abort` sau checkpoint. Trả về undo-list (`txn`).
with chk as (
  select max(lsn) as lsn from tx_log where log_id = 'LOG2' and kind = 'checkpoint'
), l as (
  select unnest(active) as txn from tx_log where log_id = 'LOG2' and lsn = (select lsn from chk)
  union
  select txn from tx_log where log_id = 'LOG2' and kind = 'start' and lsn > (select lsn from chk)
)
select txn from l
where txn not in (select txn from tx_log
                  where log_id = 'LOG2' and kind in ('commit', 'abort') and lsn > (select lsn from chk));

-- @ex CH19.04  [redo phase]  ★★☆
-- Liệt kê các bản ghi được redo khi phục hồi `LOG2` (mọi `update` và `clr` sau checkpoint cuối cùng): `lsn, txn, kind, item`.
select lsn, txn, kind, item
from tx_log
where log_id = 'LOG2' and kind in ('update', 'clr')
  and lsn > (select max(lsn) from tx_log where log_id = 'LOG2' and kind = 'checkpoint');

-- @ex CH19.05  [undo phase log]  ★★★
-- Pha undo khi phục hồi `LOG2` duyệt log ngược và ghi thêm log: với mỗi update của transaction trong undo-list ghi CLR ``; khi gặp `start` của transaction đó ghi ``. Trả về các bản ghi được ghi thêm theo đúng thứ tự: `seq, txn, kind` (`clr`/`abort`), `item, value` (null với abort).
-- (Thứ tự dòng được chấm.)
with undo_list as (
  select txn from tx_log
  where log_id = 'LOG2' and txn is not null
  group by txn
  having not bool_or(kind in ('commit', 'abort'))
)
select row_number() over (order by lsn desc) as seq, txn,
       case when kind = 'update' then 'clr' else 'abort' end as kind,
       case when kind = 'update' then item end as item,
       case when kind = 'update' then old_val end as value
from tx_log
where log_id = 'LOG2' and txn in (select txn from undo_list) and kind in ('update', 'start')
order by seq;

-- @ex CH19.06  [undo order]  ★★☆
-- Đề gốc: Exercise 19.1. Explain why the log records of transactions on the undo-list must be processed in reverse order, while redo is done in the forward direction.
--
-- `LOG3`: transaction incomplete T7 sửa X và Y nhiều lần. Với mỗi item trả về `item, correct_value` (undo ngược) và `wrong_value` (nếu undo xuôi, tức áp old_val theo thứ tự LSN tăng dần).
select item,
       (array_agg(old_val order by lsn))[1]      as correct_value,
       (array_agg(old_val order by lsn desc))[1] as wrong_value
from tx_log
where log_id = 'LOG3' and kind = 'update'
group by item;

-- @ex CH19.07  [logging rollback]  ★★★
-- Đề gốc: Exercise 19.7. Suppose we (wrongly) change the recovery algorithm of Section 19.4 so that actions taken during transaction rollback are not logged. Then, when recovering from a system crash, transactions that were rolled back earlier would be put on the undo-list and rolled back a second time. Give an example showing how actions taken in the undo phase of recovery could leave the database in an incorrect state. (Hint: consider a data item updated by an aborted transaction and afterwards updated by a transaction that commits.)
--
-- `LOG4` là log của thuật toán sửa sai ở PE 19.7 (rollback của T1 không ghi log); `LOG5` là log đúng (có CLR và abort). Áp cùng quy tắc phục hồi như CH19.02 cho cả hai log và trả về `log_id, item, value`.
with undo_list as (
  select log_id, txn from tx_log
  where log_id in ('LOG4', 'LOG5') and txn is not null
  group by log_id, txn
  having not bool_or(kind in ('commit', 'abort'))
), w as (
  select * from tx_log where log_id in ('LOG4', 'LOG5') and kind in ('update', 'clr')
)
select i.log_id, i.item,
       coalesce((select u.old_val from w u
                      join undo_list ul on ul.log_id = u.log_id and ul.txn = u.txn
                 where u.log_id = i.log_id and u.item = i.item and u.kind = 'update'
                 order by u.lsn limit 1),
                (select u.new_val from w u
                 where u.log_id = i.log_id and u.item = i.item
                 order by u.lsn desc limit 1)) as value
from (select distinct log_id, item from w) i;

-- @ex CH19.08  [log truncation]  ★★☆
-- Đề gốc: Exercise 19.3. Some database systems let the administrator choose between two kinds of logging: *normal logging*, used for recovery from system crashes, and *archival logging*, used for recovery from media (disk) failure. With the recovery algorithm of Section 19.4, when can a log record be deleted in each of these two cases?
--
-- Theo PE 19.3, với `LOG2`, bản ghi của transaction không active lúc checkpoint cuối và đã kết thúc trước checkpoint thì xoá được. Trả về các `lsn` của `LOG2` có thể xoá (mọi bản ghi của những transaction đó).
with chk as (
  select lsn, active from tx_log
  where log_id = 'LOG2' and kind = 'checkpoint'
  order by lsn desc limit 1
)
select l.lsn
from tx_log l, chk
where l.log_id = 'LOG2' and l.txn is not null
  and l.lsn < chk.lsn
  and not (l.txn = any (chk.active))
  and l.txn not in (select txn from tx_log where log_id = 'LOG2' and lsn > chk.lsn and txn is not null);

-- @ex CH19.09  [deferred modification]  ★★☆
-- Đề gốc: Exercise 19.5 (b). Assume the database uses the deferred-modification technique.
--
-- b. Without old values in update log records, transaction undo is clearly impossible. How must the redo phase of recovery change as a consequence?
--
-- Giả sử `LOG1` được sinh với deferred modification: CSDL trên đĩa (`tx_disk(item, val)`) chỉ chứa giá trị ban đầu, chỉ cập nhật của transaction đã commit được áp khi phục hồi. Trả về giá trị sau phục hồi của mọi item trong `tx_disk`: `item, value`.
select d.item,
       coalesce((select l.new_val from tx_log l
                 where l.log_id = 'LOG1' and l.kind = 'update' and l.item = d.item
                   and l.txn in (select txn from tx_log where log_id = 'LOG1' and kind = 'commit')
                 order by l.lsn desc limit 1), d.val) as value
from tx_disk d;

-- @ex CH19.10  [undo committed txn]  ★★☆
-- Đề gốc: Exercise 19.11 (a). Sometimes a transaction must be undone after it has committed, because it was executed by mistake — for example, a bank teller typed wrong input.
--
-- a. Give an example showing that undoing such a transaction with the normal undo mechanism could leave the database inconsistent.
--
-- `tx_bank_log(lsn, txn, item, old_val, new_val)`: T1 rồi T2 cùng gửi 10 vào A (đều đã commit). Muốn huỷ chỉ T1. Trả về một dòng `normal_undo` (A sau khi undo T1 bằng old value như bình thường) và `logical_undo` (A hiện tại trừ đi khoản T1 đã cộng).
select (select old_val from tx_bank_log where txn = 'T1') as normal_undo,
       (select new_val from tx_bank_log order by lsn desc limit 1)
         - (select new_val - old_val from tx_bank_log where txn = 'T1') as logical_undo;

-- @ex CH19.11  [ARIES analysis]  ★★★
-- ARIES: `tx_aries_log(lsn, prev_lsn, txn, kind, page_id, undo_next_lsn)`, checkpoint ở LSN 50 ghi DirtyPageTable `tx_aries_chk_dpt(page_id, rec_lsn)`. Pha analysis đọc xuôi từ checkpoint: trang nào được update/clr mà chưa có trong DirtyPageTable thì thêm với RecLSN = LSN đó. Trả về DirtyPageTable sau analysis: `page_id, rec_lsn`.
with chk as (
  select lsn from tx_aries_log where kind = 'checkpoint'
)
select page_id, rec_lsn from tx_aries_chk_dpt
union all
select page_id, min(lsn)
from tx_aries_log
where kind in ('update', 'clr') and lsn > (select lsn from chk)
  and page_id not in (select page_id from tx_aries_chk_dpt)
group by page_id;

-- @ex CH19.12  [ARIES redo]  ★★★
-- Tiếp CH19.11. RedoLSN = RecLSN nhỏ nhất. Pha redo đọc xuôi từ RedoLSN và redo bản ghi update/clr trừ khi: trang không có trong DirtyPageTable, hoặc LSN < RecLSN của trang, hoặc PageLSN trên đĩa (`tx_aries_page`) ≥ LSN. Trả về các bản ghi được redo: `lsn, txn, page_id`.
with chk as (
  select lsn from tx_aries_log where kind = 'checkpoint'
), dpt as (
  select page_id, rec_lsn from tx_aries_chk_dpt
  union all
  select page_id, min(lsn) from tx_aries_log
  where kind in ('update', 'clr') and lsn > (select lsn from chk)
    and page_id not in (select page_id from tx_aries_chk_dpt)
  group by page_id
)
select l.lsn, l.txn, l.page_id
from tx_aries_log l
     join dpt d on d.page_id = l.page_id
     join tx_aries_page p on p.page_id = l.page_id
where l.kind in ('update', 'clr')
  and l.lsn >= (select min(rec_lsn) from dpt)
  and l.lsn >= d.rec_lsn
  and p.page_lsn < l.lsn;

-- @ex CH19.13  [ARIES undo]  ★★★
-- Pha undo của ARIES: transaction chưa kết thúc (không có `commit`/`end`) là loser. Bắt đầu từ bản ghi cuối của mỗi loser, đi lùi theo `prev_lsn` (với CLR thì nhảy theo `undo_next_lsn`). Trả về các bản ghi update bị undo, theo thứ tự undo (LSN giảm dần): `lsn, txn, page_id`.
-- (Thứ tự dòng được chấm.)
with recursive losers as (
  select txn, max(lsn) as last_lsn
  from tx_aries_log
  where txn is not null
  group by txn
  having not bool_or(kind in ('commit', 'end'))
), chain (txn, lsn) as (
  select txn, last_lsn from losers
  union all
  select l.txn, case when l.kind = 'clr' then l.undo_next_lsn else l.prev_lsn end
  from chain c join tx_aries_log l on l.lsn = c.lsn
  where (case when l.kind = 'clr' then l.undo_next_lsn else l.prev_lsn end) is not null
)
select l.lsn, l.txn, l.page_id
from chain c join tx_aries_log l on l.lsn = c.lsn
where l.kind = 'update'
order by l.lsn desc;

-- @ex CH19.14  [savepoint]  ★★☆
-- Đề gốc: Exercise 19.4. Describe how to modify the recovery algorithm of Section 19.4 to support savepoints and rollback to a savepoint. (Savepoints are described in Section 19.9.3.)
--
-- Savepoint thật trên PostgreSQL: trong một transaction, cộng 100 vào `A-101`; `savepoint s1`; trừ 300 khỏi `A-102`; `savepoint s2`; xoá tài khoản `A-301`; rollback về s1; cộng 1 vào `A-201`; commit.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
begin;
update tx_account set balance = balance + 100 where acc_id = 'A-101';
savepoint s1;
update tx_account set balance = balance - 300 where acc_id = 'A-102';
savepoint s2;
delete from tx_account where acc_id = 'A-301';
rollback to savepoint s1;
update tx_account set balance = balance + 1 where acc_id = 'A-201';
commit;

-- Câu truy vấn hệ thống dùng để chấm:
--   select acc_id, balance from tx_account order by acc_id;
