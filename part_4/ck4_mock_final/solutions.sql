-- =====================================================================
-- CS4420 · Đề thi thử CK — Đề thi thử cuối kỳ — Chương 6–7 (Mock Final (Chapters 6–7))
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CK4.01  [weak entity → DDL]  ★★☆
-- Tạo bảng cho strong entity `hotel(hotel_id varchar(5), name, city)` và weak entity `hotel_room` của hotel với discriminator `room_no varchar(5)` và thuộc tính `floor integer`. Khoá và foreign key đúng quy tắc chuyển weak entity; xoá một hotel thì các phòng của nó bị xoá theo.
create table hotel (
  hotel_id varchar(5) primary key,
  name     varchar(30),
  city     varchar(30));
create table hotel_room (
  hotel_id varchar(5) references hotel on delete cascade,
  room_no  varchar(5),
  floor    integer,
  primary key (hotel_id, room_no));

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select string_agg(k.column_name, ', ' order by k.column_name)
--           from information_schema.table_constraints t
--           join information_schema.key_column_usage k on k.constraint_name = t.constraint_name and k.table_name = t.table_name
--           where t.table_name = 'hotel_room' and t.constraint_type = 'PRIMARY KEY') as room_pk,
--          try_sql($$insert into hotel values ('H1', 'Sunrise', 'Hue')$$) as add_hotel,
--          try_sql($$insert into hotel_room values ('H1', '101', 1)$$) as add_room,
--          try_sql($$insert into hotel_room values ('H1', '101', 2)$$) as dup_room,
--          try_sql($$insert into hotel_room values ('H9', '101', 1)$$) as room_of_unknown_hotel,
--          try_sql($$delete from hotel where hotel_id = 'H1'$$) as delete_hotel,
--          sql_value('select count(*) from hotel_room') as rooms_left;

-- @ex CK4.02  [M:N → DDL]  ★★★
-- Tiếp CK4.01 (tạo lại hotel, hotel_room trong cùng câu trả lời). Thêm entity `guest(guest_id varchar(5), name)` và relationship many-to-many `stay` giữa guest và hotel_room với thuộc tính `nights integer`. Bảng `stay` có khoá theo quy tắc chuyển M:N và foreign key tới cả hai bên.
-- Gợi ý: Khoá của hotel_room là kép, nên FK từ stay tới hotel_room cũng là kép: foreign key (hotel_id, room_no) references hotel_room.
create table hotel (hotel_id varchar(5) primary key, name varchar(30), city varchar(30));
create table hotel_room (
  hotel_id varchar(5) references hotel on delete cascade,
  room_no  varchar(5),
  floor    integer,
  primary key (hotel_id, room_no));
create table guest (guest_id varchar(5) primary key, name varchar(30));
create table stay (
  guest_id varchar(5) references guest,
  hotel_id varchar(5),
  room_no  varchar(5),
  nights   integer,
  primary key (guest_id, hotel_id, room_no),
  foreign key (hotel_id, room_no) references hotel_room);

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select string_agg(k.column_name, ', ' order by k.column_name)
--           from information_schema.table_constraints t
--           join information_schema.key_column_usage k on k.constraint_name = t.constraint_name and k.table_name = t.table_name
--           where t.table_name = 'stay' and t.constraint_type = 'PRIMARY KEY') as stay_pk,
--          (select count(*) from information_schema.table_constraints
--           where table_name = 'stay' and constraint_type = 'FOREIGN KEY') as stay_fks,
--          try_sql($$insert into hotel values ('H1', 'Sunrise', 'Hue')$$)
--          || try_sql($$insert into hotel_room values ('H1', '101', 1)$$)
--          || try_sql($$insert into guest values ('G1', 'Lan')$$) as setup,
--          try_sql($$insert into stay values ('G1', 'H1', '101', 3)$$) as valid_stay,
--          try_sql($$insert into stay values ('G1', 'H1', '999', 2)$$) as unknown_room;

