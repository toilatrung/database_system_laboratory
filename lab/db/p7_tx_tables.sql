-- =====================================================================
-- Bảng cho bài tập Part 7 (Chương 17–19: Transactions, Concurrency
-- Control, Recovery). Mọi bảng bắt đầu bằng tx_. Lịch (schedule), khoá,
-- log... được lưu thành dòng để phân tích bằng SQL.
-- =====================================================================

drop table if exists tx_account, tx_sched, tx_pg_edge, tx_lock_compat, tx_lock_req,
  tx_lock_sched, tx_txn, tx_waits, tx_conflict, tx_to_req, tx_to_ops, tx_val, tx_si,
  tx_versions, tx_mv_reads, tx_pred, tx_ins, tx_log, tx_disk, tx_bank_log,
  tx_aries_log, tx_aries_chk_dpt, tx_aries_chk_tt, tx_aries_page cascade;

-- ---------------------------------------------------------------- Chương 17
-- Tài khoản để thử commit / rollback / savepoint / atomicity.
create table tx_account (
  acc_id  varchar(10) primary key,
  owner   varchar(20) not null,
  kind    varchar(10) not null,
  balance numeric(10,2) not null check (balance >= 0)
);
insert into tx_account values
  ('A-101', 'Alice', 'checking', 500),
  ('A-102', 'Bob',   'checking', 300),
  ('A-201', 'Alice', 'savings',  200),
  ('A-301', 'Carol', 'checking', 0);

-- Schedule: mỗi dòng là một thao tác. op: R = read, W = write, C = commit, A = abort.
create table tx_sched (
  sched_id varchar(5),
  step     integer,
  txn      varchar(5) not null,
  op       char(1) not null check (op in ('R', 'W', 'C', 'A')),
  item     varchar(5),
  primary key (sched_id, step)
);
insert into tx_sched values
  -- S1: xen kẽ, conflict serializable (T1 → T2), không cascadeless
  ('S1', 1, 'T1', 'R', 'A'), ('S1', 2, 'T1', 'W', 'A'), ('S1', 3, 'T2', 'R', 'A'), ('S1', 4, 'T2', 'W', 'A'),
  ('S1', 5, 'T1', 'R', 'B'), ('S1', 6, 'T1', 'W', 'B'), ('S1', 7, 'T1', 'C', null),
  ('S1', 8, 'T2', 'R', 'B'), ('S1', 9, 'T2', 'W', 'B'), ('S1', 10, 'T2', 'C', null),
  -- S2: lost update trên A, có chu trình T1 ⇄ T2
  ('S2', 1, 'T1', 'R', 'A'), ('S2', 2, 'T2', 'R', 'A'), ('S2', 3, 'T1', 'W', 'A'), ('S2', 4, 'T2', 'W', 'A'),
  ('S2', 5, 'T1', 'C', null), ('S2', 6, 'T2', 'C', null),
  -- S3: T2 đọc A do T1 ghi rồi commit trước T1 → không recoverable
  ('S3', 1, 'T1', 'R', 'A'), ('S3', 2, 'T1', 'W', 'A'), ('S3', 3, 'T2', 'R', 'A'), ('S3', 4, 'T2', 'C', null),
  ('S3', 5, 'T1', 'R', 'B'), ('S3', 6, 'T1', 'C', null),
  -- S4: recoverable nhưng không cascadeless (T1 → T2 → T3 đọc dây chuyền)
  ('S4', 1, 'T1', 'R', 'A'), ('S4', 2, 'T1', 'R', 'B'), ('S4', 3, 'T1', 'W', 'A'), ('S4', 4, 'T2', 'R', 'A'),
  ('S4', 5, 'T2', 'W', 'A'), ('S4', 6, 'T3', 'R', 'A'), ('S4', 7, 'T1', 'C', null), ('S4', 8, 'T2', 'C', null),
  ('S4', 9, 'T3', 'C', null),
  -- S5: xen kẽ, cascadeless
  ('S5', 1, 'T1', 'R', 'A'), ('S5', 2, 'T2', 'R', 'B'), ('S5', 3, 'T1', 'W', 'A'), ('S5', 4, 'T2', 'W', 'B'),
  ('S5', 5, 'T1', 'C', null), ('S5', 6, 'T2', 'R', 'A'), ('S5', 7, 'T2', 'C', null),
  -- S6: chu trình qua ba giao tác T1 → T2 → T3 → T1
  ('S6', 1, 'T1', 'R', 'A'), ('S6', 2, 'T2', 'W', 'A'), ('S6', 3, 'T2', 'R', 'B'), ('S6', 4, 'T3', 'W', 'B'),
  ('S6', 5, 'T3', 'R', 'C'), ('S6', 6, 'T1', 'W', 'C'), ('S6', 7, 'T1', 'C', null), ('S6', 8, 'T2', 'C', null),
  ('S6', 9, 'T3', 'C', null),
  -- S7: serial T1 rồi T2
  ('S7', 1, 'T1', 'R', 'A'), ('S7', 2, 'T1', 'W', 'A'), ('S7', 3, 'T1', 'C', null),
  ('S7', 4, 'T2', 'R', 'A'), ('S7', 5, 'T2', 'W', 'A'), ('S7', 6, 'T2', 'C', null);

