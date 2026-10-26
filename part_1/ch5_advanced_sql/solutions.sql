-- =====================================================================
-- CS4420 · Chương 5 — SQL nâng cao (Advanced SQL)
-- Dialect: PostgreSQL. Database: University (db/*.sql)
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại db/*.sql.

-- @ex 5.01  [function]  ★★☆
-- Tạo function `dept_count(dname varchar(20)) returns integer` (PL/pgSQL) trả về số instructor của khoa. Sau đó dùng nó tìm dept_name, budget của các khoa có hơn 2 instructor.
-- Gợi ý: Đặt tên tham số là dname (không phải dept_name) để khỏi nhầm với tên cột.
create function dept_count(dname varchar(20))
returns integer
language plpgsql as $$
declare
  d_count integer;
begin
  select count(*) into d_count
  from instructor
  where instructor.dept_name = dname;
  return d_count;
end $$;

select dept_name, budget
from department
where dept_count(dept_name) > 2;

-- Câu truy vấn hệ thống dùng để chấm:
--   select dept_name, dept_count(dept_name) from department;

-- @ex 5.02  [table function]  ★★☆
-- Tạo table function `instructor_of(dname varchar(20))` trả về bảng (ID, name, dept_name, salary) gồm instructor của khoa dname.
-- Gợi ý: returns table (...) language sql as $$ select ... $$; dùng: select * from instructor_of('Music')
create function instructor_of(dname varchar(20))
returns table (ID varchar(5), name varchar(20), dept_name varchar(20), salary numeric(8,2))
language sql as $$
  select ID, name, dept_name, salary
  from instructor
  where instructor.dept_name = dname;
$$;

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from instructor_of('Comp. Sci.');

-- @ex 5.03  [procedure]  ★★☆
-- Tạo procedure `dept_count_proc(in dname varchar(20), out d_count integer)`. Gọi thử bằng `call dept_count_proc('Physics', null);`
create procedure dept_count_proc(in dname varchar(20), out d_count integer)
language plpgsql as $$
begin
  select count(*) into d_count
  from instructor
  where instructor.dept_name = dname;
end $$;

-- Câu truy vấn hệ thống dùng để chấm:
--   call dept_count_proc('Comp. Sci.', null);

-- @ex 5.04  [for loop]  ★★☆
-- Tạo function `building_budget(bldg varchar(15)) returns numeric` tính tổng budget các khoa đặt ở toà nhà bldg bằng vòng lặp for (không dùng sum).
create function building_budget(bldg varchar(15))
returns numeric
language plpgsql as $$
declare
  n numeric := 0;
  r record;
begin
  for r in select budget from department where building = bldg loop
    n := n + r.budget;
  end loop;
  return n;
end $$;

-- Câu truy vấn hệ thống dùng để chấm:
--   select building, building_budget(building) from (select distinct building from department) as b;

-- @ex 5.05  [if / elsif]  ★☆☆
-- Tạo function `salary_level(sal numeric) returns varchar` trả về `'high'` nếu sal ≥ 90000, `'medium'` nếu sal ≥ 70000, ngược lại `'low'`.
create function salary_level(sal numeric)
returns varchar
language plpgsql as $$
begin
  if sal >= 90000 then
    return 'high';
  elsif sal >= 70000 then
    return 'medium';
  else
    return 'low';
  end if;
end $$;

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, salary_level(salary) from instructor;

-- @ex 5.06  [procedure + update]  ★★☆
-- Tạo procedure `give_raise(dname varchar(20), pct numeric)` tăng lương pct% cho instructor khoa dname. Gọi `call give_raise('Comp. Sci.', 10);`
create procedure give_raise(dname varchar(20), pct numeric)
language plpgsql as $$
begin
  update instructor
  set salary = salary * (1 + pct / 100)
  where dept_name = dname;
end $$;

call give_raise('Comp. Sci.', 10);

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, salary from instructor order by ID;

-- @ex 5.07  [row trigger]  ★★★
-- Cài trigger `credits_earned` như slide bằng PostgreSQL: khi grade của takes được update từ F hoặc null sang điểm qua (khác F, không null) thì cộng credits của môn vào tot_cred của sinh viên.
-- Hệ thống sẽ thử: Tanaka BIO-301 null → B (cộng 4), rồi B → A (không cộng), Levy CS-101 Fall F → B (cộng 4).
-- Gợi ý: create function ... returns trigger (dùng new, old) + create trigger ... after update of grade on takes for each row when (...) execute function ...
create function credits_earned_fn() returns trigger
language plpgsql as $$
begin
  update student
  set tot_cred = tot_cred + (select credits from course
                             where course.course_id = new.course_id)
  where student.ID = new.ID;
  return new;
end $$;

create trigger credits_earned
after update of grade on takes
for each row
when (new.grade <> 'F' and new.grade is not null
      and (old.grade = 'F' or old.grade is null))
execute function credits_earned_fn();

-- Câu truy vấn hệ thống dùng để chấm:
--   update takes set grade = 'B' where ID = '98988' and course_id = 'BIO-301';
--   update takes set grade = 'A' where ID = '98988' and course_id = 'BIO-301';
--   update takes set grade = 'B' where ID = '45678' and course_id = 'CS-101' and semester = 'Fall';
--   select ID, tot_cred from student where ID in ('98988', '45678');

-- @ex 5.08  [before trigger]  ★★☆
-- Tạo trigger before insert or update trên takes: nếu grade là chuỗi rỗng `''` hoặc chỉ toàn khoảng trắng thì đổi thành null.
create function setnull_fn() returns trigger
language plpgsql as $$
begin
  if trim(new.grade) = '' then
    new.grade := null;
  end if;
  return new;
end $$;

create trigger setnull_trigger
before insert or update on takes
for each row
execute function setnull_fn();

-- Câu truy vấn hệ thống dùng để chấm:
--   insert into takes values ('70557', 'PHY-101', '1', 'Fall', 2017, '');
--   update takes set grade = ' ' where ID = '00128' and course_id = 'CS-347';
--   select ID, course_id, grade from takes where ID in ('70557', '00128');

-- @ex 5.09  [audit trigger]  ★★☆
-- Tạo bảng `salary_audit(ID varchar(5), old_salary numeric(8,2), new_salary numeric(8,2))` và trigger ghi lại mỗi lần salary của instructor thay đổi (chỉ khi giá trị thực sự khác).
-- Gợi ý: when (old.salary is distinct from new.salary)
create table salary_audit (
  ID         varchar(5),
  old_salary numeric(8,2),
  new_salary numeric(8,2)
);

create function salary_audit_fn() returns trigger
language plpgsql as $$
begin
  insert into salary_audit values (new.ID, old.salary, new.salary);
  return new;
end $$;

create trigger salary_audit_trigger
after update of salary on instructor
for each row
when (old.salary is distinct from new.salary)
execute function salary_audit_fn();

-- Câu truy vấn hệ thống dùng để chấm:
--   update instructor set salary = salary + 1000 where dept_name = 'History';
--   update instructor set salary = salary where dept_name = 'Music';
--   select * from salary_audit;

-- @ex 5.10  [statement trigger]  ★★★
-- Tạo bảng `update_log(table_name text, num_rows integer)` và một trigger statement-level (`for each statement`) dùng transition table (`referencing new table as ...`) để ghi số dòng bị update mỗi khi chạy update trên instructor.
create table update_log (table_name text, num_rows integer);

create function log_update_fn() returns trigger
language plpgsql as $$
begin
  insert into update_log select 'instructor', count(*) from new_rows;
  return null;
end $$;

create trigger log_instructor_update
after update on instructor
referencing new table as new_rows
for each statement
execute function log_update_fn();

-- Câu truy vấn hệ thống dùng để chấm:
--   update instructor set salary = salary * 1.01 where dept_name = 'Comp. Sci.';
--   update instructor set salary = salary * 1.01 where dept_name = 'Nowhere';
--   select * from update_log;

-- @ex 5.11  [with recursive]  ★★☆
-- Dùng with recursive trên emp_super: tìm tất cả supervisor (trực tiếp và gián tiếp) của `Bob`.
with recursive sup(person, supervisor) as (
    select person, supervisor from emp_super
  union
    select sup.person, emp_super.supervisor
    from sup, emp_super
    where sup.supervisor = emp_super.person
)
select supervisor from sup where person = 'Bob';

-- @ex 5.12  [transitive closure]  ★★☆
-- Trước tiên thêm 2 dòng prereq `('CS-319', 'CS-190')` và `('BIO-399', 'BIO-301')` để có chuỗi nhiều mức. Sau đó tính rec_prereq(course_id, prereq_id) — transitive closure của prereq.
insert into prereq values ('CS-319', 'CS-190'), ('BIO-399', 'BIO-301');

with recursive rec_prereq(course_id, prereq_id) as (
    select course_id, prereq_id from prereq
  union
    select rec_prereq.course_id, prereq.prereq_id
    from rec_prereq, prereq
    where rec_prereq.prereq_id = prereq.course_id
)
select * from rec_prereq;

-- @ex 5.13  [recursion + depth]  ★★★
-- Tìm mọi cấp dưới (trực tiếp và gián tiếp) của `Mary` cùng cấp độ (`level`: cấp dưới trực tiếp = 1, cấp dưới của họ = 2, …). Trả về person, level.
with recursive sub(person, level) as (
    select person, 1 from emp_super where supervisor = 'Mary'
  union all
    select e.person, sub.level + 1
    from emp_super e, sub
    where e.supervisor = sub.person
)
select person, level from sub;

-- @ex 5.14  [rank]  ★☆☆
-- Xếp hạng sinh viên theo GPA giảm dần từ `student_grades`, sinh viên GPA null xếp cuối. Trả về ID, GPA, s_rank.
select ID, GPA, rank() over (order by GPA desc nulls last) as s_rank
from student_grades
order by s_rank;

-- @ex 5.15  [dense_rank]  ★☆☆
-- Như 5.14 (bỏ qua sinh viên GPA null) nhưng trả về cả `rank()` và `dense_rank()` để so sánh: ID, GPA, r, dr.
select ID, GPA,
       rank()       over (order by GPA desc) as r,
       dense_rank() over (order by GPA desc) as dr
from student_grades
where GPA is not null;

-- @ex 5.16  [rank without window]  ★★★
-- Tính hạng như 5.15 (cột r) không dùng window function: hạng = 1 + số sinh viên có GPA cao hơn. Bỏ qua GPA null. Trả về ID, s_rank.
select ID, (1 + (select count(*)
                 from student_grades B
                 where B.GPA > A.GPA)) as s_rank
from student_grades A
where A.GPA is not null
order by s_rank;

-- @ex 5.17  [partition by]  ★★☆
-- Xếp hạng sinh viên trong từng khoa theo GPA giảm dần (`dept_grades`, bỏ GPA null). Trả về ID, dept_name, dept_rank.
select ID, dept_name,
       rank() over (partition by dept_name order by GPA desc) as dept_rank
from dept_grades
where GPA is not null
order by dept_name, dept_rank;

-- @ex 5.18  [top-n per group]  ★★★
-- Sinh viên có GPA cao nhất mỗi khoa (nếu bằng nhau lấy hết). Trả về dept_name, ID, GPA.
select dept_name, ID, GPA
from (select dept_name, ID, GPA,
             rank() over (partition by dept_name order by GPA desc) as r
      from dept_grades
      where GPA is not null) as t
where r = 1;

-- @ex 5.19  [ntile]  ★★☆
-- Chia sinh viên (GPA không null) thành 4 nhóm (quartile) theo GPA giảm dần. Trả về ID, GPA, quartile. *(Lưu ý: ntile với giá trị trùng có thể không xác định — ở đây hãy thêm ID vào order by để cố định: `order by GPA desc, ID`.)*
select ID, GPA, ntile(4) over (order by GPA desc, ID) as quartile
from student_grades
where GPA is not null;

-- @ex 5.20  [percent_rank / cume_dist]  ★★☆
-- Với sinh viên có GPA: ID, GPA, `percent_rank()` và `cume_dist()` theo GPA tăng dần.
select ID, GPA,
       percent_rank() over (order by GPA) as pr,
       cume_dist()    over (order by GPA) as cd
from student_grades
where GPA is not null;

-- @ex 5.21  [moving average]  ★★☆
-- Từ `daily_sales`: với mỗi ngày, trung bình value của ngày trước, ngày đó và ngày sau (`moving_avg`). Sắp theo sale_date.
-- (Thứ tự dòng được chấm.)
select sale_date,
       avg(value) over (order by sale_date
                        rows between 1 preceding and 1 following) as moving_avg
from daily_sales
order by sale_date;

-- @ex 5.22  [running total]  ★★☆
-- Từ `account_txn`: số dư của mỗi tài khoản sau mỗi giao dịch (`balance`). Trả về account_number, date_time, value, balance, sắp theo account_number, date_time.
-- (Thứ tự dòng được chấm.)
select account_number, date_time, value,
       sum(value) over (partition by account_number
                        order by date_time
                        rows unbounded preceding) as balance
from account_txn
order by account_number, date_time;

-- @ex 5.23  [range window]  ★★★
-- Từ `daily_sales`: với mỗi ngày, tổng value trong 3 ngày gần nhất tính cả ngày đó (`range between interval '2 day' preceding and current row`). Sắp theo sale_date.
-- (Thứ tự dòng được chấm.)
select sale_date,
       sum(value) over (order by sale_date
                        range between interval '2 day' preceding and current row) as last_3_days
from daily_sales
order by sale_date;

-- @ex 5.24  [cross-tab data]  ★☆☆
-- Tổng quantity theo (item_name, color) từ bảng `sales`.
select item_name, color, sum(quantity)
from sales
group by item_name, color;

-- @ex 5.25  [pivot]  ★★☆
-- Tạo cross-tab: mỗi dòng là một item_name, các cột `dark`, `pastel`, `white`, `total` là tổng quantity. Sắp theo item_name.
-- Gợi ý: sum(quantity) filter (where color = 'dark') — hoặc sum(case when color = 'dark' then quantity else 0 end)
-- (Thứ tự dòng được chấm.)
select item_name,
       sum(quantity) filter (where color = 'dark')   as dark,
       sum(quantity) filter (where color = 'pastel') as pastel,
       sum(quantity) filter (where color = 'white')  as white,
       sum(quantity)                                 as total
from sales
group by item_name
order by item_name;

-- @ex 5.26  [cube]  ★★☆
-- Dùng cube(item_name, color): tổng quantity cho mọi tổ hợp, kể cả dòng tổng. Trả về item_name, color, total.
select item_name, color, sum(quantity) as total
from sales
group by cube(item_name, color);

-- @ex 5.27  [grouping()]  ★★★
-- Như 5.26 nhưng thay null "all" bằng chữ `'all'` (dùng `grouping()` + case, tương đương `decode` trong slide).
select case when grouping(item_name) = 1 then 'all' else item_name end as item_name,
       case when grouping(color) = 1 then 'all' else color end as color,
       sum(quantity) as total
from sales
group by cube(item_name, color);

-- @ex 5.28  [rollup]  ★★☆
-- Dùng rollup(item_name, color, clothes_size): tổng quantity. Trả về item_name, color, clothes_size, total.
select item_name, color, clothes_size, sum(quantity) as total
from sales
group by rollup(item_name, color, clothes_size);

-- @ex 5.29  [rollup + hierarchy]  ★★☆
-- Kết hợp `sales` với `itemcategory`, dùng rollup(category, item_name) để có tổng theo từng item, từng category và tổng chung. Trả về category, item_name, total.
select category, itemcategory.item_name, sum(quantity) as total
from sales, itemcategory
where sales.item_name = itemcategory.item_name
group by rollup(category, itemcategory.item_name);

-- @ex 5.30  [multiple rollups]  ★★★
-- `group by rollup(item_name), rollup(color, clothes_size)` sinh ra bao nhiêu dòng kết quả trên bảng sales? Viết truy vấn đếm (1 cột, 1 dòng).
select count(*)
from (select item_name, color, clothes_size, sum(quantity)
      from sales
      group by rollup(item_name), rollup(color, clothes_size)) as t;
