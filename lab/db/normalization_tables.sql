-- =====================================================================
-- Bảng cho bài tập Chương 7 (Normalization) — Part 2 và Part 4.
-- Mọi bảng bắt đầu bằng nf_. Chạy SAU university_data.sql (một số bảng
-- được sinh từ University database).
-- =====================================================================

drop table if exists nf_in_dep, nf_class, nf_employee, nf_enroll_raw, nf_dept_advisor,
  nf_cust_banker, nf_inst_info, nf_r_abc, nf_pe79_r, nf_pe79_clean, nf_pe71, nf_pe710,
  nf_pe717, nf_pe720 cascade;

-- Slide 7.3: in_dep = instructor ⋈ department (lặp building, budget)
create table nf_in_dep as
select i.ID, i.name, i.salary, i.dept_name, d.building, d.budget
from instructor i join department d on d.dept_name = i.dept_name;

-- Slide 7.58: class = course ⋈ section ⋈ classroom
create table nf_class as
select c.course_id, c.title, c.dept_name, c.credits,
       s.sec_id, s.semester, s.year, s.building, s.room_number, r.capacity, s.time_slot_id
from section s
     join course c on c.course_id = s.course_id
     join classroom r on r.building = s.building and r.room_number = s.room_number;

-- Slide 7.5: employee(ID, name, street, city, salary) — có hai nhân viên tên Kim
create table nf_employee (
  ID      varchar(5) primary key,
  name    varchar(20),
  street  varchar(20),
  city    varchar(20),
  salary  numeric(8,0)
);
insert into nf_employee values
  ('57766', 'Kim',   'Main',  'Perryridge', 75000),
  ('98776', 'Kim',   'North', 'Hampton',    67000),
  ('11223', 'Lee',   'Oak',   'Brooklyn',   58000),
  ('33445', 'Patel', 'Elm',   'Rye',        81000);

-- Dữ liệu "bẩn" để kiểm tra FD: student_id → student_name, course_id → course_title
create table nf_enroll_raw (
  student_id    varchar(5),
  student_name  varchar(20),
  course_id     varchar(8),
  course_title  varchar(40),
  grade         varchar(2)
);
insert into nf_enroll_raw values
  ('S001', 'An',   'CS-101', 'Intro. to Computer Science', 'A'),
  ('S001', 'An',   'CS-190', 'Game Design',                'B+'),
  ('S002', 'Binh', 'CS-101', 'Intro. to Computer Science', 'B'),
  ('S002', 'Bihn', 'MU-199', 'Music Video Production',     'A-'),
  ('S003', 'Chi',  'CS-101', 'Intro to CS',                'C'),
  ('S003', 'Chi',  'BIO-101','Intro. to Biology',          'A'),
  ('S004', 'Dung', 'BIO-101','Intro. to Biology',          'B');

-- Slide 7.19 / 7.26: dept_advisor(s_ID, i_ID, dept_name)
--   i_ID → dept_name ;  s_ID, dept_name → i_ID
create table nf_dept_advisor (
  s_ID       varchar(5),
  i_ID       varchar(5),
  dept_name  varchar(20),
  primary key (s_ID, i_ID)
);
insert into nf_dept_advisor values
  ('00128', '10101', 'Comp. Sci.'),
  ('00128', '22222', 'Physics'),
  ('12345', '45565', 'Comp. Sci.'),
  ('12345', '32343', 'History'),
  ('19991', '83821', 'Comp. Sci.'),
  ('23121', '10101', 'Comp. Sci.'),
  ('23121', '22222', 'Physics');

