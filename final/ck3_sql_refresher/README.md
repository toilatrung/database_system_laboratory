# Ôn CK · Phần 3 — Ôn nhanh SQL & đại số quan hệ (phòng câu tổng hợp)

*SQL & Relational Algebra Refresher · Tổng hợp Chương 2–4, dữ liệu: bank / employee / insurance database của Practice Exercises*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ck3`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Vì sao có phần này
Đề cuối kỳ tập trung Chương 6–7, nhưng câu thiết kế thường kèm "viết DDL" hoặc "viết truy vấn trên lược đồ vừa thiết kế", và chuẩn hoá cần hiểu join/projection. Phần này ôn **thật nhanh** những gì hay ra nhất. Muốn ôn kỹ: Part 1 (Chương 2–4) và Part 3 (GK1–GK3).

### 1. Đại số quan hệ ↔ SQL
| Đại số | SQL |
|---|---|
| σ<sub>p</sub>(r) | `select * from r where p` |
| Π<sub>A,B</sub>(r) | `select distinct A, B from r` |
| r ∪ s, r − s, r ∩ s | `union`, `except`, `intersect` (tự loại trùng) |
| r × s | `from r, s` |
| r ⋈<sub>θ</sub> s | `r join s on θ` |
| r ⋈ s | `r natural join s` (cẩn thận cột trùng tên ngoài ý muốn) |
| r ⟕ s, r ⟖ s, r ⟗ s | `left / right / full outer join` |
| r ÷ s ("với mọi") | `not exists ((tập cần có) except (tập của đối tượng))` |
| <sub>G</sub>𝒢<sub>F(A)</sub>(r) | `select G, F(A) from r group by G` |
| ρ<sub>x</sub>(E) | `E as x` |

### 2. Khuôn truy vấn hay gặp
```sql
-- Đếm cả nhóm rỗng: outer join + count(cột bên phải)
select b.branch_name, count(a.account_number)
from branch b left join account a on a.branch_name = b.branch_name
group by b.branch_name;

-- Lớn nhất, có thể hoà
with t as (select company_name, count(*) as n from works group by company_name)
select company_name from t where n = (select max(n) from t);

-- Không có / chưa từng
select * from person p
where not exists (select * from participated x where x.driver_id = p.driver_id);
```
- `where` lọc dòng **trước** khi nhóm; `having` lọc **nhóm**.
- `x > all (S)`: lớn hơn max; `x > some (S)`: lớn hơn min; `in` = `= some`; `not in` = `<> all` (cẩn thận null trong S).
- Aggregate bỏ qua null; `count(*)` thì không. sum/avg của tập rỗng là null → dùng `coalesce`.

### 3. DDL & ràng buộc
```sql
create table policy (
  policy_no  varchar(10) primary key,
  driver_id  varchar(5) not null references person on delete cascade,
  premium    numeric(10,2) check (premium > 0),
  start_date date,
  end_date   date,
  check (end_date > start_date),
  unique (driver_id, start_date));
