-- =====================================================================
-- CS4420 · Ôn GK · Phần 3 — Practice Exercises Chương 4 (Intermediate SQL) (Practice Exercises — Chapter 4)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- gk3
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex GK3.01  [PE 4.1 natural join trap]  ★★☆
-- Đề gốc: Exercise 4.1. Consider the following SQL query that seeks to find a list of titles of all courses taught in Spring 2017 along with the name of the instructor.
--
-- ```sql
-- select name, title
-- from instructor natural join teaches natural join section natural join course
-- where semester = 'Spring' and year = 2017
-- ```
--
-- What is wrong with this query?
--
-- PE 4.1 — Tạo view `gk_spring2017_titles(name, title)`: tên instructor và title của mỗi course họ dạy ở Spring 2017, sửa lỗi natural join của sách. Khi chấm, hệ thống cho Einstein (Physics) dạy thêm CS-190 section 1 Spring 2017 rồi đọc view.
-- Gợi ý: join course using (course_id) thay vì natural join course.




-- @ex GK3.02  [PE 4.2a left outer join]  ★☆☆
-- Đề gốc: Exercise 4.2 (a). Write the following queries in SQL:
--
-- a. Display a list of all instructors, showing each instructor’s ID and the number of sections taught. Make sure to show the number of sections as 0 for instructors who have not taught any section. Your query should use an outer join, and should not use subqueries.
--
-- PE 4.2a — ID của mỗi instructor và số section đã dạy (0 nếu chưa dạy). Dùng outer join, không dùng subquery.




-- @ex GK3.03  [PE 4.2b scalar subquery]  ★☆☆
-- Đề gốc: Exercise 4.2 (a, b). Write the following queries in SQL:
--
-- a. Display a list of all instructors, showing each instructor’s ID and the number of sections taught. Make sure to show the number of sections as 0 for instructors who have not taught any section. Your query should use an outer join, and should not use subqueries.
--
-- b. Write the same query as in part a, but using a scalar subquery and not using outer join.
--
-- PE 4.2b — Như PE 4.2a nhưng dùng scalar subquery, không dùng outer join.




-- @ex GK3.04  [PE 4.2c coalesce]  ★★☆
-- Đề gốc: Exercise 4.2 (c). Write the following queries in SQL:
--
-- c. Display the list of all course sections offered in Spring 2018, along with the ID and name of each instructor teaching the section. If a section has more than one instructor, that section should appear as many times in the result as it has instructors. If a section does not have any instructor, it should still appear in the result with the instructor name set to “−”.
--
-- PE 4.2c — Tạo view `gk_spring2018_sections(course_id, sec_id, ID, name)`: mọi section mở ở Spring 2018 cùng ID và tên instructor; section nhiều instructor xuất hiện nhiều lần; section không có instructor vẫn xuất hiện với name = `-`. Khi chấm, hệ thống thêm một section Spring 2018 chưa có ai dạy.
-- Gợi ý: (section natural left outer join teaches) natural left outer join instructor; coalesce(name, '-').




-- @ex GK3.05  [PE 4.2d count zero]  ★★☆
-- Đề gốc: Exercise 4.2 (d). Write the following queries in SQL:
--
-- d. Display the list of all departments, with the total number of instructors in each department, without using subqueries. Make sure to show departments that have no instructors, and list those departments with an instructor count of zero.
--
-- PE 4.2d — Tạo view `gk_dept_instructors(dept_name, num_instructors)`: mọi department với tổng số instructor, khoa không có ai phải hiện 0. Không dùng subquery. Khi chấm, hệ thống thêm khoa `Statistics` chưa có instructor.




-- @ex GK3.06  [PE 4.3a left join rewrite]  ★★☆
-- Đề gốc: Exercise 4.3 (a). Outer join expressions can be computed in SQL without using the SQL outer join operation. To illustrate this fact, show how to rewrite each of the following SQL queries without using the outer join expression.
--
-- a. `select * from student natural left outer join takes`
--
-- PE 4.3a — Viết `select * from student natural left outer join takes` không dùng outer join (natural join + union + not exists).




