-- =====================================================================
-- Bảng cho bài tập Chương 9 (Application Development) — Part 3.
-- Mọi bảng đều có prefix app_. Mô phỏng CSDL phía sau một web app bán hàng.
--
--   Người dùng, mật khẩu băm + salt (PE 9.12):    app_user
--   Phiên đăng nhập, phân quyền trang (PE 9.4):   app_session, app_page_acl, app_request
--   Giỏ hàng gửi từ form (PE 9.3):                app_product, app_cart_submission
--   Phân trang (pagination):                      app_post
--   Đếm lượt xem (upsert):                        app_page_view
--   Giao dịch trong một request:                  app_wallet
--   Row-level security:                           app_note
--   Đo kết nối như netstat (PE 9.7):              app_netstat
--   Nhật ký truy vấn để chọn chỗ cache (PE 9.6):  app_query_log
--   Chuỗi chứng chỉ số (PE 9.11):                 app_cert
--   Thuộc tính được mã hoá/băm (PE 9.9):          app_card
-- =====================================================================

drop function if exists app_find_user_unsafe(text);
drop table if exists app_request, app_session, app_page_acl, app_cart_submission, app_product,
  app_post, app_page_view, app_wallet, app_note, app_netstat, app_query_log, app_cert, app_card, app_user cascade;

-- ---------------------------------------------------------------- Users (salted password hash)
-- pw_hash = hex(sha256(salt || password)). Mật khẩu gốc (chỉ để làm bài):
-- alice/secret1, bob/hunter2, carol/pa55word, dave/secret1, erin/letmein
create table app_user (
  user_id   integer primary key,
  username  varchar(20) unique not null,
  role      varchar(10) not null check (role in ('customer', 'staff', 'admin')),
  salt      varchar(16) not null,
  pw_hash   char(64) not null
);
insert into app_user (user_id, username, role, salt, pw_hash)
select user_id, username, role, salt, encode(sha256(convert_to(salt || pw, 'UTF8')), 'hex')
from (values
  (1, 'alice', 'customer', 'q8Zr1', 'secret1'),
  (2, 'bob',   'customer', 'Lm03x', 'hunter2'),
  (3, 'carol', 'staff',    'Tt9aa', 'pa55word'),
  (4, 'dave',  'customer', 'Pw7kQ', 'secret1'),
  (5, 'erin',  'admin',    'Zz1b2', 'letmein')
) as v(user_id, username, role, salt, pw);

-- ---------------------------------------------------------------- Sessions and page authorization
create table app_session (
  session_id  varchar(10) primary key,
  user_id     integer not null references app_user,
  expires_at  timestamp not null
);
insert into app_session values
  ('s-a1', 1, '2026-05-01 12:00'),
  ('s-b1', 2, '2026-05-01 12:00'),
  ('s-c1', 3, '2026-05-01 12:00'),
  ('s-d1', 4, '2026-04-30 09:00'),
  ('s-e1', 5, '2026-05-01 12:00');

-- Trang nào được role nào xem.
create table app_page_acl (
  page  varchar(20),
  role  varchar(10),
  primary key (page, role)
);
insert into app_page_acl values
  ('/shop', 'customer'), ('/shop', 'staff'), ('/shop', 'admin'),
  ('/orders', 'customer'), ('/orders', 'staff'), ('/orders', 'admin'),
  ('/reports', 'staff'), ('/reports', 'admin'),
  ('/admin', 'admin');

-- Các request mà servlet đã phục vụ (chỉ kiểm tra session còn hạn, không kiểm tra quyền).
create table app_request (
  request_id    integer primary key,
  session_id    varchar(10) not null references app_session,
  page          varchar(20) not null,
  requested_at  timestamp not null
);
insert into app_request values
  (1, 's-a1', '/shop',    '2026-05-01 10:00'),
  (2, 's-a1', '/reports', '2026-05-01 10:05'),
  (3, 's-b1', '/orders',  '2026-05-01 10:06'),
  (4, 's-c1', '/reports', '2026-05-01 10:10'),
  (5, 's-c1', '/admin',   '2026-05-01 10:12'),
  (6, 's-d1', '/shop',    '2026-05-01 10:15'),
  (7, 's-e1', '/admin',   '2026-05-01 10:20'),
  (8, 's-b1', '/admin',   '2026-05-01 10:21');

-- ---------------------------------------------------------------- Products and submitted cart form
create table app_product (
  product_id  integer primary key,
  name        varchar(20) not null,
  price       numeric(8,2) not null check (price > 0)
);
insert into app_product values
  (101, 'Keyboard', 45.00),
  (102, 'Mouse',    20.00),
  (103, 'Monitor', 180.00),
  (104, 'Cable',     5.50);

-- Giá trị mà trình duyệt gửi lên, gồm cả giá lấy từ hidden form field.
create table app_cart_submission (
  submission_id    integer,
  user_id          integer references app_user,
  product_id       integer references app_product,
  qty              integer not null check (qty > 0),
  submitted_price  numeric(8,2) not null,
  primary key (submission_id, product_id)
);
insert into app_cart_submission values
  (1, 1, 101, 1,  45.00),
  (1, 1, 104, 2,   5.50),
  (2, 2, 103, 1,   1.80),
  (2, 2, 102, 2,  20.00),
  (3, 4, 103, 2, 180.00),
  (3, 4, 101, 1,   4.50);