-- @ex CK4.03  [1:1 + total]  ★★☆
-- Mỗi department có đúng một trưởng khoa là một instructor, và một instructor làm trưởng tối đa một khoa. Tạo bảng `dept_head(dept_name, head_id)` (dept_name là khoá, FK tới department; head_id FK tới instructor) với các ràng buộc ép đúng cardinality one-to-one và total phía department-trong-bảng (head_id không được để trống).
-- Gợi ý: PE 6.9 và 6.10: unique + not null.
create table dept_head (
  dept_name varchar(20) primary key references department,
  head_id   varchar(5) not null unique references instructor);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into dept_head values ('Physics', '22222')$$) as ok_row,
--          try_sql($$insert into dept_head values ('Biology', '22222')$$) as same_head_twice,
--          try_sql($$insert into dept_head values ('Physics', '33456')$$) as two_heads,
--          try_sql($$insert into dept_head values ('Music', null)$$) as no_head,
--          try_sql($$insert into dept_head values ('Music', '99999')$$) as unknown_instructor;

-- @ex CK4.04  [multivalued → DDL]  ★☆☆
-- instructor có thuộc tính multivalued `{phone}`. Tạo bảng `inst_phone` tương ứng (cột ID, phone varchar(15)); xoá instructor thì số điện thoại của họ bị xoá theo.
create table inst_phone (
  ID    varchar(5) references instructor on delete cascade,
  phone varchar(15),
  primary key (ID, phone));

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into instructor values ('99001', 'Tester', 'Physics', 50000)$$) as new_instructor,
--          try_sql($$insert into inst_phone values ('99001', '555-0101')$$) as phone1,
--          try_sql($$insert into inst_phone values ('99001', '555-0102')$$) as phone2,
--          try_sql($$insert into inst_phone values ('99001', '555-0101')$$) as duplicate,
--          try_sql($$insert into inst_phone values ('00000', '555-0000')$$) as unknown_id,
--          try_sql($$delete from instructor where ID = '99001'$$) as delete_instructor,
--          sql_value('select count(*) from inst_phone') as phones_left;

-- @ex CK4.05  [specialization → DDL]  ★★☆
-- vehicle(vin, make) được specialize thành truck(capacity integer) và bus(seats integer). Dùng cách 1: tạo `vehicle(vin varchar(10) primary key, make varchar(20))`, `truck`, `bus` — mỗi bảng con có khoá là vin, tham chiếu vehicle, xoá theo khi xoá vehicle.
create table vehicle (vin varchar(10) primary key, make varchar(20));
create table truck (vin varchar(10) primary key references vehicle on delete cascade, capacity integer);
create table bus (vin varchar(10) primary key references vehicle on delete cascade, seats integer);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into vehicle values ('V1', 'Volvo')$$) as add_vehicle,
--          try_sql($$insert into truck values ('V1', 20)$$) as as_truck,
--          try_sql($$insert into bus values ('V1', 45)$$) as also_bus,
--          try_sql($$insert into truck values ('V9', 10)$$) as truck_without_vehicle,
--          try_sql($$delete from vehicle where vin = 'V1'$$) as delete_vehicle,
--          sql_value('select count(*) from truck') as trucks_left,
--          sql_value('select count(*) from bus') as buses_left;

-- @ex CK4.06  [FD test (vi phạm)]  ★★☆
-- Trên `fr_enrollment`, FD instructor → course_id có đúng không? Trả về các instructor làm FD này sai (dạy hơn một course) cùng số course khác nhau họ dạy.
-- Gợi ý: PE 7.9: group by vế trái, having count(distinct vế phải) > 1.
select instructor, count(distinct course_id) as num_courses
from fr_enrollment
group by instructor
having count(distinct course_id) > 1;

