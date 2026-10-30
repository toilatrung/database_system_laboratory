-- =====================================================================
-- CS4420 · Ôn CK · Phần 2 — Practice Exercises Chương 7 (Normalization) (Practice Exercises — Chapter 7)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CK2.01  [PE 7.2 — test FD]  ★☆☆
-- Đề gốc: Exercise 7.2. List every nontrivial functional dependency satisfied by the relation of Figure 7.18.
--
-- *Figure 7.18 — Relation of Exercise 7.2:*
--
-- | A | B | C |
-- |---|---|---|
-- | a1 | b1 | c1 |
-- | a1 | b1 | c2 |
-- | a2 | b1 | c1 |
-- | a2 | b1 | c3 |
--
-- Bảng `nf_r_abc(a, b, c)` là instance của PE 7.2. Trả về một dòng, 6 cột boolean theo thứ tự `a_b, a_c, b_a, b_c, c_a, c_b` cho biết mỗi FD A → B, A → C, B → A, B → C, C → A, C → B có thoả trên instance không.
-- Gợi ý: X → Y thoả ⇔ not exists (select X from r group by X having count(distinct Y) > 1)
select not exists (select a from nf_r_abc group by a having count(distinct b) > 1) as a_b,
       not exists (select a from nf_r_abc group by a having count(distinct c) > 1) as a_c,
       not exists (select b from nf_r_abc group by b having count(distinct a) > 1) as b_a,
       not exists (select b from nf_r_abc group by b having count(distinct c) > 1) as b_c,
       not exists (select c from nf_r_abc group by c having count(distinct a) > 1) as c_a,
       not exists (select c from nf_r_abc group by c having count(distinct b) > 1) as c_b;

-- @ex CK2.02  [PE 7.2 — composite FD]  ★★☆
-- Đề gốc: Exercise 7.2. List every nontrivial functional dependency satisfied by the relation of Figure 7.18.
--
-- *Figure 7.18 — Relation of Exercise 7.2:*
--
-- | A | B | C |
-- |---|---|---|
-- | a1 | b1 | c1 |
-- | a1 | b1 | c2 |
-- | a2 | b1 | c1 |
-- | a2 | b1 | c3 |
--
-- Tiếp PE 7.2: trả về một dòng ba cột boolean: `ac_b` (AC → B có thoả), `ab_c` (AB → C có thoả), `ac_unique` (AC có xác định duy nhất mỗi dòng trên instance).
select not exists (select a, c from nf_r_abc group by a, c having count(distinct b) > 1) as ac_b,
       not exists (select a, b from nf_r_abc group by a, b having count(distinct c) > 1) as ab_c,
       count(*) = count(distinct (a, c)) as ac_unique
from nf_r_abc;

-- @ex CK2.03  [PE 7.9 — test FD]  ★☆☆
-- Đề gốc: Exercise 7.9. For the schema R(A, B, C) and a relation r on R, write an SQL query that tests whether the functional dependency B → C holds on r. Also write an SQL assertion that enforces this dependency. Assume no null values are present. (Such assertions belong to the SQL standard but no database implementation currently supports them.)
--
-- PE 7.9a: bảng `nf_pe79_r(a, b, c)`. Viết câu truy vấn trả về các giá trị b vi phạm FD B → C (kết quả rỗng ⇔ FD đúng).
select b from nf_pe79_r group by b having count(distinct c) > 1;

-- @ex CK2.04  [PE 7.9 — enforce FD]  ★★★
-- Đề gốc: Exercise 7.9. For the schema R(A, B, C) and a relation r on R, write an SQL query that tests whether the functional dependency B → C holds on r. Also write an SQL assertion that enforces this dependency. Assume no null values are present. (Such assertions belong to the SQL standard but no database implementation currently supports them.)
--
-- PE 7.9b: PostgreSQL không hỗ trợ `create assertion`. Hãy ép FD B → C trên bảng `nf_pe79_clean(a, b, c)` bằng trigger (before insert or update, raise exception khi có dòng khác cùng b mà khác c).
-- Hệ thống thử chèn (4, 'x', 11) — phải bị từ chối — và (5, 'x', 10) — phải thành công.
create function nf_pe79_b_to_c() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from nf_pe79_clean
             where b = new.b and c <> new.c and a <> new.a) then
    raise exception 'FD B -> C violated for b = %', new.b;
  end if;
  return new;
