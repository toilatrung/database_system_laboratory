-- =====================================================================
-- CS4420 · Chương 26 — Cơ sở dữ liệu blockchain (Blockchain Databases)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch26
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH26.01  [tính hash khối]  ★☆☆
-- Mỗi khối trong `bc_block` có hash = sha256 của chuỗi `height || '|' || prev_hash || '|' || data || '|' || nonce` (mã hoá UTF-8), viết dạng hex. Tính lại hash cho mọi khối và trả về `height`, `hash_ok` (true nếu hash tính lại bằng cột hash).
-- Gợi ý: encode(sha256(convert_to(..., 'UTF8')), 'hex')




-- @ex CH26.02  [kiểm tra chuỗi bị sửa]  ★★☆
-- Đề gốc: Exercise 26.6. Data stored in a blockchain are protected by its tamper-resistance property. In what way is this tamper resistance more secure in practice than the security provided by a traditional enterprise database system?
--
-- `bc_block_tampered` là bản sao mà ai đó đã sửa dữ liệu một khối và tính lại hash của khối đó. Với mỗi khối, trả về `height`, `hash_ok` (hash tính lại bằng cột hash) và `link_ok` (prev_hash bằng hash của khối có height − 1; khối 0 coi là true).




-- @ex CH26.03  [khối phải đào lại]  ★★☆
-- Đề gốc: Exercise 26.6. Data stored in a blockchain are protected by its tamper-resistance property. In what way is this tamper resistance more secure in practice than the security provided by a traditional enterprise database system?
--
-- Tiếp CH26.02: kẻ sửa muốn chuỗi hợp lệ trở lại thì phải tính lại (đào lại) mọi khối từ khối đầu tiên bị lỗi liên kết tới khối cuối. Trả về một dòng: `first_broken` (height nhỏ nhất có link_ok = false) và `blocks_to_remine` (số khối từ first_broken tới khối cuối).




-- @ex CH26.04  [Merkle: lá]  ★☆☆
-- Lá của Merkle tree là sha256 (hex) của payload mỗi giao dịch. Trả về `tx_no`, `leaf_hash` cho các giao dịch của khối 1 trong `bc_tx`.




-- @ex CH26.05  [Merkle root]  ★★★
-- Tính Merkle root của khối 1: mỗi node cha = sha256 (hex) của chuỗi ghép hash con trái || hash con phải (ghép chuỗi hex, mã hoá UTF-8); ghép các node theo thứ tự 1-2, 3-4, …; nếu một mức có số node lẻ thì node cuối được ghép với chính nó. Trả về một dòng một cột `merkle_root`.
-- Gợi ý: with recursive giữ mảng hash của một mức; mức sau tính từ hs[2i−1] || hs[2i] bằng generate_series.




-- @ex CH26.06  [Merkle root, số lá lẻ]  ★★★
-- Như CH26.05 nhưng cho khối 2 (3 giao dịch — mức lá có số node lẻ, giao dịch 3 được ghép với chính nó).




-- @ex CH26.07  [proof-of-work]  ★★☆
-- Proof-of-work độ khó nhỏ: tìm nonce nhỏ nhất trong 0…20000 sao cho sha256 (hex) của chuỗi `'6|' || hash_khối_5 || '|Bob pays Dave 6|' || nonce` bắt đầu bằng '000' (hash_khối_5 lấy từ bc_block). Trả về `nonce` và `hash`.
-- Gợi ý: generate_series(0, 20000), order by nonce limit 1.




-- @ex CH26.08  [hash yếu: va chạm]  ★☆☆
-- Đề gốc: Exercise 26.2 (a). Consider the hash function h(x) = x mod 2256, i.e., it returns the last 256 bits of x. Does this function have each of the following properties? Explain why or why not.
--
-- a. Collision resistance.
--
-- Minh hoạ PE 26.2 với phiên bản thu nhỏ h(x) = x mod 256: trả về 5 giá trị x dương nhỏ nhất có cùng hash với x = 42 (kể cả 42), cột `x`, sắp tăng dần. Collision resistance hoàn toàn không có.
-- (Thứ tự dòng được chấm.)




-- @ex CH26.09  [số dư từ sổ cái]  ★★☆
-- Số dư hiện tại của mỗi tài khoản = số dư ban đầu (`bc_genesis`) + tổng tiền nhận − tổng tiền gửi trong `bc_transfer` (giả sử mọi lệnh đều hợp lệ). Trả về `acct`, `balance`.




-- @ex CH26.10  [phát hiện tiêu quá số dư]  ★★★
-- Xử lý các lệnh chuyển theo thứ tự tx_id (mọi lệnh đều được áp dụng). Tìm các lệnh mà ngay sau khi áp dụng, số dư của người gửi bị âm — những lệnh một node hợp lệ phải từ chối (tương tự double spending). Trả về `tx_id`, `from_acct`, `balance_after`.
-- Gợi ý: Biến mỗi lệnh thành hai dòng (+ cho người nhận, − cho người gửi), rồi tổng chạy theo tài khoản, order by tx_id.




-- @ex CH26.11  [append-only bằng trigger]  ★★★
-- Đề gốc: Exercise 26.11. Why do enterprise blockchains often provide database-style access?
--
-- Biến `bc_ledger` thành sổ cái chỉ được thêm: tạo hàm trigger và trigger `bc_ledger_append_only` before update or delete trên bc_ledger, raise exception (SQLSTATE mặc định P0001). Hệ thống thử update, delete và insert.




-- @ex CH26.12  [điểm fork]  ★☆☆
-- Đề gốc: Exercise 26.1. What is a blockchain fork? Name the two kinds of fork and explain how they differ.
--
-- `bc_fork(block_id, parent_id)` là các khối một node đã thấy. Tìm các điểm fork — khối có nhiều hơn một khối con: `block_id`, `num_children`.




-- @ex CH26.13  [quy tắc chuỗi dài nhất]  ★★★
-- Đề gốc: Exercise 26.1. What is a blockchain fork? Name the two kinds of fork and explain how they differ.
--
-- Theo quy tắc chuỗi dài nhất, node chọn nhánh có khối ngọn (tip) xa genesis nhất. Trả về `tip` và `chain` — chuỗi block_id từ genesis tới tip, ngăn cách bởi ' -> ' — của chuỗi dài nhất.
-- Gợi ý: with recursive từ khối có parent_id null đi xuống, mang theo đường đi và độ dài.


