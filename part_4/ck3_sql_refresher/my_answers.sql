-- =====================================================================
-- CS4420 · Ôn CK · Phần 3 — Ôn nhanh SQL & đại số quan hệ (phòng câu tổng hợp) (SQL & Relational Algebra Refresher)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ck3
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CK3.01  [join]  ★☆☆
-- Bank: customer_name, loan_number, branch_name và amount của mọi khoản vay (mỗi người đứng tên một dòng).




-- @ex CK3.02  [left outer join + count]  ★★☆
-- Mọi customer: ID, customer_name và số account đứng tên (`num_accounts`, 0 nếu không có).




-- @ex CK3.03  [group by / having]  ★☆☆
-- Các customer_city có ít nhất 2 khách hàng; trả về customer_city và số khách.




-- @ex CK3.04  [in subquery]  ★☆☆
-- Insurance: name của những người sở hữu ít nhất một xe đời (year) 2010.




-- @ex CK3.05  [not exists]  ★★☆
-- Insurance: driver_id và name của những người có sở hữu xe nhưng chưa từng là người lái trong vụ tai nạn nào.




-- @ex CK3.06  [> all]  ★★☆
-- Employee: ID và salary của nhân viên có lương cao hơn mọi nhân viên của `Mega Corp`.




-- @ex CK3.07  [union]  ★☆☆
-- Các thành phố có branch hoặc có khách hàng sinh sống (không trùng).




-- @ex CK3.08  [with]  ★★☆
-- Insurance: với mỗi năm, tổng damage_amount của các vụ tai nạn trong năm đó; chỉ trả về các năm có tổng damage lớn hơn trung bình tổng damage của các năm. Trả về year, total_damage.




-- @ex CK3.09  [scalar subquery]  ★★☆
-- Mọi branch: branch_name, assets và số account của branch (dùng scalar subquery trong select, không dùng join).




-- @ex CK3.10  [case + group by]  ★★☆
-- Phân loại account theo balance: dưới 500 là `'low'`, từ 500 đến dưới 800 là `'medium'`, còn lại `'high'`. Trả về level và số account mỗi loại.




-- @ex CK3.11  [DDL + constraints]  ★★☆
-- Tạo bảng `policy(policy_no, driver_id, premium, start_date, end_date)`: policy_no là primary key; driver_id bắt buộc và là foreign key tới person; premium > 0; end_date phải sau start_date.




-- @ex CK3.12  [create view]  ★☆☆
-- Tạo view `accident_damage(report_number, year, total_damage)` — tổng thiệt hại của từng vụ tai nạn.




-- @ex CK3.13  [delete + subquery]  ★★☆
-- Xoá mọi chiếc xe đời trước 2016 chưa từng gặp tai nạn nào. (owns có on delete cascade.)




-- @ex CK3.14  [update + subquery]  ★☆☆
-- Tăng 5% amount của các loan thuộc branch nằm ở thành phố `Horseneck`.




-- @ex CK3.15  [division]  ★★★
-- ID và customer_name của khách có account ở mọi branch mà khách `'12345'` có account (kể cả chính 12345).