-- ---------------------------------------------------------------- Posts for pagination
create table app_post (
  post_id     integer primary key,
  title       varchar(30) not null,
  created_at  timestamp not null
);
insert into app_post
select i, 'Post ' || i, timestamp '2026-01-01 08:00' + (i * interval '7 hours')
from generate_series(1, 25) as i;

-- ---------------------------------------------------------------- Page view counters (upsert)
create table app_page_view (
  page   varchar(20) primary key,
  views  integer not null default 0
);
insert into app_page_view values ('/shop', 120), ('/orders', 45);

-- ---------------------------------------------------------------- Wallets (transaction per request)
create table app_wallet (
  user_id  integer primary key references app_user,
  balance  numeric(10,2) not null check (balance >= 0)
);
insert into app_wallet values (1, 100.00), (2, 30.00), (3, 0.00), (4, 250.00), (5, 10.00);

-- ---------------------------------------------------------------- Notes (row-level security)
create table app_note (
  note_id  integer primary key,
  owner    varchar(20) not null,
  body     varchar(40) not null
);
insert into app_note values
  (1, 'alice', 'Gift ideas'),
  (2, 'alice', 'Shipping address'),
  (3, 'bob',   'Return policy question'),
  (4, 'carol', 'Restock monitors');

-- ---------------------------------------------------------------- netstat samples (PE 9.7)
-- Số kết nối tới DB đang mở, đo sau mỗi lô 100 lần truy cập trang (pool tối đa giữ 5 kết nối rảnh).
create table app_netstat (
  page        varchar(20),
  sample_no   integer,
  open_conns  integer not null,
  primary key (page, sample_no)
);
insert into app_netstat values
  ('/shop', 1, 2), ('/shop', 2, 4), ('/shop', 3, 5), ('/shop', 4, 5), ('/shop', 5, 5), ('/shop', 6, 5),
  ('/reports', 1, 3), ('/reports', 2, 6), ('/reports', 3, 9), ('/reports', 4, 12), ('/reports', 5, 15), ('/reports', 6, 18),
  ('/orders', 1, 1), ('/orders', 2, 3), ('/orders', 3, 4), ('/orders', 4, 3), ('/orders', 5, 4), ('/orders', 6, 4);

-- ---------------------------------------------------------------- Query log (PE 9.6)
create table app_query_log (
  log_id      integer primary key,
  query_text  varchar(60) not null,
  ms          integer not null
);
insert into app_query_log values
  (1,  'select * from app_product', 12),
  (2,  'select * from app_product', 11),
  (3,  'select * from app_post order by created_at desc limit 10', 40),
  (4,  'select * from app_product', 13),
  (5,  'select sum(views) from app_page_view', 5),
  (6,  'select * from app_post order by created_at desc limit 10', 38),
  (7,  'select * from app_product', 12),
  (8,  'select * from app_post order by created_at desc limit 10', 42),
  (9,  'select balance from app_wallet where user_id = 1', 2),
  (10, 'select * from app_post order by created_at desc limit 10', 39);

-- ---------------------------------------------------------------- Certificate chain (PE 9.11)
-- issued_by: chứng chỉ của cơ quan đã ký chứng chỉ này (null = root CA, được trình duyệt tin sẵn).
create table app_cert (
  cert_id    varchar(6) primary key,
  subject    varchar(30) not null,
  issued_by  varchar(6) references app_cert
);
insert into app_cert values
  ('C0', 'RootCA',          null),
  ('C1', 'IntermediateCA',  'C0'),
  ('C2', 'X Corp',          'C1'),
  ('C3', 'X Corp Payroll',  'C2'),
  ('C4', 'X Corp Updater',  'C2'),
  ('C5', 'Y Inc',           'C1'),
  ('C6', 'Z Ltd',           'C0'),
  ('C7', 'Z Ltd Shop',      'C6');

-- ---------------------------------------------------------------- Encrypted / hashed attribute (PE 9.9)
-- det_hash: băm tất định (cùng số thẻ → cùng giá trị); salted_hash: băm kèm salt ngẫu nhiên theo từng dòng.
create table app_card (
  card_id      integer primary key,
  user_id      integer references app_user,
  last4        char(4) not null,
  det_hash     char(64) not null,
  salt         varchar(8) not null,
  salted_hash  char(64) not null
);
insert into app_card (card_id, user_id, last4, det_hash, salt, salted_hash)
select card_id, user_id, right(num, 4),
       encode(sha256(convert_to(num, 'UTF8')), 'hex'), salt,
       encode(sha256(convert_to(salt || num, 'UTF8')), 'hex')
from (values
  (1, 1, '4111111111111111', 'a1'),
  (2, 2, '5500000000000004', 'b2'),
  (3, 4, '4111111111111111', 'c3'),
  (4, 5, '340000000000009',  'd4')
) as v(card_id, user_id, num, salt);

-- ---------------------------------------------------------------- An injectable lookup (PE 9.8)
-- Cách viết SAI: ghép chuỗi đầu vào của người dùng thẳng vào câu SQL.
create or replace function app_find_user_unsafe(name text)
returns table (user_id integer, username varchar) language plpgsql as $$
begin
  return query execute
    'select user_id, username from app_user where username = ''' || name || '''';
end $$;
