export default {
  key: 'ck3',
  slug: 'ck3_sql_refresher',
  label: 'Ôn CK · Phần 3',
  navLabel: 'CK3',
  kind: 'Ôn tập',
  short: 'CK3',
  title: 'SQL & Relational Algebra Refresher',
  titleVi: 'Ôn nhanh SQL & đại số quan hệ (phòng câu tổng hợp)',
  source: 'Tổng hợp Chương 2–4, dữ liệu: bank / employee / insurance database của Practice Exercises',

  summary: `
### 0. Vì sao có phần này
Đề cuối kỳ tập trung Chương 6–7, nhưng câu thiết kế thường kèm "viết DDL" hoặc "viết truy vấn trên lược đồ vừa thiết kế", và chuẩn hoá cần hiểu join/projection. Phần này ôn **thật nhanh** những gì hay ra nhất. Muốn ôn kỹ: Part 1 (Chương 2–4) và Part 3 (GK1–GK3).

### 1. Đại số quan hệ ↔ SQL
| Đại số | SQL |
|---|---|
| σ<sub>p</sub>(r) | \`select * from r where p\` |
| Π<sub>A,B</sub>(r) | \`select distinct A, B from r\` |
| r ∪ s, r − s, r ∩ s | \`union\`, \`except\`, \`intersect\` (tự loại trùng) |
| r × s | \`from r, s\` |
| r ⋈<sub>θ</sub> s | \`r join s on θ\` |
| r ⋈ s | \`r natural join s\` (cẩn thận cột trùng tên ngoài ý muốn) |
| r ⟕ s, r ⟖ s, r ⟗ s | \`left / right / full outer join\` |
| r ÷ s ("với mọi") | \`not exists ((tập cần có) except (tập của đối tượng))\` |
| <sub>G</sub>𝒢<sub>F(A)</sub>(r) | \`select G, F(A) from r group by G\` |
| ρ<sub>x</sub>(E) | \`E as x\` |

### 2. Khuôn truy vấn hay gặp
\`\`\`sql
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
\`\`\`
- \`where\` lọc dòng **trước** khi nhóm; \`having\` lọc **nhóm**.
- \`x > all (S)\`: lớn hơn max; \`x > some (S)\`: lớn hơn min; \`in\` = \`= some\`; \`not in\` = \`<> all\` (cẩn thận null trong S).
- Aggregate bỏ qua null; \`count(*)\` thì không. sum/avg của tập rỗng là null → dùng \`coalesce\`.

### 3. DDL & ràng buộc
\`\`\`sql
create table policy (
  policy_no  varchar(10) primary key,
  driver_id  varchar(5) not null references person on delete cascade,
  premium    numeric(10,2) check (premium > 0),
  start_date date,
  end_date   date,
  check (end_date > start_date),
  unique (driver_id, start_date));
\`\`\`
- PK = unique + not null; \`unique\` cho phép null; FK tham chiếu PK hoặc cột unique.
- \`on delete cascade | set null\`; \`check\` không chứa subquery trong PostgreSQL.

### 4. View & sửa dữ liệu
- \`create view v(cột...) as select ...\`; view có join/group by/distinct thì không update được.
- \`insert into r select ...\`, \`delete from r where ... in (subquery)\`, \`update r set c = case ... end where ...\`.
`,

  quiz: [
    {
      q: 'Π<sub>customer_city</sub>(customer) tương đương câu nào?',
      options: ['select customer_city from customer', 'select distinct customer_city from customer', 'select * from customer', 'select count(customer_city) from customer'],
      answer: 1,
      explain: 'Projection loại trùng.',
    },
    {
      q: 'Muốn liệt kê mọi customer kèm số account (0 nếu không có), phép join nào phù hợp?',
      options: ['natural join', 'customer left outer join depositor', 'customer right outer join depositor', 'cross join'],
      answer: 1,
      explain: 'Giữ lại mọi customer, phía depositor bù null.',
    },
    {
      q: 'Điều kiện chỉ áp dụng được sau khi nhóm (ví dụ count(*) >= 2) đặt ở đâu?',
      options: ['where', 'having', 'from', 'order by'],
      answer: 1,
      explain: 'having lọc nhóm.',
    },
    {
      q: '`salary > some (select salary from works where company_name = \'Small Bank Corporation\')` nghĩa là?',
      options: ['Lớn hơn lương lớn nhất của Small Bank', 'Lớn hơn lương nhỏ nhất của Small Bank', 'Bằng một lương nào đó', 'Lớn hơn trung bình'],
      answer: 1,
      explain: '> some: lớn hơn ít nhất một giá trị, tức là lớn hơn min.',
    },
    {
      q: 'Nếu S chứa null, `x not in (S)` có thể cho kết quả gì với mọi x không thuộc S?',
      options: ['true', 'false', 'unknown — dòng bị loại', 'Lỗi'],
      answer: 2,
      explain: 'x <> null là unknown, nên not in không bao giờ true. Dùng not exists an toàn hơn.',
    },
    {
      q: 'Phép nào tương ứng "khách có account ở MỌI branch của Horseneck"?',
      options: ['∪', '−', '÷', '×'],
      answer: 2,
      explain: 'Division.',
    },
    {
      q: '`select sum(balance) from account where branch_name = \'Lakeview\'` khi Lakeview không có account trả về?',
      options: ['0', 'null (một dòng)', 'Không có dòng', 'Lỗi'],
      answer: 1,
      explain: 'Aggregate không group by luôn trả một dòng; sum tập rỗng = null.',
    },
    {
      q: 'Ràng buộc nào cho phép giá trị null nhưng cấm trùng?',
      options: ['primary key', 'unique', 'not null', 'foreign key'],
      answer: 1,
      explain: 'unique cho phép null.',
    },
    {
      q: 'FK owns.license_plate → car có `on delete cascade`. Xoá một car thì?',
      options: ['Bị từ chối', 'Các dòng owns của xe đó bị xoá theo', 'owns.license_plate thành null', 'Không ảnh hưởng owns'],
      answer: 1,
      explain: 'cascade lan sang bảng referencing.',
    },
    {
      q: 'View nào UPDATE được (theo chuẩn SQL)?',
      options: ['select branch_name, sum(balance) from account group by branch_name', 'select account_number, balance from account where balance > 500', 'select distinct branch_name from account', 'select * from account natural join depositor'],
      answer: 1,
      explain: 'Một bảng, chỉ có cột, không aggregate/distinct/group by.',
    },
    {
      q: 'Kết quả `(select ID from depositor) union (select ID from borrower)` có dòng trùng không?',
      options: ['Có', 'Không — union tự loại trùng', 'Chỉ khi có null', 'Tuỳ DBMS'],
      answer: 1,
      explain: 'Dùng union all nếu muốn giữ trùng.',
    },
    {
      q: 'Đoạn `with t as (...) select ... from t where v = (select max(v) from t)` giải quyết vấn đề gì?',
      options: ['Phân trang', 'Lấy tất cả các dòng đạt max, kể cả hoà', 'Tránh null', 'Tăng tốc join'],
      answer: 1,
      explain: 'Khác với order by ... limit 1 (chỉ lấy một dòng).',
    },
  ],

  questions: [
    {
      q: 'Viết đại số quan hệ (insurance database): tên những người **sở hữu** một chiếc xe đã gặp tai nạn năm 2017 nhưng **không phải** là người lái trong vụ đó.',
      answer: `D ← Π<sub>report_number, license_plate, driver_id</sub>(σ<sub>year = 2017</sub>(accident) ⋈ participated) — người **lái** trong mỗi vụ.

O ← ρ<sub>O(license_plate, owner_id)</sub>(owns) — **chủ** của mỗi xe (đổi tên để không trùng driver_id).

Kết quả: Π<sub>name</sub>(person ⋈<sub>person.driver_id = O.owner_id</sub> σ<sub>owner_id ≠ driver_id</sub>(D ⋈ O))

(D ⋈ O ghép theo license_plate; phải **rename** vì owns và participated cùng có driver_id — natural join không rename sẽ ép chủ = người lái, đúng cái ta muốn loại.)

**SQL** (dễ viết hơn, cũng là đáp án chấp nhận):
\`\`\`sql
select distinct p.name
from accident a join participated x on x.report_number = a.report_number
     join owns o on o.license_plate = x.license_plate
     join person p on p.driver_id = o.driver_id
where a.year = 2017 and o.driver_id <> x.driver_id;
\`\`\`
Với dữ liệu mẫu: Mary Lee (chủ DDD444, Chloe Park lái) và Brian Cho (đồng sở hữu EEE555).`,
    },
    {
      q: 'So sánh 3 cách tìm "branch không có loan nào": `not in`, `not exists`, `left outer join ... is null`. Cách nào có thể sai khi có null?',
      answer: `\`\`\`sql
select branch_name from branch where branch_name not in (select branch_name from loan);
select branch_name from branch b where not exists (select * from loan l where l.branch_name = b.branch_name);
select b.branch_name from branch b left join loan l on l.branch_name = b.branch_name where l.loan_number is null;
\`\`\`
**not in** sai (trả rỗng) nếu subquery chứa một \`branch_name\` null, vì \`x <> null\` là unknown. **not exists** và **left join + is null** (kiểm tra cột khoá của bảng phải) không bị ảnh hưởng.`,
    },
    {
      q: 'Viết DDL cho bank database (branch, customer, loan, borrower, account, depositor) với PK, FK; giải thích vì sao borrower có khoá kép.',
      answer: `\`\`\`sql
create table branch (branch_name varchar(20) primary key, branch_city varchar(20), assets numeric(14,2) check (assets >= 0));
create table customer (ID varchar(5) primary key, customer_name varchar(20) not null, customer_street varchar(30), customer_city varchar(20));
create table loan (loan_number varchar(10) primary key, branch_name varchar(20) references branch, amount numeric(12,2));
create table borrower (ID varchar(5) references customer, loan_number varchar(10) references loan, primary key (ID, loan_number));
create table account (account_number varchar(10) primary key, branch_name varchar(20) references branch, balance numeric(12,2));
create table depositor (ID varchar(5) references customer, account_number varchar(10) references account, primary key (ID, account_number));
\`\`\`
borrower biểu diễn quan hệ **nhiều–nhiều** customer–loan (một khách nhiều khoản vay, một khoản vay nhiều người đứng tên), nên khoá là hợp hai khoá của hai bên — đúng quy tắc chuyển relationship set many-to-many ở Chương 6.`,
    },
    {
      q: 'Giải thích tại sao `select * from employee natural join works natural join company` trên employee database cho kết quả "lạ".',
      answer: `employee có cột **city** (nơi ở) và company cũng có **city** (nơi đặt công ty). Natural join ghép theo **mọi** cột trùng tên, nên chỉ giữ nhân viên **sống đúng thành phố công ty đặt trụ sở** — không phải ý định. Cách đúng: \`employee natural join works join company using (company_name)\` hoặc \`join ... on\` rõ ràng. Đây là cùng loại bẫy với dept_name trong University (PE 4.1).`,
    },
  ],

  exercises: [
    {
      id: 'CK3.01', topic: 'join', level: 1,
      prompt: 'Bank: customer_name, loan_number, branch_name và amount của mọi khoản vay (mỗi người đứng tên một dòng).',
      solution: `select c.customer_name, l.loan_number, l.branch_name, l.amount
from customer c join borrower b on b.ID = c.ID
     join loan l on l.loan_number = b.loan_number;`,
    },
    {
      id: 'CK3.02', topic: 'left outer join + count', level: 2,
      prompt: 'Mọi customer: ID, customer_name và số account đứng tên (`num_accounts`, 0 nếu không có).',
      solution: `select c.ID, c.customer_name, count(d.account_number) as num_accounts
from customer c left outer join depositor d on d.ID = c.ID
group by c.ID, c.customer_name;`,
    },
    {
      id: 'CK3.03', topic: 'group by / having', level: 1,
      prompt: 'Các customer_city có **ít nhất 2** khách hàng; trả về customer_city và số khách.',
      solution: `select customer_city, count(*) as num_customers
from customer
group by customer_city
having count(*) >= 2;`,
    },
    {
      id: 'CK3.04', topic: 'in subquery', level: 1,
      prompt: 'Insurance: name của những người sở hữu ít nhất một xe đời (year) 2010.',
      solution: `select name from person
where driver_id in (select o.driver_id from owns o join car c on c.license_plate = o.license_plate
                    where c.year = 2010);`,
    },
    {
      id: 'CK3.05', topic: 'not exists', level: 2,
      prompt: 'Insurance: driver_id và name của những người **có sở hữu xe** nhưng **chưa từng là người lái** trong vụ tai nạn nào.',
      solution: `select p.driver_id, p.name
from person p
where exists (select * from owns o where o.driver_id = p.driver_id)
  and not exists (select * from participated x where x.driver_id = p.driver_id);`,
    },
    {
      id: 'CK3.06', topic: '> all', level: 2,
      prompt: 'Employee: ID và salary của nhân viên có lương cao hơn **mọi** nhân viên của `Mega Corp`.',
      solution: `select ID, salary from works
where salary > all (select salary from works where company_name = 'Mega Corp');`,
    },
    {
      id: 'CK3.07', topic: 'union', level: 1,
      prompt: 'Các thành phố có branch **hoặc** có khách hàng sinh sống (không trùng).',
      solution: `(select branch_city from branch)
union
(select customer_city from customer);`,
    },
    {
      id: 'CK3.08', topic: 'with', level: 2,
      prompt: 'Insurance: với mỗi năm, tổng damage_amount của các vụ tai nạn trong năm đó; chỉ trả về các năm có tổng damage **lớn hơn trung bình** tổng damage của các năm. Trả về year, total_damage.',
      solution: `with by_year as (
  select a.year, sum(x.damage_amount) as total_damage
  from accident a join participated x on x.report_number = a.report_number
  group by a.year)
select year, total_damage from by_year
where total_damage > (select avg(total_damage) from by_year);`,
    },
    {
      id: 'CK3.09', topic: 'scalar subquery', level: 2,
      prompt: 'Mọi branch: branch_name, assets và số account của branch (dùng **scalar subquery** trong select, không dùng join).',
      solution: `select branch_name, assets,
       (select count(*) from account a where a.branch_name = b.branch_name) as num_accounts
from branch b;`,
    },
    {
      id: 'CK3.10', topic: 'case + group by', level: 2,
      prompt: `Phân loại account theo balance: dưới 500 là \`'low'\`, từ 500 đến dưới 800 là \`'medium'\`, còn lại \`'high'\`. Trả về level và số account mỗi loại.`,
      solution: `select case when balance < 500 then 'low'
            when balance < 800 then 'medium'
            else 'high' end as level,
       count(*)
from account
group by 1;`,
    },
    {
      id: 'CK3.11', topic: 'DDL + constraints', level: 2,
      prompt: 'Tạo bảng `policy(policy_no, driver_id, premium, start_date, end_date)`: policy_no là primary key; driver_id **bắt buộc** và là foreign key tới person; premium > 0; end_date phải sau start_date.',
      solution: `create table policy (
  policy_no  varchar(10) primary key,
  driver_id  varchar(5) not null references person,
  premium    numeric(10,2) check (premium > 0),
  start_date date,
  end_date   date,
  check (end_date > start_date));`,
      check: `select try_sql($$insert into policy values ('P1', '12345', 500, '2024-01-01', '2025-01-01')$$) as valid_row,
       try_sql($$insert into policy values ('P1', '22222', 300, '2024-01-01', '2025-01-01')$$) as dup_key,
       try_sql($$insert into policy values ('P2', null, 300, '2024-01-01', '2025-01-01')$$) as null_driver,
       try_sql($$insert into policy values ('P3', '99999', 300, '2024-01-01', '2025-01-01')$$) as bad_driver,
       try_sql($$insert into policy values ('P4', '22222', 0, '2024-01-01', '2025-01-01')$$) as zero_premium,
       try_sql($$insert into policy values ('P5', '22222', 100, '2025-01-01', '2024-01-01')$$) as bad_dates;`,
    },
    {
      id: 'CK3.12', topic: 'create view', level: 1,
      prompt: 'Tạo view `accident_damage(report_number, year, total_damage)` — tổng thiệt hại của từng vụ tai nạn.',
      solution: `create view accident_damage (report_number, year, total_damage) as
  select a.report_number, a.year, sum(x.damage_amount)
  from accident a join participated x on x.report_number = a.report_number
  group by a.report_number, a.year;`,
      check: `select * from accident_damage;`,
    },
    {
      id: 'CK3.13', topic: 'delete + subquery', level: 2,
      prompt: 'Xoá mọi chiếc xe đời **trước 2016** chưa từng gặp tai nạn nào. (owns có on delete cascade.)',
      solution: `delete from car
where year < 2016
  and license_plate not in (select license_plate from participated);`,
      check: `select c.license_plate, (select count(*) from owns o where o.license_plate = c.license_plate) as owners
from car c;`,
    },
    {
      id: 'CK3.14', topic: 'update + subquery', level: 1,
      prompt: 'Tăng 5% amount của các loan thuộc branch nằm ở thành phố `Horseneck`.',
      solution: `update loan set amount = amount * 1.05
where branch_name in (select branch_name from branch where branch_city = 'Horseneck');`,
      check: `select loan_number, amount from loan;`,
    },
    {
      id: 'CK3.15', topic: 'division', level: 3,
      prompt: `ID và customer_name của khách có account ở **mọi** branch mà khách \`'12345'\` có account (kể cả chính 12345).`,
      solution: `select c.ID, c.customer_name
from customer c
where not exists (
  (select a.branch_name from depositor d join account a on a.account_number = d.account_number
   where d.ID = '12345')
  except
  (select a.branch_name from depositor d join account a on a.account_number = d.account_number
   where d.ID = c.ID));`,
    },
  ],
};
