-- =====================================================================
-- CS4420 · Chương 1 — Giới thiệu về hệ cơ sở dữ liệu (Introduction)
-- Dialect: PostgreSQL. Database: University (db/*.sql)
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động:   npm run grade -- ch1
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex 1.01  [warm-up]  ★☆☆
-- Câu truy vấn đầu tiên trong slide: tìm name của tất cả instructor thuộc khoa `Comp. Sci.`
-- Gợi ý: select ... from instructor where dept_name = ...




-- @ex 1.02  [warm-up]  ★☆☆
-- Xem toàn bộ instance hiện tại của bảng `department` (mọi cột, mọi dòng).
-- Gợi ý: Dấu * nghĩa là "all attributes".




-- @ex 1.03  [data dictionary]  ★★☆
-- Data dictionary lưu metadata. Trong PostgreSQL có thể đọc nó qua `information_schema`. Liệt kê column_name và data_type của bảng `instructor`, theo đúng thứ tự cột (`ordinal_position`).
-- Gợi ý: Bảng information_schema.columns, lọc table_name = 'instructor'.
-- (Thứ tự dòng được chấm.)