-- Slide 7.65: cust_banker_branch(customer_id, employee_id, branch_name, type)
--   customer_id, employee_id → type ; employee_id → branch_name ;
--   customer_id, branch_name → employee_id
create table nf_cust_banker (
  customer_id  varchar(5),
  employee_id  varchar(5),
  branch_name  varchar(20),
  type         varchar(10),
  primary key (customer_id, employee_id)
);
insert into nf_cust_banker values
  ('C1', 'E1', 'Downtown', 'checking'),
  ('C1', 'E3', 'Uptown',   'loan'),
  ('C2', 'E1', 'Downtown', 'loan'),
  ('C2', 'E2', 'Brighton', 'savings'),
  ('C3', 'E3', 'Uptown',   'checking'),
  ('C3', 'E4', 'Downtown', 'checking');

-- Slide 7.33–7.35: inst_info(ID, child_name, phone) — ID →→ child_name, ID →→ phone.
-- Instructor 88888 cố ý thiếu một tổ hợp (Ben, 512-555-2222) → MVD bị vi phạm trên instance.
create table nf_inst_info (
  ID          varchar(5),
  child_name  varchar(20),
  phone       varchar(12)
);
insert into nf_inst_info values
  ('99999', 'David',   '512-555-1234'),
  ('99999', 'David',   '512-555-4321'),
  ('99999', 'William', '512-555-1234'),
  ('99999', 'William', '512-555-4321'),
  ('88888', 'Anna',    '512-555-1111'),
  ('88888', 'Anna',    '512-555-2222'),
  ('88888', 'Ben',     '512-555-1111');

-- PE 7.2 (Figure 7.17): r(A, B, C)
create table nf_r_abc (a varchar(2), b varchar(2), c integer);
insert into nf_r_abc values ('a1', 'b1', 1), ('a1', 'b1', 2), ('a2', 'b1', 1), ('a2', 'b1', 3);

-- PE 7.9: r(A, B, C) — nf_pe79_r vi phạm B → C ở b = 'y'; nf_pe79_clean thoả B → C.
create table nf_pe79_r (a integer primary key, b varchar(2), c integer);
insert into nf_pe79_r values (1, 'x', 10), (2, 'x', 10), (3, 'y', 20), (4, 'y', 21), (5, 'z', 30);
create table nf_pe79_clean (a integer primary key, b varchar(2), c integer);
insert into nf_pe79_clean values (1, 'x', 10), (2, 'x', 10), (3, 'y', 20);

-- PE 7.1 / 7.6 / 7.13: R(A, B, C, D, E), F = {A → BC, CD → E, B → D, E → A}
create table nf_pe71 (a varchar(2) primary key, b varchar(2), c varchar(2), d varchar(2), e varchar(2));
insert into nf_pe71 values
  ('a1', 'b1', 'c1', 'd1', 'e1'),
  ('a2', 'b2', 'c1', 'd2', 'e2'),
  ('a3', 'b1', 'c2', 'd1', 'e3'),
  ('a4', 'b3', 'c3', 'd3', 'e4');

-- PE 7.10: R(A, B, C) với A → B, có null ở A
create table nf_pe710 (a integer, b varchar(2), c varchar(2));
insert into nf_pe710 values (1, 'b1', 'c1'), (2, 'b2', 'c2'), (null, 'b3', 'c3'), (null, 'b4', 'c4');

-- PE 7.17: R(A, B, C, D), F = {A → B, C → D, B → C}
create table nf_pe717 (a varchar(2) primary key, b varchar(2), c varchar(2), d varchar(2));
insert into nf_pe717 values
  ('a1', 'b1', 'c1', 'd1'),
  ('a2', 'b1', 'c1', 'd1'),
  ('a3', 'b2', 'c2', 'd2'),
  ('a4', 'b3', 'c2', 'd2');

-- PE 7.20: R(A, B, C) với A →→ B (đủ mọi tổ hợp B × C cho mỗi A)
create table nf_pe720 (a varchar(2), b varchar(2), c varchar(2));
insert into nf_pe720 values
  ('a1', 'b1', 'c1'), ('a1', 'b1', 'c2'), ('a1', 'b2', 'c1'), ('a1', 'b2', 'c2'),
  ('a2', 'b3', 'c3'), ('a2', 'b3', 'c4');
