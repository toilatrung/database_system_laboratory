-- =====================================================================
-- Shop database — dùng cho "Đề mẫu 2 · Cửa hàng" của mục Ôn giữa kỳ.
-- Cùng các dạng truy vấn của đề mẫu University (GK7) nhưng trên lược đồ khác.
-- Dữ liệu được thiết kế cho các bẫy: mua lại cùng sản phẩm, đơn huỷ,
-- dòng hàng chưa giao, hoà khi tìm lớn nhất, khách không mua gì, đánh giá NULL/lạ.
--
--   sh_region(city, region, ship_fee)
--   sh_customer(cust_id, name, city, tier)
--   sh_category(category, manager)
--   sh_product(product_id, name, category, price)
--   sh_requires(product_id, required_id)      sản phẩm phụ cần có sản phẩm chính
--   sh_supplier(supplier_id, name, country, specialty)
--   sh_supplies(supplier_id, product_id)
--   sh_orders(order_id, cust_id, order_date, status)
--   sh_order_item(order_id, line_no, product_id, qty, unit_price)
--   sh_shipment(order_id, line_no, carrier, ship_date)
--   sh_review(cust_id, product_id, rating)
-- =====================================================================

drop table if exists sh_review, sh_shipment, sh_order_item, sh_orders, sh_supplies, sh_supplier,
  sh_requires, sh_product, sh_category, sh_customer, sh_region cascade;

create table sh_region (
  city      varchar(20) primary key,
  region    varchar(10) not null,
  ship_fee  numeric(6,2)
);

create table sh_customer (
  cust_id  varchar(4) primary key,
  name     varchar(20) not null,
  city     varchar(20) references sh_region,
  tier     varchar(10)
);

create table sh_category (
  category  varchar(20) primary key,
  manager   varchar(20)
);

create table sh_product (
  product_id  varchar(4) primary key,
  name        varchar(30) not null,
  category    varchar(20) references sh_category,
  price       numeric(10,2)
);

-- Muốn dùng product_id thì phải có required_id (ví dụ ốp lưng cần đúng mẫu điện thoại).
create table sh_requires (
  product_id   varchar(4) references sh_product,
  required_id  varchar(4) references sh_product,
  primary key (product_id, required_id)
);

create table sh_supplier (
  supplier_id  varchar(4) primary key,
  name         varchar(20) not null,
  country      varchar(20),
  specialty    varchar(20) references sh_category
);

create table sh_supplies (
  supplier_id  varchar(4) references sh_supplier,
  product_id   varchar(4) references sh_product,
  primary key (supplier_id, product_id)
);

create table sh_orders (
  order_id    varchar(4) primary key,
  cust_id     varchar(4) references sh_customer,
  order_date  date not null,
  status      varchar(10) not null   -- delivered | pending | cancelled
);

-- Một đơn có nhiều dòng; cùng một sản phẩm có thể nằm ở hai dòng của một đơn.
create table sh_order_item (
  order_id    varchar(4) references sh_orders,
  line_no     integer,
  product_id  varchar(4) references sh_product,
  qty         integer not null,
  unit_price  numeric(10,2) not null,  -- giá bán thực tế, có thể thấp hơn giá niêm yết
  primary key (order_id, line_no)
);

-- Mỗi dòng hàng được giao riêng; khoá là cả hai cột (order_id, line_no).
create table sh_shipment (
  order_id   varchar(4),
  line_no    integer,
  carrier    varchar(10) not null,
  ship_date  date,
  primary key (order_id, line_no),
  foreign key (order_id, line_no) references sh_order_item
);

create table sh_review (
  cust_id     varchar(4) references sh_customer,
  product_id  varchar(4) references sh_product,
  rating      varchar(10),   -- Excellent | Good | Average | Poor | Terrible; có NULL và 'N/A'
  primary key (cust_id, product_id)
);

