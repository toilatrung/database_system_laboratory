-- =====================================================================
-- Airline database — dùng cho "Đề mẫu 3 · Hãng bay" của mục Ôn giữa kỳ.
-- Cùng các dạng truy vấn của đề mẫu University (GK7) trên lược đồ khác.
-- Một chuyến bay được xác định bởi (route_id, flight_date), giống section
-- được xác định bởi 4 cột; crew và booking phải khớp cả hai cột.
--
--   fl_airport(code, city, country)
--   fl_route(route_id, origin, dest, distance)      origin/dest tham chiếu fl_airport
--   fl_requires(route_id, required_id)               chặng nối: bay route_id phải có vé required_id
--   fl_flight(route_id, flight_date)
--   fl_pilot(pilot_id, name, base, salary)           base: sân bay gốc của phi công
--   fl_crew(pilot_id, route_id, flight_date)
--   fl_passenger(pax_id, name, country, tier)
--   fl_booking(pax_id, route_id, flight_date, seat_class)   F | J | W | Y; có NULL và mã lạ
-- =====================================================================

drop table if exists fl_booking, fl_passenger, fl_crew, fl_pilot, fl_flight, fl_requires, fl_route, fl_airport cascade;

create table fl_airport (
  code     char(3) primary key,
  city     varchar(20) not null,
  country  varchar(2) not null
);

create table fl_route (
  route_id  varchar(4) primary key,
  origin    char(3) references fl_airport,
  dest      char(3) references fl_airport,
  distance  integer
);

create table fl_requires (
  route_id     varchar(4) references fl_route,
  required_id  varchar(4) references fl_route,
  primary key (route_id, required_id)
);

create table fl_flight (
  route_id     varchar(4) references fl_route,
  flight_date  date,
  primary key (route_id, flight_date)
);

create table fl_pilot (
  pilot_id  varchar(4) primary key,
  name      varchar(20) not null,
  base      char(3) references fl_airport,
  salary    numeric(8,2)
);

create table fl_crew (
  pilot_id     varchar(4) references fl_pilot,
  route_id     varchar(4),
  flight_date  date,
  primary key (pilot_id, route_id, flight_date),
  foreign key (route_id, flight_date) references fl_flight
);

create table fl_passenger (
  pax_id   varchar(4) primary key,
  name     varchar(20) not null,
  country  varchar(2),
  tier     varchar(10)
);

create table fl_booking (
  pax_id       varchar(4) references fl_passenger,
  route_id     varchar(4),
  flight_date  date,
  seat_class   varchar(2),
  primary key (pax_id, route_id, flight_date),
  foreign key (route_id, flight_date) references fl_flight
);

insert into fl_airport values
  ('HAN', 'Hanoi',     'VN'),
  ('SGN', 'HCMC',      'VN'),
  ('DAD', 'Danang',    'VN'),
  ('PQC', 'Phu Quoc',  'VN'),
  ('BKK', 'Bangkok',   'TH'),
  ('SIN', 'Singapore', 'SG'),
  ('NRT', 'Tokyo',     'JP');   -- không có phi công đặt gốc

insert into fl_route values
  ('R01', 'HAN', 'SGN', 1160),
  ('R02', 'SGN', 'HAN', 1160),
  ('R03', 'HAN', 'DAD',  630),
  ('R04', 'SGN', 'DAD',  610),
  ('R05', 'HAN', 'BKK',  980),
  ('R06', 'SGN', 'SIN', 1100),
  ('R07', 'DAD', 'SIN', 1500),
  ('R08', 'SGN', 'PQC',  300),   -- chưa khai thác chuyến nào
  ('R09', 'PQC', 'HAN', 1200);   -- chưa khai thác chuyến nào

insert into fl_requires values
  ('R06', 'R01'),
  ('R07', 'R03');

insert into fl_flight values
  ('R01', '2024-12-20'), ('R01', '2025-01-10'), ('R01', '2025-03-05'),
  ('R02', '2025-01-12'), ('R02', '2025-03-08'),
  ('R03', '2025-02-01'), ('R03', '2025-03-15'),
  ('R04', '2025-02-02'),
  ('R05', '2025-01-20'), ('R05', '2025-02-20'),
  ('R06', '2025-03-10'),
  ('R07', '2025-03-18');

insert into fl_pilot values
  ('PL1', 'Hung',    'HAN', 5000),
  ('PL2', 'Lan',     'SGN', 5400),
  ('PL3', 'Minh',    'SGN', 4800),
  ('PL4', 'Tuan',    'DAD', 4500),
  ('PL5', 'Mai',     'HAN', 5200),
  ('PL6', 'Somchai', 'BKK', 4900),
  ('PL7', 'Wei',     'SIN', 6000);

insert into fl_crew values
  ('PL1', 'R01', '2025-01-10'), ('PL5', 'R01', '2025-01-10'),
  ('PL1', 'R01', '2025-03-05'),
  ('PL5', 'R01', '2024-12-20'),
  ('PL2', 'R02', '2025-01-12'),
  ('PL2', 'R02', '2025-03-08'), ('PL3', 'R02', '2025-03-08'),
  ('PL1', 'R03', '2025-02-01'),
  ('PL4', 'R03', '2025-03-15'),
  ('PL3', 'R04', '2025-02-02'),
  ('PL6', 'R05', '2025-01-20'),
  -- R05 ngày 2025-02-20 chưa phân công phi công
  ('PL2', 'R06', '2025-03-10'), ('PL7', 'R06', '2025-03-10');
  -- R07 ngày 2025-03-18 chưa phân công phi công

insert into fl_passenger values
  ('P01', 'An',    'VN', 'Gold'),
  ('P02', 'Bao',   'VN', 'Silver'),
  ('P03', 'Chau',  'VN', 'Basic'),
  ('P04', 'David', 'US', 'Gold'),
  ('P05', 'Emi',   'JP', 'Basic'),
  ('P06', 'Fah',   'TH', 'Silver'),
  ('P07', 'Gia',   'VN', 'Basic'),   -- chưa đặt vé
  ('P08', 'Hana',  'JP', 'Basic');   -- chưa đặt vé

insert into fl_booking values
  ('P01', 'R01', '2025-01-10', 'J'),
  ('P01', 'R03', '2025-02-01', 'Y'),
  ('P01', 'R07', '2025-03-18', 'J'),
  ('P01', 'R01', '2025-03-05', 'Y'),
  ('P01', 'R05', '2025-01-20', 'F'),
  ('P01', 'R04', '2025-02-02', 'Y'),
  ('P02', 'R02', '2025-01-12', 'Y'),
  ('P02', 'R06', '2025-03-10', 'Y'),
  ('P02', 'R02', '2025-03-08', 'Y'),
  ('P03', 'R03', '2025-03-15', 'Y'),
  ('P03', 'R04', '2025-02-02', 'W'),
  ('P04', 'R01', '2024-12-20', 'F'),
  ('P04', 'R06', '2025-03-10', 'J'),
  ('P04', 'R05', '2025-02-20', 'F'),
  ('P04', 'R01', '2025-01-10', 'F'),
  ('P04', 'R03', '2025-03-15', 'Y'),
  ('P05', 'R05', '2025-01-20', 'Y'),
  ('P05', 'R03', '2025-02-01', 'X'),    -- mã hạng ghế lạ
  ('P05', 'R07', '2025-03-18', null),
  ('P06', 'R05', '2025-02-20', 'Y'),
  ('P06', 'R02', '2025-01-12', 'J');
