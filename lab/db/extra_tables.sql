-- =====================================================================
-- Các bảng phụ dùng cho bài tập (self join, recursion, ranking,
-- windowing, OLAP). Chạy SAU university_data.sql.
-- =====================================================================

drop table if exists emp_super cascade;
drop table if exists grade_points cascade;
drop table if exists student_grades cascade;
drop table if exists dept_grades cascade;
drop table if exists sales cascade;
drop table if exists itemcategory cascade;
drop table if exists daily_sales cascade;
drop table if exists account_txn cascade;

-- Slide 3: "Self Join Example" — relation emp-super(person, supervisor)
create table emp_super (
  person      varchar(20) primary key,
  supervisor  varchar(20)
);
insert into emp_super values
  ('Bob',   'Alice'),
  ('Mary',  'Susan'),
  ('Alice', 'David'),
  ('David', 'Mary'),
  ('Tom',   'Bob'),
  ('Eve',   'Alice');

-- Điểm số quy đổi của từng letter grade
create table grade_points (
  grade   varchar(2) primary key,
  points  numeric(2,1)
);
insert into grade_points values
  ('A', 4.0), ('A-', 3.7), ('B+', 3.3), ('B', 3.0), ('B-', 2.7),
  ('C+', 2.3), ('C', 2.0), ('C-', 1.7), ('F', 0.0);

-- Slide 5: student_grades(ID, GPA) và dept_grades(ID, dept_name, GPA)
-- GPA = sum(points * credits) / sum(credits), bỏ qua môn chưa có điểm.
-- Sinh viên chưa học môn nào có GPA = null.
create table student_grades as
select s.ID,
       round(sum(gp.points * c.credits) / sum(c.credits), 2)::numeric(3,2) as GPA
from student s
     left join takes t on t.ID = s.ID
     left join course c on c.course_id = t.course_id
     left join grade_points gp on gp.grade = t.grade
group by s.ID;

create table dept_grades as
select sg.ID, s.dept_name, sg.GPA
from student_grades sg join student s on s.ID = sg.ID;

-- Slide 5 (OLAP): sales(item_name, color, clothes_size, quantity)
create table sales (
  item_name     varchar(10),
  color         varchar(10),
  clothes_size  varchar(10),
  quantity      integer
);
insert into sales values
  ('skirt', 'dark',   'small', 2),  ('skirt', 'dark',   'medium', 5),  ('skirt', 'dark',   'large', 1),
  ('skirt', 'pastel', 'small', 11), ('skirt', 'pastel', 'medium', 9),  ('skirt', 'pastel', 'large', 15),
  ('skirt', 'white',  'small', 2),  ('skirt', 'white',  'medium', 5),  ('skirt', 'white',  'large', 3),
  ('dress', 'dark',   'small', 2),  ('dress', 'dark',   'medium', 6),  ('dress', 'dark',   'large', 12),
  ('dress', 'pastel', 'small', 4),  ('dress', 'pastel', 'medium', 3),  ('dress', 'pastel', 'large', 3),
  ('dress', 'white',  'small', 2),  ('dress', 'white',  'medium', 3),  ('dress', 'white',  'large', 0),
  ('shirt', 'dark',   'small', 2),  ('shirt', 'dark',   'medium', 6),  ('shirt', 'dark',   'large', 6),
  ('shirt', 'pastel', 'small', 4),  ('shirt', 'pastel', 'medium', 1),  ('shirt', 'pastel', 'large', 2),
  ('shirt', 'white',  'small', 17), ('shirt', 'white',  'medium', 1),  ('shirt', 'white',  'large', 10),
  ('pants', 'dark',   'small', 14), ('pants', 'dark',   'medium', 6),  ('pants', 'dark',   'large', 0),
  ('pants', 'pastel', 'small', 1),  ('pants', 'pastel', 'medium', 0),  ('pants', 'pastel', 'large', 1),
  ('pants', 'white',  'small', 3),  ('pants', 'white',  'medium', 0),  ('pants', 'white',  'large', 2);

create table itemcategory (
  item_name  varchar(10) primary key,
  category   varchar(15)
);
insert into itemcategory values
  ('skirt', 'womenswear'), ('dress', 'womenswear'),
  ('shirt', 'menswear'),   ('pants', 'menswear');

-- Hàm tiện ích để kiểm tra ràng buộc: chạy câu SQL q, trả về 'ok' nếu thành
-- công, ngược lại trả về mã SQLSTATE (23502 not null, 23503 foreign key,
-- 23505 unique, 23514 check, 42501 permission denied, ...).
-- Ví dụ: select try_sql($$insert into department values ('X', 'Y', -1)$$);
create or replace function try_sql(q text) returns text
language plpgsql as $$
begin
  execute q;
  return 'ok';
exception when others then
  return sqlstate;
end $$;

-- Chạy câu truy vấn q và trả về giá trị đầu tiên (dạng text). Khác với một
-- subquery thông thường, nó thấy được các thay đổi mà try_sql vừa làm
-- trong cùng câu select (đọc từ trái sang phải).
-- Ví dụ: select try_sql($$delete from ...$$), sql_value($$select count(*) from ...$$);
create or replace function sql_value(q text) returns text
language plpgsql as $$
declare
  v text;
begin
  execute q into v;
  return v;
end $$;

-- Slide 5 (Windowing): sales(date, value) — đổi tên để không trùng bảng sales ở trên
create table daily_sales (
  sale_date  date primary key,
  value      numeric(8,2)
);
insert into daily_sales values
  ('2018-03-01', 120), ('2018-03-02', 80),  ('2018-03-03', 200),
  ('2018-03-04', 150), ('2018-03-05', 90),  ('2018-03-06', 300),
  ('2018-03-07', 60);

-- Slide 5 (Windowing within partitions): transaction(account_number, date_time, value)
-- value > 0: gửi tiền, value < 0: rút tiền
create table account_txn (
  account_number  varchar(10),
  date_time       timestamp,
  value           numeric(10,2),
  primary key (account_number, date_time)
);
insert into account_txn values
  ('A-101', '2018-01-05 09:00', 500),
  ('A-101', '2018-01-12 14:30', -200),
  ('A-101', '2018-02-01 10:15', 300),
  ('A-101', '2018-02-20 16:45', -50),
  ('A-215', '2018-01-07 11:00', 1000),
  ('A-215', '2018-01-30 08:20', -400),
  ('A-215', '2018-03-02 13:10', 250);