insert into sh_region values
  ('Hanoi',    'North',   20),
  ('Haiphong', 'North',   25),
  ('Danang',   'Central', 30),
  ('Hue',      'Central', 30),
  ('HCMC',     'South',   15),
  ('Cantho',   'South',   35);

insert into sh_customer values
  ('C01', 'An Nguyen',  'Hanoi',    'Gold'),
  ('C02', 'Binh Tran',  'HCMC',     'Silver'),
  ('C03', 'Chi Le',     'Danang',   'Regular'),
  ('C04', 'Dung Pham',  'Hanoi',    'Gold'),
  ('C05', 'Em Vo',      'HCMC',     'Regular'),
  ('C06', 'Giang Ho',   'Hue',      'Silver'),
  ('C07', 'Hoa Bui',    'Hanoi',    'Regular'),   -- chưa đặt đơn nào
  ('C08', 'Khanh Do',   'Cantho',   'Regular'),
  ('C09', 'Lan Ngo',    'HCMC',     'Gold'),
  ('C10', 'Minh Ly',    'Haiphong', 'Regular');   -- chưa đặt đơn nào

insert into sh_category values
  ('Phones',      'Quang'),
  ('Computers',   'Thao'),
  ('Audio',       'Vinh'),
  ('Accessories', 'Yen'),
  ('Home',        'Phuong');   -- chưa có sản phẩm nào

insert into sh_product values
  ('P01', 'Phone X',          'Phones',      800),
  ('P02', 'Phone Lite',       'Phones',      400),
  ('P03', 'Laptop Pro',       'Computers',  1500),
  ('P04', 'Laptop Air',       'Computers',  1000),
  ('P05', 'Earbuds',          'Audio',       100),
  ('P06', 'Headphones',       'Audio',       200),
  ('P07', 'Speaker',          'Audio',       150),
  ('P08', 'Phone X Case',     'Accessories',  20),
  ('P09', 'Laptop Air Sleeve','Accessories',  40),
  ('P10', 'Laptop Pro Dock',  'Accessories', 120),
  ('P11', 'Audio Adapter',    'Accessories',  60),
  ('P12', 'Tablet Mini',      'Computers',   600),   -- chưa ai mua
  ('P13', 'Smart Watch',      'Accessories', 250);   -- chưa ai mua

insert into sh_requires values
  ('P08', 'P01'),
  ('P09', 'P04'),
  ('P10', 'P03'),
  ('P11', 'P05'),
  ('P11', 'P06');

insert into sh_supplier values
  ('S01', 'TechSource', 'Vietnam', 'Phones'),
  ('S02', 'SoundWorld', 'Korea',   'Audio'),
  ('S03', 'CompuPlus',  'Taiwan',  'Computers'),
  ('S04', 'AllGoods',   'Vietnam', 'Accessories'),
  ('S05', 'MegaSupply', 'China',   'Phones');

insert into sh_supplies values
  ('S01', 'P01'), ('S01', 'P02'), ('S01', 'P08'),
  ('S02', 'P05'), ('S02', 'P06'), ('S02', 'P07'),
  ('S03', 'P03'), ('S03', 'P04'), ('S03', 'P09'), ('S03', 'P10'),
  ('S04', 'P08'), ('S04', 'P09'), ('S04', 'P10'), ('S04', 'P05'),
  ('S05', 'P01'), ('S05', 'P11'), ('S05', 'P12');

insert into sh_orders values
  ('O01', 'C01', '2024-12-15', 'delivered'),
  ('O02', 'C01', '2025-01-05', 'delivered'),
  ('O03', 'C02', '2025-01-12', 'delivered'),
  ('O04', 'C03', '2025-01-20', 'cancelled'),
  ('O05', 'C01', '2025-02-03', 'delivered'),
  ('O06', 'C04', '2025-02-14', 'delivered'),
  ('O07', 'C09', '2025-01-25', 'delivered'),
  ('O08', 'C09', '2025-02-26', 'delivered'),
  ('O09', 'C05', '2025-03-02', 'pending'),
  ('O10', 'C01', '2025-03-09', 'delivered'),
  ('O11', 'C02', '2025-03-15', 'delivered'),
  ('O12', 'C06', '2025-03-21', 'delivered'),
  ('O13', 'C09', '2025-03-28', 'delivered'),
  ('O14', 'C08', '2024-11-11', 'delivered'),
  ('O15', 'C04', '2025-03-30', 'pending');

