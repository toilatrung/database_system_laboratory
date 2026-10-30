-- Part 5 (Chương 12–14): dữ liệu cho bài tập lưu trữ vật lý, cấu trúc file và index.
-- Tiền tố st_ (Chương 12–13) và ix_ (Chương 14).

-- Thông số ổ đĩa (Chương 12). block_kb: kích thước block đọc/ghi.
create table st_disk (
  disk_id       varchar(5) primary key,
  model         varchar(30),
  kind          varchar(4) check (kind in ('HDD', 'SSD')),
  rpm           integer,          -- null với SSD
  avg_seek_ms   numeric(6,3),     -- SSD: độ trễ đọc ngẫu nhiên một trang
  transfer_mb_s numeric(8,1),
  capacity_gb   integer,
  mttf_hours    integer,
  price_usd     numeric(8,2)
);
insert into st_disk values
  ('D1', 'Barra 7200 4TB',   'HDD', 7200,  4.000,  200.0,  4000, 1000000,  90.00),
  ('D2', 'Barra 5400 8TB',   'HDD', 5400,  8.000,  160.0,  8000, 1200000, 140.00),
  ('D3', 'Cheetah 15K 900G', 'HDD', 15000, 3.000,  250.0,   900, 1500000, 210.00),
  ('D4', 'Flash SATA 1TB',   'SSD', null,  0.100,  550.0,  1000, 2000000, 100.00),
  ('D5', 'Flash NVMe 2TB',   'SSD', null,  0.020, 3000.0,  2000, 1800000, 180.00);

-- Các mảng RAID (Chương 12).
create table st_raid_array (
  array_id    varchar(5) primary key,
  raid_level  integer check (raid_level in (0, 1, 5, 6)),
  num_disks   integer,
  disk_id     varchar(5) references st_disk,
  mttr_hours  integer           -- thời gian thay và khôi phục một đĩa hỏng
);
insert into st_raid_array values
  ('A1', 0, 4, 'D1', 24),
  ('A2', 1, 2, 'D2', 10),
  ('A3', 5, 5, 'D1', 24),
  ('A4', 6, 8, 'D2', 48),
  ('A5', 1, 4, 'D4', 5),
  ('A6', 5, 9, 'D3', 12);

-- Thiết bị flash cho bảng ánh xạ (flash translation table, PE 12.3).
create table st_flash (
  device       varchar(10) primary key,
  capacity_gb  integer,
  page_bytes   integer,
  address_bits integer
);
insert into st_flash values
  ('F64',  64,   4096, 32),
  ('F512', 512,  4096, 32),
  ('F2T',  2048, 8192, 32),
  ('F4T',  4096, 16384, 64);

-- Bố trí block trên 4 đĩa của PE 12.4 (stripe = hàng). label: B<i> là dữ liệu, P<i> là parity.
create table st_raid_layout (
  disk_no integer,
  stripe  integer,
  label   varchar(5),
  primary key (disk_no, stripe)
);
insert into st_raid_layout values
  (1, 1, 'B1'), (2, 1, 'B2'), (3, 1, 'B3'), (4, 1, 'B4'),
  (1, 2, 'P1'), (2, 2, 'B5'), (3, 2, 'B6'), (4, 2, 'B7'),
  (1, 3, 'B8'), (2, 3, 'P2'), (3, 3, 'B9'), (4, 3, 'B10'),
  (1, 4, 'B11'), (2, 4, 'B12'), (3, 4, 'P3'), (4, 4, 'B13'),
  (1, 5, 'B14'), (2, 5, 'B15'), (3, 5, 'B16'), (4, 5, 'P4');

