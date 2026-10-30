-- =====================================================================
-- CS4420 · Chương 6 — Thiết kế CSDL bằng mô hình E-R (Database Design Using the E-R Model)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex 6.01  [strong entity]  ★☆☆
-- Entity set `lecturer` có thuộc tính ID (khoá), `name` (bắt buộc), `salary`. Tạo bảng `lecturer(ID varchar(5), name varchar(20), salary numeric(8,2))` với primary key và not null phù hợp.
create table lecturer (
  ID      varchar(5) primary key,
  name    varchar(20) not null,
  salary  numeric(8,2)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into lecturer values ('L1', 'Ann', 50000)$$)   as first_insert,
--          try_sql($$insert into lecturer values ('L1', 'Bob', 60000)$$)   as duplicate_id,
--          try_sql($$insert into lecturer values ('L2', null, 60000)$$)    as null_name,
--          try_sql($$insert into lecturer values ('L3', 'Cid', null)$$)    as null_salary;

-- @ex 6.02  [composite attribute]  ★☆☆
-- Entity set `applicant`:
-- ```
-- applicant
--   ID
--   name (first_name, middle_initial, last_name)
--   address (street (street_number, street_name, apt_number), city, state, zip)
-- ```
-- Tạo bảng `applicant` bằng cách làm phẳng các composite attribute (mọi cột kiểu varchar(20), ID là primary key).
-- Gợi ý: Chỉ giữ các thuộc tính đơn ở mức lá; không có cột name, address, street.
create table applicant (
  ID              varchar(20) primary key,
  first_name      varchar(20),
  middle_initial  varchar(20),
  last_name       varchar(20),
  street_number   varchar(20),
  street_name     varchar(20),
  apt_number      varchar(20),
  city            varchar(20),
  state           varchar(20),
  zip             varchar(20)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select string_agg(column_name, ', ' order by column_name) as columns
--   from information_schema.columns where table_name = 'applicant';

-- @ex 6.03  [multivalued attribute]  ★★☆
-- instructor có thuộc tính multivalued `{phone_number}`. Tạo bảng `instructor_phone(ID varchar(5), phone_number varchar(15))`: một giảng viên có nhiều số, không lặp cùng một số, ID tham chiếu instructor và tự xoá khi giảng viên bị xoá.
create table instructor_phone (
  ID            varchar(5) references instructor on delete cascade,
  phone_number  varchar(15),
  primary key (ID, phone_number)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into instructor_phone values ('83821', '555-1234')$$) as phone_1,
--          try_sql($$insert into instructor_phone values ('83821', '555-9999')$$) as phone_2,
--          try_sql($$insert into instructor_phone values ('83821', '555-1234')$$) as duplicate,
--          try_sql($$insert into instructor_phone values ('00000', '555-0000')$$) as bad_instructor,
--          try_sql($$insert into instructor_phone values ('83821', null)$$)       as null_phone,
--          try_sql($$delete from instructor where ID = '83821'$$)                 as delete_instructor,
--          sql_value($$select count(*) from instructor_phone$$)                   as phones_left;

-- @ex 6.04  [derived attribute]  ★★☆
-- Thuộc tính derived `num_advisees()` của instructor = số sinh viên mà giảng viên đó hướng dẫn (bảng advisor). Không lưu cột này; hãy tạo view `instructor_advisees(ID, name, num_advisees)` cho mọi instructor (kể cả người có 0 advisee).
-- Gợi ý: left outer join advisor on advisor.i_ID = instructor.ID; count(advisor.s_ID).
create view instructor_advisees (ID, name, num_advisees) as
  select i.ID, i.name, count(a.s_ID)
  from instructor i left outer join advisor a on a.i_ID = i.ID
  group by i.ID, i.name;

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from instructor_advisees;

-- @ex 6.05  [weak entity]  ★★☆
-- Weak entity set `course_assignment` phụ thuộc course qua identifying relationship; discriminator là `assign_no`, thêm thuộc tính `title`. Tạo bảng `course_assignment(course_id varchar(8), assign_no integer, title varchar(30))` với primary key đúng của weak entity, foreign key tới owner, và xoá theo owner.
-- Gợi ý: PK = PK(owner) ∪ discriminator; on delete cascade.
create table course_assignment (
  course_id  varchar(8) references course on delete cascade,
  assign_no  integer,
  title      varchar(30),
  primary key (course_id, assign_no)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into course_assignment values ('CS-101', 1, 'Hello world')$$) as a1,
--          try_sql($$insert into course_assignment values ('CS-347', 1, 'ER diagram')$$)  as same_no_other_course,
--          try_sql($$insert into course_assignment values ('CS-101', 1, 'Again')$$)       as duplicate,
--          try_sql($$insert into course_assignment values ('XX-000', 1, 'No owner')$$)    as no_owner,
--          try_sql($$insert into course_assignment values ('CS-101', null, 'No disc')$$)  as null_discriminator,
--          try_sql($$delete from course where course_id = 'CS-347'$$)                    as delete_owner,
--          sql_value($$select count(*) from course_assignment$$)                         as rows_left;

-- @ex 6.06  [M:N + attribute]  ★★☆
-- Relationship set many-to-many `mentors` giữa instructor và student, có thuộc tính `start_date date`. Tạo bảng `mentors(i_ID, s_ID, start_date)` (kiểu varchar(5) cho ID) với primary key và các foreign key đúng.
create table mentors (
  i_ID        varchar(5) references instructor (ID),
  s_ID        varchar(5) references student (ID),
  start_date  date,
  primary key (i_ID, s_ID)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into mentors values ('10101', '00128', '2024-01-10')$$) as m1,
--          try_sql($$insert into mentors values ('10101', '12345', '2024-02-01')$$) as same_instructor,
--          try_sql($$insert into mentors values ('45565', '00128', '2024-03-01')$$) as same_student,
--          try_sql($$insert into mentors values ('10101', '00128', '2025-01-01')$$) as duplicate_pair,
--          try_sql($$insert into mentors values ('10101', '99999', '2025-01-01')$$) as bad_student;

-- @ex 6.07  [many-to-one gộp]  ★★☆
-- Entity `laptop(serial_no, model)` và relationship many-to-one `assigned_to` từ laptop tới student (mỗi laptop giao cho tối đa một sinh viên, một sinh viên có thể giữ nhiều laptop; laptop có thể chưa giao). Không tạo bảng riêng cho relationship: tạo bảng `laptop(serial_no varchar(10), model varchar(20), owner_id varchar(5))`.
-- Gợi ý: owner_id là FK → student, cho phép null (partial).
create table laptop (
  serial_no  varchar(10) primary key,
  model      varchar(20),
  owner_id   varchar(5) references student (ID)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into laptop values ('S1', 'XPS', '00128')$$)   as l1,
--          try_sql($$insert into laptop values ('S2', 'Mac', '00128')$$)   as same_owner,
--          try_sql($$insert into laptop values ('S3', 'ThinkPad', null)$$) as unassigned,
--          try_sql($$insert into laptop values ('S1', 'Dup', '12345')$$)   as duplicate_serial,
--          try_sql($$insert into laptop values ('S4', 'Bad', '99999')$$)   as bad_owner,
--          (select count(*) from information_schema.tables where table_name = 'assigned_to') as extra_table;

-- @ex 6.08  [one-to-one]  ★★☆
-- Relationship one-to-one giữa `parking_permit` và instructor: mỗi permit cấp cho đúng một instructor, mỗi instructor có tối đa một permit. Tạo bảng `parking_permit(permit_no varchar(6), i_ID varchar(5), zone varchar(2))`.
-- Gợi ý: i_ID: not null (total phía permit) + unique (one-to-one) + FK.
create table parking_permit (
  permit_no  varchar(6) primary key,
  i_ID       varchar(5) not null unique references instructor (ID),
  zone       varchar(2)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into parking_permit values ('P1', '10101', 'A')$$) as p1,
--          try_sql($$insert into parking_permit values ('P2', '10101', 'B')$$) as second_permit_same_instructor,
--          try_sql($$insert into parking_permit values ('P3', null, 'B')$$)    as no_instructor,
--          try_sql($$insert into parking_permit values ('P4', '12121', 'B')$$) as other_instructor,
--          try_sql($$insert into parking_permit values ('P5', '00000', 'B')$$) as bad_instructor;

-- @ex 6.09  [total participation]  ★★☆
-- Entity `textbook(isbn, title)` và relationship many-to-one `used_in` tới course, với total participation của textbook (mỗi sách phải dùng cho đúng một course). Tạo bảng `textbook(isbn varchar(13), title varchar(40), course_id varchar(8))` ép được cả cardinality lẫn total participation.
create table textbook (
  isbn       varchar(13) primary key,
  title      varchar(40),
  course_id  varchar(8) not null references course
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into textbook values ('978-1', 'DB Concepts', 'CS-347')$$) as t1,
--          try_sql($$insert into textbook values ('978-2', 'Genetics', 'BIO-301')$$)    as t2,
--          try_sql($$insert into textbook values ('978-3', 'Orphan', null)$$)          as no_course,
--          try_sql($$insert into textbook values ('978-4', 'Ghost', 'XX-000')$$)       as bad_course;

-- @ex 6.10  [role / recursive]  ★★☆
-- Relationship `coreq` trên cùng entity set course với hai role `course_id` và `coreq_id` (môn phải học song song). Tạo bảng `coreq(course_id varchar(8), coreq_id varchar(8))`: cả hai là course hợp lệ, không lặp cặp, và một môn không thể là coreq của chính nó.
create table coreq (
  course_id  varchar(8) references course,
  coreq_id   varchar(8) references course,
  primary key (course_id, coreq_id),
  check (course_id <> coreq_id)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into coreq values ('CS-315', 'CS-319')$$) as c1,
--          try_sql($$insert into coreq values ('CS-319', 'CS-315')$$) as reverse_pair,
--          try_sql($$insert into coreq values ('CS-315', 'CS-319')$$) as duplicate,
--          try_sql($$insert into coreq values ('CS-315', 'CS-315')$$) as self,
--          try_sql($$insert into coreq values ('CS-315', 'XX-000')$$) as bad_course;

-- @ex 6.11  [cardinality từ dữ liệu]  ★★☆
-- Trong bảng `advisor`, primary key là s_ID nên advisor là many-to-one từ student tới instructor. Kiểm tra trên dữ liệu: liệt kê `i_ID` và số advisee của các instructor hướng dẫn nhiều hơn một sinh viên (chứng tỏ phía instructor là "many").
select i_ID, count(*) as num_advisees
from advisor
group by i_ID
having count(*) > 1;

-- @ex 6.12  [specialization M1 (DDL)]  ★★☆
-- Chuyển specialization person → {employee, student} theo method 1: tạo
-- - `p_person(ID varchar(5) primary key, name varchar(20), street varchar(30), city varchar(20))`
-- - `p_employee(ID, salary numeric(8,2))` và `p_student(ID, tot_cred numeric(3,0))`, trong đó ID của bảng con vừa là primary key vừa là foreign key tới p_person, xoá theo cha.
create table p_person (
  ID      varchar(5) primary key,
  name    varchar(20),
  street  varchar(30),
  city    varchar(20)
);
create table p_employee (
  ID      varchar(5) primary key references p_person on delete cascade,
  salary  numeric(8,2)
);
create table p_student (
  ID        varchar(5) primary key references p_person on delete cascade,
  tot_cred  numeric(3,0)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into p_person values ('X1', 'An', '1 A', 'Hue')$$) as person,
--          try_sql($$insert into p_employee values ('X1', 50000)$$)              as employee,
--          try_sql($$insert into p_student values ('X1', 30)$$)                  as also_student,
--          try_sql($$insert into p_employee values ('X9', 1)$$)                  as employee_without_person,
--          try_sql($$insert into p_employee values ('X1', 2)$$)                  as duplicate_employee,
--          try_sql($$delete from p_person where ID = 'X1'$$)                     as delete_person,
--          sql_value($$select count(*) from p_employee$$)                        as employees_left,
--          sql_value($$select count(*) from p_student$$)                         as students_left;

-- @ex 6.13  [specialization M1 (query)]  ★☆☆
-- Với các bảng method 1 có sẵn `er_person`, `er_employee`, `er_student`: liệt kê ID, name, city, salary của mọi employee. (Nhược điểm method 1: phải join để có đủ thuộc tính.)
select p.ID, p.name, p.city, e.salary
from er_person p join er_employee e on e.ID = p.ID;

-- @ex 6.14  [overlapping / partial]  ★★☆
-- Trên `er_person`, `er_employee`, `er_student`: trả về hai cột `ID, kind`, với kind là `both` cho người vừa là employee vừa là student, `none` cho người không thuộc entity con nào (partial specialization).
-- Gợi ý: Dùng exists / not exists hoặc left join + case.
select ID, 'both' as kind from er_person p
where exists (select 1 from er_employee e where e.ID = p.ID)
  and exists (select 1 from er_student s where s.ID = p.ID)
union
select ID, 'none' from er_person p
where not exists (select 1 from er_employee e where e.ID = p.ID)
  and not exists (select 1 from er_student s where s.ID = p.ID);

-- @ex 6.15  [specialization M2]  ★★★
-- Chuyển dữ liệu của `er_person/er_employee/er_student` sang method 2:
-- 1. Tạo bảng `m2_employee(ID, name, street, city, salary)` và `m2_student(ID, name, street, city, tot_credits)` (cùng kiểu với bảng gốc, ID là primary key) và nạp dữ liệu từ các bảng er_.
-- 2. Tạo view `m2_person(ID, name, street, city)` = hợp của hai bảng.
-- Hệ thống sẽ đếm số dòng mỗi bảng, số người bị lặp name/street/city ở cả hai bảng, và số người trong view.
-- Gợi ý: insert into m2_employee select p.ID, name, street, city, salary from er_person p join er_employee ...; view dùng union (loại trùng).
create table m2_employee (
  ID varchar(5) primary key, name varchar(20), street varchar(30), city varchar(20), salary numeric(8,2)
);
create table m2_student (
  ID varchar(5) primary key, name varchar(20), street varchar(30), city varchar(20), tot_credits numeric(3,0)
);
insert into m2_employee select p.ID, p.name, p.street, p.city, e.salary from er_person p join er_employee e on e.ID = p.ID;
insert into m2_student select p.ID, p.name, p.street, p.city, s.tot_credits from er_person p join er_student s on s.ID = p.ID;
create view m2_person (ID, name, street, city) as
  select ID, name, street, city from m2_employee
  union
  select ID, name, street, city from m2_student;

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select count(*) from m2_employee) as employees,
--          (select count(*) from m2_student) as students,
--          (select count(*) from m2_employee e join m2_student s on s.ID = e.ID) as duplicated_people,
--          (select count(*) from m2_person) as people_in_view,
--          (select count(*) from er_person) as people_total;

