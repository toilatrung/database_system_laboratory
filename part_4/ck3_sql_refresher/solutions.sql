-- =====================================================================
-- CS4420 · Ôn CK · Phần 3 — Ôn nhanh SQL & đại số quan hệ (phòng câu tổng hợp) (SQL & Relational Algebra Refresher)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CK3.01  [join]  ★☆☆
-- Bank: customer_name, loan_number, branch_name và amount của mọi khoản vay (mỗi người đứng tên một dòng).
select c.customer_name, l.loan_number, l.branch_name, l.amount
from customer c join borrower b on b.ID = c.ID
     join loan l on l.loan_number = b.loan_number;

-- @ex CK3.02  [left outer join + count]  ★★☆
-- Mọi customer: ID, customer_name và số account đứng tên (`num_accounts`, 0 nếu không có).
select c.ID, c.customer_name, count(d.account_number) as num_accounts
from customer c left outer join depositor d on d.ID = c.ID
group by c.ID, c.customer_name;

-- @ex CK3.03  [group by / having]  ★☆☆
-- Các customer_city có ít nhất 2 khách hàng; trả về customer_city và số khách.
select customer_city, count(*) as num_customers
from customer
group by customer_city
having count(*) >= 2;

-- @ex CK3.04  [in subquery]  ★☆☆
-- Insurance: name của những người sở hữu ít nhất một xe đời (year) 2010.
select name from person
where driver_id in (select o.driver_id from owns o join car c on c.license_plate = o.license_plate
                    where c.year = 2010);

-- @ex CK3.05  [not exists]  ★★☆
-- Insurance: driver_id và name của những người có sở hữu xe nhưng chưa từng là người lái trong vụ tai nạn nào.
select p.driver_id, p.name
from person p
where exists (select * from owns o where o.driver_id = p.driver_id)
  and not exists (select * from participated x where x.driver_id = p.driver_id);

-- @ex CK3.06  [> all]  ★★☆
-- Employee: ID và salary của nhân viên có lương cao hơn mọi nhân viên của `Mega Corp`.
select ID, salary from works
where salary > all (select salary from works where company_name = 'Mega Corp');

-- @ex CK3.07  [union]  ★☆☆
-- Các thành phố có branch hoặc có khách hàng sinh sống (không trùng).
(select branch_city from branch)
union
(select customer_city from customer);

-- @ex CK3.08  [with]  ★★☆
-- Insurance: với mỗi năm, tổng damage_amount của các vụ tai nạn trong năm đó; chỉ trả về các năm có tổng damage lớn hơn trung bình tổng damage của các năm. Trả về year, total_damage.
with by_year as (
  select a.year, sum(x.damage_amount) as total_damage
  from accident a join participated x on x.report_number = a.report_number
  group by a.year)
select year, total_damage from by_year
where total_damage > (select avg(total_damage) from by_year);

-- @ex CK3.09  [scalar subquery]  ★★☆
-- Mọi branch: branch_name, assets và số account của branch (dùng scalar subquery trong select, không dùng join).
select branch_name, assets,
       (select count(*) from account a where a.branch_name = b.branch_name) as num_accounts
from branch b;

-- @ex CK3.10  [case + group by]  ★★☆
-- Phân loại account theo balance: dưới 500 là `'low'`, từ 500 đến dưới 800 là `'medium'`, còn lại `'high'`. Trả về level và số account mỗi loại.
select case when balance < 500 then 'low'
            when balance < 800 then 'medium'
            else 'high' end as level,
       count(*)
from account
group by 1;

-- @ex CK3.11  [DDL + constraints]  ★★☆
-- Tạo bảng `policy(policy_no, driver_id, premium, start_date, end_date)`: policy_no là primary key; driver_id bắt buộc và là foreign key tới person; premium > 0; end_date phải sau start_date.
create table policy (
  policy_no  varchar(10) primary key,
  driver_id  varchar(5) not null references person,
  premium    numeric(10,2) check (premium > 0),
  start_date date,
  end_date   date,
  check (end_date > start_date));

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into policy values ('P1', '12345', 500, '2024-01-01', '2025-01-01')$$) as valid_row,
--          try_sql($$insert into policy values ('P1', '22222', 300, '2024-01-01', '2025-01-01')$$) as dup_key,
--          try_sql($$insert into policy values ('P2', null, 300, '2024-01-01', '2025-01-01')$$) as null_driver,
--          try_sql($$insert into policy values ('P3', '99999', 300, '2024-01-01', '2025-01-01')$$) as bad_driver,
--          try_sql($$insert into policy values ('P4', '22222', 0, '2024-01-01', '2025-01-01')$$) as zero_premium,
--          try_sql($$insert into policy values ('P5', '22222', 100, '2025-01-01', '2024-01-01')$$) as bad_dates;

-- @ex CK3.12  [create view]  ★☆☆
-- Tạo view `accident_damage(report_number, year, total_damage)` — tổng thiệt hại của từng vụ tai nạn.
create view accident_damage (report_number, year, total_damage) as
  select a.report_number, a.year, sum(x.damage_amount)
  from accident a join participated x on x.report_number = a.report_number
  group by a.report_number, a.year;

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from accident_damage;

-- @ex CK3.13  [delete + subquery]  ★★☆
-- Xoá mọi chiếc xe đời trước 2016 chưa từng gặp tai nạn nào. (owns có on delete cascade.)
delete from car
where year < 2016
  and license_plate not in (select license_plate from participated);

-- Câu truy vấn hệ thống dùng để chấm:
--   select c.license_plate, (select count(*) from owns o where o.license_plate = c.license_plate) as owners
--   from car c;

-- @ex CK3.14  [update + subquery]  ★☆☆
-- Tăng 5% amount của các loan thuộc branch nằm ở thành phố `Horseneck`.
update loan set amount = amount * 1.05
where branch_name in (select branch_name from branch where branch_city = 'Horseneck');

-- Câu truy vấn hệ thống dùng để chấm:
--   select loan_number, amount from loan;

-- @ex CK3.15  [division]  ★★★
-- ID và customer_name của khách có account ở mọi branch mà khách `'12345'` có account (kể cả chính 12345).
select c.ID, c.customer_name
from customer c
where not exists (
  (select a.branch_name from depositor d join account a on a.account_number = d.account_number
   where d.ID = '12345')
  except
  (select a.branch_name from depositor d join account a on a.account_number = d.account_number
   where d.ID = c.ID));
