-- =====================================================================
-- CS4420 · Chương 18 — Điều khiển đồng thời (Concurrency Control) (Concurrency Control)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch18
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH18.01  [lock compatibility]  ★★☆
-- Đề gốc: Exercise 18.7. A database system offers an atomic *increment* operation besides read and write. If V is the value of data item X, then
--
-- increment(X) by C
--
-- sets X to V + C in a single atomic step. The transaction does not learn the value of X unless it also executes read(X).
--
-- Increment operations lock the item in *increment mode*, using the compatibility matrix of Figure 18.25.
--
-- a. Show that if every transaction locks the data it accesses in the matching mode, two-phase locking guarantees serializability.
--
-- b. Show that adding increment-mode locks allows more concurrency.
--
-- *Figure 18.25 — Lock-compatibility matrix with increment mode* (true = compatible):
--
-- |   | S | X | I |
-- |---|---|---|---|
-- | S | true | false | false |
-- | X | false | false | false |
-- | I | false | false | true |
--
-- `tx_lock_req(req_id, item, txn, mode, status)` là bảng khoá của lock manager (mode S, X hoặc I); `tx_lock_compat(held, requested, ok)` là ma trận Figure 18.25. Với mỗi yêu cầu waiting, cho biết có cấp được ngay không (tương thích với mọi khoá held của transaction khác trên cùng item; bỏ qua thứ tự hàng đợi): `req_id, txn, item, mode, grantable`.




-- @ex CH18.02  [two-phase check]  ★★☆
-- `tx_lock_sched(sched_id, step, txn, action, item)` lưu schedule có lệnh khoá (action: lock-S, lock-X, unlock, read, write, commit). Với mỗi (sched_id, txn), cho biết transaction có tuân theo 2PL không (không xin khoá nào sau lần unlock đầu tiên): `sched_id, txn, two_phase`.




-- @ex CH18.03  [lock point]  ★★☆
-- Đề gốc: Exercise 18.1. Show that the two-phase locking protocol guarantees conflict serializability, and that transactions can be serialized in the order of their lock points.
--
-- Với schedule `L1`, tính lock point (step của lệnh khoá cuối cùng) của mỗi transaction và trả về `txn, lock_point` sắp theo lock_point — đây là thứ tự serial tương đương theo PE 18.1.
-- (Thứ tự dòng được chấm.)




-- @ex CH18.04  [strict / rigorous 2PL]  ★★★
-- Đề gốc: Exercise 18.3. What advantage does rigorous two-phase locking offer? How does it compare with the other variants of two-phase locking?
--
-- Với mỗi (sched_id, txn) trong `tx_lock_sched`, trả về `sched_id, txn, strict, rigorous`: strict — mọi unlock của item đã khoá X đều sau commit; rigorous — mọi unlock đều sau commit (transaction không unlock thì coi là đúng).




-- @ex CH18.05  [deadlock detection]  ★★★
-- `tx_waits(graph, waiter, holder)` lưu các wait-for graph. Trả về các transaction đang bị deadlock (nằm trên một chu trình): `graph, txn`.




-- @ex CH18.06  [deadlock victim]  ★★★
-- Trong mỗi wait-for graph, mỗi chu trình (thành phần liên thông mạnh có chu trình) chọn victim là transaction trẻ nhất (timestamp lớn nhất trong `tx_txn`). Trả về `graph, cycle_id, victim` với cycle_id là tên transaction nhỏ nhất (theo thứ tự chữ) của chu trình.
-- Gợi ý: Hai transaction cùng chu trình ⇔ mỗi bên đến được bên kia.




-- @ex CH18.07  [wait-die / wound-wait]  ★★☆
-- `tx_conflict(req_id, requester, holder)`: requester xin khoá đang bị holder giữ; timestamp ở `tx_txn` (nhỏ = già). Trả về `req_id, wait_die, wound_wait` với giá trị `wait`, `rollback requester` hoặc `rollback holder`.




-- @ex CH18.08  [timestamp ordering]  ★★☆
-- Đề gốc: Exercise 18.8. In timestamp ordering, W-timestamp(Q) is the largest timestamp of any transaction that successfully executed write(Q). Suppose we instead defined it as the timestamp of the most recent transaction that successfully executed write(Q). Would this change in wording make a difference? Explain.
--
-- `tx_to_req(req_id, txn_ts, op, item, r_ts, w_ts)`: mỗi dòng là một yêu cầu độc lập — TS của transaction, thao tác R/W và R-/W-timestamp hiện tại của item. Trả về `req_id, basic_to, thomas`: quyết định của timestamp ordering cơ bản (`execute`/`rollback`) và khi dùng Thomas' write rule (`execute`/`rollback`/`ignore`).