-- File bản ghi độ dài cố định với free list (Figure 13.4).
-- slot = -1 là header. Slot trống có id null và next_free trỏ tới slot trống kế tiếp (null = hết danh sách).
create table st_file (
  slot      integer primary key,
  id        varchar(5),
  name      varchar(20),
  dept_name varchar(20),
  salary    numeric(8,2),
  next_free integer
);
insert into st_file values
  (-1, null, null, null, null, 1),
  (0, '10101', 'Srinivasan', 'Comp. Sci.', 65000, null),
  (1, null, null, null, null, 4),
  (2, '15151', 'Mozart', 'Music', 40000, null),
  (3, '22222', 'Einstein', 'Physics', 95000, null),
  (4, null, null, null, null, 6),
  (5, '33456', 'Gold', 'Physics', 87000, null),
  (6, null, null, null, null, null),
  (7, '58583', 'Califieri', 'History', 62000, null),
  (8, '76543', 'Singh', 'Finance', 80000, null),
  (9, '76766', 'Crick', 'Biology', 72000, null),
  (10, '83821', 'Brandt', 'Comp. Sci.', 92000, null),
  (11, '98345', 'Kim', 'Elec. Eng.', 80000, null);

-- Mức sử dụng các block của một file (free-space map, PE 13.4). block_bytes = 8192.
create table st_block (
  block_no   integer primary key,
  used_bytes integer
);
insert into st_block values
  (0, 8100), (1, 2000), (2, 4500), (3, 7000), (4, 300),
  (5, 8192), (6, 5000), (7, 2457), (8, 7400), (9, 0);

-- Chuỗi truy cập block của buffer manager (Chương 13).
create table st_buffer_trace (
  seq      integer primary key,
  block_id varchar(5)
);
insert into st_buffer_trace values
  (1, 'A'), (2, 'B'), (3, 'C'), (4, 'A'), (5, 'D'), (6, 'B'), (7, 'A'),
  (8, 'E'), (9, 'C'), (10, 'A'), (11, 'B'), (12, 'D'), (13, 'A'), (14, 'E');

-- Kích thước (byte) mỗi cột của bảng sales rộng, cho bài lưu trữ theo cột (Chương 13).
create table st_column_spec (
  column_name varchar(20) primary key,
  bytes       integer
);
insert into st_column_spec values
  ('sale_id', 8), ('sale_date', 4), ('store_id', 4), ('item_id', 8), ('customer_id', 8),
  ('quantity', 4), ('unit_price', 8), ('discount', 4), ('channel', 16), ('note', 64);

-- File tuần tự đã sắp theo khoá, 3 bản ghi mỗi block (Chương 14: sparse index).
create table ix_seq_file (
  pos       integer primary key,   -- vị trí trong file, bắt đầu từ 0
  id        varchar(5),
  name      varchar(20)
);
insert into ix_seq_file values
  (0, '10101', 'Srinivasan'), (1, '12121', 'Wu'), (2, '15151', 'Mozart'),
  (3, '22222', 'Einstein'), (4, '32343', 'El Said'), (5, '33456', 'Gold'),
  (6, '45565', 'Katz'), (7, '58583', 'Califieri'), (8, '76543', 'Singh'),
  (9, '76766', 'Crick'), (10, '83821', 'Brandt'), (11, '98345', 'Kim');

-- Thông số các index cần ước lượng B+-tree (Chương 14).
create table ix_index_spec (
  index_name  varchar(20) primary key,
  num_keys    bigint,
  key_bytes   integer,
  ptr_bytes   integer,
  block_bytes integer
);
insert into ix_index_spec values
  ('student_id',  1000000,   8, 8, 4096),
  ('takes_pk',   20000000,  32, 8, 8192),
  ('email',       5000000,  40, 8, 4096),
  ('order_id', 1000000000,   8, 8, 16384);

-- Bảng có sẵn nhiều index để tìm index thừa (Chương 14).
create table ix_orders (
  order_id    integer primary key,
  customer_id integer,
  order_date  date,
  status      varchar(10),
  total       numeric(10,2)
);
insert into ix_orders
select g, 1 + g % 50, date '2024-01-01' + (g % 365), (array['new', 'paid', 'shipped', 'closed'])[1 + g % 4], (g * 37 % 1000) + 0.5
from generate_series(1, 400) as g;
create index ix_orders_cust on ix_orders (customer_id);
create index ix_orders_cust_date on ix_orders (customer_id, order_date);
create index ix_orders_status on ix_orders (status);
create index ix_orders_date on ix_orders (order_date);
create index ix_orders_date_status on ix_orders (order_date, status);