-- @ex 6.16  [aggregation (DDL)]  ★★★
-- Bảng `er_proj_guide(i_ID, s_ID, project_id)` (primary key cả ba cột) và `er_evaluation(evaluation_id, ...)` đã có. Tạo bảng `eval_for(i_ID varchar(5), s_ID varchar(5), project_id varchar(5), evaluation_id varchar(5))` biểu diễn relationship giữa aggregation proj_guide và evaluation.
-- Gợi ý: FK nhiều cột (i_ID, s_ID, project_id) → er_proj_guide; FK evaluation_id → er_evaluation.
create table eval_for (
  i_ID           varchar(5),
  s_ID           varchar(5),
  project_id     varchar(5),
  evaluation_id  varchar(5) references er_evaluation,
  primary key (i_ID, s_ID, project_id, evaluation_id),
  foreign key (i_ID, s_ID, project_id) references er_proj_guide
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into eval_for values ('10101', '00128', 'PJ3', 'EV1')$$) as guided_triple,
--          try_sql($$insert into eval_for values ('10101', '00128', 'PJ2', 'EV1')$$) as not_guided,
--          try_sql($$insert into eval_for values ('10101', '00128', 'PJ3', 'EVX')$$) as bad_evaluation,
--          try_sql($$insert into eval_for values ('10101', '00128', 'PJ3', 'EV1')$$) as duplicate;

