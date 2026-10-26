-- =====================================================================
-- CS4420 · Chương 1 — Giới thiệu về hệ cơ sở dữ liệu (Introduction)
-- Dialect: PostgreSQL. Database: University (db/*.sql)
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại db/*.sql.

-- @ex 1.01  [warm-up]  ★☆☆
-- Câu truy vấn đầu tiên trong slide: tìm name của tất cả instructor thuộc khoa `Comp. Sci.`
-- Gợi ý: select ... from instructor where dept_name = ...
select name
from instructor
where dept_name = 'Comp. Sci.';

-- @ex 1.02  [warm-up]  ★☆☆
-- Xem toàn bộ instance hiện tại của bảng `department` (mọi cột, mọi dòng).
-- Gợi ý: Dấu * nghĩa là "all attributes".
select * from department;

-- @ex 1.03  [data dictionary]  ★★☆
-- Data dictionary lưu metadata. Trong PostgreSQL có thể đọc nó qua `information_schema`. Liệt kê column_name và data_type của bảng `instructor`, theo đúng thứ tự cột (`ordinal_position`).
-- Gợi ý: Bảng information_schema.columns, lọc table_name = 'instructor'.
-- (Thứ tự dòng được chấm.)
select column_name, data_type
from information_schema.columns
where table_name = 'instructor'
order by ordinal_position;
