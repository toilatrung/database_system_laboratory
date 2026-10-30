-- =====================================================================
-- Bảng cho Part 8 (Chương 20–23: kiến trúc, lưu trữ / xử lý truy vấn /
-- giao dịch song song và phân tán). Mọi bảng đều có prefix pd_.
-- "Node" và "site" chỉ là một cột dữ liệu: các bài mô phỏng việc chia
-- dữ liệu, chuyển tuple và log của nhiều máy bằng SQL trên một database.
--
--   Ch20  pd_run, pd_amdahl, pd_job_task, pd_system, pd_proc, pd_mem_access
--   Ch21  pd_order, pd_hist, pd_replica, pd_master_epoch, pd_route
--   Ch22  pd_emp, pd_dept, pd_band_r, pd_band_s, pd_bloom_r, pd_bloom_s,
--         pd_lo_r, pd_lo_s, pd_sab, pd_doc
--   Ch23  pd_2pc_part, pd_2pc_log, pd_quorum, pd_copy, pd_read_req, pd_wfg,
--         pd_event, pd_msg_in, pd_chain, pd_lease, pd_serve,
--         pd_primary_hist, pd_replica_apply, pd_replica_read, pd_sched
-- =====================================================================

drop table if exists pd_run, pd_amdahl, pd_job_task, pd_system, pd_proc, pd_mem_access cascade;
drop table if exists pd_order, pd_hist, pd_replica, pd_master_epoch, pd_route cascade;
drop table if exists pd_emp, pd_dept, pd_band_r, pd_band_s, pd_bloom_r, pd_bloom_s, pd_lo_r, pd_lo_s, pd_sab, pd_doc cascade;
drop table if exists pd_2pc_part, pd_2pc_log, pd_quorum, pd_copy, pd_read_req, pd_wfg, pd_event, pd_msg_in,
  pd_chain, pd_lease, pd_serve, pd_primary_hist, pd_replica_apply, pd_replica_read, pd_sched cascade;

-- ================================================================ Chương 20
-- Thời gian chạy (giây) của 3 workload trên 1..16 node.
--   Q1: speedup — dữ liệu cố định 100 GB.
--   Q2: scaleup — dữ liệu tăng theo số node (10 GB mỗi node).
--   Q3: join 64 GB, mỗi node có 16 GB RAM (superlinear speedup, PE 20.9).
create table pd_run (
  workload  varchar(5),
  nodes     integer,
  data_gb   integer,
  seconds   numeric(8,2),
  primary key (workload, nodes)
);
insert into pd_run values
  ('Q1', 1, 100, 400), ('Q1', 2, 100, 210), ('Q1', 4, 100, 110), ('Q1', 8, 100, 60), ('Q1', 16, 100, 40),
  ('Q2', 1, 10, 100), ('Q2', 2, 20, 105), ('Q2', 4, 40, 115), ('Q2', 8, 80, 125), ('Q2', 16, 160, 160),
  ('Q3', 1, 64, 600), ('Q3', 2, 64, 300), ('Q3', 4, 64, 120), ('Q3', 8, 64, 80);

-- Amdahl: p = phần có thể song song hoá, n = số bộ xử lý.
create table pd_amdahl (
  task  varchar(10) primary key,
  p     numeric(4,3) not null,
  n     integer not null
);
insert into pd_amdahl values
  ('A', 0.8, 4), ('B', 0.8, 16), ('C', 0.95, 16), ('D', 0.5, 100), ('PE20.5', 0.8, 1000000);

-- Thời gian từng node xử lý phần việc của một job song song.
create table pd_job_task (
  job      varchar(5),
  node     integer,
  seconds  numeric(6,2),
  primary key (job, node)
);
insert into pd_job_task values
  ('J1', 1, 10), ('J1', 2, 11), ('J1', 3, 9), ('J1', 4, 10),
  ('J2', 1, 5), ('J2', 2, 5), ('J2', 3, 5), ('J2', 4, 25),
  ('J3', 1, 8), ('J3', 2, 8), ('J3', 3, 8), ('J3', 4, 8);

-- Các hệ thống: bộ nhớ chung? đĩa chung?
create table pd_system (
  name           varchar(30) primary key,
  shared_memory  boolean not null,
  shared_disk    boolean not null
);
insert into pd_system values
  ('Multicore server', true, true),
  ('Oracle RAC cluster', false, true),
  ('Teradata', false, false),
  ('Hadoop cluster', false, false),
  ('SAN cluster', false, true);