-- Precedence graph cho sẵn. F17.16 = Figure 17.16 (PE 17.6); G2 có chu trình.
create table tx_pg_edge (
  graph varchar(10),
  src   varchar(5),
  dst   varchar(5),
  primary key (graph, src, dst)
);
insert into tx_pg_edge values
  ('F17.16', 'T1', 'T2'), ('F17.16', 'T1', 'T3'), ('F17.16', 'T1', 'T4'), ('F17.16', 'T2', 'T3'),
  ('F17.16', 'T2', 'T4'), ('F17.16', 'T3', 'T5'), ('F17.16', 'T4', 'T5'),
  ('G2', 'T1', 'T2'), ('G2', 'T2', 'T3'), ('G2', 'T3', 'T1'), ('G2', 'T3', 'T4');

-- ---------------------------------------------------------------- Chương 18
-- Ma trận tương thích khoá S, X, I (Figure 18.25).
create table tx_lock_compat (
  held      char(1),
  requested char(1),
  ok        boolean not null,
  primary key (held, requested)
);
insert into tx_lock_compat values
  ('S', 'S', true),  ('S', 'X', false), ('S', 'I', false),
  ('X', 'S', false), ('X', 'X', false), ('X', 'I', false),
  ('I', 'S', false), ('I', 'X', false), ('I', 'I', true);

-- Bảng khoá của lock manager: yêu cầu đang giữ (held) hoặc đang chờ (waiting).
create table tx_lock_req (
  req_id integer primary key,
  item   varchar(5) not null,
  txn    varchar(5) not null,
  mode   char(1) not null,
  status varchar(7) not null check (status in ('held', 'waiting'))
);
insert into tx_lock_req values
  (1, 'A', 'T1', 'S', 'held'),    (2, 'A', 'T2', 'S', 'held'),    (3, 'A', 'T3', 'X', 'waiting'),
  (4, 'B', 'T1', 'I', 'held'),    (5, 'B', 'T2', 'I', 'waiting'), (6, 'B', 'T3', 'S', 'waiting'),
  (7, 'C', 'T4', 'X', 'held'),    (8, 'C', 'T4', 'S', 'waiting'), (9, 'D', 'T5', 'S', 'waiting'),
  (10, 'A', 'T4', 'S', 'waiting');

-- Schedule có lệnh khoá. action: lock-S, lock-X, unlock, read, write, commit.
create table tx_lock_sched (
  sched_id varchar(5),
  step     integer,
  txn      varchar(5) not null,
  action   varchar(6) not null,
  item     varchar(5),
  primary key (sched_id, step)
);
insert into tx_lock_sched values
  ('L1', 1, 'T1', 'lock-X', 'A'), ('L1', 2, 'T1', 'read', 'A'), ('L1', 3, 'T1', 'write', 'A'),
  ('L1', 4, 'T2', 'lock-S', 'B'), ('L1', 5, 'T2', 'read', 'B'), ('L1', 6, 'T1', 'lock-S', 'B'),
  ('L1', 7, 'T1', 'read', 'B'), ('L1', 8, 'T1', 'commit', null), ('L1', 9, 'T1', 'unlock', 'A'),
  ('L1', 10, 'T1', 'unlock', 'B'), ('L1', 11, 'T2', 'lock-X', 'A'), ('L1', 12, 'T2', 'write', 'A'),
  ('L1', 13, 'T2', 'commit', null), ('L1', 14, 'T2', 'unlock', 'B'), ('L1', 15, 'T2', 'unlock', 'A'),
  ('L2', 1, 'T1', 'lock-X', 'A'), ('L2', 2, 'T1', 'write', 'A'), ('L2', 3, 'T1', 'lock-X', 'B'),
  ('L2', 4, 'T1', 'unlock', 'A'), ('L2', 5, 'T2', 'lock-S', 'A'), ('L2', 6, 'T2', 'read', 'A'),
  ('L2', 7, 'T1', 'write', 'B'), ('L2', 8, 'T1', 'unlock', 'B'), ('L2', 9, 'T1', 'commit', null),
  ('L2', 10, 'T2', 'unlock', 'A'), ('L2', 11, 'T2', 'commit', null),
  ('L3', 1, 'T1', 'lock-S', 'A'), ('L3', 2, 'T1', 'read', 'A'), ('L3', 3, 'T1', 'unlock', 'A'),
  ('L3', 4, 'T2', 'lock-X', 'A'), ('L3', 5, 'T2', 'write', 'A'), ('L3', 6, 'T2', 'unlock', 'A'),
  ('L3', 7, 'T1', 'lock-X', 'B'), ('L3', 8, 'T1', 'write', 'B'), ('L3', 9, 'T1', 'unlock', 'B'),
  ('L3', 10, 'T1', 'commit', null), ('L3', 11, 'T2', 'commit', null);