-- @ex CH18.09  [multiversion read]  ★★☆
-- Multiversion timestamp ordering: `tx_versions(item, w_ts, value)` là các phiên bản; `tx_mv_reads(req_id, txn_ts, item)` là các yêu cầu đọc. Trả về `req_id, value_read` — giá trị của phiên bản có W-timestamp lớn nhất ≤ TS của transaction.




-- @ex CH18.10  [TO simulation]  ★★★
-- Đề gốc: Exercise 18.12. Under the timestamp-ordering protocol, take two transactions: one writes data items p and q, the other reads the same two items. Give a schedule in which the timestamp test for a write fails and forces the first transaction to restart, which in turn causes a cascading abort of the other transaction. Show how this can lead to starvation of both transactions. (A situation in which two or more processes keep acting but never finish because of their interaction with each other is called a *livelock*.)
--
-- Mô phỏng timestamp ordering trên schedule `tx_to_ops(step, txn, ts, op, item)` (kịch bản PE 18.12). Ban đầu mọi R-/W-timestamp bằng 0. Xử lý lần lượt từng step:
-- - read: TS < W-ts → `rollback`; ngược lại `execute` và R-ts := max(R-ts, TS);
-- - write: TS < R-ts hoặc TS < W-ts → `rollback`; ngược lại `execute` và W-ts := TS;
-- - transaction đã bị rollback thì các lệnh sau của nó là `skipped` (không restart, không cascading).
-- Trả về `step, txn, op, item, outcome` sắp theo step.
-- Gợi ý: Recursive CTE, mỗi bước mang trạng thái: jsonb R-ts, jsonb W-ts, mảng transaction đã rollback.
-- (Thứ tự dòng được chấm.)




-- @ex CH18.11  [validation]  ★★★
-- `tx_val(txn, start_ts, val_ts, finish_ts, read_set, write_set)` (mảng text). Áp dụng validation test cho từng T[j] so với mọi T[i] có val_ts nhỏ hơn: FinishTS(T[i]) < StartTS(T[j]), hoặc StartTS(T[j]) < FinishTS(T[i]) < ValidationTS(T[j]) và write_set(T[i]) không giao read_set(T[j]). Trả về `txn, passes`.
-- Gợi ý: Toán tử && kiểm tra hai mảng có phần tử chung.




-- @ex CH18.12  [first-committer-wins]  ★★★
-- Đề gốc: Exercise 18.15 (a). Snapshot isolation includes a validation step which, before transaction T writes a data item, checks whether a transaction concurrent with T has already written that item.
--
-- a. A simple implementation gives every transaction a start timestamp and a commit timestamp, plus an *update set* (the set of data items it updated). Explain how to validate under the first-committer-wins scheme using the transaction timestamps and the update sets. You may assume validation and the other commit-processing steps run serially, one transaction at a time.
--
-- `tx_si(txn, start_ts, commit_ts, write_set)`: các transaction xin commit theo thứ tự commit_ts. Theo first-committer-wins, T commit được nếu không transaction nào đã commit thành công có commit_ts > start_ts(T) và write set giao write set của T; ngược lại T abort (và không được tính cho các transaction sau). Trả về `txn, status` (`commit`/`abort`) sắp theo commit_ts.
-- Gợi ý: Transaction bị abort không tính — cần xử lý tuần tự (recursive CTE mang theo danh sách đã commit).
-- (Thứ tự dòng được chấm.)




-- @ex CH18.13  [item W-timestamp]  ★★★
-- Đề gốc: Exercise 18.15 (b). Snapshot isolation includes a validation step which, before transaction T writes a data item, checks whether a transaction concurrent with T has already written that item.
--
-- b. Now, instead of update sets, every data item carries a write timestamp. Explain how validation can be done as part of commit processing for first-committer-wins with this variant. Again assume validation and other commit steps run serially.
--
-- Theo cách cài đặt ở PE 18.15b, mỗi item giữ W-timestamp = commit_ts của transaction cuối cùng đã commit một ghi lên nó. Dùng kết quả first-committer-wins trên `tx_si` (như CH18.12), trả về `item, w_timestamp` cho mọi item từng được một transaction đã commit ghi.




-- @ex CH18.14  [phantom]  ★★☆
-- Đề gốc: Exercise 18.13. Design a timestamp-based protocol that avoids the phantom phenomenon.
--
-- `tx_pred(txn, lo, hi)`: mỗi transaction đọc instructor theo vị từ `salary between lo and hi`. `tx_ins(ins_id, txn, salary)`: các lệnh chèn instructor. Liệt kê các lệnh chèn tạo phantom cho một transaction đọc khác: `reader, inserter, ins_id, salary`.