-- @ex 6.17  [aggregation (query)]  ★★☆
-- Với `er_proj_guide`, `er_project`, `er_eval_for`, `er_evaluation`: liệt kê mọi bộ hướng dẫn (i_ID, s_ID, project title) kèm grade của evaluation; bộ chưa được đánh giá vẫn xuất hiện với grade null.
select g.i_ID, g.s_ID, p.title, ev.grade
from er_proj_guide g
     join er_project p on p.project_id = g.project_id
     left join er_eval_for f on f.i_ID = g.i_ID and f.s_ID = g.s_ID and f.project_id = g.project_id
     left join er_evaluation ev on ev.evaluation_id = f.evaluation_id;

-- @ex 6.18  [ternary + arrow]  ★★★
-- Ternary relationship `proj_guide_t(instructor, student, project)` có một mũi tên tới instructor: mỗi cặp (student, project) có tối đa một instructor hướng dẫn. Tạo bảng `proj_guide_t(i_ID varchar(5), s_ID varchar(5), project_id varchar(5))` với primary key phản ánh đúng ràng buộc đó (FK: i_ID → instructor, s_ID → student, project_id → er_project).
-- Gợi ý: Phía có mũi tên không nằm trong primary key.
create table proj_guide_t (
  i_ID        varchar(5) not null references instructor (ID),
  s_ID        varchar(5) references student (ID),
  project_id  varchar(5) references er_project,
  primary key (s_ID, project_id)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into proj_guide_t values ('10101', '00128', 'PJ1')$$) as g1,
