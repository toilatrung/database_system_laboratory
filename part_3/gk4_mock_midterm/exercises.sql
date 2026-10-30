-- =====================================================================
-- CS4420 · Đề thi thử GK — Đề thi thử giữa kỳ — Chương 1–4 (Mock Midterm (Chapters 1–4))
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- gk4
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex GK4.01  [outer join + count]  ★★☆
-- Bank database. Với mọi branch: branch_name và số loan của branch đó (`num_loans`, bằng 0 nếu không có). Không dùng subquery.
-- Gợi ý: Biến thể PE 4.2d: left outer join + count(cột của loan).




-- @ex GK4.02  [intersect]  ★☆☆
-- ID các khách hàng vừa có account vừa có loan.




-- @ex GK4.03  [division (for all)]  ★★★
-- ID và customer_name của khách có account ở mọi branch đặt tại thành phố `Brooklyn`.
-- Gợi ý: not exists ((branch ở Brooklyn) except (branch mà khách C có account)).




-- @ex GK4.04  [with + max (ties)]  ★★☆
-- Branch có tổng số tiền cho vay (sum amount của loan) lớn nhất — nếu hoà thì trả về tất cả. Trả về branch_name và total_amount.
-- Gợi ý: Biến thể PE 3.1g.




-- @ex GK4.05  [having + subquery]  ★★☆
-- Các branch có số dư trung bình (avg balance của account) lớn hơn số dư trung bình của toàn bộ account. Trả về branch_name.
-- Gợi ý: Biến thể PE 3.9g.




-- @ex GK4.06  [correlated subquery]  ★★☆
-- Employee database. ID, person_name và salary của nhân viên có lương cao hơn lương trung bình của chính công ty mình.




-- @ex GK4.07  [update + case]  ★★☆
-- Nhân viên của `Mega Corp`: lương dưới 50000 tăng 8%, còn lại tăng 4%. Viết một câu update (an toàn với thứ tự).
-- Gợi ý: Biến thể PE 3.10b.




-- @ex GK4.08  [insert ... select]  ★★★
-- Mỗi khách có loan ở branch `Downtown` được mở một account mới tại Downtown: account_number là `'A-9' || ID`, balance 100; đồng thời thêm dòng depositor tương ứng.
-- Gợi ý: Hai câu insert ... select: account trước (vì FK), depositor sau.




-- @ex GK4.09  [view with check option]  ★★☆
-- Tạo view `brooklyn_branches` gồm mọi cột của branch ở thành phố `Brooklyn`, with check option.




-- @ex GK4.10  [FK self cascade]  ★★★
-- Tạo bảng `emp_tree(employee_id varchar(5) primary key, manager_id varchar(5))` với manager_id là foreign key tham chiếu chính emp_tree, on delete cascade. Nạp mọi nhân viên của employee (manager_id lấy từ manages, null nếu không có quản lý), rồi xoá nhân viên `'10004'`.
-- Gợi ý: Insert tất cả với manager_id null trước, rồi update từ manages — để FK không bị vi phạm khi chèn. Biến thể PE 4.9.




-- @ex GK4.11  [grant on view]  ★★☆
-- Tạo view `small_bank_staff(ID, person_name, city)` — nhân viên của `Small Bank Corporation`. Tạo role `hr_clerk`, cấp quyền select trên view (không cấp gì trên employee/works).




-- @ex GK4.12  [RA → SQL]  ★☆☆
-- Viết SQL cho Π[ID](σ[city = "Miami"](employee)) − Π[ID](σ[company_name = "First Bank Corporation"](works)).


