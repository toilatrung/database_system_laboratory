-- =====================================================================
-- Các lược đồ dùng trong Practice Exercises của sách (chương 2–4).
-- Sách không kèm dữ liệu cho các lược đồ này; dữ liệu dưới đây được
-- thiết kế để mỗi câu Practice Exercise cho ra kết quả có ý nghĩa
-- (có hoà, có null, có giá trị biên). Chạy SAU extra_tables.sql.
--
--   Employee database  (Figure 2.17, 3.19, 4.12): employee, works, company, manages
--   Bank database      (Figure 2.18, 3.18):       branch, customer, loan, borrower, account, depositor
--   Insurance database (Figure 3.17):             person, car, accident, owns, participated
--   marks(ID, score)   (Exercise 3.5)
--   emp_title, emp_salary (Exercise 4.10: a(name, address, title), b(name, address, salary))
-- =====================================================================

drop table if exists manages, works, company, employee cascade;
drop table if exists depositor, account, borrower, loan, customer, branch cascade;
drop table if exists participated, owns, accident, car, person cascade;
drop table if exists marks, emp_title, emp_salary cascade;

-- ---------------------------------------------------------------- Employee database
create table employee (
  ID           varchar(5) primary key,
  person_name  varchar(30) not null,
  street       varchar(30),
  city         varchar(30)
);

-- Exercise 3.9e giả sử một công ty có thể đặt ở nhiều thành phố,
-- nên khoá của company là (company_name, city).
create table company (
  company_name  varchar(30),
  city          varchar(30),
  primary key (company_name, city)
);

-- ID là khoá: mỗi người làm cho đúng một công ty.
create table works (
  ID            varchar(5) primary key references employee,
  company_name  varchar(30) not null,
  salary        numeric(10,2)
);

create table manages (
  ID          varchar(5) primary key references employee,
  manager_id  varchar(5) references employee (ID)
);

insert into employee values
  ('10001', 'Alice Nguyen', '12 Oak St',    'Miami'),
  ('10002', 'Bob Tran',     '45 Pine Ave',  'Miami'),
  ('10003', 'Carol Le',     '9 Elm Rd',     'Boston'),
  ('10004', 'David Pham',   '77 Main St',   'New York'),
  ('10005', 'Eva Vo',       '3 Lake Dr',    'Miami'),
  ('10006', 'Frank Do',     '21 Hill St',   'Chicago'),
  ('10007', 'Grace Ho',     '8 River Rd',   'Miami'),
  ('10008', 'Henry Bui',    '50 Bay St',    'New York'),
  ('10009', 'Ivy Dang',     '5 Park Ln',    'Chicago'),
  ('10010', 'Jack Ngo',     '14 Sea Ave',   'Miami'),
  ('10011', 'Kim Ly',       '30 Oak St',    'Boston'),
  ('10012', 'Leo Vu',       '2 Hill St',    'Chicago'),   -- không có trong works
  ('10013', 'Mia Ta',       '61 Main St',   'Boston'),
  ('12345', 'Zoe Mai',      '100 Main St',  'Boston');

insert into company values
  ('First Bank Corporation', 'New York'),
  ('First Bank Corporation', 'Boston'),
  ('Small Bank Corporation', 'Miami'),
  ('Small Bank Corporation', 'Boston'),
  ('BigBank',                'Chicago'),
  ('BigBank',                'Miami'),
  ('Mega Corp',              'Miami'),
  ('Mega Corp',              'Boston'),
  ('Mega Corp',              'Chicago'),
  ('Tiny Tech',              'Miami');

insert into works values
  ('10001', 'First Bank Corporation',  85000),
  ('10002', 'First Bank Corporation',   9500),
  ('10003', 'First Bank Corporation',  60000),
  ('10004', 'First Bank Corporation',  92000),
  ('10005', 'Small Bank Corporation',  45000),
  ('10006', 'Small Bank Corporation',  52000),
  ('10007', 'BigBank',                120000),
  ('10008', 'BigBank',                105000),
  ('10009', 'Mega Corp',               58000),
  ('10010', 'Mega Corp',               61000),
  ('10013', 'Mega Corp',               47000),
  ('12345', 'Mega Corp',               50000),
  ('10011', 'Tiny Tech',               40000);