-- @ex CK4.07  [FD test (update anomaly)]  ★★☆
-- Bảng `fr_supply` lẽ ra phải thoả supplier_id → supplier_city nhưng dữ liệu bị cập nhật lệch. Tìm các supplier_id vi phạm và số thành phố khác nhau được ghi cho mỗi supplier.
select supplier_id, count(distinct supplier_city) as num_cities
from fr_supply
group by supplier_id
having count(distinct supplier_city) > 1;

-- @ex CK4.08  [kiểm tra nhiều FD]  ★★★
-- Viết một truy vấn trả về hai cột `fd` (text) và `holds` (boolean) cho 5 FD trên `fr_enrollment`: `'student_id -> student_name'`, `'course_id -> instructor'`, `'instructor -> office'`, `'instructor -> course_id'`, `'office -> instructor'`. (Lưu ý: dữ liệu chỉ chứng minh được một FD sai, không chứng minh được FD đúng với mọi instance.)
-- Gợi ý: not exists (select ... group by X having count(distinct Y) > 1), nối các dòng bằng union all.
select 'student_id -> student_name' as fd,
       not exists (select 1 from fr_enrollment group by student_id having count(distinct student_name) > 1) as holds
union all
select 'course_id -> instructor',
       not exists (select 1 from fr_enrollment group by course_id having count(distinct instructor) > 1)
union all
select 'instructor -> office',
       not exists (select 1 from fr_enrollment group by instructor having count(distinct office) > 1)
union all
select 'instructor -> course_id',
       not exists (select 1 from fr_enrollment group by instructor having count(distinct course_id) > 1)
union all
select 'office -> instructor',
       not exists (select 1 from fr_enrollment group by office having count(distinct instructor) > 1);

-- @ex CK4.09  [phân rã BCNF + lossless]  ★★★
-- Với FD student_id → student_name; course_id → course_title, instructor; instructor → office; (student_id, course_id) → grade, phân rã BCNF của fr_enrollment là:
-- `fr_student(student_id, student_name)`, `fr_course(course_id, course_title, instructor)`, `fr_instructor(instructor, office)`, `fr_grade(student_id, course_id, grade)`.
-- Tạo 4 bảng này bằng `create table ... as select distinct ...` từ fr_enrollment.
create table fr_student as select distinct student_id, student_name from fr_enrollment;
create table fr_course as select distinct course_id, course_title, instructor from fr_enrollment;
create table fr_instructor as select distinct instructor, office from fr_enrollment;
create table fr_grade as select distinct student_id, course_id, grade from fr_enrollment;

-- Câu truy vấn hệ thống dùng để chấm:
--   with joined as (
--     select student_id, student_name, course_id, course_title, instructor, office, grade
--     from fr_grade natural join fr_student natural join fr_course natural join fr_instructor)
--   select (select count(*) from fr_student) as students,
--          (select count(*) from fr_course) as courses,
--          (select count(*) from fr_instructor) as instructors,
--          (select count(*) from fr_grade) as grades,
--          (select count(*) from (select * from joined except select * from fr_enrollment) x) as spurious_rows,
--          (select count(*) from (select * from fr_enrollment except select * from joined) y) as lost_rows;

-- @ex CK4.10  [phân rã lossy]  ★★★
-- Phân rã sai: chiếu fr_enrollment thành r1(student_id, instructor) và r2(instructor, course_id) (distinct), rồi natural join lại. Trả về hai số: `original_rows` = số bộ (student_id, instructor, course_id) khác nhau trong fr_enrollment, và `joined_rows` = số dòng của r1 ⋈ r2. Vì sao joined_rows lớn hơn?
-- Gợi ý: Phần chung là instructor, mà instructor không phải superkey của r1 hay r2 → lossy (sinh tuple giả).
with r1 as (select distinct student_id, instructor from fr_enrollment),
     r2 as (select distinct instructor, course_id from fr_enrollment)
select (select count(*) from (select distinct student_id, instructor, course_id from fr_enrollment) o) as original_rows,
       (select count(*) from r1 natural join r2) as joined_rows;
