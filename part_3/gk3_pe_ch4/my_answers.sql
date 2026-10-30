-- =====================================================================
-- CS4420 · Ôn GK · Phần 3 — Practice Exercises Chương 4 (Intermediate SQL) (Practice Exercises — Chapter 4)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- gk3
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex GK3.01  [PE 4.1 natural join trap]  ★★☆
-- PE 4.1 — Tạo view `gk_spring2017_titles(name, title)`: tên instructor và title của mỗi course họ dạy ở Spring 2017, sửa lỗi natural join của sách. Khi chấm, hệ thống cho Einstein (Physics) dạy thêm CS-190 section 1 Spring 2017 rồi đọc view.
-- Gợi ý: join course using (course_id) thay vì natural join course.




-- @ex GK3.02  [PE 4.2a left outer join]  ★☆☆
-- PE 4.2a — ID của mỗi instructor và số section đã dạy (0 nếu chưa dạy). Dùng outer join, không dùng subquery.




-- @ex GK3.03  [PE 4.2b scalar subquery]  ★☆☆
-- PE 4.2b — Như PE 4.2a nhưng dùng scalar subquery, không dùng outer join.




-- @ex GK3.04  [PE 4.2c coalesce]  ★★☆
-- PE 4.2c — Tạo view `gk_spring2018_sections(course_id, sec_id, ID, name)`: mọi section mở ở Spring 2018 cùng ID và tên instructor; section nhiều instructor xuất hiện nhiều lần; section không có instructor vẫn xuất hiện với name = `-`. Khi chấm, hệ thống thêm một section Spring 2018 chưa có ai dạy.
-- Gợi ý: (section natural left outer join teaches) natural left outer join instructor; coalesce(name, '-').




-- @ex GK3.05  [PE 4.2d count zero]  ★★☆
-- PE 4.2d — Tạo view `gk_dept_instructors(dept_name, num_instructors)`: mọi department với tổng số instructor, khoa không có ai phải hiện 0. Không dùng subquery. Khi chấm, hệ thống thêm khoa `Statistics` chưa có instructor.




-- @ex GK3.06  [PE 4.3a left join rewrite]  ★★☆
-- PE 4.3a — Viết `select * from student natural left outer join takes` không dùng outer join (natural join + union + not exists).




-- @ex GK3.07  [PE 4.3b full join rewrite]  ★★★
-- PE 4.3b — Viết `select * from student natural full outer join takes` không dùng outer join.
-- Gợi ý: Thêm nhánh thứ ba cho takes không khớp student (trên dữ liệu hợp lệ nhánh này rỗng vì foreign key).




-- @ex GK3.08  [PE 4.4 outer join order]  ★★★
-- PE 4.4 — Tạo `gk_r(a, b)`, `gk_s(b, c)`, `gk_t(b, d)` (mọi cột `not null`) và chèn dữ liệu sao cho trong `(gk_r natural left outer join gk_s) natural left outer join gk_t` có dòng với c null nhưng d khác null. Hệ thống kiểm tra điều đó, và kiểm tra rằng với `gk_r natural left outer join (gk_s natural left outer join gk_t)` thì không có dòng như vậy (PE 4.4b).
-- Gợi ý: r = {(a, b)}, s = {(b1, c1)}, t = {(b, d)}.




-- @ex GK3.09  [PE 4.5a test data]  ★★☆
-- PE 4.5a — Tạo bộ dữ liệu test bắt được lỗi natural join của Section 4.1.1: các bảng `gk_instructor(ID, name, dept_name, salary)`, `gk_teaches(ID, course_id, sec_id, semester, year)`, `gk_course(course_id, title, dept_name, credits)` sao cho `gk_instructor natural join gk_teaches natural join gk_course` có ít dòng hơn `gk_instructor natural join gk_teaches join gk_course using (course_id)`.
-- Gợi ý: Một giảng viên Physics dạy môn Elec. Eng.




-- @ex GK3.10  [PE 4.6 view with nulls]  ★★★
-- PE 4.6 — Tạo view `gk_student_grades(ID, GPA)` cho mọi sinh viên: môn có grade null không tính vào cả tử số lẫn mẫu số; sinh viên chưa có môn nào có điểm (hoặc chưa học môn nào) có GPA = null. Dùng `case` thay cho `decode` của sách.




-- @ex GK3.11  [PE 4.7 DDL foreign keys]  ★★☆
-- PE 4.7 — Viết DDL cho Employee database với tên `gk_employee(ID, person_name, street, city)`, `gk_company(company_name, city)`, `gk_works(ID, company_name, salary)`, `gk_manages(ID, manager_id)`: primary key như PE 2.1 (gk_manages: ID) và đủ bốn foreign key.
-- Gợi ý: works.ID, works.company_name, manages.ID, manages.manager_id. Tạo gk_company trước gk_works.




-- @ex GK3.12  [PE 4.8a constraint query]  ★★★
-- PE 4.8a — Tạo view `gk_room_conflicts(ID, name, semester, year, time_slot_id, num_rooms)`: các instructor dạy section ở nhiều hơn một phòng trong cùng semester, year và time slot. (Sửa hai lỗi của lời giải sách: bỏ sec_id khỏi group by; viết `count(distinct (building, room_number))`.) Khi chấm, hệ thống cho Katz dạy thêm một section ở phòng khác cùng time slot F, Spring 2018.




-- @ex GK3.13  [PE 4.9 cascade chain]  ★★☆
-- PE 4.9 — Tạo `gk_manager(employee_id varchar(20) primary key, manager_id varchar(20))` với foreign key (manager_id) tham chiếu `gk_manager(employee_id)` on delete cascade. Chèn: (Alice, null), (Bob, Alice), (Carol, Alice), (Dave, Bob), (Eve, Dave), (Frank, null), (Grace, Frank). Sau đó xoá Bob và trả về các dòng còn lại.




-- @ex GK3.14  [PE 4.10 full outer join on]  ★★★
-- PE 4.10 — Với `emp_title(name, address, title)` và `emp_salary(name, address, salary)` (có null ở name/address), viết tương đương `emp_title natural full outer join emp_salary` bằng full outer join ... on và coalesce: cột name, address, title, salary (mỗi cột chung chỉ một bản).




-- @ex GK3.15  [PE 4.13 view authorization]  ★★★
-- PE 4.13 (1) — Tạo view `gk_physics_staff(ID, name)` (instructor khoa Physics) và role `gk_viewer`; grant select chỉ trên view cho gk_viewer. Hệ thống sẽ `set role gk_viewer`: đọc được view nhưng không đọc được bảng instructor.




-- @ex GK3.16  [PE 4.13 invisible insert]  ★★☆
-- PE 4.13 (3) — Tạo view `gk_history_instructors` (mọi cột của instructor khoa History, không có with check option), rồi insert qua view giảng viên `('25566', 'Brown', 'Biology', 100000)`. Hệ thống kiểm tra: tuple có trong instructor nhưng không thấy qua view.


