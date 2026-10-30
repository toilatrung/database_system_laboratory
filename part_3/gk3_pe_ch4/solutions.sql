-- =====================================================================
-- CS4420 · Ôn GK · Phần 3 — Practice Exercises Chương 4 (Intermediate SQL) (Practice Exercises — Chapter 4)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex GK3.01  [PE 4.1 natural join trap]  ★★☆
-- PE 4.1 — Tạo view `gk_spring2017_titles(name, title)`: tên instructor và title của mỗi course họ dạy ở Spring 2017, sửa lỗi natural join của sách. Khi chấm, hệ thống cho Einstein (Physics) dạy thêm CS-190 section 1 Spring 2017 rồi đọc view.
-- Gợi ý: join course using (course_id) thay vì natural join course.
create view gk_spring2017_titles (name, title) as
select name, title
from instructor natural join teaches natural join section join course using (course_id)
where semester = 'Spring' and year = 2017;

-- Câu truy vấn hệ thống dùng để chấm:
--   insert into teaches values ('22222', 'CS-190', '1', 'Spring', 2017);
--   select * from gk_spring2017_titles;

-- @ex GK3.02  [PE 4.2a left outer join]  ★☆☆
-- PE 4.2a — ID của mỗi instructor và số section đã dạy (0 nếu chưa dạy). Dùng outer join, không dùng subquery.
select ID, count(sec_id) as number_of_sections
from instructor natural left outer join teaches
group by ID;

-- @ex GK3.03  [PE 4.2b scalar subquery]  ★☆☆
-- PE 4.2b — Như PE 4.2a nhưng dùng scalar subquery, không dùng outer join.
select ID, (select count(*) from teaches T where T.ID = I.ID) as number_of_sections
from instructor I;

-- @ex GK3.04  [PE 4.2c coalesce]  ★★☆
-- PE 4.2c — Tạo view `gk_spring2018_sections(course_id, sec_id, ID, name)`: mọi section mở ở Spring 2018 cùng ID và tên instructor; section nhiều instructor xuất hiện nhiều lần; section không có instructor vẫn xuất hiện với name = `-`. Khi chấm, hệ thống thêm một section Spring 2018 chưa có ai dạy.
-- Gợi ý: (section natural left outer join teaches) natural left outer join instructor; coalesce(name, '-').
create view gk_spring2018_sections (course_id, sec_id, ID, name) as
select course_id, sec_id, ID, coalesce(name, '-')
from (section natural left outer join teaches) natural left outer join instructor
where semester = 'Spring' and year = 2018;

-- Câu truy vấn hệ thống dùng để chấm:
--   insert into section values ('BIO-399', '1', 'Spring', 2018, 'Watson', '100', 'E');
--   select * from gk_spring2018_sections;

-- @ex GK3.05  [PE 4.2d count zero]  ★★☆
-- PE 4.2d — Tạo view `gk_dept_instructors(dept_name, num_instructors)`: mọi department với tổng số instructor, khoa không có ai phải hiện 0. Không dùng subquery. Khi chấm, hệ thống thêm khoa `Statistics` chưa có instructor.
create view gk_dept_instructors (dept_name, num_instructors) as
select dept_name, count(ID)
from department natural left outer join instructor
group by dept_name;

-- Câu truy vấn hệ thống dùng để chấm:
--   insert into department values ('Statistics', 'Taylor', 60000);
--   select * from gk_dept_instructors;

-- @ex GK3.06  [PE 4.3a left join rewrite]  ★★☆
-- PE 4.3a — Viết `select * from student natural left outer join takes` không dùng outer join (natural join + union + not exists).
select * from student natural join takes
union
select ID, name, dept_name, tot_cred, null, null, null, null, null
from student S1
where not exists (select ID from takes T1 where T1.ID = S1.ID);

-- @ex GK3.07  [PE 4.3b full join rewrite]  ★★★
-- PE 4.3b — Viết `select * from student natural full outer join takes` không dùng outer join.
-- Gợi ý: Thêm nhánh thứ ba cho takes không khớp student (trên dữ liệu hợp lệ nhánh này rỗng vì foreign key).
(select * from student natural join takes)
union
(select ID, name, dept_name, tot_cred, null, null, null, null, null
 from student S1
 where not exists (select ID from takes T1 where T1.ID = S1.ID))
union
(select ID, null, null, null, course_id, sec_id, semester, year, grade
 from takes T1
 where not exists (select ID from student S1 where T1.ID = S1.ID));