insert into manages values
  ('10001', '10004'),
  ('10002', '10001'),
  ('10003', '10001'),
  ('10006', '10005'),
  ('10008', '10007'),
  ('10010', '10009'),
  ('10013', '10009'),
  ('12345', '10009');

-- ---------------------------------------------------------------- Bank database
create table branch (
  branch_name  varchar(20) primary key,
  branch_city  varchar(20),
  assets       numeric(14,2)
);

create table customer (
  ID               varchar(5) primary key,
  customer_name    varchar(20) not null,
  customer_street  varchar(30),
  customer_city    varchar(20)
);

create table loan (
  loan_number  varchar(10) primary key,
  branch_name  varchar(20) references branch,
  amount       numeric(12,2)
);

create table borrower (
  ID           varchar(5) references customer,
  loan_number  varchar(10) references loan,
  primary key (ID, loan_number)
);

create table account (
  account_number  varchar(10) primary key,
  branch_name     varchar(20) references branch,
  balance         numeric(12,2)
);

create table depositor (
  ID              varchar(5) references customer,
  account_number  varchar(10) references account,
  primary key (ID, account_number)
);

insert into branch values
  ('Downtown',     'Brooklyn',  9000000),
  ('Redwood',      'Palo Alto', 2100000),
  ('Perryridge',   'Horseneck', 1700000),
  ('Mianus',       'Horseneck',  400000),
  ('Round Hill',   'Horseneck', 8000000),
  ('Brighton',     'Brooklyn',  7100000),
  ('North Town',   'Rye',       3700000),
  ('Chicago Loop', 'Chicago',   5000000),
  ('Lakeview',     'Chicago',   2500000);

insert into customer values
  ('12345', 'Adams',    'Spring',    'Pittsfield'),
  ('19283', 'Brooks',   'Senator',   'Brooklyn'),
  ('23456', 'Curry',    'North',     'Rye'),
  ('34567', 'Glenn',    'Sand Hill', 'Woodside'),
  ('45678', 'Green',    'Walnut',    'Stamford'),
  ('56789', 'Hayes',    'Main',      'Harrison'),
  ('67890', 'Johnson',  'Alma',      'Palo Alto'),
  ('78901', 'Jones',    'Main',      'Harrison'),
  ('89012', 'Lindsay',  'Park',      'Pittsfield'),
  ('90123', 'Smith',    'North',     'Rye'),
  ('91234', 'Turner',   'Putnam',    'Stamford'),
  ('92345', 'Williams', 'Nassau',    'Princeton'),
  ('93456', 'Knight',   'Spring',    'Pittsfield');

insert into loan values
  ('L-11', 'Round Hill',    900),
  ('L-14', 'Downtown',     1500),
  ('L-15', 'Perryridge',   1500),
  ('L-16', 'Perryridge',   1300),
  ('L-17', 'Downtown',     1000),
  ('L-20', 'North Town',   7500),
  ('L-21', 'Chicago Loop',  570),
  ('L-23', 'Redwood',      2000),
  ('L-93', 'Mianus',        500);

insert into borrower values
  ('12345', 'L-16'),
  ('19283', 'L-14'),
  ('23456', 'L-93'),
  ('34567', 'L-20'),
  ('56789', 'L-15'),
  ('78901', 'L-17'),
  ('90123', 'L-11'),
  ('90123', 'L-23'),
  ('91234', 'L-21'),
  ('92345', 'L-17');

insert into account values
  ('A-101', 'Downtown',      500),
  ('A-102', 'Perryridge',    400),
  ('A-201', 'Brighton',      900),
  ('A-215', 'Mianus',        700),
  ('A-217', 'Brighton',      750),
  ('A-222', 'Redwood',       700),
  ('A-305', 'Round Hill',    350),
  ('A-333', 'Chicago Loop',  850),
  ('A-444', 'North Town',    625);

insert into depositor values
  ('12345', 'A-101'),
  ('45678', 'A-444'),
  ('56789', 'A-102'),
  ('67890', 'A-101'),
  ('67890', 'A-201'),
  ('78901', 'A-217'),
  ('89012', 'A-222'),
  ('90123', 'A-215'),
  ('91234', 'A-305'),
  ('93456', 'A-333');

