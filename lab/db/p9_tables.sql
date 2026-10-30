-- =====================================================================
-- Bảng cho Part 9 — Chương 24 (Advanced Indexing), 25 (Advanced
-- Application Development), 26 (Blockchain Databases).
-- Prefix: ai_ (ch24), at_ (ch25), bc_ (ch26). Chạy SAU university_data.sql.
-- Mọi dữ liệu cố định (không random, không now()) để kết quả chấm ổn định.
-- =====================================================================

drop table if exists ai_word, ai_probe, ai_lsm_l0, ai_lsm_l1, ai_customer, ai_place, ai_region, ai_segment, ai_hash_key cascade;
drop table if exists at_workload, at_index, at_txn_type, at_lock_wait, at_txn, at_r, at_s, at_bench, at_ldap, at_expected, at_sale cascade;
drop table if exists bc_block, bc_block_tampered, bc_tx, bc_genesis, bc_transfer, bc_ledger, bc_fork cascade;

-- ================================================================ Chương 24
-- Bloom filter: tập khoá được đưa vào filter, và các khoá dùng để hỏi.
create table ai_word (word varchar(20) primary key);
insert into ai_word values
  ('alpha'), ('bravo'), ('charlie'), ('delta'), ('echo'), ('foxtrot'),
  ('golf'), ('hotel'), ('india'), ('juliet'), ('kilo'), ('lima');

create table ai_probe (word varchar(20) primary key);
insert into ai_probe values
  ('alpha'), ('delta'), ('kilo'), ('mike'), ('november'), ('oscar'),
  ('papa'), ('quebec'), ('romeo'), ('sierra'), ('tango'), ('uniform');

-- LSM tree hai mức: L0 (trong bộ nhớ, mới hơn) và L1 (trên đĩa, cũ hơn).
-- is_delete = true là tombstone (bản ghi xoá).
create table ai_lsm_l0 (k integer, val varchar(10), ts integer, is_delete boolean not null default false, primary key (k, ts));
create table ai_lsm_l1 (k integer, val varchar(10), ts integer, is_delete boolean not null default false, primary key (k, ts));
insert into ai_lsm_l1 values
  (1, 'a1', 1, false), (2, 'b1', 2, false), (3, 'c1', 3, false), (4, 'd1', 4, false),
  (5, 'e1', 5, false), (6, 'f1', 6, false), (2, 'b2', 7, false);
insert into ai_lsm_l0 values
  (2, 'b3', 10, false), (3, null, 11, true), (7, 'g1', 12, false),
  (5, 'e2', 13, false), (8, 'h1', 14, false), (8, null, 15, true), (1, 'a2', 16, false);

-- Bitmap index: mỗi khách hàng là một bản ghi theo thứ tự cust_id (vị trí bit).
create table ai_customer (
  cust_id      integer primary key,   -- 1..12, vị trí bit
  name         varchar(20),
  gender       char(1),               -- 'F' / 'M'
  income_level integer,               -- 1..5
  deleted      boolean not null default false
);
insert into ai_customer values
  (1, 'An', 'F', 2, false),   (2, 'Binh', 'M', 1, false),  (3, 'Chi', 'F', 3, false),
  (4, 'Dung', 'M', 2, false), (5, 'Em', 'F', 2, true),     (6, 'Giang', 'F', 5, false),
  (7, 'Hai', 'M', 3, false),  (8, 'Hoa', 'F', 2, false),   (9, 'Khoa', 'M', 4, false),
  (10, 'Lan', 'F', 1, false), (11, 'Minh', 'M', 2, false), (12, 'Nga', 'F', 3, true);

-- Dữ liệu không gian: điểm, vùng hình chữ nhật, đoạn thẳng.
create table ai_place (name varchar(20) primary key, loc point not null);
insert into ai_place values
  ('Library', point(2, 3)),  ('Cafe', point(5, 6)),     ('Gym', point(8, 1)),
  ('Bank', point(4, 4)),     ('Museum', point(9, 9)),   ('School', point(1, 8)),
  ('Park', point(6, 5)),     ('Station', point(3, 9)),  ('Clinic', point(7, 7)),
  ('Market', point(5, 2));

create table ai_region (name varchar(20) primary key, area box not null);
insert into ai_region values
  ('Downtown', box(point(3, 3), point(6, 6))),
  ('North',    box(point(0, 7), point(10, 10))),
  ('East',     box(point(7, 0), point(10, 4)));

create table ai_segment (seg_id integer primary key, seg lseg not null);
insert into ai_segment values
  (1, lseg(point(0, 0), point(10, 10))),   -- đường chéo dài: bounding box rất lớn
  (2, lseg(point(0, 5), point(2, 5))),     -- nằm ngang, ngắn
  (3, lseg(point(4, 1), point(4, 2))),     -- thẳng đứng, ngắn
  (4, lseg(point(8, 9), point(10, 3))),    -- chéo
  (5, lseg(point(0, 10), point(9, 1))),    -- chéo dài
  (6, lseg(point(6, 8), point(7, 9)));     -- chéo ngắn

