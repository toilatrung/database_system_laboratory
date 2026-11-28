-- =====================================================================
-- Library database — dùng cho "Đề mẫu 4 · Thư viện" của mục Ôn giữa kỳ.
-- Cùng các dạng truy vấn của đề mẫu University (GK7) trên lược đồ khác.
-- Một bản sách được xác định bởi (isbn, copy_no); lb_loan và lb_handles
-- phải khớp cả hai cột.
--
--   lb_branch(branch_name, district, budget)
--   lb_genre(genre, shelf)
--   lb_book(isbn, title, genre, pages)
--   lb_series(isbn, prev_isbn)            tập sau / tập trước
--   lb_copy(isbn, copy_no, branch_name)
--   lb_librarian(lib_id, name, branch_name, salary)
--   lb_handles(lib_id, isbn, copy_no)     thủ thư phụ trách một bản sách
--   lb_member(member_id, name, branch_name, type)
--   lb_loan(member_id, isbn, copy_no, loan_date, return_date, cond)
--           return_date NULL = chưa trả; cond lúc trả: New | Good | Worn | Damaged (có NULL và 'Lost')
-- =====================================================================

drop table if exists lb_loan, lb_member, lb_handles, lb_librarian, lb_copy, lb_series, lb_book, lb_genre, lb_branch cascade;

create table lb_branch (
  branch_name  varchar(10) primary key,
  district     varchar(20),
  budget       integer
);

create table lb_genre (
  genre  varchar(10) primary key,
  shelf  varchar(4)
);

create table lb_book (
  isbn   varchar(4) primary key,
  title  varchar(30) not null,
  genre  varchar(10) references lb_genre,
  pages  integer
);

create table lb_series (
  isbn       varchar(4) primary key references lb_book,
  prev_isbn  varchar(4) references lb_book
);

create table lb_copy (
  isbn         varchar(4) references lb_book,
  copy_no      integer,
  branch_name  varchar(10) references lb_branch,
  primary key (isbn, copy_no)
);

create table lb_librarian (
  lib_id       varchar(3) primary key,
  name         varchar(20) not null,
  branch_name  varchar(10) references lb_branch,
  salary       integer
);

create table lb_handles (
  lib_id   varchar(3) references lb_librarian,
  isbn     varchar(4),
  copy_no  integer,
  primary key (lib_id, isbn, copy_no),
  foreign key (isbn, copy_no) references lb_copy
);

create table lb_member (
  member_id    varchar(3) primary key,
  name         varchar(20) not null,
  branch_name  varchar(10) references lb_branch,   -- chi nhánh đăng ký
  type         varchar(10)
);

create table lb_loan (
  member_id    varchar(3) references lb_member,
  isbn         varchar(4),
  copy_no      integer,
  loan_date    date,
  return_date  date,
  cond         varchar(10),
  primary key (member_id, isbn, copy_no, loan_date),
  foreign key (isbn, copy_no) references lb_copy
);

insert into lb_branch values
  ('Central', 'Hoan Kiem', 500),
  ('East',    'Long Bien', 300),
  ('West',    'Cau Giay',  350);

insert into lb_genre values
  ('Fantasy', 'A1'),
  ('Science', 'B2'),
  ('History', 'C3'),
  ('Novel',   'E5'),
  ('Poetry',  'D4'),   -- chưa có sách
  ('Comics',  'F6');   -- chưa có sách

insert into lb_book values
  ('B01', 'Dragon Gate',     'Fantasy', 420),
  ('B02', 'Dragon Gate II',  'Fantasy', 450),
  ('B03', 'Dragon Gate III', 'Fantasy', 480),
  ('B04', 'Cosmos Basics',   'Science', 300),
  ('B05', 'Quantum Ideas',   'Science', 520),
  ('B06', 'Ancient Hanoi',   'History', 380),
  ('B07', 'Silk Roads',      'History', 610),
  ('B08', 'River Song',      'Novel',   250),
  ('B09', 'Night Train',     'Novel',   330),   -- chưa ai mượn
  ('B10', 'Stars Above',     'Science', 200);   -- chưa ai mượn