-- @ex GK3.08  [PE 4.4 outer join order]  ★★★
-- PE 4.4 — Tạo `gk_r(a, b)`, `gk_s(b, c)`, `gk_t(b, d)` (mọi cột `not null`) và chèn dữ liệu sao cho trong `(gk_r natural left outer join gk_s) natural left outer join gk_t` có dòng với c null nhưng d khác null. Hệ thống kiểm tra điều đó, và kiểm tra rằng với `gk_r natural left outer join (gk_s natural left outer join gk_t)` thì không có dòng như vậy (PE 4.4b).
-- Gợi ý: r = {(a, b)}, s = {(b1, c1)}, t = {(b, d)}.
create table gk_r (a varchar(5) not null, b varchar(5) not null);
create table gk_s (b varchar(5) not null, c varchar(5) not null);
create table gk_t (b varchar(5) not null, d varchar(5) not null);
insert into gk_r values ('a', 'b');
insert into gk_s values ('b1', 'c1');
insert into gk_t values ('b', 'd');

-- Câu truy vấn hệ thống dùng để chấm:
--   select
--     (select count(*) > 0 from ((gk_r natural left outer join gk_s) natural left outer join gk_t) x
--      where x.c is null and x.d is not null) as case_a_c_null_d_not_null,
--     (select count(*) > 0 from (gk_r natural left outer join (gk_s natural left outer join gk_t)) y
--      where y.c is null and y.d is not null) as case_b_c_null_d_not_null,
--     (select count(*) from information_schema.columns
--      where table_name in ('gk_r', 'gk_s', 'gk_t') and is_nullable = 'NO') as not_null_columns;

-- @ex GK3.09  [PE 4.5a test data]  ★★☆
-- PE 4.5a — Tạo bộ dữ liệu test bắt được lỗi natural join của Section 4.1.1: các bảng `gk_instructor(ID, name, dept_name, salary)`, `gk_teaches(ID, course_id, sec_id, semester, year)`, `gk_course(course_id, title, dept_name, credits)` sao cho `gk_instructor natural join gk_teaches natural join gk_course` có ít dòng hơn `gk_instructor natural join gk_teaches join gk_course using (course_id)`.
-- Gợi ý: Một giảng viên Physics dạy môn Elec. Eng.
create table gk_instructor (ID varchar(5), name varchar(20), dept_name varchar(20), salary numeric(8,2));
create table gk_teaches (ID varchar(5), course_id varchar(8), sec_id varchar(8), semester varchar(6), year numeric(4,0));
create table gk_course (course_id varchar(8), title varchar(50), dept_name varchar(20), credits numeric(2,0));
insert into gk_instructor values ('12345', 'Gauss', 'Physics', 10000);
insert into gk_teaches values ('12345', 'EE321', '1', 'Spring', 2017);
insert into gk_course values ('EE321', 'Magnetism', 'Elec. Eng.', 6);

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select count(*) from gk_instructor natural join gk_teaches natural join gk_course)
--        < (select count(*) from gk_instructor natural join gk_teaches join gk_course using (course_id)) as test_catches_bug;

-- @ex GK3.10  [PE 4.6 view with nulls]  ★★★
-- PE 4.6 — Tạo view `gk_student_grades(ID, GPA)` cho mọi sinh viên: môn có grade null không tính vào cả tử số lẫn mẫu số; sinh viên chưa có môn nào có điểm (hoặc chưa học môn nào) có GPA = null. Dùng `case` thay cho `decode` của sách.
create view gk_student_grades (ID, GPA) as
select ID, credit_points / (case when credit_sum = 0 then null else credit_sum end)
from ((select ID,
              sum(case when grade is null then 0 else credits end) as credit_sum,
              sum(case when grade is null then 0 else credits * points end) as credit_points
       from (takes natural join course) natural left outer join grade_points
       group by ID)
      union
      select ID, null, null from student where ID not in (select ID from takes)) as t;

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, round(GPA, 4) from gk_student_grades;

-- @ex GK3.11  [PE 4.7 DDL foreign keys]  ★★☆
-- PE 4.7 — Viết DDL cho Employee database với tên `gk_employee(ID, person_name, street, city)`, `gk_company(company_name, city)`, `gk_works(ID, company_name, salary)`, `gk_manages(ID, manager_id)`: primary key như PE 2.1 (gk_manages: ID) và đủ bốn foreign key.
-- Gợi ý: works.ID, works.company_name, manages.ID, manages.manager_id. Tạo gk_company trước gk_works.
create table gk_employee (ID numeric(6,0), person_name char(20), street char(30), city char(30), primary key (ID));
create table gk_company (company_name char(15), city char(30), primary key (company_name));
create table gk_works (ID numeric(6,0), company_name char(15), salary integer,
  primary key (ID),
  foreign key (ID) references gk_employee,
  foreign key (company_name) references gk_company);
create table gk_manages (ID numeric(6,0), manager_id numeric(6,0),
  primary key (ID),
  foreign key (ID) references gk_employee,
  foreign key (manager_id) references gk_employee (ID));