-- Extendable hashing (Practice Exercise 24.6).
create table ai_hash_key (k integer primary key);
insert into ai_hash_key values (2), (3), (5), (7), (11), (17), (19), (23), (29), (31);

-- ================================================================ Chương 25
-- Workload của ứng dụng: mỗi dòng là một mẫu truy vấn được ghi lại.
create table at_workload (
  query_id       varchar(5) primary key,
  table_name     varchar(20),
  column_name    varchar(20),
  predicate_type varchar(5),   -- 'eq' hoặc 'range'
  calls_per_hour integer,
  rows_scanned   integer,      -- số dòng phải đọc mỗi lần chạy
  rows_returned  integer       -- số dòng trả về mỗi lần chạy
);
insert into at_workload values
  ('Q1', 'orders',    'customer_id', 'eq',    1200, 500000, 12),
  ('Q2', 'orders',    'order_date',  'range',  300, 500000, 9000),
  ('Q3', 'customer',  'email',       'eq',    2500, 80000, 1),
  ('Q4', 'customer',  'city',        'eq',      40, 80000, 30000),
  ('Q5', 'product',   'category',    'eq',     600, 2000, 150),
  ('Q6', 'orders',    'status',      'eq',      90, 500000, 240000),
  ('Q7', 'lineitem',  'order_id',    'eq',    3000, 2000000, 4),
  ('Q8', 'lineitem',  'ship_date',   'range',   20, 2000000, 600000),
  ('Q9', 'product',   'product_id',  'eq',    5000, 1, 1);

-- Index đang có.
create table at_index (table_name varchar(20), column_name varchar(20), primary key (table_name, column_name));
insert into at_index values ('product', 'product_id'), ('orders', 'order_date'), ('lineitem', 'order_id');

-- Practice Exercise 25.6.
create table at_txn_type (txn_type char(1) primary key, rate_per_sec numeric(8,2), mix_pct numeric(5,2));
insert into at_txn_type values ('A', 50, 25), ('B', 100, 25), ('C', 200, 50);

-- Thống kê chờ lock theo tài nguyên.
create table at_lock_wait (resource varchar(30) primary key, waits integer, total_wait_ms integer);
insert into at_lock_wait values
  ('seq_counter', 900, 54000), ('account:42', 300, 21000), ('orders:page 7', 120, 2400),
  ('customer:page 3', 80, 800), ('inventory:item 9', 400, 36000), ('audit_log', 50, 250);

-- Transaction nhận số thứ tự từ sequence; một số bị abort (Practice Exercise 25.2).
create table at_txn (txn_id varchar(5) primary key, seq_no integer unique, status varchar(6));
insert into at_txn values
  ('T1', 101, 'commit'), ('T2', 102, 'commit'), ('T3', 103, 'abort'), ('T4', 104, 'commit'),
  ('T5', 105, 'abort'),  ('T6', 106, 'abort'),  ('T7', 107, 'commit'), ('T8', 108, 'commit'),
  ('T9', 109, 'abort'),  ('T10', 110, 'commit');

-- Practice Exercise 25.7: r(A, B), s(B, C).
create table at_r (a varchar(5), b integer);
create table at_s (b integer, c varchar(5));
insert into at_r values ('a1', 1), ('a2', 2), ('a3', 3), ('a4', 4);
insert into at_s values (1, 'c1'), (2, 'c2'), (2, 'c3'), (5, 'c5');

-- Kết quả benchmark kiểu TPC.
create table at_bench (system varchar(10) primary key, txns_completed integer, seconds integer, total_cost_usd numeric(12,2));
insert into at_bench values
  ('Sys-A', 1800000, 600, 450000), ('Sys-B', 2700000, 900, 540000),
  ('Sys-C', 960000, 400, 168000),  ('Sys-D', 4200000, 1200, 1470000);

-- Thư mục LDAP: cây theo vùng địa lý; person_id trỏ tới dữ liệu gốc
-- (một nhánh khác theo phòng ban dùng referral thay vì chép dữ liệu — PE 25.9).
create table at_ldap (
  node_id   varchar(10) primary key,
  parent_id varchar(10) references at_ldap,
  rdn       varchar(30),        -- relative distinguished name, ví dụ 'ou=Sales'
  person_id varchar(5)          -- chỉ có ở node lá (một người)
);
insert into at_ldap values
  ('n0', null, 'o=Acme', null),
  ('g1', 'n0', 'ou=Hanoi', null),       ('g2', 'n0', 'ou=Saigon', null),
  ('g11', 'g1', 'ou=Sales', null),      ('g12', 'g1', 'ou=IT', null),
  ('g21', 'g2', 'ou=Sales', null),
  ('p1', 'g11', 'cn=Lan', 'E01'),       ('p2', 'g11', 'cn=Minh', 'E02'),
  ('p3', 'g12', 'cn=Hoa', 'E03'),       ('p4', 'g21', 'cn=Khoa', 'E04');

-- Kết quả mong đợi của một test hồi quy: số instructor mỗi khoa.
create table at_expected (dept_name varchar(20) primary key, num_instructors integer);
insert into at_expected values
  ('Biology', 1), ('Comp. Sci.', 3), ('Elec. Eng.', 1), ('Finance', 2),
  ('History', 2), ('Music', 1), ('Physics', 3);