-- NUMA: mỗi bộ xử lý thuộc một node bộ nhớ; độ trễ truy cập (ns) theo node bộ nhớ.
create table pd_proc (
  proc       varchar(5) primary key,
  home_node  integer not null
);
insert into pd_proc values ('P0', 0), ('P1', 0), ('P2', 1), ('P3', 1);
create table pd_mem_access (
  proc      varchar(5) references pd_proc,
  mem_node  integer,
  ns        integer,
  primary key (proc, mem_node)
);
insert into pd_mem_access values
  ('P0', 0, 80), ('P0', 1, 140), ('P1', 0, 82), ('P1', 1, 138),
  ('P2', 0, 145), ('P2', 1, 78), ('P3', 0, 150), ('P3', 1, 80);

-- ================================================================ Chương 21
create table pd_order (
  order_id    integer primary key,
  customer    varchar(10) not null,
  amount      integer not null,
  order_date  date not null
);
insert into pd_order values
  (1, 'An', 120, '2024-01-05'), (2, 'Binh', 450, '2024-01-09'), (3, 'Chi', 980, '2024-01-15'),
  (4, 'An', 60, '2024-01-20'), (5, 'Dung', 1500, '2024-02-02'), (6, 'Giang', 310, '2024-02-11'),
  (7, 'Hoa', 75, '2024-02-14'), (8, 'Binh', 220, '2024-02-25'), (9, 'An', 640, '2024-03-03'),
  (10, 'Chi', 180, '2024-03-08'), (11, 'Dung', 90, '2024-03-19'), (12, 'An', 1200, '2024-03-30'),
  (13, 'Giang', 150, '2024-04-04'), (14, 'Hoa', 400, '2024-04-12'), (15, 'An', 55, '2024-04-18'),
  (16, 'Binh', 130, '2024-05-01'), (17, 'Chi', 770, '2024-05-09'), (18, 'An', 95, '2024-05-21'),
  (19, 'Dung', 260, '2024-06-02'), (20, 'Hoa', 110, '2024-06-10'), (21, 'An', 85, '2024-06-17'),
  (22, 'Giang', 1990, '2024-06-23'), (23, 'Binh', 170, '2024-06-28'), (24, 'An', 140, '2024-06-30');

-- Histogram của PE 21.2a.
create table pd_hist (
  lo    integer primary key,
  hi    integer not null,
  freq  integer not null
);
insert into pd_hist values
  (1, 10, 15), (11, 20, 5), (21, 30, 20), (31, 40, 10), (41, 50, 10),
  (51, 60, 5), (61, 70, 5), (71, 80, 20), (81, 90, 5), (91, 100, 5);

-- Bản sao của từng data item: một primary, hai backup.
create table pd_replica (
  item  varchar(5),
  node  varchar(5),
  role  varchar(10) check (role in ('primary', 'backup')),
  primary key (item, node)
);
insert into pd_replica values
  ('I1', 'N1', 'primary'), ('I1', 'N2', 'backup'), ('I1', 'N3', 'backup'),
  ('I2', 'N1', 'primary'), ('I2', 'N3', 'backup'), ('I2', 'N4', 'backup'),
  ('I3', 'N1', 'primary'), ('I3', 'N4', 'backup'), ('I3', 'N2', 'backup'),
  ('I4', 'N2', 'primary'), ('I4', 'N3', 'backup'), ('I4', 'N4', 'backup'),
  ('I5', 'N2', 'primary'), ('I5', 'N4', 'backup'), ('I5', 'N1', 'backup'),
  ('I6', 'N2', 'primary'), ('I6', 'N1', 'backup'), ('I6', 'N3', 'backup'),
  ('I7', 'N3', 'primary'), ('I7', 'N4', 'backup'), ('I7', 'N1', 'backup'),
  ('I8', 'N3', 'primary'), ('I8', 'N1', 'backup'), ('I8', 'N2', 'backup'),
  ('I9', 'N4', 'primary'), ('I9', 'N1', 'backup'), ('I9', 'N2', 'backup');