-- @ex GK3.07  [PE 4.3b full join rewrite]  ★★★
-- Đề gốc: Exercise 4.3 (b). Outer join expressions can be computed in SQL without using the SQL outer join operation. To illustrate this fact, show how to rewrite each of the following SQL queries without using the outer join expression.
--
-- b. `select * from student natural full outer join takes`
--
-- PE 4.3b — Viết `select * from student natural full outer join takes` không dùng outer join.
-- Gợi ý: Thêm nhánh thứ ba cho takes không khớp student (trên dữ liệu hợp lệ nhánh này rỗng vì foreign key).




-- @ex GK3.08  [PE 4.4 outer join order]  ★★★
-- Đề gốc: Exercise 4.4. Suppose we have three relations r(A, B), s(B, C), and t(B, D), with all attributes declared as not null.
--
-- a. Give instances of relations r, s, and t such that in the result of
--
-- (r natural left outer join s) natural left outer join t
--
-- attribute C has a null value but attribute D has a non-null value.
--
-- b. Are there instances of r, s, and t such that the result of
--
-- r natural left outer join (s natural left outer join t)
--
-- has a null value for C but a non-null value for D? Explain why or why not.
--
-- PE 4.4 — Tạo `gk_r(a, b)`, `gk_s(b, c)`, `gk_t(b, d)` (mọi cột `not null`) và chèn dữ liệu sao cho trong `(gk_r natural left outer join gk_s) natural left outer join gk_t` có dòng với c null nhưng d khác null. Hệ thống kiểm tra điều đó, và kiểm tra rằng với `gk_r natural left outer join (gk_s natural left outer join gk_t)` thì không có dòng như vậy (PE 4.4b).
-- Gợi ý: r = {(a, b)}, s = {(b1, c1)}, t = {(b, d)}.




-- @ex GK3.09  [PE 4.5a test data]  ★★☆
-- Đề gốc: Exercise 4.5 (a). Testing SQL queries: To test if a query specified in English has been correctly written in SQL, the SQL query is typically executed on multiple test databases, and a human checks if the SQL query result on each test database matches the intention of the specification in English.
--
-- a. In Section 4.1.1 we saw an example of an erroneous SQL query which was intended to find which courses had been taught by each instructor; the query computed the natural join of *instructor*, *teaches*, and *course*, and as a result it unintentionally equated the *dept_name* attribute of *instructor* and *course*. Give an example of a dataset that would help catch this particular error.
--
-- PE 4.5a — Tạo bộ dữ liệu test bắt được lỗi natural join của Section 4.1.1: các bảng `gk_instructor(ID, name, dept_name, salary)`, `gk_teaches(ID, course_id, sec_id, semester, year)`, `gk_course(course_id, title, dept_name, credits)` sao cho `gk_instructor natural join gk_teaches natural join gk_course` có ít dòng hơn `gk_instructor natural join gk_teaches join gk_course using (course_id)`.
-- Gợi ý: Một giảng viên Physics dạy môn Elec. Eng.




-- @ex GK3.10  [PE 4.6 view with nulls]  ★★★
-- Đề gốc: Exercise 4.6. Show how to define the view *student_grades* (*ID*, *GPA*) giving the grade-point average of each student, based on the query in Exercise 3.2; recall that we used a relation *grade_points*(*grade*, *points*) to get the numeric points associated with a letter grade. Make sure your view definition correctly handles the case of *null* values for the *grade* attribute of the *takes* relation.
--
-- PE 4.6 — Tạo view `gk_student_grades(ID, GPA)` cho mọi sinh viên: môn có grade null không tính vào cả tử số lẫn mẫu số; sinh viên chưa có môn nào có điểm (hoặc chưa học môn nào) có GPA = null. Dùng `case` thay cho `decode` của sách.




-- @ex GK3.11  [PE 4.7 DDL foreign keys]  ★★☆
-- Đề gốc: Exercise 4.7. Consider the employee database of Figure 4.12. Give an SQL DDL definition of this database. Identify referential-integrity constraints that should hold, and include them in the DDL definition.
--
-- *Figure 4.12 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 4.7 — Viết DDL cho Employee database với tên `gk_employee(ID, person_name, street, city)`, `gk_company(company_name, city)`, `gk_works(ID, company_name, salary)`, `gk_manages(ID, manager_id)`: primary key như PE 2.1 (gk_manages: ID) và đủ bốn foreign key.
-- Gợi ý: works.ID, works.company_name, manages.ID, manages.manager_id. Tạo gk_company trước gk_works.




