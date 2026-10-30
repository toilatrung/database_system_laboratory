-- =====================================================================
-- Bảng cho bài tập Chương 10 (Big Data) — Part 4 (ch10).
-- Mọi bảng đều có prefix bd_. Chạy SAU university_data.sql.
--
--   MapReduce / word count (slide 10.x, Practice Ex. 10.7):  bd_doc
--   Spark collect() (Practice Ex. 10.5):                      bd_log
--   Document store (Practice Ex. 10.2):                       bd_student_doc (jsonb)
--   Key-value store + range query (Practice Ex. 10.3):        bd_bill
--   MapReduce join (Practice Ex. 10.4):                       bd_r, bd_s
--   Streaming, tumbling window (Practice Ex. 10.8):           bd_order
--   Graph database (Practice Ex. 10.9):                       bd_node, bd_edge
-- =====================================================================

drop table if exists bd_doc, bd_log, bd_student_doc, bd_bill, bd_r, bd_s, bd_order, bd_edge, bd_node cascade;

-- ---------------------------------------------------------------- Documents (chữ thường, không dấu câu)
create table bd_doc (
  doc_id  integer primary key,
  body    text not null
);
insert into bd_doc values
  (1, 'big data needs parallel processing'),
  (2, 'map reduce is a model for parallel processing of big data'),
  (3, 'spark keeps data in memory'),
  (4, 'a key value store scales out'),
  (5, 'big data big systems');

-- ---------------------------------------------------------------- Log lines
create table bd_log (
  line_no  integer primary key,
  line     text not null
);
insert into bd_log values
  (1, 'GET /index.html 200'),
  (2, 'GET /course/CS-101 200'),
  (3, 'POST /login 302'),
  (4, 'GET /missing 404'),
  (5, 'GET /index.html 200');

-- ---------------------------------------------------------------- Document store: một document JSON cho mỗi sinh viên
-- { "ID", "name", "dept_name", "tot_cred", "takes": [ {course_id, sec_id, semester, year, grade}, ... ] }
create table bd_student_doc (
  id   varchar(5) primary key,
  doc  jsonb not null
);
insert into bd_student_doc
select s.ID,
       jsonb_build_object(
         'ID', s.ID, 'name', s.name, 'dept_name', s.dept_name, 'tot_cred', s.tot_cred,
         'takes', coalesce((select jsonb_agg(jsonb_build_object(
                                     'course_id', t.course_id, 'sec_id', t.sec_id,
                                     'semester', t.semester, 'year', t.year, 'grade', t.grade)
                                   order by t.year, t.semester, t.course_id, t.sec_id)
                            from takes t where t.ID = s.ID), '[]'::jsonb))
from student s;

-- ---------------------------------------------------------------- Utility bills (key-value store)
create table bd_bill (
  customer_id  varchar(5),
  bill_date    date,
  amount       numeric(8,2) not null,
  primary key (customer_id, bill_date)
);
insert into bd_bill values
  ('C1', '2018-01-31', 52.10), ('C1', '2018-02-28', 48.75), ('C1', '2018-03-31', 61.20),
  ('C1', '2018-04-30', 44.00), ('C2', '2018-01-31', 80.00), ('C2', '2018-02-28', 77.50),
  ('C2', '2018-03-31', 90.25), ('C10', '2018-02-28', 15.00), ('C10', '2018-03-31', 17.40);

-- ---------------------------------------------------------------- Join bằng MapReduce
create table bd_r (rid integer primary key, a integer, b varchar(5));
create table bd_s (sid integer primary key, a integer, c varchar(5));
insert into bd_r values (1, 10, 'r1'), (2, 20, 'r2'), (3, 20, 'r3'), (4, 30, 'r4');
insert into bd_s values (1, 20, 's1'), (2, 30, 's2'), (3, 30, 's3'), (4, 40, 's4');

-- ---------------------------------------------------------------- Stream of orders
create table bd_order (
  order_id  integer primary key,
  itemid    varchar(5) not null,
  datetime  timestamp not null,
  amount    integer not null
);
insert into bd_order values
  (1, 'I1', '2019-05-01 09:05:00', 3), (2, 'I2', '2019-05-01 09:20:00', 1),
  (3, 'I1', '2019-05-01 09:59:59', 2), (4, 'I1', '2019-05-01 10:00:00', 5),
  (5, 'I2', '2019-05-01 10:30:00', 4), (6, 'I1', '2019-05-01 10:45:00', 1),
  (7, 'I3', '2019-05-01 11:10:00', 7), (8, 'I2', '2019-05-01 11:15:00', 2),
  (9, 'I1', '2019-05-01 12:01:00', 6), (10, 'I3', '2019-05-01 12:30:00', 1);

-- ---------------------------------------------------------------- Graph: trang web và liên kết (cho PageRank, reachability)
create table bd_node (node varchar(3) primary key, label varchar(20));
create table bd_edge (
  src  varchar(3) references bd_node,
  dst  varchar(3) references bd_node,
  primary key (src, dst)
);
insert into bd_node values ('A', 'home'), ('B', 'courses'), ('C', 'cs101'), ('D', 'about'), ('E', 'orphan');
insert into bd_edge values ('A', 'B'), ('A', 'D'), ('B', 'C'), ('C', 'A'), ('D', 'A'), ('D', 'C');