-- Thứ tự ưu tiên: khi primary hỏng, backup có thứ tự 1 lên làm primary.
alter table pd_replica add column backup_rank integer;
update pd_replica r set backup_rank = x.rk
from (values ('I1','N2',1),('I1','N3',2),('I2','N3',1),('I2','N4',2),('I3','N4',1),('I3','N2',2),
             ('I4','N3',1),('I4','N4',2),('I5','N4',1),('I5','N1',2),('I6','N1',1),('I6','N3',2),
             ('I7','N4',1),('I7','N1',2),('I8','N1',1),('I8','N2',2),('I9','N1',1),('I9','N2',2)) as x(item, node, rk)
where r.item = x.item and r.node = x.node;

-- Lịch sử master của từng record (epoch tăng dần mỗi lần đổi master) và các request đã gửi.
create table pd_master_epoch (
  item   varchar(5),
  epoch  integer,
  node   varchar(5) not null,
  primary key (item, epoch)
);
insert into pd_master_epoch values
  ('K1', 1, 'N1'), ('K1', 2, 'N3'),
  ('K2', 1, 'N2'),
  ('K3', 1, 'N4'), ('K3', 2, 'N2'), ('K3', 3, 'N4');
create table pd_route (
  req      integer primary key,
  item     varchar(5) not null,
  sent_to  varchar(5) not null
);
insert into pd_route values (1, 'K1', 'N1'), (2, 'K1', 'N3'), (3, 'K2', 'N2'), (4, 'K3', 'N2'), (5, 'K3', 'N4');

-- ================================================================ Chương 22
-- pd_emp đang được chia round-robin trên 3 node (node = (emp_id - 1) % 3);
-- pd_dept được chia theo dept_id % 3.
create table pd_dept (
  dept_id  integer primary key,
  dname    varchar(15) not null,
  node     integer not null
);
insert into pd_dept values
  (1, 'Sales', 1), (2, 'IT', 2), (3, 'HR', 0), (4, 'Finance', 1), (5, 'Legal', 2), (6, 'Research', 0);
create table pd_emp (
  emp_id   integer primary key,
  dept_id  integer not null references pd_dept,
  salary   integer not null,
  node     integer not null
);
insert into pd_emp values
  (1, 1, 50, 0), (2, 1, 60, 1), (3, 2, 80, 2), (4, 1, 55, 0), (5, 3, 45, 1), (6, 1, 65, 2),
  (7, 2, 90, 0), (8, 1, 52, 1), (9, 4, 70, 2), (10, 1, 58, 0), (11, 5, 100, 1), (12, 2, 85, 2),
  (13, 1, 61, 0), (14, 3, 47, 1), (15, 1, 59, 2), (16, 2, 95, 0), (17, 1, 54, 1), (18, 4, 75, 2);

-- Band join (PE 22.4): chia range theo khoảng 10 giá trị: 1–10 → 0, 11–20 → 1, 21–30 → 2.
create table pd_band_r (a integer primary key);
create table pd_band_s (b integer primary key);
insert into pd_band_r values (2), (9), (11), (19), (24), (30);
insert into pd_band_s values (1), (10), (12), (21), (22), (28);

-- Bloom filter (PE 22.6): s nhỏ, r lớn và đa số tuple của r không khớp.
create table pd_bloom_s (b integer primary key);
insert into pd_bloom_s values (3), (8), (21), (34);
create table pd_bloom_r (id integer primary key, b integer not null);
insert into pd_bloom_r select g, (g * 7) % 40 + 1 from generate_series(1, 40) g;

-- Left outer join (PE 22.7b): r nhỏ, s lớn và được chia trên 3 node.
create table pd_lo_r (a integer primary key, label varchar(10));
insert into pd_lo_r values (1, 'one'), (2, 'two'), (3, 'three'), (4, 'four'), (5, 'five');
create table pd_lo_s (id integer primary key, a integer, val varchar(10), node integer);
insert into pd_lo_s values
  (1, 1, 'x1', 0), (2, 3, 'x2', 1), (3, 1, 'x3', 2), (4, 6, 'x4', 0), (5, 3, 'x5', 1), (6, 7, 'x6', 2), (7, 5, 'x7', 0);

-- PE 22.8: s(A, B, C) đang được chia theo B (node = b % 3).
create table pd_sab (id integer primary key, a integer, b integer, c integer, node integer);
insert into pd_sab
select g, g % 4, g % 9, g * 10, (g % 9) % 3 from generate_series(1, 36) g;