end $$;

create trigger nf_pe79_fd
before insert or update on nf_pe79_clean
for each row execute function nf_pe79_b_to_c();

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into nf_pe79_clean values (4, 'x', 11)$$) <> 'ok' as violating_rejected,
--          try_sql($$insert into nf_pe79_clean values (5, 'x', 10)$$) as valid_insert;

-- @ex CK2.05  [PE 7.1 — lossless]  ★★☆
-- Đề gốc: Exercise 7.1. The schema R = (A, B, C, D, E) is decomposed into (A, B, C) and (A, D, E). Show that this decomposition is lossless when the following set F of functional dependencies holds:
--
-- A → BC, CD → E, B → D, E → A
--
-- PE 7.1 trên dữ liệu: `nf_pe71(a, b, c, d, e)` thoả F = {A → BC, CD → E, B → D, E → A}. Phân rã thành (a, b, c) và (a, d, e). Trả về một dòng ba cột `joined_rows`, `extra`, `missing` (số tuple thừa / thiếu của join so với bảng gốc).
with j as (
  select a, b, c, d, e
  from (select a, b, c from nf_pe71) r1 natural join (select a, d, e from nf_pe71) r2
)
select (select count(*) from j) as joined_rows,
       (select count(*) from (select * from j except select * from nf_pe71) x) as extra,
       (select count(*) from (select * from nf_pe71 except select * from j) y) as missing;

-- @ex CK2.06  [PE 7.6 — keys on data]  ★★☆
-- Đề gốc: Exercise 7.6. For the relation schema R = (A, B, C, D, E), compute the closure of the following set F of functional dependencies:
--
-- A → BC, CD → E, B → D, E → A
--
-- List the candidate keys of R.
--
-- PE 7.6: candidate key là A, E, BC, CD; B không phải key. Minh hoạ trên `nf_pe71`: trả về một dòng 5 cột boolean `a, e, bc, cd, b` — mỗi tập có xác định duy nhất mỗi dòng của instance không.
select count(*) = count(distinct a) as a,
       count(*) = count(distinct e) as e,
       count(*) = count(distinct (b, c)) as bc,
       count(*) = count(distinct (c, d)) as cd,
       count(*) = count(distinct b) as b
from nf_pe71;

-- @ex CK2.07  [PE 7.13 — lost FD]  ★★★
-- Đề gốc: Exercise 7.13. Show that the decomposition of Exercise 7.1 does not preserve dependencies.
--
-- PE 7.13 trên dữ liệu: tạo `nf_pe71_r1(a primary key, b, c)` và `nf_pe71_r2(a primary key, d, e)` từ nf_pe71 (A là key của cả hai). Rồi chèn ('a5', 'b1', 'c9') vào r1 và ('a5', 'd9', 'e9') vào r2 — ràng buộc của từng bảng đều thoả.
-- (Hệ thống join hai bảng và tìm các b vi phạm B → D — FD không được bảo toàn.)
create table nf_pe71_r1 (a varchar(2) primary key, b varchar(2), c varchar(2));
create table nf_pe71_r2 (a varchar(2) primary key, d varchar(2), e varchar(2));
insert into nf_pe71_r1 select a, b, c from nf_pe71;
insert into nf_pe71_r2 select a, d, e from nf_pe71;
insert into nf_pe71_r1 values ('a5', 'b1', 'c9');
insert into nf_pe71_r2 values ('a5', 'd9', 'e9');

