-- =====================================================================
-- Bảng cho bài tập Part 6 — Chương 15 (Query Processing), 16 (Query Optimization).
-- Mọi bảng đều có prefix qp_. Chạy SAU university_data.sql.
--
--   External sort-merge (PE 15.1):         qp_sort_input, qp_sort_params
--   Cost model / join cost (PE 15.3):      qp_rel_stats, qp_memory
--   Bank database (Figure 15.14 / 16.9):   qp_branch, qp_account
--   Semijoin / anti-semijoin (PE 15.10):   qp_orders, qp_vip, qp_blocked
--   Division (PE 15.8):                    qp_supply, qp_req_part
--   Keyword index (PE 15.13):              qp_doc_kw, qp_query_kw
--   Size estimation (PE 16.5, 16.6):       qp_card, qp_vstats
--   Histogram / selectivity:               qp_emp
--   Join ordering (PE 16.12–16.14):        qp_jrel, qp_jpred
--   upper() join (PE 16.8):                qp_names_r, qp_names_s
-- =====================================================================

drop table if exists qp_sort_input, qp_sort_params, qp_rel_stats, qp_memory cascade;
drop table if exists qp_account, qp_branch cascade;
drop table if exists qp_orders, qp_vip, qp_blocked, qp_supply, qp_req_part cascade;
drop table if exists qp_doc_kw, qp_query_kw, qp_card, qp_vstats, qp_emp cascade;
drop table if exists qp_jrel, qp_jpred, qp_names_r, qp_names_s cascade;

-- ---------------------------------------------------------------- External sort-merge
-- PE 15.1: one tuple per block, memory holds 3 blocks. pos = position in the input file.
create table qp_sort_input (
  pos   integer primary key,
  name  varchar(20) not null,
  num   integer not null
);
insert into qp_sort_input values
  (1, 'kangaroo', 17), (2, 'wallaby', 21), (3, 'emu', 1), (4, 'wombat', 13),
  (5, 'platypus', 3), (6, 'lion', 8), (7, 'warthog', 4), (8, 'zebra', 11),
  (9, 'meerkat', 6), (10, 'hyena', 9), (11, 'hornbill', 2), (12, 'baboon', 12);

-- b_r = blocks of the relation, m = memory blocks, bb = buffer blocks per run.
create table qp_sort_params (
  case_id  integer primary key,
  b_r      integer not null,
  m        integer not null,
  bb       integer not null
);
insert into qp_sort_params values
  (1, 12, 3, 1),        -- PE 15.1
  (2, 800, 25, 1),
  (3, 1500, 25, 1),
  (4, 10000, 11, 1),
  (5, 100000, 101, 1),
  (6, 100000, 101, 10); -- 10 buffer blocks per run: fewer seeks, smaller fan-in

-- ---------------------------------------------------------------- Cost model
-- PE 15.3: r1 has 20,000 tuples, 25 per block; r2 has 45,000 tuples, 30 per block.
create table qp_rel_stats (
  rel                varchar(10) primary key,
  n_tuples           integer not null,
  tuples_per_block   integer not null
);
insert into qp_rel_stats values ('r1', 20000, 25), ('r2', 45000, 30);

create table qp_memory (m integer primary key);   -- memory sizes (blocks) to compare
insert into qp_memory values (12), (52), (102), (802);

-- ---------------------------------------------------------------- Bank database
create table qp_branch (
  branch_name  varchar(20) primary key,
  branch_city  varchar(20) not null,
  assets       numeric(12,2) not null
);
insert into qp_branch values
  ('Brighton',   'Brooklyn',  7100000),
  ('Bronx Main', 'Bronx',      300000),
  ('Downtown',   'Brooklyn',  9000000),
  ('Mianus',     'Horseneck',  400000),
  ('North Town', 'Rye',       3700000),
  ('Perryridge', 'Horseneck', 1700000),
  ('Pownal',     'Bennington', 300000),
  ('Redwood',    'Palo Alto', 2100000),
  ('Round Hill', 'Horseneck', 8000000),
  ('Bay Ridge',  'Brooklyn',     4000),
  ('Austin',     'Austin',       3000);

