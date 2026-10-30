-- =====================================================================
-- CS4420 · Chương 19 — Phục hồi (Recovery System) (Recovery System)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch19
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH19.01  [transaction status]  ★☆☆
-- `tx_log(log_id, lsn, txn, kind, item, old_val, new_val, active)` lưu các log (hệ thống crash ngay sau bản ghi cuối). Với `LOG1`, trả về `txn, status`: `committed`, `aborted` hoặc `incomplete`.




-- @ex CH19.02  [values after recovery]  ★★★
-- Tính giá trị của mỗi item sau khi phục hồi `LOG1` bằng thuật toán Section 19.4: redo mọi bản ghi update/clr theo thứ tự, rồi undo (ngược) mọi update của transaction incomplete. Trả về `item, value`.
-- Gợi ý quy tắc: nếu item có update của transaction incomplete thì giá trị cuối là old_val của update sớm nhất trong số đó; ngược lại là giá trị (new_val) của bản ghi update/clr cuối cùng.




-- @ex CH19.03  [undo-list from checkpoint]  ★★☆
-- `LOG2` có bản ghi `checkpoint` (cột `active` = danh sách L). Theo pha redo của Section 19.4: undo-list khởi tạo bằng L của checkpoint cuối cùng, thêm transaction có `start` sau checkpoint, bỏ transaction có `commit`/`abort` sau checkpoint. Trả về undo-list (`txn`).




-- @ex CH19.04  [redo phase]  ★★☆
-- Liệt kê các bản ghi được redo khi phục hồi `LOG2` (mọi `update` và `clr` sau checkpoint cuối cùng): `lsn, txn, kind, item`.




-- @ex CH19.05  [undo phase log]  ★★★
-- Pha undo khi phục hồi `LOG2` duyệt log ngược và ghi thêm log: với mỗi update của transaction trong undo-list ghi CLR ``; khi gặp `start` của transaction đó ghi ``. Trả về các bản ghi được ghi thêm theo đúng thứ tự: `seq, txn, kind` (`clr`/`abort`), `item, value` (null với abort).
-- (Thứ tự dòng được chấm.)




-- @ex CH19.06  [undo order]  ★★☆
-- Đề gốc: Exercise 19.1. Explain why the log records of transactions on the undo-list must be processed in reverse order, while redo is done in the forward direction.
--
-- `LOG3`: transaction incomplete T7 sửa X và Y nhiều lần. Với mỗi item trả về `item, correct_value` (undo ngược) và `wrong_value` (nếu undo xuôi, tức áp old_val theo thứ tự LSN tăng dần).




-- @ex CH19.07  [logging rollback]  ★★★
-- Đề gốc: Exercise 19.7. Suppose we (wrongly) change the recovery algorithm of Section 19.4 so that actions taken during transaction rollback are not logged. Then, when recovering from a system crash, transactions that were rolled back earlier would be put on the undo-list and rolled back a second time. Give an example showing how actions taken in the undo phase of recovery could leave the database in an incorrect state. (Hint: consider a data item updated by an aborted transaction and afterwards updated by a transaction that commits.)
--
-- `LOG4` là log của thuật toán sửa sai ở PE 19.7 (rollback của T1 không ghi log); `LOG5` là log đúng (có CLR và abort). Áp cùng quy tắc phục hồi như CH19.02 cho cả hai log và trả về `log_id, item, value`.




-- @ex CH19.08  [log truncation]  ★★☆
-- Đề gốc: Exercise 19.3. Some database systems let the administrator choose between two kinds of logging: *normal logging*, used for recovery from system crashes, and *archival logging*, used for recovery from media (disk) failure. With the recovery algorithm of Section 19.4, when can a log record be deleted in each of these two cases?
--
-- Theo PE 19.3, với `LOG2`, bản ghi của transaction không active lúc checkpoint cuối và đã kết thúc trước checkpoint thì xoá được. Trả về các `lsn` của `LOG2` có thể xoá (mọi bản ghi của những transaction đó).




-- @ex CH19.09  [deferred modification]  ★★☆
-- Đề gốc: Exercise 19.5 (b). Assume the database uses the deferred-modification technique.
--
-- b. Without old values in update log records, transaction undo is clearly impossible. How must the redo phase of recovery change as a consequence?
--
-- Giả sử `LOG1` được sinh với deferred modification: CSDL trên đĩa (`tx_disk(item, val)`) chỉ chứa giá trị ban đầu, chỉ cập nhật của transaction đã commit được áp khi phục hồi. Trả về giá trị sau phục hồi của mọi item trong `tx_disk`: `item, value`.




-- @ex CH19.10  [undo committed txn]  ★★☆
-- Đề gốc: Exercise 19.11 (a). Sometimes a transaction must be undone after it has committed, because it was executed by mistake — for example, a bank teller typed wrong input.
--
-- a. Give an example showing that undoing such a transaction with the normal undo mechanism could leave the database inconsistent.
--
-- `tx_bank_log(lsn, txn, item, old_val, new_val)`: T1 rồi T2 cùng gửi 10 vào A (đều đã commit). Muốn huỷ chỉ T1. Trả về một dòng `normal_undo` (A sau khi undo T1 bằng old value như bình thường) và `logical_undo` (A hiện tại trừ đi khoản T1 đã cộng).




-- @ex CH19.11  [ARIES analysis]  ★★★
-- ARIES: `tx_aries_log(lsn, prev_lsn, txn, kind, page_id, undo_next_lsn)`, checkpoint ở LSN 50 ghi DirtyPageTable `tx_aries_chk_dpt(page_id, rec_lsn)`. Pha analysis đọc xuôi từ checkpoint: trang nào được update/clr mà chưa có trong DirtyPageTable thì thêm với RecLSN = LSN đó. Trả về DirtyPageTable sau analysis: `page_id, rec_lsn`.




-- @ex CH19.12  [ARIES redo]  ★★★
-- Tiếp CH19.11. RedoLSN = RecLSN nhỏ nhất. Pha redo đọc xuôi từ RedoLSN và redo bản ghi update/clr trừ khi: trang không có trong DirtyPageTable, hoặc LSN < RecLSN của trang, hoặc PageLSN trên đĩa (`tx_aries_page`) ≥ LSN. Trả về các bản ghi được redo: `lsn, txn, page_id`.




-- @ex CH19.13  [ARIES undo]  ★★★
-- Pha undo của ARIES: transaction chưa kết thúc (không có `commit`/`end`) là loser. Bắt đầu từ bản ghi cuối của mỗi loser, đi lùi theo `prev_lsn` (với CLR thì nhảy theo `undo_next_lsn`). Trả về các bản ghi update bị undo, theo thứ tự undo (LSN giảm dần): `lsn, txn, page_id`.
-- (Thứ tự dòng được chấm.)




-- @ex CH19.14  [savepoint]  ★★☆
-- Đề gốc: Exercise 19.4. Describe how to modify the recovery algorithm of Section 19.4 to support savepoints and rollback to a savepoint. (Savepoints are described in Section 19.9.3.)
--
-- Savepoint thật trên PostgreSQL: trong một transaction, cộng 100 vào `A-101`; `savepoint s1`; trừ 300 khỏi `A-102`; `savepoint s2`; xoá tài khoản `A-301`; rollback về s1; cộng 1 vào `A-201`; commit.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)