-- MapReduce: đếm từ.
create table pd_doc (doc_id integer primary key, body text);
insert into pd_doc values
  (1, 'Parallel databases partition data across nodes.'),
  (2, 'Each node processes its partition of the data in parallel.'),
  (3, 'Skew makes one node slower: the slowest node decides the response time.');

-- ================================================================ Chương 23
-- Two-phase commit: coordinator là site C; S1, S2 là participant.
create table pd_2pc_part (
  txn   varchar(5),
  site  varchar(5),
  primary key (txn, site)
);
insert into pd_2pc_part select t, s from unnest(array['T1','T2','T3','T4','T5']) t, unnest(array['S1','S2']) s;
-- rec: prepare (coordinator), ready / no (phiếu của participant), commit, abort.
create table pd_2pc_log (
  txn   varchar(5),
  site  varchar(5),
  seq   integer,
  rec   varchar(10) check (rec in ('prepare', 'ready', 'no', 'commit', 'abort')),
  primary key (txn, site, seq)
);
insert into pd_2pc_log values
  ('T1', 'C', 1, 'prepare'), ('T1', 'S1', 2, 'ready'), ('T1', 'S2', 3, 'ready'), ('T1', 'C', 4, 'commit'), ('T1', 'S1', 5, 'commit'), ('T1', 'S2', 6, 'commit'),
  ('T2', 'C', 1, 'prepare'), ('T2', 'S1', 2, 'ready'), ('T2', 'S2', 3, 'no'), ('T2', 'S2', 4, 'abort'), ('T2', 'C', 5, 'abort'), ('T2', 'S1', 6, 'abort'),
  ('T3', 'C', 1, 'prepare'), ('T3', 'S1', 2, 'ready'), ('T3', 'S2', 3, 'ready'), ('T3', 'C', 4, 'commit'), ('T3', 'S2', 5, 'commit'),
  ('T4', 'C', 1, 'prepare'), ('T4', 'S1', 2, 'ready'), ('T4', 'S2', 3, 'ready'),
  ('T5', 'C', 1, 'prepare'), ('T5', 'S1', 2, 'ready');

-- Cấu hình quorum: n bản sao, read quorum r, write quorum w.
create table pd_quorum (
  cfg  varchar(5) primary key,
  n    integer not null,
  r    integer not null,
  w    integer not null
);
insert into pd_quorum values ('A', 3, 2, 2), ('B', 3, 1, 3), ('C', 3, 1, 2), ('D', 5, 3, 3), ('E', 5, 4, 2), ('F', 4, 2, 2);

-- Các bản sao của data item (version càng lớn càng mới) và các lần đọc quorum.
create table pd_copy (
  item     varchar(5),
  node     varchar(5),
  version  integer,
  val      integer,
  primary key (item, node)
);
insert into pd_copy values
  ('X', 'N1', 3, 300), ('X', 'N2', 2, 200), ('X', 'N3', 3, 300),
  ('Y', 'N1', 1, 10), ('Y', 'N2', 2, 20), ('Y', 'N3', 1, 10);
create table pd_read_req (
  req   integer,
  item  varchar(5),
  node  varchar(5),
  primary key (req, node)
);
insert into pd_read_req values (1, 'X', 'N1'), (1, 'X', 'N2'), (2, 'X', 'N2'), (2, 'X', 'N3'), (3, 'Y', 'N1'), (3, 'Y', 'N3'), (4, 'Y', 'N2'), (4, 'Y', 'N3');

-- Local wait-for graph của từng site (PE 23.8). ts null = cạnh cục bộ.
create table pd_wfg (
  site    varchar(5),
  waiter  varchar(5),
  holder  varchar(5),
  ts      integer
);
insert into pd_wfg values
  ('S1', 'T1', 'T2', null), ('S1', 'T2', 'T3', 5),
  ('S2', 'T2', 'T3', 5), ('S2', 'T3', 'T1', 8), ('S2', 'T5', 'T4', null),
  ('S3', 'T3', 'T1', 8), ('S3', 'T4', 'T5', 11);

