-- =====================================================================
-- Bảng cho bài tập Chương 6 (E-R) — Part 2 (ch6) và Part 4 (ck1).
-- Mọi bảng đều có prefix er_. Chạy SAU university_data.sql.
--
--   Specialization, method 1 (slide 6.56):   er_person, er_employee, er_student
--   Aggregation (slide 6.61–6.64):           er_project, er_proj_guide, er_evaluation, er_eval_for
--   Sports statistics (Practice Ex. 6.3):    er_player, er_match, er_played
--   Temporal data (Practice Ex. 6.13):       er_t_student, er_t_student_name, er_t_instructor,
--                                            er_t_instructor_name, er_t_advisor
-- =====================================================================

drop table if exists er_employee, er_student, er_person cascade;
drop table if exists er_eval_for, er_evaluation, er_proj_guide, er_project cascade;
drop table if exists er_played, er_match, er_player cascade;
drop table if exists er_t_advisor, er_t_student_name, er_t_instructor_name, er_t_student, er_t_instructor cascade;

-- ---------------------------------------------------------------- Specialization (method 1)
-- person là entity cấp cao; employee và student là specialization
-- **overlapping** (một người có thể vừa là employee vừa là student).
create table er_person (
  ID      varchar(5) primary key,
  name    varchar(20) not null,
  street  varchar(30),
  city    varchar(20)
);
create table er_employee (
  ID      varchar(5) primary key references er_person on delete cascade,
  salary  numeric(8,2)
);
create table er_student (
  ID           varchar(5) primary key references er_person on delete cascade,
  tot_credits  numeric(3,0)
);
insert into er_person values
  ('P01', 'An',    '1 Le Loi',      'Hue'),
  ('P02', 'Binh',  '5 Tran Phu',    'Danang'),
  ('P03', 'Chi',   '9 Hai Ba Trung', 'Hanoi'),
  ('P04', 'Dung',  '2 Nguyen Hue',  'Saigon'),
  ('P05', 'Giang', '7 Ly Thuong Kiet', 'Hue'),
  ('P06', 'Hoa',   '3 Bach Dang',   'Danang');
insert into er_employee values
  ('P01', 52000), ('P02', 61000), ('P05', 45000);
insert into er_student values
  ('P02', 30), ('P03', 85), ('P04', 112), ('P05', 12);
-- P06 không thuộc specialization nào (partial specialization).

-- ---------------------------------------------------------------- Aggregation
create table er_project (
  project_id  varchar(5) primary key,
  title       varchar(40) not null
);
-- Quan hệ ba ngôi proj_guide(instructor, student, project).
create table er_proj_guide (
  i_ID        varchar(5) references instructor (ID),
  s_ID        varchar(5) references student (ID),
  project_id  varchar(5) references er_project,
  primary key (i_ID, s_ID, project_id)
);
create table er_evaluation (
  evaluation_id  varchar(5) primary key,
  grade          varchar(2),
  comments       varchar(60)
);
-- eval_for: quan hệ giữa aggregation proj_guide và entity evaluation.
create table er_eval_for (
  i_ID           varchar(5),
  s_ID           varchar(5),
  project_id     varchar(5),
  evaluation_id  varchar(5) references er_evaluation,
  primary key (i_ID, s_ID, project_id, evaluation_id),
  foreign key (i_ID, s_ID, project_id) references er_proj_guide
);
insert into er_project values
  ('PJ1', 'Robot Soccer'),
  ('PJ2', 'Genome Search'),
  ('PJ3', 'Music Recommender'),
  ('PJ4', 'Quantum Simulator');
insert into er_proj_guide values
  ('45565', '00128', 'PJ1'),
  ('10101', '12345', 'PJ1'),
  ('10101', '00128', 'PJ3'),
  ('76766', '98988', 'PJ2'),
  ('22222', '44553', 'PJ4'),
  ('15151', '55739', 'PJ3');
insert into er_evaluation values
  ('EV1', 'A',  'Excellent prototype'),
  ('EV2', 'B+', 'Good, needs tests'),
  ('EV3', 'A-', 'Strong analysis'),
  ('EV4', 'B',  'Mid-term check');
insert into er_eval_for values
  ('45565', '00128', 'PJ1', 'EV1'),
  ('10101', '12345', 'PJ1', 'EV2'),
  ('76766', '98988', 'PJ2', 'EV3'),
  ('76766', '98988', 'PJ2', 'EV4');