insert into lb_series values
  ('B02', 'B01'),
  ('B03', 'B02');

insert into lb_copy values
  ('B01', 1, 'Central'), ('B01', 2, 'East'),
  ('B02', 1, 'Central'),
  ('B03', 1, 'West'),
  ('B04', 1, 'Central'), ('B04', 2, 'West'),
  ('B05', 1, 'East'),
  ('B06', 1, 'Central'),
  ('B07', 1, 'West'),
  ('B08', 1, 'East'),    ('B08', 2, 'Central'),
  ('B09', 1, 'West'),
  ('B10', 1, 'Central');

insert into lb_librarian values
  ('L1', 'Thu',   'Central', 900),
  ('L2', 'Nam',   'East',    850),
  ('L3', 'Ha',    'West',    800),
  ('L4', 'Quang', 'Central', 750),
  ('L5', 'Vy',    'West',    950);

insert into lb_handles values
  ('L1', 'B01', 1), ('L1', 'B02', 1), ('L1', 'B06', 1),
  ('L2', 'B05', 1), ('L2', 'B08', 1), ('L2', 'B04', 2),
  ('L3', 'B03', 1), ('L3', 'B04', 2), ('L3', 'B07', 1),
  ('L4', 'B04', 1), ('L4', 'B08', 2), ('L4', 'B03', 1),
  ('L5', 'B05', 1), ('L5', 'B09', 1);
  -- B01 bản 2 và B10 bản 1 chưa có thủ thư phụ trách

insert into lb_member values
  ('M01', 'Anh',  'Central', 'Student'),
  ('M02', 'Bich', 'East',    'Staff'),
  ('M03', 'Cuong','West',    'Student'),
  ('M04', 'Dao',  'Central', 'Public'),
  ('M05', 'Hieu', 'East',    'Student'),
  ('M06', 'Kim',  'West',    'Public'),
  ('M07', 'Linh', 'Central', 'Student'),   -- chưa mượn
  ('M08', 'Phuc', 'East',    'Public');    -- chưa mượn

insert into lb_loan values
  ('M01', 'B01', 1, '2025-01-05', '2025-01-20', 'Good'),
  ('M01', 'B02', 1, '2025-02-01', '2025-02-15', 'Good'),
  ('M01', 'B03', 1, '2025-03-01', '2025-03-14', 'Good'),
  ('M01', 'B04', 1, '2025-01-10', '2025-01-25', 'New'),
  ('M01', 'B01', 1, '2025-03-10', '2025-03-20', 'Worn'),
  ('M01', 'B05', 1, '2025-03-22', null,         null),
  ('M02', 'B02', 1, '2025-01-15', '2025-02-01', 'Damaged'),
  ('M02', 'B05', 1, '2025-02-10', '2025-02-20', 'Good'),
  ('M02', 'B08', 1, '2025-03-05', '2025-03-19', 'Lost'),
  ('M03', 'B01', 2, '2025-02-05', '2025-02-25', 'Good'),
  ('M03', 'B02', 1, '2025-03-02', '2025-03-15', 'Good'),
  ('M03', 'B07', 1, '2025-01-20', '2025-02-10', 'New'),
  ('M03', 'B03', 1, '2025-03-20', null,         null),
  ('M04', 'B06', 1, '2024-12-01', '2024-12-20', 'Good'),
  ('M04', 'B06', 1, '2025-02-12', '2025-02-28', 'Good'),
  ('M04', 'B08', 2, '2025-03-12', null,         null),
  ('M05', 'B01', 2, '2025-02-26', null,         null),   -- chưa trả tập 1
  ('M05', 'B02', 1, '2025-03-25', null,         null),
  ('M05', 'B04', 2, '2025-01-08', '2025-01-30', 'Worn'),
  ('M06', 'B05', 1, '2025-03-03', '2025-03-18', 'New'),
  ('M06', 'B04', 2, '2025-03-03', '2025-03-18', 'Damaged');