create table qp_account (
  account_number  varchar(10) primary key,
  branch_name     varchar(20) not null references qp_branch,
  balance         numeric(12,2) not null
);
insert into qp_account values
  ('A-101', 'Downtown',   500), ('A-102', 'Perryridge', 400), ('A-201', 'Brighton',   900),
  ('A-215', 'Mianus',     700), ('A-217', 'Brighton',   750), ('A-218', 'Brighton',   900),
  ('A-222', 'Redwood',    700), ('A-305', 'Round Hill', 350), ('A-310', 'Bronx Main', 820),
  ('A-311', 'Bronx Main', 610), ('A-401', 'Bay Ridge',  120), ('A-402', 'Bay Ridge',  120),
  ('A-501', 'Downtown',   950);

-- ---------------------------------------------------------------- Semijoin / anti-semijoin
-- qp_orders has duplicate rows on purpose (multiset semantics).
create table qp_orders (cust varchar(10), item varchar(10));
insert into qp_orders values
  ('ann', 'pen'), ('ann', 'pen'), ('ann', 'ink'), ('bob', 'pad'),
  ('cid', 'pen'), ('dan', 'cup'), ('dan', 'cup'), (null, 'box');
create table qp_vip (cust varchar(10));              -- duplicates on purpose
insert into qp_vip values ('ann'), ('ann'), ('dan'), ('eve');
create table qp_blocked (cust varchar(10));          -- contains a null on purpose
insert into qp_blocked values ('bob'), (null);

-- ---------------------------------------------------------------- Division
create table qp_supply (supplier varchar(10), part varchar(10));   -- duplicates on purpose
insert into qp_supply values
  ('s1', 'p1'), ('s1', 'p2'), ('s1', 'p3'), ('s1', 'p3'),
  ('s2', 'p1'), ('s2', 'p2'),
  ('s3', 'p1'), ('s3', 'p2'), ('s3', 'p3'), ('s3', 'p4'),
  ('s4', 'p3'), ('s4', 'p3'), ('s4', 'p3');
create table qp_req_part (part varchar(10) primary key);
insert into qp_req_part values ('p1'), ('p2'), ('p3');

-- ---------------------------------------------------------------- Keyword index
create table qp_doc_kw (doc_id integer, keyword varchar(20), primary key (doc_id, keyword));
insert into qp_doc_kw values
  (1, 'database'), (1, 'index'), (1, 'query'),
  (2, 'database'), (2, 'recovery'), (2, 'hash'),
  (3, 'index'), (3, 'btree'), (3, 'query'), (3, 'hash'),
  (4, 'query'),
  (5, 'hash'), (5, 'join'), (5, 'database'), (5, 'index'),
  (6, 'recovery'), (6, 'log');
create table qp_query_kw (keyword varchar(20) primary key);
insert into qp_query_kw values ('database'), ('index'), ('query'), ('hash');

-- ---------------------------------------------------------------- Size estimation
-- PE 16.5/16.6: r1(A, B, C), r2(C, D, E), r3(E, F).
create table qp_card (rel varchar(5) primary key, n integer not null);
insert into qp_card values ('r1', 1000), ('r2', 1500), ('r3', 750);
create table qp_vstats (rel varchar(5), attr varchar(5), v integer not null, primary key (rel, attr));
insert into qp_vstats values ('r1', 'C', 900), ('r2', 'C', 1100), ('r2', 'E', 50), ('r3', 'E', 100);

-- ---------------------------------------------------------------- Histogram
create table qp_emp (id integer primary key, dept varchar(10) not null, salary integer not null);
insert into qp_emp
select g,
       (array['sales', 'it', 'hr', 'ops'])[1 + g % 4],
       20000 + ((g * 7919) % 80000)
from generate_series(1, 200) as g;

-- ---------------------------------------------------------------- Join ordering
-- Four relations with sizes; qp_jpred lists join predicates and their selectivity.
-- A pair of relations without a predicate is a Cartesian product (selectivity 1).
create table qp_jrel (id integer primary key, name varchar(5) not null, n integer not null);
insert into qp_jrel values (0, 'A', 1000), (1, 'B', 100), (2, 'C', 5000), (3, 'D', 20);
create table qp_jpred (r1 integer, r2 integer, sel numeric not null, primary key (r1, r2));
insert into qp_jpred values (0, 1, 0.01), (1, 2, 0.001), (2, 3, 0.05);

-- ---------------------------------------------------------------- upper() join
create table qp_names_r (id integer primary key, name varchar(20));
insert into qp_names_r values (1, 'alice'), (2, 'Bob'), (3, 'CAROL'), (4, 'dave');
create table qp_names_s (code varchar(5) primary key, name varchar(20));
insert into qp_names_s values ('x1', 'ALICE'), ('x2', 'bob'), ('x3', 'Carol'), ('x4', 'erin'), ('x5', 'Alice');