-- @ex GK3.12  [PE 4.8a constraint query]  ★★★
-- Đề gốc: Exercise 4.8. As discussed in Section 4.4.8, we expect the constraint “an instructor cannot teach sections in two different classrooms in a semester in the same time slot” to hold.
--
-- a. Write an SQL query that returns all (*instructor*, *section*) combinations that violate this constraint.
--
-- b. Write an SQL assertion to enforce this constraint (as discussed in Section 4.4.8, current generation database systems do not support such assertions, although they are part of the SQL standard).
--
-- PE 4.8a — Tạo view `gk_room_conflicts(ID, name, semester, year, time_slot_id, num_rooms)`: các instructor dạy section ở nhiều hơn một phòng trong cùng semester, year và time slot. (Sửa hai lỗi của lời giải sách: bỏ sec_id khỏi group by; viết `count(distinct (building, room_number))`.) Khi chấm, hệ thống cho Katz dạy thêm một section ở phòng khác cùng time slot F, Spring 2018.




-- @ex GK3.13  [PE 4.9 cascade chain]  ★★☆
-- Đề gốc: Exercise 4.9. SQL allows a foreign-key dependency to refer to the same relation, as in the following example:
--
-- ```sql
-- create table manager
--   (employee_ID char(20),
--    manager_ID  char(20),
--    primary key employee_ID,
--    foreign key (manager_ID) references manager(employee_ID)
--      on delete cascade )
-- ```
--
-- Here, *employee_ID* is a key to the table *manager*, meaning that each employee has at most one manager. The foreign-key clause requires that every manager also be an employee. Explain exactly what happens when a tuple in the relation *manager* is deleted.
--
-- PE 4.9 — Tạo `gk_manager(employee_id varchar(20) primary key, manager_id varchar(20))` với foreign key (manager_id) tham chiếu `gk_manager(employee_id)` on delete cascade. Chèn: (Alice, null), (Bob, Alice), (Carol, Alice), (Dave, Bob), (Eve, Dave), (Frank, null), (Grace, Frank). Sau đó xoá Bob và trả về các dòng còn lại.




-- @ex GK3.14  [PE 4.10 full outer join on]  ★★★
-- Đề gốc: Exercise 4.10. Given the relations a(*name*, *address*, *title*) and b(*name*, *address*, *salary*), show how to express a natural full outer join b using the full outer-join operation with an on condition rather than using the natural join syntax. This can be done using the coalesce operation. Make sure that the result relation does not contain two copies of the attributes *name* and *address* and that the solution is correct even if some tuples in a and b have null values for attributes *name* or *address*.
--
-- PE 4.10 — Với `emp_title(name, address, title)` và `emp_salary(name, address, salary)` (có null ở name/address), viết tương đương `emp_title natural full outer join emp_salary` bằng full outer join ... on và coalesce: cột name, address, title, salary (mỗi cột chung chỉ một bản).




-- @ex GK3.15  [PE 4.13 view authorization]  ★★★
-- Đề gốc: Exercise 4.13. Consider a view v whose definition references only relation r.
--
-- - If a user is granted select authorization on v, does that user need to have select authorization on r as well? Why or why not?
-- - If a user is granted update authorization on v, does that user need to have update authorization on r as well? Why or why not?
-- - Give an example of an insert operation on a view v to add a tuple t that is not visible in the result of select * from v. Explain your answer.
--
-- PE 4.13 (1) — Tạo view `gk_physics_staff(ID, name)` (instructor khoa Physics) và role `gk_viewer`; grant select chỉ trên view cho gk_viewer. Hệ thống sẽ `set role gk_viewer`: đọc được view nhưng không đọc được bảng instructor.




-- @ex GK3.16  [PE 4.13 invisible insert]  ★★☆
-- Đề gốc: Exercise 4.13. Consider a view v whose definition references only relation r.
--
-- - If a user is granted select authorization on v, does that user need to have select authorization on r as well? Why or why not?
-- - If a user is granted update authorization on v, does that user need to have update authorization on r as well? Why or why not?
-- - Give an example of an insert operation on a view v to add a tuple t that is not visible in the result of select * from v. Explain your answer.
--
-- PE 4.13 (3) — Tạo view `gk_history_instructors` (mọi cột của instructor khoa History, không có with check option), rồi insert qua view giảng viên `('25566', 'Brown', 'Biology', 100000)`. Hệ thống kiểm tra: tuple có trong instructor nhưng không thấy qua view.