-- Bảng dùng cho bài chọn index (Practice Exercise 25.3).
create table at_sale (sale_id integer primary key, a integer, b integer, c varchar(10));
insert into at_sale select g, g % 97, (g * 37) % 1000, 'x' || g from generate_series(1, 2000) as g;

-- ================================================================ Chương 26
-- Chuỗi khối: hash = sha256(height || '|' || prev_hash || '|' || data || '|' || nonce), dạng hex.
-- Khối 0 (genesis) có prev_hash là 64 chữ số 0.
create table bc_block (
  height    integer primary key,
  prev_hash char(64) not null,
  data      varchar(100) not null,
  nonce     integer not null,
  hash      char(64) not null
);
insert into bc_block
select 0, repeat('0', 64), 'genesis', 0,
       encode(sha256(convert_to(0 || '|' || repeat('0', 64) || '|' || 'genesis' || '|' || 0, 'UTF8')), 'hex');
insert into bc_block
select 1, b.hash, 'Alice pays Bob 10', 7,
       encode(sha256(convert_to(1 || '|' || b.hash || '|' || 'Alice pays Bob 10' || '|' || 7, 'UTF8')), 'hex')
from bc_block b where b.height = 0;
insert into bc_block
select 2, b.hash, 'Bob pays Carol 4', 3,
       encode(sha256(convert_to(2 || '|' || b.hash || '|' || 'Bob pays Carol 4' || '|' || 3, 'UTF8')), 'hex')
from bc_block b where b.height = 1;
insert into bc_block
select 3, b.hash, 'Carol pays Dave 2', 11,
       encode(sha256(convert_to(3 || '|' || b.hash || '|' || 'Carol pays Dave 2' || '|' || 11, 'UTF8')), 'hex')
from bc_block b where b.height = 2;
insert into bc_block
select 4, b.hash, 'Dave pays Alice 1', 5,
       encode(sha256(convert_to(4 || '|' || b.hash || '|' || 'Dave pays Alice 1' || '|' || 5, 'UTF8')), 'hex')
from bc_block b where b.height = 3;
insert into bc_block
select 5, b.hash, 'Alice pays Carol 3', 2,
       encode(sha256(convert_to(5 || '|' || b.hash || '|' || 'Alice pays Carol 3' || '|' || 2, 'UTF8')), 'hex')
from bc_block b where b.height = 4;

-- Bản sao bị sửa: ai đó đổi dữ liệu khối 2 (4 → 40) và tính lại hash của khối 2,
-- nhưng không "đào" lại các khối sau.
create table bc_block_tampered as select * from bc_block;
alter table bc_block_tampered add primary key (height);
update bc_block_tampered
set data = 'Bob pays Carol 40',
    hash = encode(sha256(convert_to(2 || '|' || prev_hash || '|' || 'Bob pays Carol 40' || '|' || nonce, 'UTF8')), 'hex')
where height = 2;

-- Giao dịch trong mỗi khối (dùng cho Merkle tree).
create table bc_tx (block_height integer, tx_no integer, payload varchar(50), primary key (block_height, tx_no));
insert into bc_tx values
  (1, 1, 'Alice->Bob:10'), (1, 2, 'Eve->Frank:5'), (1, 3, 'Gina->Hal:7'), (1, 4, 'Ivan->Judy:1'),
  (2, 1, 'Bob->Carol:4'),  (2, 2, 'Ken->Liam:9'),  (2, 3, 'Mia->Ned:2');

-- Sổ cái chuyển tiền: số dư ban đầu và các lệnh chuyển theo thứ tự tx_id.
create table bc_genesis (acct varchar(10) primary key, amount integer not null);
insert into bc_genesis values ('Alice', 50), ('Bob', 20), ('Carol', 10), ('Dave', 0);

create table bc_transfer (tx_id integer primary key, from_acct varchar(10), to_acct varchar(10), amount integer);
insert into bc_transfer values
  (1, 'Alice', 'Bob', 30), (2, 'Bob', 'Carol', 45), (3, 'Carol', 'Dave', 15),
  (4, 'Bob', 'Dave', 10),  (5, 'Dave', 'Alice', 30), (6, 'Alice', 'Carol', 40),
  (7, 'Carol', 'Bob', 25);

-- Sổ cái chỉ được thêm (append-only) — bài tập 26 sẽ tạo trigger bảo vệ.
create table bc_ledger (entry_id integer primary key, note varchar(50));
insert into bc_ledger values (1, 'open'), (2, 'deposit 100'), (3, 'withdraw 20');

-- Fork: các khối mà mỗi node đã thấy (hash viết tắt). Khối cha có > 1 con là điểm fork.
create table bc_fork (block_id varchar(5) primary key, parent_id varchar(5) references bc_fork);
insert into bc_fork values
  ('G', null), ('B1', 'G'), ('B2', 'B1'), ('B3a', 'B2'), ('B3b', 'B2'),
  ('B4a', 'B3a'), ('B4b', 'B3b'), ('B5b', 'B4b'), ('B2x', 'B1');
