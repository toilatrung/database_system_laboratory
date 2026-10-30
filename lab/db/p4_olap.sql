-- =====================================================================
-- Bảng cho bài tập Chương 11 (Data Analytics) — Part 4 (ch11).
-- Mọi bảng đều có prefix olap_. Chạy SAU university_data.sql.
--
--   Star schema của Figure 11.2 (Practice Ex. 11.4):
--     fact olap_sales; dimension olap_item_info, olap_store, olap_customer, olap_date_info
--   Association rules (slide Data Mining):    olap_basket
--   Classification (Practice Ex. 11.5):       olap_applicant
--   Đánh giá classifier (Practice Ex. 11.6):  olap_test (2000 ca: 100 có bệnh, 1900 không)
-- =====================================================================

drop table if exists olap_sales, olap_item_info, olap_store, olap_customer, olap_date_info,
                     olap_basket, olap_applicant, olap_test cascade;

-- ---------------------------------------------------------------- Dimension tables
create table olap_item_info (
  item_id   varchar(5) primary key,
  itemname  varchar(20),
  color     varchar(10),
  size      varchar(10),
  category  varchar(15)
);
insert into olap_item_info values
  ('I1', 'skirt',  'dark',   'small',  'womenswear'),
  ('I2', 'dress',  'pastel', 'medium', 'womenswear'),
  ('I3', 'shirt',  'white',  'medium', 'menswear'),
  ('I4', 'pants',  'dark',   'large',  'menswear');

create table olap_store (
  store_id  varchar(5) primary key,
  city      varchar(15),
  state     varchar(15),
  country   varchar(15)
);
insert into olap_store values
  ('S1', 'Boston',    'MA', 'USA'),
  ('S2', 'Cambridge', 'MA', 'USA'),
  ('S3', 'Austin',    'TX', 'USA'),
  ('S4', 'Toronto',   'ON', 'Canada');

create table olap_customer (
  customer_id  varchar(5) primary key,
  name         varchar(20),
  street       varchar(30),
  city         varchar(15),
  state        varchar(15),
  zipcode      varchar(10),
  country      varchar(15)
);
insert into olap_customer values
  ('U1', 'Ana',   '1 Main St',   'Boston',  'MA', '02101', 'USA'),
  ('U2', 'Binh',  '5 Elm St',    'Austin',  'TX', '73301', 'USA'),
  ('U3', 'Chloe', '9 King St',   'Toronto', 'ON', 'M5H',   'Canada');

create table olap_date_info (
  date     date primary key,
  month    integer,
  quarter  integer,
  year     integer
);
insert into olap_date_info values
  ('2018-01-15', 1, 1, 2018), ('2018-02-10', 2, 1, 2018), ('2018-04-05', 4, 2, 2018),
  ('2018-11-20', 11, 4, 2018), ('2019-01-08', 1, 1, 2019), ('2019-03-03', 3, 1, 2019);

-- ---------------------------------------------------------------- Fact table
create table olap_sales (
  sale_id      integer primary key,
  item_id      varchar(5) references olap_item_info,
  store_id     varchar(5) references olap_store,
  customer_id  varchar(5) references olap_customer,
  date         date references olap_date_info,
  number       integer not null,
  price        numeric(8,2) not null      -- tổng tiền của dòng bán
);
insert into olap_sales values
  ( 1, 'I1', 'S1', 'U1', '2018-01-15', 2,  60.00),
  ( 2, 'I2', 'S1', 'U1', '2018-01-15', 1,  80.00),
  ( 3, 'I3', 'S2', 'U1', '2018-02-10', 3,  75.00),
  ( 4, 'I4', 'S3', 'U2', '2018-02-10', 1,  40.00),
  ( 5, 'I1', 'S3', 'U2', '2018-04-05', 4, 120.00),
  ( 6, 'I3', 'S4', 'U3', '2018-04-05', 2,  50.00),
  ( 7, 'I2', 'S4', 'U3', '2018-11-20', 2, 160.00),
  ( 8, 'I4', 'S1', 'U1', '2018-11-20', 5, 200.00),
  ( 9, 'I1', 'S2', 'U2', '2019-01-08', 1,  30.00),
  (10, 'I3', 'S3', 'U2', '2019-01-08', 6, 150.00),
  (11, 'I2', 'S1', 'U3', '2019-03-03', 3, 240.00),
  (12, 'I4', 'S4', 'U3', '2019-03-03', 2,  80.00);

-- ---------------------------------------------------------------- Market baskets
create table olap_basket (
  trans_id  integer,
  item      varchar(10),
  primary key (trans_id, item)
);
insert into olap_basket values
  (1, 'bread'), (1, 'milk'),
  (2, 'bread'), (2, 'diaper'), (2, 'beer'), (2, 'eggs'),
  (3, 'milk'), (3, 'diaper'), (3, 'beer'), (3, 'cola'),
  (4, 'bread'), (4, 'milk'), (4, 'diaper'), (4, 'beer'),
  (5, 'bread'), (5, 'milk'), (5, 'diaper'), (5, 'cola');

-- ---------------------------------------------------------------- Credit applicants (classification)
create table olap_applicant (
  id         integer primary key,
  salary     integer not null,
  education  varchar(12) not null,   -- 'graduate' | 'high-school'
  credit     varchar(12) not null    -- nhãn thật: excellent | good | satisfactory | poor
);
insert into olap_applicant values
  ( 1, 35000, 'graduate',    'good'),
  ( 2, 42000, 'graduate',    'good'),
  ( 3, 48000, 'graduate',    'good'),
  ( 4, 31000, 'graduate',    'good'),
  ( 5, 45000, 'graduate',    'satisfactory'),
  ( 6, 33000, 'high-school', 'satisfactory'),
  ( 7, 39000, 'high-school', 'satisfactory'),
  ( 8, 47000, 'high-school', 'satisfactory'),
  ( 9, 36000, 'high-school', 'satisfactory'),
  (10, 41000, 'high-school', 'poor'),
  (11, 60000, 'graduate',    'excellent'),
  (12, 75000, 'high-school', 'excellent'),
  (13, 52000, 'graduate',    'excellent'),
  (14, 90000, 'graduate',    'excellent'),
  (15, 58000, 'high-school', 'good'),
  (16, 20000, 'high-school', 'poor'),
  (17, 25000, 'graduate',    'satisfactory');

-- ---------------------------------------------------------------- Test set cho Practice Ex. 11.6
-- 2000 người: 100 có bệnh (5%), 1900 không (95%).
-- c1: luôn đoán âm tính. c2: dương tính với 80% người có bệnh, 5% người không bệnh.
-- c3: dương tính với 95% người có bệnh, 20% người không bệnh.
create table olap_test (
  case_id  integer primary key,
  actual   boolean not null,
  c1       boolean not null,
  c2       boolean not null,
  c3       boolean not null
);
insert into olap_test
select i,
       i <= 100,
       false,
       case when i <= 100 then i <= 80 else i - 100 <= 95 end,
       case when i <= 100 then i <= 95 else i - 100 <= 380 end
from generate_series(1, 2000) as g(i);