-- Sự kiện của 3 tiến trình: local, send, recv (msg nối send với recv).
create table pd_event (
  proc  varchar(5),
  seq   integer,
  kind  varchar(5) check (kind in ('local', 'send', 'recv')),
  msg   varchar(5),
  primary key (proc, seq)
);
insert into pd_event values
  ('P1', 1, 'local', null), ('P1', 2, 'send', 'm1'), ('P1', 3, 'local', null), ('P1', 4, 'recv', 'm3'),
  ('P2', 1, 'recv', 'm1'), ('P2', 2, 'send', 'm2'), ('P2', 3, 'local', null),
  ('P3', 1, 'local', null), ('P3', 2, 'local', null), ('P3', 3, 'recv', 'm2'), ('P3', 4, 'send', 'm3');

-- Persistent messaging bằng sequence number (PE 23.5): thứ tự các message tới nơi.
create table pd_msg_in (
  sender   varchar(5),
  seq      integer,
  arrival  integer,
  primary key (sender, seq)
);
insert into pd_msg_in values
  ('A', 1, 1), ('A', 2, 2), ('A', 4, 3), ('A', 3, 5), ('A', 6, 6),
  ('B', 2, 4), ('B', 1, 7), ('B', 3, 8),
  ('C', 2, 9), ('C', 3, 10);

-- Chain replication (PE 23.9): pos 1 là head, pos lớn nhất là tail.
create table pd_chain (
  item     varchar(5),
  pos      integer,
  node     varchar(5),
  version  integer,
  primary key (item, pos)
);
insert into pd_chain values
  ('A', 1, 'N1', 7), ('A', 2, 'N2', 7), ('A', 3, 'N3', 6),
  ('B', 1, 'N2', 4), ('B', 2, 'N3', 4), ('B', 3, 'N4', 4),
  ('C', 1, 'N3', 9), ('C', 2, 'N4', 8), ('C', 3, 'N1', 8);

-- Lease của primary (PE 23.10) và các request mà node đã tự phục vụ với tư cách primary.
create table pd_lease (
  node         varchar(5),
  lease_start  integer,
  lease_end    integer,
  primary key (node, lease_start)
);
insert into pd_lease values ('N1', 0, 10), ('N1', 10, 20), ('N2', 25, 35);
create table pd_serve (
  req   integer primary key,
  node  varchar(5) not null,
  t     integer not null
);
insert into pd_serve values (1, 'N1', 3), (2, 'N1', 15), (3, 'N1', 22), (4, 'N1', 27), (5, 'N2', 26), (6, 'N2', 40);

-- Lazy replication (PE 23.7): các version đã commit ở primary và thời điểm replica nhận được.
create table pd_primary_hist (
  version   integer primary key,
  t_commit  integer not null,
  balance   integer not null
);
insert into pd_primary_hist values (1, 0, 100), (2, 10, 110), (3, 20, 120);
create table pd_replica_apply (
  node     varchar(5),
  version  integer references pd_primary_hist,
  t_apply  integer not null,
  primary key (node, version)
);
insert into pd_replica_apply values ('R1', 1, 1), ('R1', 2, 12), ('R1', 3, 21), ('R2', 1, 2), ('R2', 2, 30), ('R2', 3, 31);
create table pd_replica_read (
  read_id  integer primary key,
  node     varchar(5) not null,
  t        integer not null
);
insert into pd_replica_read values (1, 'R1', 15), (2, 'R2', 15), (3, 'R2', 25), (4, 'R1', 25), (5, 'R2', 35);

-- Schedule trên hai site của một federated database (PE 23.11b).
-- T1 là giao dịch cục bộ ở site 1, T2 ở site 2; G1, G2 là giao dịch toàn cục
-- (G2 chỉ bắt đầu sau khi G1 kết thúc).
create table pd_sched (
  step  integer primary key,
  site  integer not null,
  txn   varchar(5) not null,
  op    varchar(5) check (op in ('read', 'write')),
  item  varchar(5) not null
);
insert into pd_sched values
  (1, 1, 'T1', 'read', 'X1'),
  (2, 1, 'G1', 'write', 'X1'),
  (3, 2, 'G1', 'write', 'X2'),
  (4, 2, 'T2', 'read', 'X2'),
  (5, 2, 'T2', 'write', 'Y2'),
  (6, 2, 'G2', 'read', 'Y2'),
  (7, 1, 'G2', 'read', 'Y1'),
  (8, 1, 'T1', 'write', 'Y1');