-- ('10101','00128','PJ3'), ('22222','44553','PJ4'), ('15151','55739','PJ3') chưa được đánh giá.

-- ---------------------------------------------------------------- Sports statistics (PE 6.3)
create table er_player (
  player_id  varchar(5) primary key,
  name       varchar(20) not null,
  age        integer
);
create table er_match (
  match_id    varchar(5) primary key,
  match_date  date,
  stadium     varchar(30),
  opponent    varchar(30),
  own_score   integer,
  opp_score   integer
);
-- played(player, match) với thuộc tính score: số điểm cầu thủ ghi trong trận.
create table er_played (
  match_id   varchar(5) references er_match,
  player_id  varchar(5) references er_player,
  score      integer not null default 0,
  primary key (match_id, player_id)
);
insert into er_player values
  ('PL1', 'Minh',  24), ('PL2', 'Quang', 27), ('PL3', 'Tuan', 21),
  ('PL4', 'Hai',   30), ('PL5', 'Long',  19);
insert into er_match values
  ('M1', '2025-09-06', 'My Dinh',   'Thailand',  3, 1),
  ('M2', '2025-09-13', 'Hang Day',  'Malaysia',  1, 1),
  ('M3', '2025-10-04', 'Thong Nhat', 'Indonesia', 2, 0),
  ('M4', '2025-10-11', 'My Dinh',   'Singapore', 0, 2);
insert into er_played values
  ('M1', 'PL1', 2), ('M1', 'PL2', 1), ('M1', 'PL3', 0),
  ('M2', 'PL1', 0), ('M2', 'PL2', 1), ('M2', 'PL4', 0),
  ('M3', 'PL1', 1), ('M3', 'PL3', 1), ('M3', 'PL4', 0),
  ('M4', 'PL2', 0), ('M4', 'PL3', 0), ('M4', 'PL4', 0);
-- PL5 chưa thi đấu trận nào.

-- ---------------------------------------------------------------- Temporal data (PE 6.13)
-- Mỗi thuộc tính thay đổi theo thời gian thành một relation (value, start_time,
-- end_time); end_time = 'infinity' nghĩa là vẫn còn hiệu lực.
create table er_t_student (
  student_id  varchar(5) primary key
);
create table er_t_student_name (
  student_id  varchar(5) references er_t_student,
  value       varchar(20),
  start_time  date,
  end_time    date,
  primary key (student_id, start_time, end_time)
);
create table er_t_instructor (
  instructor_id  varchar(5) primary key
);
create table er_t_instructor_name (
  instructor_id  varchar(5) references er_t_instructor,
  value          varchar(20),
  start_time     date,
  end_time       date,
  primary key (instructor_id, start_time, end_time)
);
create table er_t_advisor (
  student_id     varchar(5) references er_t_student,
  instructor_id  varchar(5) references er_t_instructor,
  start_time     date,
  end_time       date,
  primary key (student_id, instructor_id, start_time, end_time)
);
insert into er_t_student values ('12345'), ('00128'), ('76543');
insert into er_t_student_name values
  ('12345', 'Shankar', '2018-09-01', 'infinity'),
  ('00128', 'Zhang',   '2015-09-01', '2019-05-31'),
  ('76543', 'Brown',   '2017-09-01', '2020-12-31'),
  ('76543', 'Browne',  '2021-01-01', 'infinity');
insert into er_t_instructor values ('22222'), ('83821'), ('45565');
insert into er_t_instructor_name values
  ('22222', 'Einstein', '2010-01-01', 'infinity'),
  ('83821', 'Brandt',   '2012-01-01', 'infinity'),
  ('45565', 'Katz',     '2014-01-01', 'infinity');
insert into er_t_advisor values
  ('12345', '22222', '2018-05-01', '2018-12-31'),
  ('12345', '45565', '2019-01-01', '2019-05-31'),
  ('12345', '22222', '2019-06-01', '2020-01-31'),
  ('12345', '83821', '2020-02-01', 'infinity'),
  ('00128', '45565', '2015-09-01', '2019-05-31'),
  ('76543', '83821', '2017-09-01', '2019-08-31'),
  ('76543', '22222', '2019-09-01', 'infinity');