-- Timestamp của giao tác (số nhỏ = già hơn).
create table tx_txn (
  txn varchar(5) primary key,
  ts  integer not null unique
);
insert into tx_txn values ('T1', 5), ('T2', 3), ('T3', 8), ('T4', 1), ('T5', 2), ('T6', 9);

-- Wait-for graph: waiter đang chờ khoá do holder giữ.
create table tx_waits (
  graph  varchar(5),
  waiter varchar(5),
  holder varchar(5),
  primary key (graph, waiter, holder)
);
insert into tx_waits values
  ('W1', 'T1', 'T2'), ('W1', 'T2', 'T3'), ('W1', 'T3', 'T4'),
  ('W2', 'T1', 'T2'), ('W2', 'T2', 'T3'), ('W2', 'T3', 'T1'), ('W2', 'T4', 'T1'),
  ('W2', 'T5', 'T6'), ('W2', 'T6', 'T5');

-- Xung đột khoá: requester xin khoá đang bị holder giữ (dùng cho wait-die / wound-wait).
create table tx_conflict (
  req_id    integer primary key,
  requester varchar(5) not null references tx_txn,
  holder    varchar(5) not null references tx_txn
);
insert into tx_conflict values (1, 'T4', 'T1'), (2, 'T3', 'T1'), (3, 'T2', 'T6'), (4, 'T6', 'T5'), (5, 'T5', 'T2');

-- Yêu cầu độc lập trong timestamp ordering: TS của giao tác, R-/W-timestamp hiện tại của item.
create table tx_to_req (
  req_id integer primary key,
  txn_ts integer not null,
  op     char(1) not null check (op in ('R', 'W')),
  item   varchar(5) not null,
  r_ts   integer not null,
  w_ts   integer not null
);
insert into tx_to_req values
  (1, 5, 'R', 'Q', 3, 4), (2, 5, 'R', 'Q', 6, 7), (3, 5, 'W', 'Q', 4, 3), (4, 5, 'W', 'Q', 6, 3),
  (5, 5, 'W', 'Q', 4, 7), (6, 5, 'R', 'Q', 9, 5), (7, 5, 'W', 'Q', 5, 5);

-- Schedule cho mô phỏng timestamp ordering (kịch bản của PE 18.12). TS lấy theo txn ở cột ts.
create table tx_to_ops (
  step integer primary key,
  txn  varchar(5) not null,
  ts   integer not null,
  op   char(1) not null check (op in ('R', 'W')),
  item varchar(5) not null
);
insert into tx_to_ops values
  (1, 'T1', 1, 'W', 'p'), (2, 'T2', 2, 'R', 'p'), (3, 'T2', 2, 'R', 'q'), (4, 'T1', 1, 'W', 'q'),
  (5, 'T3', 3, 'W', 'q'), (6, 'T2', 2, 'W', 'p'), (7, 'T1', 1, 'W', 'p');

-- Validation-based protocol: các mốc thời gian và read/write set.
create table tx_val (
  txn       varchar(5) primary key,
  start_ts  integer not null,
  val_ts    integer not null unique,
  finish_ts integer not null,
  read_set  text[] not null,
  write_set text[] not null
);
insert into tx_val values
  ('T1', 1, 3, 4, '{A}', '{A}'),
  ('T2', 2, 5, 6, '{B}', '{B}'),
  ('T3', 3, 7, 9, '{A,C}', '{C}'),
  ('T4', 5, 8, 10, '{B}', '{D}'),
  ('T5', 11, 12, 13, '{A}', '{A}');