--          try_sql($$insert into proj_guide_t values ('45565', '00128', 'PJ1')$$) as second_instructor_same_pair,
--          try_sql($$insert into proj_guide_t values ('10101', '00128', 'PJ2')$$) as same_student_other_project,
--          try_sql($$insert into proj_guide_t values ('10101', '12345', 'PJ1')$$) as other_student_same_project;

-- @ex 6.19  [ternary → binary]  ★★★
-- Thay ternary proj_guide bằng entity set `guide_e` (thuộc tính định danh `e_id`) và ba relationship R[A], R[B], R[C] many-to-one, total từ phía E (gộp vào bảng E). Tạo bảng `guide_e(e_id integer, i_ID varchar(5), s_ID varchar(5), project_id varchar(5))` sao cho: mỗi e nối đúng một instructor, một student, một project, và không có hai e cho cùng bộ (i_ID, s_ID, project_id).
-- Gợi ý: not null cho cả ba FK (total participation của E), unique (i_ID, s_ID, project_id).
create table guide_e (
  e_id        integer primary key,
  i_ID        varchar(5) not null references instructor (ID),
  s_ID        varchar(5) not null references student (ID),
  project_id  varchar(5) not null references er_project,
  unique (i_ID, s_ID, project_id)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into guide_e values (1, '10101', '00128', 'PJ1')$$) as e1,
