-- =====================================================================
-- CS4420 · Chương 17 — Giao tác (Transactions) (Transactions)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch17
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH17.01  [commit]  ★☆☆
-- Viết một transaction chuyển 100 từ tài khoản `A-101` sang `A-102` (bảng `tx_account`) rồi commit. *(Bài này chạy trên CSDL mới, được dùng begin/commit.)*
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)




-- @ex CH17.02  [atomicity]  ★★★
-- Viết hàm PL/pgSQL `tx_transfer(src varchar, dst varchar, amt numeric) returns text` chuyển `amt` từ `src` sang `dst` trong `tx_account`: cộng vào dst trước, trừ src sau. Nếu việc trừ vi phạm `check (balance >= 0)` thì không được để lại thay đổi nào (kể cả phần đã cộng vào dst) và trả về `'FAILED'`; thành công trả về `'OK'`.
-- Khi chấm, hệ thống gọi `tx_transfer('A-101', 'A-102', 100)` và `tx_transfer('A-102', 'A-301', 1000)` rồi đọc số dư.
-- Gợi ý: Khối begin … exception when check_violation then … end trong PL/pgSQL là một subtransaction: lỗi trong khối làm huỷ mọi thay đổi của khối.




-- @ex CH17.03  [savepoint]  ★★☆
-- Trong một transaction: cộng 50 vào `A-201`; tạo `savepoint s1`; đặt số dư mọi tài khoản của `Bob` về 0; rollback về s1; cộng 25 vào `A-301`; commit.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)




-- @ex CH17.04  [conflicting operations]  ★★☆
-- `tx_sched(sched_id, step, txn, op, item)` lưu các schedule (op: R, W, C = commit, A = abort). Liệt kê mọi cặp lệnh xung đột của schedule `S1`: `step1, step2, txn1, txn2, item` với step1 < step2.
-- Gợi ý: Cùng item, khác transaction, ít nhất một W; bỏ C/A.




-- @ex CH17.05  [precedence graph]  ★★☆
-- Trả về các cạnh `src, dst` (không trùng) của precedence graph của schedule `S6`.




-- @ex CH17.06  [cycle detection]  ★★★
-- Với mỗi schedule trong `tx_sched`, cho biết có conflict serializable không: `sched_id, conflict_serializable` (boolean). Dùng recursive CTE tìm chu trình trên precedence graph.
-- Gợi ý: Tính bao đóng bắc cầu reach(src, dst); có chu trình ⇔ tồn tại reach(T, T).




-- @ex CH17.07  [topological order]  ★★★
-- Đề gốc: Exercise 17.6. Look at the precedence graph of Figure 17.16. Is the schedule it corresponds to conflict serializable? Justify your answer.
--
-- *Figure 17.16 — Precedence graph for Practice Exercise 17.6* (nodes T1–T5, edges):
--
-- T1 → T2, T1 → T3, T1 → T4, T2 → T3, T2 → T4, T3 → T5, T4 → T5
--
-- `tx_pg_edge(graph, src, dst)` chứa precedence graph `F17.16` của Figure 17.16. Tính thứ tự serial tương đương: mỗi transaction cùng `level` = độ dài đường đi dài nhất từ một đỉnh không có cạnh vào. Trả về `txn, level`, sắp theo level rồi txn.
-- (Thứ tự dòng được chấm.)




-- @ex CH17.08  [reads-from]  ★★☆
-- Quan hệ reads-from của schedule `S4`: với mỗi lệnh R, trả về `step, reader, item, writer` — writer là transaction thực hiện lệnh W gần nhất trước đó trên cùng item, hoặc `initial` nếu chưa có ai ghi.




-- @ex CH17.09  [recoverable / cascadeless]  ★★★
-- Đề gốc: Exercise 17.7. What is a cascadeless schedule? Why is it desirable for schedules to be cascadeless? Are there situations in which allowing noncascadeless schedules would be preferable? Explain.
--
-- Với mỗi schedule, trả về `sched_id, recoverable, cascadeless` (boolean). Dùng quan hệ reads-from ở CH17.08 (bỏ trường hợp đọc giá trị ban đầu hoặc đọc chính dữ liệu mình ghi). Recoverable: reader đã commit thì writer phải commit trước reader. Cascadeless: writer phải commit trước lệnh read.




-- @ex CH17.10  [lost update]  ★★★
-- Đề gốc: Exercise 17.8 (a). A *lost update* anomaly happens when a transaction T[j] reads a data item, another transaction T[k] then writes that item (possibly based on an earlier read), and afterwards T[j] writes the item. The update made by T[k] is lost, because T[j]'s update did not take into account the value T[k] wrote.
--
-- a. Give a schedule that exhibits the lost update anomaly.
--
-- Tìm lost update trong schedule `S2`: T[j] đọc X, sau đó T[k] (khác T[j]) ghi X, sau đó T[j] ghi X. Trả về `lost_txn` (T[k], người bị mất cập nhật), `overwriting_txn` (T[j]), `item`.




-- @ex CH17.11  [serial schedule]  ★★☆
-- Với mỗi schedule, cho biết có phải serial schedule không (mọi lệnh của mỗi transaction nằm liền nhau): `sched_id, is_serial`.
-- Gợi ý: step − row_number() over (partition by sched_id, txn order by step) không đổi trên một đoạn liền nhau.




-- @ex CH17.12  [final write]  ★★☆
-- Điều kiện thứ 3 của view equivalence dùng final write. Với mỗi schedule và mỗi item, trả về transaction ghi item đó lần cuối: `sched_id, item, final_writer`.




-- @ex CH17.13  [cycle members]  ★★★
-- Trong `tx_pg_edge`, đồ thị `G2` có chu trình. Trả về các transaction nằm trên một chu trình (`txn`) — đó là các transaction không thể xếp vào thứ tự serial.