-- Snapshot isolation: start/commit timestamp (lúc xin commit) và update set.
create table tx_si (
  txn       varchar(5) primary key,
  start_ts  integer not null,
  commit_ts integer not null unique,
  write_set text[] not null
);
insert into tx_si values
  ('T1', 1, 5, '{A}'), ('T2', 2, 6, '{A,B}'), ('T3', 3, 7, '{B}'),
  ('T4', 6, 9, '{A}'), ('T5', 8, 10, '{B,C}'), ('T6', 8, 11, '{C}');

-- Multiversion timestamp ordering: các phiên bản của mỗi item và các yêu cầu đọc.
create table tx_versions (
  item  varchar(5),
  w_ts  integer,
  value integer not null,
  primary key (item, w_ts)
);
insert into tx_versions values ('Q', 0, 100), ('Q', 5, 150), ('Q', 9, 200), ('P', 0, 10), ('P', 7, 20);

create table tx_mv_reads (
  req_id integer primary key,
  txn_ts integer not null,
  item   varchar(5) not null
);
insert into tx_mv_reads values (1, 4, 'Q'), (2, 5, 'Q'), (3, 8, 'Q'), (4, 12, 'Q'), (5, 6, 'P'), (6, 7, 'P');

-- Phantom: giao tác đọc theo vị từ salary between lo and hi; các giao tác khác chèn instructor.
create table tx_pred (
  txn varchar(5) primary key,
  lo  integer not null,
  hi  integer not null
);
insert into tx_pred values ('T1', 60000, 80000), ('T2', 90000, 100000);

create table tx_ins (
  ins_id integer primary key,
  txn    varchar(5) not null,
  salary integer not null
);
insert into tx_ins values (1, 'T3', 65000), (2, 'T3', 85000), (3, 'T4', 95000), (4, 'T1', 70000), (5, 'T5', 100000);

-- ---------------------------------------------------------------- Chương 19
-- Log theo thuật toán Section 19.4. kind: start, update (old_val → new_val),
-- clr (redo-only: ghi lại old value, lưu ở new_val), commit, abort,
-- checkpoint (active = danh sách L). Hệ thống crash ngay sau bản ghi cuối.
create table tx_log (
  log_id  varchar(5),
  lsn     integer,
  txn     varchar(5),
  kind    varchar(10) not null check (kind in ('start', 'update', 'clr', 'commit', 'abort', 'checkpoint')),
  item    varchar(5),
  old_val integer,
  new_val integer,
  active  text[],
  primary key (log_id, lsn)
);
insert into tx_log values
  -- LOG1: không có checkpoint
  ('LOG1', 1, 'T0', 'start', null, null, null, null),
  ('LOG1', 2, 'T0', 'update', 'A', 1000, 950, null),
  ('LOG1', 3, 'T0', 'update', 'B', 2000, 2050, null),
  ('LOG1', 4, 'T0', 'commit', null, null, null, null),
  ('LOG1', 5, 'T1', 'start', null, null, null, null),
  ('LOG1', 6, 'T1', 'update', 'C', 700, 600, null),
  ('LOG1', 7, 'T2', 'start', null, null, null, null),
  ('LOG1', 8, 'T2', 'update', 'A', 950, 900, null),
  ('LOG1', 9, 'T1', 'commit', null, null, null, null),
  ('LOG1', 10, 'T2', 'update', 'D', 500, 550, null),
  -- LOG2: có checkpoint, có giao tác đã abort (kèm CLR)
  ('LOG2', 1, 'T1', 'start', null, null, null, null),
  ('LOG2', 2, 'T1', 'update', 'A', 100, 110, null),
  ('LOG2', 3, 'T1', 'commit', null, null, null, null),
  ('LOG2', 4, 'T2', 'start', null, null, null, null),
  ('LOG2', 5, 'T2', 'update', 'B', 200, 210, null),
  ('LOG2', 6, 'T3', 'start', null, null, null, null),
  ('LOG2', 7, null, 'checkpoint', null, null, null, '{T2,T3}'),
  ('LOG2', 8, 'T3', 'update', 'C', 300, 330, null),
  ('LOG2', 9, 'T2', 'update', 'A', 110, 120, null),
  ('LOG2', 10, 'T4', 'start', null, null, null, null),
  ('LOG2', 11, 'T4', 'update', 'D', 400, 440, null),
  ('LOG2', 12, 'T2', 'commit', null, null, null, null),
  ('LOG2', 13, 'T3', 'clr', 'C', null, 300, null),
  ('LOG2', 14, 'T3', 'abort', null, null, null, null),
  ('LOG2', 15, 'T5', 'start', null, null, null, null),
  ('LOG2', 16, 'T5', 'update', 'B', 210, 250, null),
  ('LOG2', 17, 'T4', 'update', 'E', 500, 555, null),
  -- LOG3: một giao tác cập nhật cùng item nhiều lần (PE 19.1)
  ('LOG3', 1, 'T7', 'start', null, null, null, null),
  ('LOG3', 2, 'T7', 'update', 'X', 1, 2, null),
  ('LOG3', 3, 'T7', 'update', 'Y', 10, 20, null),
  ('LOG3', 4, 'T7', 'update', 'X', 2, 3, null),
  ('LOG3', 5, 'T7', 'update', 'Y', 20, 30, null),
  ('LOG3', 6, 'T7', 'update', 'X', 3, 4, null),
  -- LOG4: log của thuật toán sửa SAI ở PE 19.7 (rollback của T1 không được ghi log)
  ('LOG4', 1, 'T1', 'start', null, null, null, null),
  ('LOG4', 2, 'T1', 'update', 'A', 1000, 900, null),
  ('LOG4', 3, 'T2', 'start', null, null, null, null),
  ('LOG4', 4, 'T2', 'update', 'A', 1000, 2000, null),
  ('LOG4', 5, 'T2', 'commit', null, null, null, null),
  -- LOG5: log đúng cho cùng kịch bản (có CLR và abort)
  ('LOG5', 1, 'T1', 'start', null, null, null, null),
  ('LOG5', 2, 'T1', 'update', 'A', 1000, 900, null),
  ('LOG5', 3, 'T1', 'clr', 'A', null, 1000, null),
  ('LOG5', 4, 'T1', 'abort', null, null, null, null),
  ('LOG5', 5, 'T2', 'start', null, null, null, null),
  ('LOG5', 6, 'T2', 'update', 'A', 1000, 2000, null),
  ('LOG5', 7, 'T2', 'commit', null, null, null, null);