--          try_sql($$insert into guide_e values (2, '10101', '00128', 'PJ1')$$) as same_triple,
--          try_sql($$insert into guide_e values (3, '10101', null, 'PJ1')$$)    as missing_student,
--          try_sql($$insert into guide_e values (4, '45565', '00128', 'PJ1')$$) as other_instructor;

-- @ex 6.20  [reduction tổng hợp]  ★★★
-- Chuyển đoạn E-R sau thành bảng (kiểu: varchar(10) cho mọi khoá/chuỗi, numeric(10,2) cho tiền, date cho ngày):
-- ```
-- [hotel] hotel_id, name, {phone}
-- [room]  (weak, owner = hotel) room_no (discriminator), rate
-- [guest] guest_id, name
--   many-to-many giữa guest và room, thuộc tính check_in
-- ```
-- Tạo các bảng `hotel(hotel_id, name)`, `hotel_phone(hotel_id, phone)`, `room(hotel_id, room_no, rate)`, `guest(guest_id, name)`, `stay(guest_id, hotel_id, room_no, check_in)` với đủ primary key, foreign key (room và hotel_phone xoá theo hotel). Một khách có thể ở cùng phòng nhiều lần ở các ngày check_in khác nhau.
-- Gợi ý: stay: PK (guest_id, hotel_id, room_no, check_in); FK (hotel_id, room_no) → room.
create table hotel (
  hotel_id  varchar(10) primary key,
  name      varchar(10)
);
create table hotel_phone (
  hotel_id  varchar(10) references hotel on delete cascade,
  phone     varchar(10),
  primary key (hotel_id, phone)
);
create table room (
  hotel_id  varchar(10) references hotel on delete cascade,
  room_no   varchar(10),
  rate      numeric(10,2),
  primary key (hotel_id, room_no)
);
create table guest (
  guest_id  varchar(10) primary key,
  name      varchar(10)
);
create table stay (
  guest_id  varchar(10) references guest,
  hotel_id  varchar(10),
  room_no   varchar(10),
  check_in  date,
  primary key (guest_id, hotel_id, room_no, check_in),
  foreign key (hotel_id, room_no) references room
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into hotel values ('H1', 'Sea')$$)                      as hotel,
--          try_sql($$insert into hotel_phone values ('H1', '111'), ('H1', '222')$$)     as two_phones,
--          try_sql($$insert into room values ('H1', '101', 50), ('H1', '102', 60)$$)    as rooms,
--          try_sql($$insert into room values ('H9', '101', 50)$$)                       as room_no_hotel,
--          try_sql($$insert into guest values ('G1', 'An')$$)                           as guest,
--          try_sql($$insert into stay values ('G1', 'H1', '101', '2025-01-01')$$)       as stay_1,
--          try_sql($$insert into stay values ('G1', 'H1', '101', '2025-02-01')$$)       as stay_again,
--          try_sql($$insert into stay values ('G1', 'H1', '999', '2025-03-01')$$)       as bad_room,
--          try_sql($$delete from hotel where hotel_id = 'H1'$$)                          as delete_hotel_with_stays;