-- Câu truy vấn hệ thống dùng để chấm:
--   select b, count(distinct d) as d_values
--   from nf_pe71_r1 natural join nf_pe71_r2
--   group by b having count(distinct d) > 1;

-- @ex CK2.08  [PE 7.10 — nulls]  ★★☆
-- Đề gốc: Exercise 7.10. Our treatment of lossless decomposition silently assumed that attributes on the left-hand side of a functional dependency cannot be null. What could go wrong in a decomposition if this assumption is violated?
--
-- PE 7.10: `nf_pe710(a, b, c)` với A → B, một số dòng có a là null. Phân rã thành (a, b) và (a, c). Trả về các dòng của bảng gốc bị mất sau natural join (cột a, b, c).
-- Gợi ý: select * from nf_pe710 except select a, b, c from (...) natural join (...)
select a, b, c from nf_pe710
except
select a, b, c from (select a, b from nf_pe710) r1 natural join (select a, c from nf_pe710) r2;

-- @ex CK2.09  [PE 7.11 — PK/FK]  ★★☆
-- Đề gốc: Exercise 7.11. In the BCNF decomposition algorithm, suppose a functional dependency α → β is used to decompose a relation schema r(α, β, γ) into r[1](α, β) and r[2](α, γ).
--
-- a. Which primary-key and foreign-key constraints do you expect to hold on the decomposed relations?
--
-- b. Give an example of an inconsistency that an erroneous update could cause if the foreign-key constraint were not enforced on these decomposed relations.
--
-- c. When a relation schema is decomposed into 3NF with the algorithm of Section 7.5.2, which primary-key and foreign-key dependencies would you expect on the decomposed schema?
--
-- PE 7.11: phân rã BCNF `nf_in_dep` theo dept_name → building, budget thành `nf_dept(dept_name primary key, building, budget)` và `nf_inst(ID primary key, name, salary, dept_name)` với dept_name foreign key tham chiếu nf_dept; chép dữ liệu sang.
-- (Hệ thống thử xoá khoa Physics khỏi nf_dept và chèn giảng viên thuộc khoa 'Nowhere' — cả hai phải bị foreign key chặn, mã 23503.)
create table nf_dept (dept_name varchar(20) primary key, building varchar(15), budget numeric(12,2));
create table nf_inst (ID varchar(5) primary key, name varchar(20), salary numeric(8,2),
                      dept_name varchar(20) references nf_dept);
insert into nf_dept select distinct dept_name, building, budget from nf_in_dep;
insert into nf_inst select ID, name, salary, dept_name from nf_in_dep;

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$delete from nf_dept where dept_name = 'Physics'$$) as delete_referenced,
--          try_sql($$insert into nf_inst values ('99999', 'Nobody', 1000, 'Nowhere')$$) as insert_dangling,
--          (select count(*) from nf_inst) as instructors;

-- @ex CK2.10  [PE 7.12 — u ⊆ join]  ★★☆
-- Đề gốc: Exercise 7.12. Let R[1], R[2], …, R[n] be a decomposition of schema U, let u(U) be a relation, and let r[i] = Π[Ri](u). Show that
--
-- u ⊆ r[1] ⋈ r[2] ⋈ ⋯ ⋈ r[n]
--
-- PE 7.12 trên dữ liệu: u = `nf_r_abc`, phân rã (a, b), (b, c) — r₁, r₂ là projection (loại trùng). Trả về một dòng ba cột: `u_rows`, `joined_rows`, `missing` (số tuple của u không có trong join — phải bằng 0).
with j as (select a, b, c from (select distinct a, b from nf_r_abc) r1 natural join (select distinct b, c from nf_r_abc) r2)
select (select count(*) from nf_r_abc) as u_rows,
       (select count(*) from j) as joined_rows,
       (select count(*) from (select * from nf_r_abc except select * from j) x) as missing;