```
- PK = unique + not null; `unique` cho phép null; FK tham chiếu PK hoặc cột unique.
- `on delete cascade | set null`; `check` không chứa subquery trong PostgreSQL.

### 4. View & sửa dữ liệu
- `create view v(cột...) as select ...`; view có join/group by/distinct thì không update được.
- `insert into r select ...`, `delete from r where ... in (subquery)`, `update r set c = case ... end where ...`.

## 2. Trắc nghiệm (12 câu)

**Câu 1.** Π<sub>customer_city</sub>(customer) tương đương câu nào?

- A. select customer_city from customer
- B. select distinct customer_city from customer
- C. select * from customer
- D. select count(customer_city) from customer

<details><summary>Đáp án</summary>

**B** — Projection loại trùng.

</details>

**Câu 2.** Muốn liệt kê mọi customer kèm số account (0 nếu không có), phép join nào phù hợp?

- A. natural join
- B. customer left outer join depositor
- C. customer right outer join depositor
- D. cross join

<details><summary>Đáp án</summary>

**B** — Giữ lại mọi customer, phía depositor bù null.

</details>

**Câu 3.** Điều kiện chỉ áp dụng được sau khi nhóm (ví dụ count(*) >= 2) đặt ở đâu?

- A. where
- B. having
- C. from
- D. order by

<details><summary>Đáp án</summary>

**B** — having lọc nhóm.

</details>

**Câu 4.** `salary > some (select salary from works where company_name = 'Small Bank Corporation')` nghĩa là?

- A. Lớn hơn lương lớn nhất của Small Bank
- B. Lớn hơn lương nhỏ nhất của Small Bank
- C. Bằng một lương nào đó
- D. Lớn hơn trung bình

<details><summary>Đáp án</summary>

**B** — > some: lớn hơn ít nhất một giá trị, tức là lớn hơn min.

</details>

**Câu 5.** Nếu S chứa null, `x not in (S)` có thể cho kết quả gì với mọi x không thuộc S?

- A. true
- B. false
- C. unknown — dòng bị loại
- D. Lỗi

<details><summary>Đáp án</summary>

**C** — x <> null là unknown, nên not in không bao giờ true. Dùng not exists an toàn hơn.

</details>

**Câu 6.** Phép nào tương ứng "khách có account ở MỌI branch của Horseneck"?

- A. ∪
- B. −
- C. ÷
- D. ×

<details><summary>Đáp án</summary>

**C** — Division.

</details>

**Câu 7.** `select sum(balance) from account where branch_name = 'Lakeview'` khi Lakeview không có account trả về?

- A. 0
- B. null (một dòng)
- C. Không có dòng
- D. Lỗi

<details><summary>Đáp án</summary>

**B** — Aggregate không group by luôn trả một dòng; sum tập rỗng = null.

</details>

**Câu 8.** Ràng buộc nào cho phép giá trị null nhưng cấm trùng?

- A. primary key
- B. unique
- C. not null
- D. foreign key

<details><summary>Đáp án</summary>

**B** — unique cho phép null.

</details>

**Câu 9.** FK owns.license_plate → car có `on delete cascade`. Xoá một car thì?

- A. Bị từ chối
- B. Các dòng owns của xe đó bị xoá theo
- C. owns.license_plate thành null
- D. Không ảnh hưởng owns

<details><summary>Đáp án</summary>

**B** — cascade lan sang bảng referencing.

</details>

**Câu 10.** View nào UPDATE được (theo chuẩn SQL)?

- A. select branch_name, sum(balance) from account group by branch_name
- B. select account_number, balance from account where balance > 500
- C. select distinct branch_name from account
- D. select * from account natural join depositor

<details><summary>Đáp án</summary>

**B** — Một bảng, chỉ có cột, không aggregate/distinct/group by.

</details>

**Câu 11.** Kết quả `(select ID from depositor) union (select ID from borrower)` có dòng trùng không?

- A. Có
- B. Không — union tự loại trùng
- C. Chỉ khi có null
- D. Tuỳ DBMS

<details><summary>Đáp án</summary>

**B** — Dùng union all nếu muốn giữ trùng.

</details>

**Câu 12.** Đoạn `with t as (...) select ... from t where v = (select max(v) from t)` giải quyết vấn đề gì?

- A. Phân trang
- B. Lấy tất cả các dòng đạt max, kể cả hoà
- C. Tránh null
- D. Tăng tốc join

<details><summary>Đáp án</summary>

**B** — Khác với order by ... limit 1 (chỉ lấy một dòng).

</details>

## 3. Câu hỏi tự luận (4 câu)

**Câu 1.** Viết đại số quan hệ (insurance database): tên những người **sở hữu** một chiếc xe đã gặp tai nạn năm 2017 nhưng **không phải** là người lái trong vụ đó.

<details><summary>Gợi ý đáp án</summary>

D ← Π<sub>report_number, license_plate, driver_id</sub>(σ<sub>year = 2017</sub>(accident) ⋈ participated) — người **lái** trong mỗi vụ.

O ← ρ<sub>O(license_plate, owner_id)</sub>(owns) — **chủ** của mỗi xe (đổi tên để không trùng driver_id).

Kết quả: Π<sub>name</sub>(person ⋈<sub>person.driver_id = O.owner_id</sub> σ<sub>owner_id ≠ driver_id</sub>(D ⋈ O))

(D ⋈ O ghép theo license_plate; phải **rename** vì owns và participated cùng có driver_id — natural join không rename sẽ ép chủ = người lái, đúng cái ta muốn loại.)

**SQL** (dễ viết hơn, cũng là đáp án chấp nhận):
```sql
select distinct p.name
from accident a join participated x on x.report_number = a.report_number
     join owns o on o.license_plate = x.license_plate
     join person p on p.driver_id = o.driver_id