-- Giá trị các item trên đĩa trước khi LOG1 bắt đầu (dùng cho deferred modification).
create table tx_disk (
  item varchar(5) primary key,
  val  integer not null
);
insert into tx_disk values ('A', 1000), ('B', 2000), ('C', 700), ('D', 500);

-- PE 19.11: hai giao tác đã commit cùng gửi 10 vào tài khoản A.
create table tx_bank_log (
  lsn     integer primary key,
  txn     varchar(5) not null,
  item    varchar(5) not null,
  old_val integer not null,
  new_val integer not null
);
insert into tx_bank_log values (1, 'T1', 'A', 100, 110), (2, 'T2', 'A', 110, 120);

-- ARIES: log (PrevLSN, UndoNextLSN), checkpoint (DirtyPageTable + transaction table), PageLSN trên đĩa.
create table tx_aries_log (
  lsn           integer primary key,
  prev_lsn      integer,
  txn           varchar(5),
  kind          varchar(10) not null check (kind in ('update', 'clr', 'commit', 'end', 'checkpoint')),
  page_id       varchar(5),
  undo_next_lsn integer
);
insert into tx_aries_log values
  (10, null, 'T1', 'update', 'P1', null),
  (20, null, 'T2', 'update', 'P2', null),
  (30, 10, 'T1', 'update', 'P3', null),
  (50, null, null, 'checkpoint', null, null),
  (60, 20, 'T2', 'update', 'P3', null),
  (70, 30, 'T1', 'commit', null, null),
  (80, null, 'T3', 'update', 'P4', null),
  (90, 60, 'T2', 'update', 'P1', null),
  (100, 70, 'T1', 'end', null, null),
  (110, 80, 'T3', 'update', 'P5', null),
  (120, 110, 'T3', 'clr', 'P5', 80);

create table tx_aries_chk_dpt (       -- DirtyPageTable ghi trong checkpoint LSN 50
  page_id varchar(5) primary key,
  rec_lsn integer not null
);
insert into tx_aries_chk_dpt values ('P1', 10), ('P2', 20);

create table tx_aries_chk_tt (        -- transaction table ghi trong checkpoint LSN 50
  txn      varchar(5) primary key,
  last_lsn integer not null
);
insert into tx_aries_chk_tt values ('T1', 30), ('T2', 20);

create table tx_aries_page (          -- PageLSN của các trang trên đĩa lúc crash
  page_id  varchar(5) primary key,
  page_lsn integer not null
);
insert into tx_aries_page values ('P1', 0), ('P2', 20), ('P3', 30), ('P4', 0), ('P5', 110);