-- @ex CK2.11  [PE 7.17 — 3 BCNF decompositions]  ★★★
-- Đề gốc: Exercise 7.17. Give an example of a relation schema R′ and a set F′ of functional dependencies for which there are at least three distinct lossless decompositions of R′ into BCNF.
--
-- PE 7.17: `nf_pe717(a, b, c, d)` thoả A → B, C → D, B → C. Với ba phân rã {(a,b),(c,d),(b,c)}, {(a,b),(c,d),(a,c)}, {(b,c),(a,d),(a,b)}, trả về một dòng ba cột `extra1, extra2, extra3`: số tuple thừa của natural join các projection so với bảng gốc (lossless ⇒ 0).
with r as (select distinct * from nf_pe717),
j1 as (select a, b, c, d from (select distinct a, b from r) x natural join (select distinct c, d from r) y natural join (select distinct b, c from r) z),
j2 as (select a, b, c, d from (select distinct a, b from r) x natural join (select distinct c, d from r) y natural join (select distinct a, c from r) z),
j3 as (select a, b, c, d from (select distinct b, c from r) x natural join (select distinct a, d from r) y natural join (select distinct a, b from r) z)
select (select count(*) from (select * from j1 except select * from r) t) as extra1,
       (select count(*) from (select * from j2 except select * from r) t) as extra2,
       (select count(*) from (select * from j3 except select * from r) t) as extra3;

-- @ex CK2.12  [PE 7.20 — MVD vs FD]  ★★☆
-- Đề gốc: Exercise 7.20. Give an example of a relation schema R and a set of dependencies for which R is in BCNF but not in 4NF.
--
-- PE 7.20: `nf_pe720(a, b, c)`. Trả về một dòng hai cột boolean: `mvd_a_b` — A →→ B thoả trên instance (với mỗi a, các dòng là đủ mọi tổ hợp b × c); `fd_a_b` — FD A → B có thoả không.
select not exists (select a from nf_pe720 group by a
                   having count(*) <> count(distinct b) * count(distinct c)) as mvd_a_b,
       not exists (select a from nf_pe720 group by a having count(distinct b) > 1) as fd_a_b;

-- @ex CK2.13  [PE 7.20 — 4NF]  ★★☆
-- Đề gốc: Exercise 7.20. Give an example of a relation schema R and a set of dependencies for which R is in BCNF but not in 4NF.
--
-- Phân rã 4NF của PE 7.20: tạo `nf_pe720_ab(a, b)` và `nf_pe720_ac(a, c)` bằng `create table ... as select distinct`. (Hệ thống đếm dòng hai bảng và số tuple thừa của join so với nf_pe720.)
create table nf_pe720_ab as select distinct a, b from nf_pe720;
create table nf_pe720_ac as select distinct a, c from nf_pe720;

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select count(*) from nf_pe720_ab) as ab_rows,
--          (select count(*) from nf_pe720_ac) as ac_rows,
--          (select count(*) from (select a, b, c from nf_pe720_ab natural join nf_pe720_ac
--                                 except select * from nf_pe720) x) as extra;

-- @ex CK2.14  [PE 7.3 — cardinality via FD]  ★☆☆
-- Đề gốc: Exercise 7.3. Explain how functional dependencies can be used to express each of the following:
--
-- - a one-to-one relationship set exists between the entity sets *student* and *instructor*;
-- - a many-to-one relationship set exists between the entity sets *student* and *instructor*.
--
-- PE 7.3 trên bảng `advisor(s_ID, i_ID)` của University: trả về một dòng hai cột boolean `s_to_i` (s_ID → i_ID có thoả) và `i_to_s` (i_ID → s_ID có thoả). Kết quả cho biết quan hệ advisor là một-một hay nhiều-một?
select not exists (select s_ID from advisor group by s_ID having count(distinct i_ID) > 1) as s_to_i,
       not exists (select i_ID from advisor group by i_ID having count(distinct s_ID) > 1) as i_to_s;