where a.year = 2017 and o.driver_id <> x.driver_id;
```
Với dữ liệu mẫu: Mary Lee (chủ DDD444, Chloe Park lái) và Brian Cho (đồng sở hữu EEE555).

</details>

**Câu 2.** So sánh 3 cách tìm "branch không có loan nào": `not in`, `not exists`, `left outer join ... is null`. Cách nào có thể sai khi có null?

<details><summary>Gợi ý đáp án</summary>

```sql
select branch_name from branch where branch_name not in (select branch_name from loan);
select branch_name from branch b where not exists (select * from loan l where l.branch_name = b.branch_name);
select b.branch_name from branch b left join loan l on l.branch_name = b.branch_name where l.loan_number is null;
```
**not in** sai (trả rỗng) nếu subquery chứa một `branch_name` null, vì `x <> null` là unknown. **not exists** và **left join + is null** (kiểm tra cột khoá của bảng phải) không bị ảnh hưởng.

</details>

**Câu 3.** Viết DDL cho bank database (branch, customer, loan, borrower, account, depositor) với PK, FK; giải thích vì sao borrower có khoá kép.

<details><summary>Gợi ý đáp án</summary>

```sql
create table branch (branch_name varchar(20) primary key, branch_city varchar(20), assets numeric(14,2) check (assets >= 0));
create table customer (ID varchar(5) primary key, customer_name varchar(20) not null, customer_street varchar(30), customer_city varchar(20));
create table loan (loan_number varchar(10) primary key, branch_name varchar(20) references branch, amount numeric(12,2));
create table borrower (ID varchar(5) references customer, loan_number varchar(10) references loan, primary key (ID, loan_number));
create table account (account_number varchar(10) primary key, branch_name varchar(20) references branch, balance numeric(12,2));
create table depositor (ID varchar(5) references customer, account_number varchar(10) references account, primary key (ID, account_number));
```
borrower biểu diễn quan hệ **nhiều–nhiều** customer–loan (một khách nhiều khoản vay, một khoản vay nhiều người đứng tên), nên khoá là hợp hai khoá của hai bên — đúng quy tắc chuyển relationship set many-to-many ở Chương 6.

</details>

**Câu 4.** Giải thích tại sao `select * from employee natural join works natural join company` trên employee database cho kết quả "lạ".

<details><summary>Gợi ý đáp án</summary>

employee có cột **city** (nơi ở) và company cũng có **city** (nơi đặt công ty). Natural join ghép theo **mọi** cột trùng tên, nên chỉ giữ nhân viên **sống đúng thành phố công ty đặt trụ sở** — không phải ý định. Cách đúng: `employee natural join works join company using (company_name)` hoặc `join ... on` rõ ràng. Đây là cùng loại bẫy với dept_name trong University (PE 4.1).

</details>

## 4. Bài tập SQL (15 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CK3.01 | join | ★☆☆ | Bank: customer_name, loan_number, branch_name và amount của mọi khoản vay (mỗi người đứng tên một dòng). |
| CK3.02 | left outer join + count | ★★☆ | Mọi customer: ID, customer_name và số account đứng tên (`num_accounts`, 0 nếu không có). |
| CK3.03 | group by / having | ★☆☆ | Các customer_city có ít nhất 2 khách hàng; trả về customer_city và số khách. |
| CK3.04 | in subquery | ★☆☆ | Insurance: name của những người sở hữu ít nhất một xe đời (year) 2010. |
| CK3.05 | not exists | ★★☆ | Insurance: driver_id và name của những người có sở hữu xe nhưng chưa từng là người lái trong vụ tai nạn nào. |
| CK3.06 | > all | ★★☆ | Employee: ID và salary của nhân viên có lương cao hơn mọi nhân viên của `Mega Corp`. |
| CK3.07 | union | ★☆☆ | Các thành phố có branch hoặc có khách hàng sinh sống (không trùng). |
| CK3.08 | with | ★★☆ | Insurance: với mỗi năm, tổng damage_amount của các vụ tai nạn trong năm đó; chỉ trả về các năm có tổng damage lớn hơn trung bình tổng damage của các năm. Trả về year, total_damage. |
| CK3.09 | scalar subquery | ★★☆ | Mọi branch: branch_name, assets và số account của branch (dùng scalar subquery trong select, không dùng join). |
| CK3.10 | case + group by | ★★☆ | Phân loại account theo balance: dưới 500 là `'low'`, từ 500 đến dưới 800 là `'medium'`, còn lại `'high'`. Trả về level và số account mỗi loại. |
| CK3.11 | DDL + constraints | ★★☆ | Tạo bảng `policy(policy_no, driver_id, premium, start_date, end_date)`: policy_no là primary key; driver_id bắt buộc và là foreign key tới person; premium > 0; end_date phải sau start_date. |
| CK3.12 | create view | ★☆☆ | Tạo view `accident_damage(report_number, year, total_damage)` — tổng thiệt hại của từng vụ tai nạn. |
| CK3.13 | delete + subquery | ★★☆ | Xoá mọi chiếc xe đời trước 2016 chưa từng gặp tai nạn nào. (owns có on delete cascade.) |
| CK3.14 | update + subquery | ★☆☆ | Tăng 5% amount của các loan thuộc branch nằm ở thành phố `Horseneck`. |
| CK3.15 | division | ★★★ | ID và customer_name của khách có account ở mọi branch mà khách `'12345'` có account (kể cả chính 12345). |
