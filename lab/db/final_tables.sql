-- =====================================================================
-- Bảng cho Part 4 (đề thi thử cuối kỳ). Mọi bảng bắt đầu bằng fr_.
-- Chạy SAU extra_tables.sql (cần hàm try_sql / sql_value).
--
--   fr_enrollment  : bảng "phẳng" chưa chuẩn hoá — dùng để kiểm tra phụ thuộc
--                    hàm bằng SQL và thử phân rã lossless / lossy.
--                    FD dự kiến: student_id → student_name
--                                course_id  → course_title, instructor
--                                instructor → office
--                                student_id, course_id → grade
--   fr_supply      : bảng có dữ liệu không nhất quán (update anomaly):
--                    supplier_id → supplier_city lẽ ra phải đúng nhưng bị vi phạm.
-- =====================================================================

drop table if exists fr_enrollment cascade;
drop table if exists fr_supply cascade;

create table fr_enrollment (
  student_id    varchar(5),
  student_name  varchar(20),
  course_id     varchar(8),
  course_title  varchar(30),
  instructor    varchar(20),
  office        varchar(10),
  grade         varchar(2),
  primary key (student_id, course_id)
);

insert into fr_enrollment values
  ('S1', 'An',   'DB101', 'Databases',               'Smith', 'R201', 'A'),
  ('S1', 'An',   'OS201', 'Operating Systems',       'Jones', 'R305', 'B'),
  ('S2', 'Binh', 'DB101', 'Databases',               'Smith', 'R201', 'B+'),
  ('S2', 'Binh', 'NW301', 'Networks',                'Smith', 'R201', 'A-'),
  ('S3', 'Chi',  'OS201', 'Operating Systems',       'Jones', 'R305', 'C'),
  ('S3', 'Chi',  'DB101', 'Databases',               'Smith', 'R201', 'A'),
  ('S4', 'Dung', 'NW301', 'Networks',                'Smith', 'R201', 'B'),
  ('S4', 'Dung', 'AI401', 'Artificial Intelligence', 'Lee',   'R110', 'A'),
  ('S5', 'Em',   'AI401', 'Artificial Intelligence', 'Lee',   'R110', 'B+'),
  ('S5', 'Em',   'OS201', 'Operating Systems',       'Jones', 'R305', 'A-');

create table fr_supply (
  supplier_id    varchar(5),
  supplier_city  varchar(20),
  part_id        varchar(5),
  qty            integer,
  primary key (supplier_id, part_id)
);

insert into fr_supply values
  ('S1', 'Hanoi',  'P1', 300),
  ('S1', 'Hanoi',  'P2', 200),
  ('S1', 'Hanoi',  'P3', 400),
  ('S2', 'Hue',    'P1', 100),
  ('S2', 'Danang', 'P2', 150),   -- cập nhật thành phố của S2 không đồng bộ
  ('S3', 'Saigon', 'P2', 500),
  ('S4', 'Cantho', 'P4', 250),
  ('S4', 'Cantho', 'P5', 120),
  ('S4', 'Vinh',   'P1',  80);   -- S4 cũng bị lệch
