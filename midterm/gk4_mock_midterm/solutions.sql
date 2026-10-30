-- =====================================================================
-- CS4420 · Đề thi thử GK — Đề thi thử giữa kỳ — Chương 1–4 (Mock Midterm (Chapters 1–4))
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex GK4.01  [outer join + count]  ★★☆
-- Bank database. Với mọi branch: branch_name và số loan của branch đó (`num_loans`, bằng 0 nếu không có). Không dùng subquery.
-- Gợi ý: Biến thể PE 4.2d: left outer join + count(cột của loan).
select branch_name, count(loan_number) as num_loans
from branch natural left outer join loan
group by branch_name;

-- @ex GK4.02  [intersect]  ★☆☆
-- ID các khách hàng vừa có account vừa có loan.
(select ID from depositor)
intersect
(select ID from borrower);

-- @ex GK4.03  [division (for all)]  ★★★
-- ID và customer_name của khách có account ở mọi branch đặt tại thành phố `Brooklyn`.
-- Gợi ý: not exists ((branch ở Brooklyn) except (branch mà khách C có account)).
select C.ID, C.customer_name
from customer as C
where not exists (
  (select branch_name from branch where branch_city = 'Brooklyn')
  except
  (select a.branch_name
   from depositor d join account a on a.account_number = d.account_number
   where d.ID = C.ID));

-- @ex GK4.04  [with + max (ties)]  ★★☆
-- Branch có tổng số tiền cho vay (sum amount của loan) lớn nhất — nếu hoà thì trả về tất cả. Trả về branch_name và total_amount.
-- Gợi ý: Biến thể PE 3.1g.
with branch_total as (
  select branch_name, sum(amount) as total_amount
  from loan group by branch_name)
select branch_name, total_amount
from branch_total
where total_amount = (select max(total_amount) from branch_total);

-- @ex GK4.05  [having + subquery]  ★★☆
-- Các branch có số dư trung bình (avg balance của account) lớn hơn số dư trung bình của toàn bộ account. Trả về branch_name.
-- Gợi ý: Biến thể PE 3.9g.
select branch_name
from account
group by branch_name
having avg(balance) > (select avg(balance) from account);

-- @ex GK4.06  [correlated subquery]  ★★☆
-- Employee database. ID, person_name và salary của nhân viên có lương cao hơn lương trung bình của chính công ty mình.
select e.ID, e.person_name, w.salary
from employee e join works w on w.ID = e.ID
where w.salary > (select avg(w2.salary) from works w2
                  where w2.company_name = w.company_name);

-- @ex GK4.07  [update + case]  ★★☆
-- Nhân viên của `Mega Corp`: lương dưới 50000 tăng 8%, còn lại tăng 4%. Viết một câu update (an toàn với thứ tự).
-- Gợi ý: Biến thể PE 3.10b.
update works
set salary = salary * (case when salary < 50000 then 1.08 else 1.04 end)
where company_name = 'Mega Corp';

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, salary from works where company_name = 'Mega Corp';

-- @ex GK4.08  [insert ... select]  ★★★
-- Mỗi khách có loan ở branch `Downtown` được mở một account mới tại Downtown: account_number là `'A-9' || ID`, balance 100; đồng thời thêm dòng depositor tương ứng.
-- Gợi ý: Hai câu insert ... select: account trước (vì FK), depositor sau.
insert into account
select distinct 'A-9' || b.ID, 'Downtown', 100
from borrower b join loan l on l.loan_number = b.loan_number
where l.branch_name = 'Downtown';
insert into depositor
select distinct b.ID, 'A-9' || b.ID
from borrower b join loan l on l.loan_number = b.loan_number
where l.branch_name = 'Downtown';

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, account_number, balance
--   from depositor natural join account
--   where branch_name = 'Downtown';

-- @ex GK4.09  [view with check option]  ★★☆
-- Tạo view `brooklyn_branches` gồm mọi cột của branch ở thành phố `Brooklyn`, with check option.
create view brooklyn_branches as
  select * from branch where branch_city = 'Brooklyn'
  with check option;

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into brooklyn_branches values ('Bay Ridge', 'Brooklyn', 100000)$$) as insert_brooklyn,
--          try_sql($$insert into brooklyn_branches values ('Harlem', 'New York', 100000)$$) as insert_other_city,
--          sql_value('select count(*) from brooklyn_branches') as rows_in_view;

-- @ex GK4.10  [FK self cascade]  ★★★
-- Tạo bảng `emp_tree(employee_id varchar(5) primary key, manager_id varchar(5))` với manager_id là foreign key tham chiếu chính emp_tree, on delete cascade. Nạp mọi nhân viên của employee (manager_id lấy từ manages, null nếu không có quản lý), rồi xoá nhân viên `'10004'`.
-- Gợi ý: Insert tất cả với manager_id null trước, rồi update từ manages — để FK không bị vi phạm khi chèn. Biến thể PE 4.9.
create table emp_tree (
  employee_id varchar(5) primary key,
  manager_id  varchar(5) references emp_tree (employee_id) on delete cascade);
insert into emp_tree select ID, null from employee;
update emp_tree t set manager_id = m.manager_id
from manages m where m.ID = t.employee_id;
delete from emp_tree where employee_id = '10004';

-- Câu truy vấn hệ thống dùng để chấm:
--   select employee_id, manager_id from emp_tree;

-- @ex GK4.11  [grant on view]  ★★☆
-- Tạo view `small_bank_staff(ID, person_name, city)` — nhân viên của `Small Bank Corporation`. Tạo role `hr_clerk`, cấp quyền select trên view (không cấp gì trên employee/works).
create view small_bank_staff (ID, person_name, city) as
  select e.ID, e.person_name, e.city
  from employee e join works w on w.ID = e.ID
  where w.company_name = 'Small Bank Corporation';
create role hr_clerk;
grant select on small_bank_staff to hr_clerk;

-- Câu truy vấn hệ thống dùng để chấm:
--   select has_table_privilege('hr_clerk', 'small_bank_staff', 'select') as view_select,
--          has_table_privilege('hr_clerk', 'works', 'select') as works_select,
--          (select count(*) from small_bank_staff) as staff;

-- @ex GK4.12  [RA → SQL]  ★☆☆
-- Viết SQL cho Π[ID](σ[city = "Miami"](employee)) − Π[ID](σ[company_name = "First Bank Corporation"](works)).
(select ID from employee where city = 'Miami')
except
(select ID from works where company_name = 'First Bank Corporation');