insert into sh_order_item values
  ('O01', 1, 'P01', 1,  800), ('O01', 2, 'P08', 2,   20),
  ('O02', 1, 'P05', 1,  100), ('O02', 2, 'P06', 1,  180),
  ('O03', 1, 'P02', 1,  400), ('O03', 2, 'P08', 1,   20),
  ('O04', 1, 'P03', 1, 1500),
  ('O05', 1, 'P07', 1,  150), ('O05', 2, 'P05', 1,  100),
  ('O06', 1, 'P04', 1,  880), ('O06', 2, 'P09', 1,   40),
  ('O07', 1, 'P01', 1,  780), ('O07', 2, 'P05', 2,  100),
  ('O08', 1, 'P06', 1,  200), ('O08', 2, 'P06', 1,  200),
  ('O09', 1, 'P11', 1,   60), ('O09', 2, 'P05', 1,   95),
  ('O10', 1, 'P05', 1,  100), ('O10', 2, 'P11', 1,   60),
  ('O11', 1, 'P02', 1,  400), ('O11', 2, 'P05', 1,  100),
  ('O12', 1, 'P10', 1,  120), ('O12', 2, 'P07', 1,  150),
  ('O13', 1, 'P07', 1,  150), ('O13', 2, 'P08', 1,   20),
  ('O14', 1, 'P03', 1, 1500),
  ('O15', 1, 'P10', 1,  110);

insert into sh_shipment values
  ('O01', 1, 'GHN',     '2024-12-16'), ('O01', 2, 'VNPost',  '2024-12-17'),
  ('O02', 1, 'GHN',     '2025-01-06'), ('O02', 2, 'DHL',     '2025-01-07'),
  ('O03', 1, 'VNPost',  '2025-01-13'), ('O03', 2, 'VNPost',  '2025-01-13'),
  ('O05', 1, 'DHL',     '2025-02-04'),                                   -- dòng 2 chưa giao
  ('O06', 1, 'GHN',     '2025-02-15'), ('O06', 2, 'Ahamove', '2025-02-15'),
  ('O07', 1, 'DHL',     '2025-01-26'), ('O07', 2, 'GHN',     '2025-01-27'),
  ('O08', 1, 'VNPost',  '2025-02-27'), ('O08', 2, 'VNPost',  '2025-02-27'),
  ('O10', 1, 'Ahamove', '2025-03-10'), ('O10', 2, 'GHN',     '2025-03-10'),
  ('O11', 1, 'GHN',     '2025-03-16'), ('O11', 2, 'GHN',     '2025-03-16'),
  ('O12', 1, 'DHL',     '2025-03-22'), ('O12', 2, 'VNPost',  '2025-03-22'),
  ('O13', 1, 'VNPost',  '2025-03-29'),                                   -- dòng 2 chưa giao
  ('O14', 1, 'DHL',     '2024-11-12');

insert into sh_review values
  ('C01', 'P01', 'Excellent'),
  ('C01', 'P05', 'Good'),
  ('C01', 'P06', 'Excellent'),
  ('C01', 'P07', 'Average'),
  ('C02', 'P02', 'Poor'),
  ('C02', 'P08', 'Terrible'),
  ('C04', 'P04', 'Good'),
  ('C04', 'P10', null),
  ('C06', 'P10', 'N/A'),
  ('C09', 'P01', 'Good'),
  ('C09', 'P06', 'Excellent'),
  ('C09', 'P08', 'Average'),
  ('C05', 'P11', 'Poor'),
  ('C08', 'P03', 'Excellent');