-- ---------------------------------------------------------------- Insurance database
create table person (
  driver_id  varchar(5) primary key,
  name       varchar(30) not null,
  address    varchar(50)
);

create table car (
  license_plate  varchar(10) primary key,
  model          varchar(30),
  year           integer
);

create table accident (
  report_number  varchar(10) primary key,
  year           integer,
  location       varchar(50)
);

-- on delete cascade: xoá một chiếc xe thì xoá luôn các dòng owns/participated
-- của xe đó (sách để các dòng này lại; PostgreSQL sẽ báo lỗi foreign key nếu
-- không cascade).
create table owns (
  driver_id      varchar(5) references person,
  license_plate  varchar(10) references car on delete cascade,
  primary key (driver_id, license_plate)
);

create table participated (
  report_number  varchar(10) references accident,
  license_plate  varchar(10) references car on delete cascade,
  driver_id      varchar(5) references person,
  damage_amount  numeric(10,2),
  primary key (report_number, license_plate)
);

insert into person values
  ('12345', 'John Carter', '12 Maple St'),
  ('22222', 'Mary Lee',    '40 Cedar Ave'),
  ('33333', 'Anna Kim',    '7 Birch Rd'),
  ('44444', 'Brian Cho',   '19 Willow Ln'),
  ('55555', 'Chloe Park',  '3 Aspen Ct'),
  ('66666', 'Daniel Wu',   '88 Spruce Dr');

insert into car values
  ('AAA111', 'Toyota Camry',  2010),
  ('BBB222', 'Honda Civic',   2010),
  ('CCC333', 'Ford Focus',    2015),
  ('DDD444', 'Mazda 3',       2010),
  ('EEE555', 'Kia Rio',       2018),
  ('FFF666', 'Tesla Model 3', 2020),
  ('GGG777', 'Hyundai i30',   2012);

insert into accident values
  ('AR1001', 2017, 'Main St'),
  ('AR1002', 2017, 'Highway 1'),
  ('AR1003', 2018, 'Downtown'),
  ('AR1004', 2017, 'Airport Rd'),
  ('AR1005', 2016, 'Old Bridge');

insert into owns values
  ('12345', 'AAA111'),
  ('12345', 'BBB222'),
  ('12345', 'CCC333'),
  ('22222', 'DDD444'),
  ('33333', 'EEE555'),
  ('44444', 'EEE555'),   -- EEE555 có hai chủ
  ('44444', 'FFF666'),
  ('55555', 'GGG777');

insert into participated values
  ('AR1001', 'AAA111', '12345', 1200),
  ('AR1001', 'EEE555', '33333',  800),
  ('AR1002', 'DDD444', '55555', 2500),   -- người lái không phải chủ xe
  ('AR1004', 'AAA111', '12345',  600),   -- 12345 dính hai vụ năm 2017
  ('AR1003', 'FFF666', '44444', 3000),
  ('AR1005', 'GGG777', '55555',  400);

-- ---------------------------------------------------------------- Exercise 3.5
-- Điểm số của sinh viên (ID lấy từ bảng student); có các giá trị biên 40, 60, 80.
create table marks (
  ID     varchar(5) primary key,
  score  integer
);
insert into marks values
  ('00128', 92), ('12345', 78), ('19991', 39), ('23121', 60), ('44553', 55),
  ('45678', 40), ('54321', 85), ('55739', 59), ('70557', 80), ('76543', 20),
  ('76653', 61), ('98765', 79), ('98988', 100);

-- ---------------------------------------------------------------- Exercise 4.10
-- a(name, address, title) và b(name, address, salary); có null ở name/address.
create table emp_title (
  name     varchar(20),
  address  varchar(30),
  title    varchar(20)
);
create table emp_salary (
  name     varchar(20),
  address  varchar(30),
  salary   numeric(10,2)
);
insert into emp_title values
  ('An',   'Hanoi',   'Engineer'),
  ('Binh', 'Hue',     'Manager'),
  ('Chi',  'Danang',  'Analyst'),
  ('Dung', null,      'Intern'),
  (null,   'Saigon',  'Designer');
insert into emp_salary values
  ('An',   'Hanoi',   70000),
  ('Binh', 'Saigon',  90000),
  ('Em',   'Cantho',  50000),
  ('Dung', null,      20000),
  (null,   'Saigon',  65000);
