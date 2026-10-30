-- =====================================================================
-- Bảng cho bài tập Chương 8 (Complex Data Types) — Part 3.
-- Mọi bảng/kiểu đều có prefix cx_. Chạy SAU university_data.sql.
--
--   JSON (slide 8.4–8.7, PE 8.1):          cx_profile
--   Array + composite (slide 8.18–8.25):   cx_book (author_array, publisher, keyword_set)
--   Multiset lồng nhau (PE 8.4):           cx_emp (children cx_child[], skills cx_skill[])
--   RDF triples (slide 8.10–8.14, PE 8.2): cx_triple — sinh từ University database
--   Text search, TF-IDF (PE 8.7):          cx_pe_doc
--   PageRank (PE 8.8):                     cx_link
--   Spatial (PE 8.9):                      cx_student_loc (point), cx_room_area (polygon)
-- =====================================================================

drop table if exists cx_profile, cx_book, cx_emp, cx_triple, cx_pe_doc, cx_link, cx_student_loc, cx_room_area cascade;
drop type if exists cx_publisher, cx_skill, cx_exam, cx_child cascade;

-- ---------------------------------------------------------------- JSON documents
-- Hồ sơ bán cấu trúc: mỗi sinh viên có một bộ thuộc tính khác nhau.
create table cx_profile (
  ID   varchar(5) primary key references student,
  doc  jsonb not null
);
insert into cx_profile values
  ('00128', '{"email": "zhang@uni.edu", "phones": ["555-0101", "555-0102"], "address": {"city": "Brooklyn", "zip": "11201"}, "hobbies": ["chess", "go"], "scholarship": 2000}'),
  ('12345', '{"email": "shankar@uni.edu", "phones": ["555-0199"], "address": {"city": "Palo Alto", "zip": "94301"}, "hobbies": ["cricket"]}'),
  ('19991', '{"email": "brandt@uni.edu", "phones": [], "address": {"city": "Brooklyn", "zip": "11215"}}'),
  ('44553', '{"phones": ["555-0300", "555-0301", "555-0302"], "address": {"city": "Stamford"}, "hobbies": ["chess"], "scholarship": 1500}'),
  ('54321', '{"email": "williams@uni.edu", "address": {"city": "Brooklyn", "zip": "11201"}, "hobbies": ["go", "piano"]}'),
  ('98988', '{"email": "tanaka@uni.edu", "phones": ["555-0900"], "scholarship": 3000}');

-- ---------------------------------------------------------------- Array + composite type
-- Ví dụ books của slide: author_array (có thứ tự), keyword_set (tập), publisher (composite).
create type cx_publisher as (name varchar(20), branch varchar(20));
create table cx_book (
  isbn          varchar(10) primary key,
  title         varchar(40) not null,
  author_array  text[],
  publisher     cx_publisher,
  keyword_set   text[]
);
insert into cx_book values
  ('B1', 'Compilers',           array['Smith', 'Jones'],          row('McGraw-Hill', 'New York'), array['parsing', 'analysis']),
  ('B2', 'Networks',            array['Jones', 'Frick'],          row('Oxford', 'London'),        array['Internet', 'Web']),
  ('B3', 'Database Concepts',   array['Silberschatz', 'Korth', 'Sudarshan'], row('McGraw-Hill', 'Boston'), array['SQL', 'relational', 'transactions']),
  ('B4', 'Data on the Web',     array['Abiteboul', 'Suciu'],      row('Morgan Kaufmann', 'San Francisco'), array['XML', 'Web', 'semistructured']),
  ('B5', 'Readings in DB',      array['Stonebraker'],             row('MIT Press', 'Boston'),     array['SQL', 'history']);

-- ---------------------------------------------------------------- Nested multisets (PE 8.4)
-- Emp = (ename, ChildrenSet multiset(Children), SkillSet multiset(Skills))
-- Children = (name, birthday); Skills = (type, ExamSet setof(Exams)); Exams = (year, city)
create type cx_child as (name varchar(20), birthday date);
create type cx_exam  as (year integer, city varchar(20));
create type cx_skill as (type varchar(20), exams cx_exam[]);
create table cx_emp (
  ename     varchar(20) primary key,
  children  cx_child[],
  skills    cx_skill[]
);
insert into cx_emp values
  ('Alice', array[row('Ann', '2015-03-12')::cx_child, row('Ben', '2018-07-01')::cx_child],
            array[row('typing',  array[row(2019, 'Dayton')::cx_exam, row(2021, 'Columbus')::cx_exam])::cx_skill,
                  row('driving', array[row(2020, 'Dayton')::cx_exam])::cx_skill]),
  ('Bob',   array[row('Cara', '2016-11-30')::cx_child],
            array[row('typing',  array[row(2018, 'Columbus')::cx_exam])::cx_skill]),
  ('Chen',  array[row('Dan', '2012-03-03')::cx_child, row('Eva', '2014-03-25')::cx_child],
            array[row('welding', array[row(2017, 'Akron')::cx_exam])::cx_skill,
                  row('typing',  array[row(2022, 'Dayton')::cx_exam])::cx_skill]),
  ('Dara',  array[]::cx_child[],
            array[row('accounting', array[]::cx_exam[])::cx_skill]);

