-- =====================================================================
-- CS4420 · Chương 4 — SQL trung cấp (Intermediate SQL)
-- Dialect: PostgreSQL. Database: University (db/*.sql)
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại db/*.sql.

-- @ex 4.01  [natural join]  ★☆☆
-- Dùng natural join: name của sinh viên và course_id các môn họ đã học.
select name, course_id from student natural join takes;

-- @ex 4.02  [natural join (đúng)]  ★★☆
-- name của sinh viên và title các môn họ đã học — cách đúng, tránh bẫy natural join với dept_name.
-- Gợi ý: student natural join takes, rồi join course using (course_id) (hoặc where takes.course_id = course.course_id)
select name, title
from student natural join takes join course using (course_id);

-- @ex 4.03  [natural join (bẫy)]  ★★☆
-- Đếm số dòng của cách sai `student natural join takes natural join course`. So sánh với số dòng của 4.02 để thấy bao nhiêu cặp bị mất.
select count(*) from student natural join takes natural join course;

-- @ex 4.04  [join using]  ★☆☆
-- Dùng `join ... using`: ID instructor, course_id và building nơi section đó học (instructor dạy section).
select ID, course_id, building
from teaches join section using (course_id, sec_id, semester, year);

-- @ex 4.05  [inner join on]  ★☆☆
-- Dùng `inner join ... on`: tất cả cột của course và prereq ghép theo course_id.
select * from course inner join prereq on course.course_id = prereq.course_id;

-- @ex 4.06  [left outer join]  ★★☆
-- Mọi course cùng prereq_id của nó (course không có prereq vẫn xuất hiện với prereq_id = null). Trả về course_id, title, prereq_id.
select course_id, title, prereq_id
from course natural left outer join prereq;

-- @ex 4.07  [left outer join]  ★★☆
-- Dùng left outer join (không dùng except/not in): ID và name của sinh viên chưa học môn nào.
select student.ID, name
from student left outer join takes on student.ID = takes.ID
where takes.ID is null;

-- @ex 4.08  [right outer join]  ★★☆
-- Dùng right outer join giữa section và course: liệt kê course_id, title, semester, year của mọi course, kể cả course chưa từng mở section.
select course.course_id, title, semester, year
from section right outer join course on section.course_id = course.course_id;

-- @ex 4.09  [full outer join]  ★★★
-- Dùng full outer join hai tập course_id (không trùng): mở ở Fall 2017 và mở ở Spring 2018. Trả về 2 cột `fall_2017`, `spring_2018`; môn chỉ mở một kỳ thì cột kia là null.
select f.course_id as fall_2017, s.course_id as spring_2018
from (select distinct course_id from section where semester = 'Fall' and year = 2017) as f
     full outer join
     (select distinct course_id from section where semester = 'Spring' and year = 2018) as s
     on f.course_id = s.course_id;

-- @ex 4.10  [outer join + count]  ★★☆
-- Với mọi instructor: ID, name và số section đã dạy (`num_sections`, bằng 0 nếu chưa dạy).
-- Gợi ý: count(teaches.course_id) — count bỏ qua null, còn count(*) thì không!
select instructor.ID, name, count(teaches.course_id) as num_sections
from instructor left outer join teaches on instructor.ID = teaches.ID
group by instructor.ID, name;

-- @ex 4.11  [create view]  ★☆☆
-- Tạo view `faculty` gồm ID, name, dept_name của instructor (ẩn salary). Sau đó dùng view tìm tên giảng viên khoa `Biology`.
create view faculty as
  select ID, name, dept_name from instructor;
select name from faculty where dept_name = 'Biology';

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from faculty;

-- @ex 4.12  [create view]  ★☆☆
-- Tạo view `departments_total_salary(dept_name, total_salary)` chứa tổng lương mỗi khoa.
create view departments_total_salary (dept_name, total_salary) as
  select dept_name, sum(salary) from instructor group by dept_name;

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from departments_total_salary;

-- @ex 4.13  [view of view]  ★★☆
-- Tạo view `physics_fall_2017(course_id, sec_id, building, room_number)` — các section của khoa Physics mở ở Fall 2017; rồi view `physics_fall_2017_watson(course_id, room_number)` dựa trên view thứ nhất, chỉ lấy building `Watson`.
create view physics_fall_2017 as
  select course.course_id, sec_id, building, room_number
  from course, section
  where course.course_id = section.course_id
    and course.dept_name = 'Physics'
    and section.semester = 'Fall'
    and section.year = 2017;
create view physics_fall_2017_watson as
  select course_id, room_number
  from physics_fall_2017
  where building = 'Watson';

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from physics_fall_2017_watson;

-- @ex 4.14  [update view]  ★★☆
-- Tạo view `faculty` (như 4.11) rồi insert qua view giảng viên `('30765', 'Green', 'Music')`. Salary trong bảng instructor sẽ là gì?
create view faculty as
  select ID, name, dept_name from instructor;
insert into faculty values ('30765', 'Green', 'Music');

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from instructor where ID = '30765';

-- @ex 4.15  [with check option]  ★★☆
-- Tạo view `history_instructors` (mọi cột của instructor khoa History) with check option, để chèn giảng viên khoa khác qua view sẽ bị từ chối.
create view history_instructors as
  select * from instructor where dept_name = 'History'
  with check option;

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select count(*) from history_instructors) as num_rows,
--          try_sql($$insert into history_instructors values ('25566', 'Brown', 'Biology', 100000)$$) as insert_biology,
--          try_sql($$insert into history_instructors values ('25567', 'Ng', 'History', 70000)$$) as insert_history;

-- @ex 4.16  [materialized view]  ★★★
-- Tạo materialized view `dept_stats(dept_name, num_instructors)`. Sau đó chèn instructor `('99999', 'Lee', 'Music', 50000)` và refresh view để số liệu được cập nhật.
-- Gợi ý: create materialized view ... ; insert ...; refresh materialized view dept_stats;
create materialized view dept_stats (dept_name, num_instructors) as
  select dept_name, count(*) from instructor group by dept_name;
insert into instructor values ('99999', 'Lee', 'Music', 50000);
refresh materialized view dept_stats;

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from dept_stats;

-- @ex 4.17  [commit]  ★★☆
-- Viết một transaction chuyển 10000 budget từ khoa `Finance` sang khoa `History` rồi commit. *(Bài này chạy trên CSDL mới, được phép dùng begin/commit.)*
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
begin;
update department set budget = budget - 10000 where dept_name = 'Finance';
update department set budget = budget + 10000 where dept_name = 'History';
commit;

-- Câu truy vấn hệ thống dùng để chấm:
--   select dept_name, budget from department order by dept_name;

-- @ex 4.18  [rollback]  ★☆☆
-- Mở transaction, xoá toàn bộ takes, đếm số dòng của takes (trong transaction), rồi rollback. Câu lệnh cuối cùng của bạn: đếm lại số dòng của takes sau khi rollback.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
begin;
delete from takes;
select count(*) from takes;   -- 0 dòng, nhưng chưa commit
rollback;
select count(*) from takes;   -- dữ liệu đã trở lại

-- @ex 4.19  [savepoint]  ★★★
-- Trong một transaction: tăng 10% lương khoa `Comp. Sci.`; tạo `savepoint s1`; xoá instructor khoa `Music`; quay lại `s1` (huỷ việc xoá); commit.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
begin;
update instructor set salary = salary * 1.10 where dept_name = 'Comp. Sci.';
savepoint s1;
delete from instructor where dept_name = 'Music';
rollback to savepoint s1;
commit;

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, salary from instructor order by ID;

-- @ex 4.20  [check / pk / fk]  ★★☆
-- Tạo bảng `scholarship`:
-- - `student_id varchar(5)` tham chiếu student (xoá sinh viên thì xoá học bổng — on delete cascade)
-- - `semester varchar(6)` chỉ nhận Fall, Winter, Spring, Summer
-- - `year numeric(4,0)`
-- - `amount numeric(8,2)` not null, phải > 0
-- - primary key (student_id, semester, year)
create table scholarship (
  student_id varchar(5),
  semester   varchar(6) check (semester in ('Fall', 'Winter', 'Spring', 'Summer')),
  year       numeric(4,0),
  amount     numeric(8,2) not null check (amount > 0),
  primary key (student_id, semester, year),
  foreign key (student_id) references student (ID) on delete cascade
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into scholarship values ('12345', 'Fall', 2018, 500)$$)    as valid,
--          try_sql($$insert into scholarship values ('12345', 'Fall', 2018, 700)$$)    as dup_pk,
--          try_sql($$insert into scholarship values ('12345', 'Autumn', 2018, 500)$$)  as bad_semester,
--          try_sql($$insert into scholarship values ('12345', 'Spring', 2019, -1)$$)   as bad_amount,
--          try_sql($$insert into scholarship values ('12345', 'Spring', 2019, null)$$) as null_amount,
--          try_sql($$insert into scholarship values ('99999', 'Spring', 2019, 100)$$)  as bad_student,
--          sql_value($$select count(*) from scholarship$$)                             as rows_before,
--          try_sql($$delete from student where ID = '12345'$$)                        as delete_student,
--          sql_value($$select count(*) from scholarship$$)                             as rows_after;

-- @ex 4.21  [unique]  ★★☆
-- Thêm cột `email varchar(50)` vào instructor với ràng buộc unique. (Hệ thống sẽ thử: gán cùng một email cho 2 người phải lỗi, nhưng nhiều người cùng email null thì được.)
alter table instructor add column email varchar(50) unique;

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$update instructor set email = 'a@uni.edu' where ID = '10101'$$) as first_email,
--          try_sql($$update instructor set email = 'a@uni.edu' where ID = '12121'$$) as duplicate_email,
--          sql_value($$select count(*) from instructor where email is null$$)       as null_emails;

-- @ex 4.22  [on delete set null]  ★★☆
-- Tạo bảng `lab(lab_id varchar(5) primary key, dept_name varchar(20))` với foreign key dept_name → department on delete set null. Chèn `('L1', 'Physics')`, `('L2', 'Music')`, rồi xoá khoa `Music`.
create table lab (
  lab_id    varchar(5) primary key,
  dept_name varchar(20) references department on delete set null
);
insert into lab values ('L1', 'Physics'), ('L2', 'Music');
delete from department where dept_name = 'Music';

-- Câu truy vấn hệ thống dùng để chấm:
--   select lab_id, dept_name,
--          (select delete_rule from information_schema.referential_constraints rc
--           join information_schema.table_constraints tc on tc.constraint_name = rc.constraint_name
--           where tc.table_name = 'lab') as delete_rule
--   from lab order by lab_id;

-- @ex 4.23  [deferred constraint]  ★★★
-- Tạo bảng `person(ID char(10) primary key, name char(40), mother char(10), father char(10))`, mother và father là foreign key tham chiếu chính person và là deferrable initially deferred.
-- Trong một transaction, chèn con `('P3', 'Child', 'P1', 'P2')` trước, rồi mới chèn `('P1', 'Mom', null, null)`, `('P2', 'Dad', null, null)`, rồi commit.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
create table person (
  ID     char(10) primary key,
  name   char(40),
  mother char(10) references person deferrable initially deferred,
  father char(10) references person deferrable initially deferred
);
begin;
insert into person values ('P3', 'Child', 'P1', 'P2');
insert into person values ('P1', 'Mom', null, null);
insert into person values ('P2', 'Dad', null, null);
commit;

-- Câu truy vấn hệ thống dùng để chấm:
--   select trim(ID), trim(name), trim(mother), trim(father) from person order by ID;

-- @ex 4.24  [timestamp / interval]  ★★☆
-- Bảng `account_txn(account_number, date_time, value)`: với mỗi tài khoản, trả về account_number và khoảng thời gian giữa giao dịch đầu tiên và cuối cùng (`span`, kiểu interval).
select account_number, max(date_time) - min(date_time) as span
from account_txn
group by account_number;

-- @ex 4.25  [date + interval]  ★★☆
-- Từ `daily_sales`: trả về sale_date và ngày sau đó 1 tuần (`one_week_later`), chỉ cho các ngày có value > 100, sắp theo sale_date.
-- Gợi ý: sale_date + interval '7 day'
-- (Thứ tự dòng được chấm.)
select sale_date, sale_date + interval '7 day' as one_week_later
from daily_sales
where value > 100
order by sale_date;

-- @ex 4.26  [domain]  ★★☆
-- Tạo domain `degree_level varchar(10)` chỉ nhận `Bachelors`, `Masters`, `Doctorate` (đặt tên constraint `degree_level_test`). Thêm cột `degree degree_level` vào student.
create domain degree_level varchar(10)
  constraint degree_level_test
  check (value in ('Bachelors', 'Masters', 'Doctorate'));
alter table student add column degree degree_level;

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$update student set degree = 'Masters' where ID = '00128'$$) as masters,
--          try_sql($$update student set degree = 'PhD' where ID = '00128'$$)     as phd,
--          sql_value($$select degree from student where ID = '00128'$$)         as zhang_degree;

-- @ex 4.27  [domain as type]  ★★☆
-- Chuẩn SQL viết `create type Dollars as numeric(12,2) final`. Trong PostgreSQL hãy tạo domain `dollars` là numeric(12,2) và không âm, rồi tạo bảng `donation(donor varchar(30), amount dollars)` và chèn `('Alice', 1500.5)`.
create domain dollars as numeric(12,2) check (value >= 0);
create table donation (donor varchar(30), amount dollars);
insert into donation values ('Alice', 1500.5);

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select amount from donation where donor = 'Alice') as alice,
--          try_sql($$insert into donation values ('Bob', -10)$$) as negative;

-- @ex 4.28  [index]  ★☆☆
-- Tạo index tên `instructor_dept_idx` trên cột dept_name của instructor.
create index instructor_dept_idx on instructor (dept_name);

-- Câu truy vấn hệ thống dùng để chấm:
--   select indexname from pg_indexes where tablename = 'instructor' and indexname = 'instructor_dept_idx';

-- @ex 4.29  [grant]  ★★☆
-- Tạo role `grader`. Cấp cho grader quyền select trên takes và quyền update chỉ trên cột grade của takes.
-- Gợi ý: grant update (grade) on takes to grader
create role grader;
grant select on takes to grader;
grant update (grade) on takes to grader;

-- Câu truy vấn hệ thống dùng để chấm:
--   select has_table_privilege('grader', 'takes', 'select')            as can_select,
--          has_table_privilege('grader', 'takes', 'insert')            as can_insert,
--          has_column_privilege('grader', 'takes', 'grade', 'update') as can_update_grade,
--          has_column_privilege('grader', 'takes', 'id', 'update')    as can_update_id;

-- @ex 4.30  [revoke]  ★★☆
-- Tạo role `clerk`, cấp select, insert, update trên department; sau đó thu hồi insert và update.
create role clerk;
grant select, insert, update on department to clerk;
revoke insert, update on department from clerk;

-- Câu truy vấn hệ thống dùng để chấm:
--   select has_table_privilege('clerk', 'department', 'select') as s,
--          has_table_privilege('clerk', 'department', 'insert') as i,
--          has_table_privilege('clerk', 'department', 'update') as u;

-- @ex 4.31  [roles chain]  ★★★
-- Tạo chuỗi role như slide: `teaching_assistant`, `instructor_role`, `dean`. Grant select trên takes cho teaching_assistant; grant teaching_assistant cho instructor_role; grant instructor_role cho dean. (dean phải kế thừa quyền select trên takes.)
create role teaching_assistant;
create role instructor_role;
create role dean;
grant select on takes to teaching_assistant;
grant teaching_assistant to instructor_role;
grant instructor_role to dean;

-- Câu truy vấn hệ thống dùng để chấm:
--   select has_table_privilege('dean', 'takes', 'select')               as dean_can_read_takes,
--          pg_has_role('dean', 'teaching_assistant', 'member')              as dean_is_ta,
--          has_table_privilege('teaching_assistant', 'instructor', 'select') as ta_can_read_instructor;

-- @ex 4.32  [authorization on views]  ★★★
-- Tạo view `physics_instructor` (mọi cột instructor khoa Physics) và role `phys_staff`; chỉ grant select trên view cho phys_staff. (Hệ thống sẽ `set role phys_staff` rồi đọc view: phải đọc được view nhưng không đọc được bảng instructor.)
create view physics_instructor as
  select * from instructor where dept_name = 'Physics';
create role phys_staff;
grant select on physics_instructor to phys_staff;

-- Câu truy vấn hệ thống dùng để chấm:
--   set role phys_staff;
--   select ID, name,
--          try_sql($$select * from instructor$$) as read_base_table
--   from physics_instructor;

-- @ex 4.33  [with grant option]  ★★★
-- Tạo role `amit`, `satoshi`. Grant select trên department cho amit with grant option. Sau đó đóng vai amit (`set role amit`) grant select tiếp cho satoshi, rồi `reset role`.
create role amit;
create role satoshi;
grant select on department to amit with grant option;
set role amit;
grant select on department to satoshi;
reset role;

-- Câu truy vấn hệ thống dùng để chấm:
--   select grantor, grantee, privilege_type, is_grantable
--   from information_schema.table_privileges
--   where table_name = 'department' and grantee in ('amit', 'satoshi');

-- @ex 4.34  [revoke cascade]  ★★★
-- Làm lại toàn bộ 4.33, sau đó revoke quyền select của amit với cascade. Quyền mà amit đã cấp cho satoshi cũng phải biến mất. (Thử đổi cascade thành restrict xem lỗi gì!)
create role amit;
create role satoshi;
grant select on department to amit with grant option;
set role amit;
grant select on department to satoshi;
reset role;
revoke select on department from amit cascade;

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select count(*) from pg_roles where rolname in ('amit', 'satoshi')) as num_roles,
--          has_table_privilege('amit', 'department', 'select')                  as amit_select,
--          has_table_privilege('satoshi', 'department', 'select')               as satoshi_select;