-- Câu truy vấn hệ thống dùng để chấm:
--   select c.conrelid::regclass::text as table_name,
--          case c.contype when 'p' then 'primary key' else 'foreign key' end as kind,
--          a.attname as column_name,
--          coalesce(c.confrelid::regclass::text, '') as referenced_table
--   from pg_constraint c
--   join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
--   where c.contype in ('p', 'f')
--     and c.conrelid::regclass::text in ('gk_employee', 'gk_company', 'gk_works', 'gk_manages')
--   order by 1, 2, 3;

-- @ex GK3.12  [PE 4.8a constraint query]  ★★★
-- PE 4.8a — Tạo view `gk_room_conflicts(ID, name, semester, year, time_slot_id, num_rooms)`: các instructor dạy section ở nhiều hơn một phòng trong cùng semester, year và time slot. (Sửa hai lỗi của lời giải sách: bỏ sec_id khỏi group by; viết `count(distinct (building, room_number))`.) Khi chấm, hệ thống cho Katz dạy thêm một section ở phòng khác cùng time slot F, Spring 2018.
create view gk_room_conflicts (ID, name, semester, year, time_slot_id, num_rooms) as
select ID, name, semester, year, time_slot_id, count(distinct (building, room_number))
from instructor natural join teaches natural join section
group by ID, name, semester, year, time_slot_id
having count(distinct (building, room_number)) > 1;

-- Câu truy vấn hệ thống dùng để chấm:
--   insert into section values ('CS-315', '2', 'Spring', 2018, 'Watson', '120', 'F');
--   insert into teaches values ('45565', 'CS-315', '2', 'Spring', 2018);
--   select * from gk_room_conflicts;

-- @ex GK3.13  [PE 4.9 cascade chain]  ★★☆
-- PE 4.9 — Tạo `gk_manager(employee_id varchar(20) primary key, manager_id varchar(20))` với foreign key (manager_id) tham chiếu `gk_manager(employee_id)` on delete cascade. Chèn: (Alice, null), (Bob, Alice), (Carol, Alice), (Dave, Bob), (Eve, Dave), (Frank, null), (Grace, Frank). Sau đó xoá Bob và trả về các dòng còn lại.
create table gk_manager (
  employee_id varchar(20) primary key,
  manager_id  varchar(20),
  foreign key (manager_id) references gk_manager (employee_id) on delete cascade);
insert into gk_manager values ('Alice', null), ('Bob', 'Alice'), ('Carol', 'Alice'),
  ('Dave', 'Bob'), ('Eve', 'Dave'), ('Frank', null), ('Grace', 'Frank');
delete from gk_manager where employee_id = 'Bob';
select * from gk_manager;

-- @ex GK3.14  [PE 4.10 full outer join on]  ★★★
-- PE 4.10 — Với `emp_title(name, address, title)` và `emp_salary(name, address, salary)` (có null ở name/address), viết tương đương `emp_title natural full outer join emp_salary` bằng full outer join ... on và coalesce: cột name, address, title, salary (mỗi cột chung chỉ một bản).
select coalesce(a.name, b.name) as name,
       coalesce(a.address, b.address) as address,
       a.title, b.salary
from emp_title as a full outer join emp_salary as b
  on a.name = b.name and a.address = b.address;

-- @ex GK3.15  [PE 4.13 view authorization]  ★★★
-- PE 4.13 (1) — Tạo view `gk_physics_staff(ID, name)` (instructor khoa Physics) và role `gk_viewer`; grant select chỉ trên view cho gk_viewer. Hệ thống sẽ `set role gk_viewer`: đọc được view nhưng không đọc được bảng instructor.
create view gk_physics_staff as
  select ID, name from instructor where dept_name = 'Physics';
create role gk_viewer;
grant select on gk_physics_staff to gk_viewer;

-- Câu truy vấn hệ thống dùng để chấm:
--   set role gk_viewer;
--   select ID, name, try_sql($$select * from instructor$$) as read_instructor
--   from gk_physics_staff;

-- @ex GK3.16  [PE 4.13 invisible insert]  ★★☆
-- PE 4.13 (3) — Tạo view `gk_history_instructors` (mọi cột của instructor khoa History, không có with check option), rồi insert qua view giảng viên `('25566', 'Brown', 'Biology', 100000)`. Hệ thống kiểm tra: tuple có trong instructor nhưng không thấy qua view.
create view gk_history_instructors as
  select * from instructor where dept_name = 'History';
insert into gk_history_instructors values ('25566', 'Brown', 'Biology', 100000);

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select count(*) from instructor where ID = '25566') as in_instructor,
--          (select count(*) from gk_history_instructors where ID = '25566') as visible_in_view,
--          (select count(*) from gk_history_instructors) as view_rows;