-- ---------------------------------------------------------------- RDF triples (PE 8.2)
-- Toàn bộ University database viết dưới dạng (subject, predicate, object), giống Figure 8.3.
-- Section được định danh bằng 'course_id/sec_id/semester/year'.
create table cx_triple (
  subject    varchar(40) not null,
  predicate  varchar(20) not null,
  object     varchar(40) not null
);
insert into cx_triple
  select ID, 'instance-of', 'instructor' from instructor
  union all select ID, 'name', name from instructor
  union all select ID, 'salary', salary::text from instructor
  union all select ID, 'inst_dept', dept_name from instructor
  union all select ID, 'instance-of', 'student' from student
  union all select ID, 'name', name from student
  union all select ID, 'tot_cred', tot_cred::text from student
  union all select ID, 'stud_dept', dept_name from student
  union all select course_id, 'instance-of', 'course' from course
  union all select course_id, 'title', title from course
  union all select course_id, 'credits', credits::text from course
  union all select course_id, 'course_dept', dept_name from course
  union all select concat_ws('/', course_id, sec_id, semester, year), 'instance-of', 'section' from section
  union all select concat_ws('/', course_id, sec_id, semester, year), 'sec_course', course_id from section
  union all select concat_ws('/', course_id, sec_id, semester, year), 'semester', semester from section
  union all select concat_ws('/', course_id, sec_id, semester, year), 'year', year::text from section
  union all select ID, 'takes', concat_ws('/', course_id, sec_id, semester, year) from takes
  union all select ID, 'teaches', concat_ws('/', course_id, sec_id, semester, year) from teaches;

-- ---------------------------------------------------------------- Documents for TF-IDF (PE 8.7)
-- Đề (diễn đạt lại) của các Practice Exercise chương 8, mỗi bài một document.
create table cx_pe_doc (
  pe_id  varchar(5) primary key,
  body   text not null
);
insert into cx_pe_doc values
  ('8.1', 'Give the information about the student Shankar in the university database including his student tuple his takes tuples and the course tuples of those takes tuples using JSON XML RDF triples and an RDF graph'),
  ('8.2', 'Using the RDF representation of the university schema write SPARQL queries for course titles taken by Zhang courses taught by Srinivasan and all attributes of Srinivasan'),
  ('8.3', 'Write an SQL schema for the vehicles of a car rental company with trucks sports cars vans and off road vehicles using inheritance where appropriate'),
  ('8.4', 'Define in SQL the relation Emp with multiset attributes for children and skills using the table type syntax of SQL Server'),
  ('8.5', 'Give an SQL schema for the instructor entity set of the E-R diagram treating the phone number as an array of ten elements in Oracle or PostgreSQL'),
  ('8.6', 'For the relational schema give an SQL schema using references for foreign keys and write SQL queries for the company with the most employees the smallest payroll and a higher average salary than First Bank Corporation'),
  ('8.7', 'Compute the relevance of each practice exercise in this chapter to the query SQL relation using term frequency and inverse document frequency'),
  ('8.8', 'Represent the PageRank matrices as relations and write an SQL query for one iterative step of PageRank'),
  ('8.9', 'Using spatial functions write SQL queries on student locations of type point and classroom locations of type polygon');

-- ---------------------------------------------------------------- Web graph for PageRank (PE 8.8)
create table cx_link (
  src  char(1) not null,
  dst  char(1) not null,
  primary key (src, dst)
);
insert into cx_link values
  ('A', 'B'), ('A', 'C'),
  ('B', 'C'),
  ('C', 'A'),
  ('D', 'C'), ('D', 'A'), ('D', 'B');

-- ---------------------------------------------------------------- Spatial data (PE 8.9)
-- Toạ độ tính bằng mét trên một lưới khuôn viên trường (PostgreSQL geometric types thay cho PostGIS).
create table cx_room_area (
  building     varchar(15),
  room_number  varchar(7),
  area         polygon not null,
  primary key (building, room_number)
);
insert into cx_room_area values
  ('Packard', '101',  '((0,0),(30,0),(30,20),(0,20))'),
  ('Painter', '514',  '((60,0),(80,0),(80,15),(60,15))'),
  ('Watson',  '100',  '((100,30),(120,30),(120,45),(100,45))'),
  ('Watson',  '120',  '((0,130),(20,130),(20,150),(0,150))'),
  ('Taylor',  '3128', '((300,300),(330,300),(330,320),(300,320))');

create table cx_student_loc (
  ID        varchar(5) primary key references student,
  location  point not null
);
insert into cx_student_loc values
  ('00128', '(10,10)'),
  ('12345', '(25,5)'),
  ('19991', '(70,8)'),
  ('23121', '(150,40)'),
  ('44553', '(28,18)'),
  ('45678', '(310,310)'),
  ('54321', '(40,30)'),
  ('76543', '(12,140)');
