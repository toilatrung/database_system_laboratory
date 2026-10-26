-- =====================================================================
-- CS4420 · Chương 4 — SQL trung cấp (Intermediate SQL)
-- Dialect: PostgreSQL. Database: University (db/*.sql)
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động:   npm run grade -- ch4
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex 4.01  [natural join]  ★☆☆
-- Dùng natural join: name của sinh viên và course_id các môn họ đã học.




-- @ex 4.02  [natural join (đúng)]  ★★☆
-- name của sinh viên và title các môn họ đã học — cách đúng, tránh bẫy natural join với dept_name.
-- Gợi ý: student natural join takes, rồi join course using (course_id) (hoặc where takes.course_id = course.course_id)




-- @ex 4.03  [natural join (bẫy)]  ★★☆
-- Đếm số dòng của cách sai `student natural join takes natural join course`. So sánh với số dòng của 4.02 để thấy bao nhiêu cặp bị mất.




-- @ex 4.04  [join using]  ★☆☆
-- Dùng `join ... using`: ID instructor, course_id và building nơi section đó học (instructor dạy section).




-- @ex 4.05  [inner join on]  ★☆☆
-- Dùng `inner join ... on`: tất cả cột của course và prereq ghép theo course_id.




-- @ex 4.06  [left outer join]  ★★☆
-- Mọi course cùng prereq_id của nó (course không có prereq vẫn xuất hiện với prereq_id = null). Trả về course_id, title, prereq_id.




-- @ex 4.07  [left outer join]  ★★☆
-- Dùng left outer join (không dùng except/not in): ID và name của sinh viên chưa học môn nào.




-- @ex 4.08  [right outer join]  ★★☆
-- Dùng right outer join giữa section và course: liệt kê course_id, title, semester, year của mọi course, kể cả course chưa từng mở section.




-- @ex 4.09  [full outer join]  ★★★
-- Dùng full outer join hai tập course_id (không trùng): mở ở Fall 2017 và mở ở Spring 2018. Trả về 2 cột `fall_2017`, `spring_2018`; môn chỉ mở một kỳ thì cột kia là null.




-- @ex 4.10  [outer join + count]  ★★☆
-- Với mọi instructor: ID, name và số section đã dạy (`num_sections`, bằng 0 nếu chưa dạy).
-- Gợi ý: count(teaches.course_id) — count bỏ qua null, còn count(*) thì không!




-- @ex 4.11  [create view]  ★☆☆
-- Tạo view `faculty` gồm ID, name, dept_name của instructor (ẩn salary). Sau đó dùng view tìm tên giảng viên khoa `Biology`.




-- @ex 4.12  [create view]  ★☆☆
-- Tạo view `departments_total_salary(dept_name, total_salary)` chứa tổng lương mỗi khoa.




-- @ex 4.13  [view of view]  ★★☆
-- Tạo view `physics_fall_2017(course_id, sec_id, building, room_number)` — các section của khoa Physics mở ở Fall 2017; rồi view `physics_fall_2017_watson(course_id, room_number)` dựa trên view thứ nhất, chỉ lấy building `Watson`.




-- @ex 4.14  [update view]  ★★☆
-- Tạo view `faculty` (như 4.11) rồi insert qua view giảng viên `('30765', 'Green', 'Music')`. Salary trong bảng instructor sẽ là gì?




-- @ex 4.15  [with check option]  ★★☆
-- Tạo view `history_instructors` (mọi cột của instructor khoa History) with check option, để chèn giảng viên khoa khác qua view sẽ bị từ chối.




-- @ex 4.16  [materialized view]  ★★★
-- Tạo materialized view `dept_stats(dept_name, num_instructors)`. Sau đó chèn instructor `('99999', 'Lee', 'Music', 50000)` và refresh view để số liệu được cập nhật.
-- Gợi ý: create materialized view ... ; insert ...; refresh materialized view dept_stats;




-- @ex 4.17  [commit]  ★★☆
-- Viết một transaction chuyển 10000 budget từ khoa `Finance` sang khoa `History` rồi commit. *(Bài này chạy trên CSDL mới, được phép dùng begin/commit.)*
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)




-- @ex 4.18  [rollback]  ★☆☆
-- Mở transaction, xoá toàn bộ takes, đếm số dòng của takes (trong transaction), rồi rollback. Câu lệnh cuối cùng của bạn: đếm lại số dòng của takes sau khi rollback.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)




-- @ex 4.19  [savepoint]  ★★★
-- Trong một transaction: tăng 10% lương khoa `Comp. Sci.`; tạo `savepoint s1`; xoá instructor khoa `Music`; quay lại `s1` (huỷ việc xoá); commit.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)




-- @ex 4.20  [check / pk / fk]  ★★☆
-- Tạo bảng `scholarship`:
-- - `student_id varchar(5)` tham chiếu student (xoá sinh viên thì xoá học bổng — on delete cascade)
-- - `semester varchar(6)` chỉ nhận Fall, Winter, Spring, Summer
-- - `year numeric(4,0)`
-- - `amount numeric(8,2)` not null, phải > 0
-- - primary key (student_id, semester, year)




-- @ex 4.21  [unique]  ★★☆
-- Thêm cột `email varchar(50)` vào instructor với ràng buộc unique. (Hệ thống sẽ thử: gán cùng một email cho 2 người phải lỗi, nhưng nhiều người cùng email null thì được.)




-- @ex 4.22  [on delete set null]  ★★☆
-- Tạo bảng `lab(lab_id varchar(5) primary key, dept_name varchar(20))` với foreign key dept_name → department on delete set null. Chèn `('L1', 'Physics')`, `('L2', 'Music')`, rồi xoá khoa `Music`.




-- @ex 4.23  [deferred constraint]  ★★★
-- Tạo bảng `person(ID char(10) primary key, name char(40), mother char(10), father char(10))`, mother và father là foreign key tham chiếu chính person và là deferrable initially deferred.
-- Trong một transaction, chèn con `('P3', 'Child', 'P1', 'P2')` trước, rồi mới chèn `('P1', 'Mom', null, null)`, `('P2', 'Dad', null, null)`, rồi commit.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)




-- @ex 4.24  [timestamp / interval]  ★★☆
-- Bảng `account_txn(account_number, date_time, value)`: với mỗi tài khoản, trả về account_number và khoảng thời gian giữa giao dịch đầu tiên và cuối cùng (`span`, kiểu interval).




-- @ex 4.25  [date + interval]  ★★☆
-- Từ `daily_sales`: trả về sale_date và ngày sau đó 1 tuần (`one_week_later`), chỉ cho các ngày có value > 100, sắp theo sale_date.
-- Gợi ý: sale_date + interval '7 day'
-- (Thứ tự dòng được chấm.)




-- @ex 4.26  [domain]  ★★☆
-- Tạo domain `degree_level varchar(10)` chỉ nhận `Bachelors`, `Masters`, `Doctorate` (đặt tên constraint `degree_level_test`). Thêm cột `degree degree_level` vào student.




-- @ex 4.27  [domain as type]  ★★☆
-- Chuẩn SQL viết `create type Dollars as numeric(12,2) final`. Trong PostgreSQL hãy tạo domain `dollars` là numeric(12,2) và không âm, rồi tạo bảng `donation(donor varchar(30), amount dollars)` và chèn `('Alice', 1500.5)`.




-- @ex 4.28  [index]  ★☆☆
-- Tạo index tên `instructor_dept_idx` trên cột dept_name của instructor.




-- @ex 4.29  [grant]  ★★☆
-- Tạo role `grader`. Cấp cho grader quyền select trên takes và quyền update chỉ trên cột grade của takes.
-- Gợi ý: grant update (grade) on takes to grader




-- @ex 4.30  [revoke]  ★★☆
-- Tạo role `clerk`, cấp select, insert, update trên department; sau đó thu hồi insert và update.




-- @ex 4.31  [roles chain]  ★★★
-- Tạo chuỗi role như slide: `teaching_assistant`, `instructor_role`, `dean`. Grant select trên takes cho teaching_assistant; grant teaching_assistant cho instructor_role; grant instructor_role cho dean. (dean phải kế thừa quyền select trên takes.)




-- @ex 4.32  [authorization on views]  ★★★
-- Tạo view `physics_instructor` (mọi cột instructor khoa Physics) và role `phys_staff`; chỉ grant select trên view cho phys_staff. (Hệ thống sẽ `set role phys_staff` rồi đọc view: phải đọc được view nhưng không đọc được bảng instructor.)




-- @ex 4.33  [with grant option]  ★★★
-- Tạo role `amit`, `satoshi`. Grant select trên department cho amit with grant option. Sau đó đóng vai amit (`set role amit`) grant select tiếp cho satoshi, rồi `reset role`.




-- @ex 4.34  [revoke cascade]  ★★★
-- Làm lại toàn bộ 4.33, sau đó revoke quyền select của amit với cascade. Quyền mà amit đã cấp cho satoshi cũng phải biến mất. (Thử đổi cascade thành restrict xem lỗi gì!)


