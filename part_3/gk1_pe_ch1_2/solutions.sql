-- =====================================================================
-- CS4420 · Ôn GK · Phần 1 — Practice Exercises Chương 1–2 (Introduction, Relational Model) (Practice Exercises — Chapters 1–2)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex GK1.01  [PE 2.1 primary key]  ★☆☆
-- PE 2.1 — Tạo ba bảng `gk_employee(ID, person_name, street, city)`, `gk_works(ID, company_name, salary)`, `gk_company(company_name, city)` với primary key đúng như lời giải PE 2.1 (kiểu dữ liệu tuỳ chọn).
-- Gợi ý: employee: ID; works: ID; company: company_name.
create table gk_employee (ID varchar(5) primary key, person_name varchar(30), street varchar(30), city varchar(30));
create table gk_works (ID varchar(5) primary key, company_name varchar(30), salary numeric(10,2));
create table gk_company (company_name varchar(30) primary key, city varchar(30));

-- Câu truy vấn hệ thống dùng để chấm:
--   select k.table_name, k.column_name
--   from information_schema.table_constraints t
--   join information_schema.key_column_usage k on k.constraint_name = t.constraint_name and k.table_name = t.table_name
--   where t.constraint_type = 'PRIMARY KEY' and t.table_name in ('gk_employee', 'gk_works', 'gk_company')
--   order by k.table_name, k.column_name;

-- @ex GK1.02  [PE 2.2 foreign key]  ★★☆
-- PE 2.2 — Viết một câu select trả về 3 cột: (1) kết quả `try_sql` khi insert `('10111', 'Ostrom', 'Economics', 110000)` vào instructor; (2) kết quả `try_sql` khi delete khoa `Biology` khỏi department; (3) số instructor có `dept_name is null` sau lệnh delete (dùng `sql_value`).
-- Gợi ý: try_sql trả về 'ok' hoặc SQLSTATE (23503 = foreign key). Schema khai báo on delete set null nên delete không lỗi.
select try_sql($$insert into instructor values ('10111', 'Ostrom', 'Economics', 110000)$$) as insert_economics,
       try_sql($$delete from department where dept_name = 'Biology'$$) as delete_biology,
       sql_value($$select count(*) from instructor where dept_name is null$$) as instructors_without_dept;

-- @ex GK1.03  [PE 2.3 time_slot key]  ★☆☆
-- PE 2.3 — Minh hoạ vì sao time_slot_id không đủ làm khoá: liệt kê các `time_slot_id` họp nhiều hơn một lần trong tuần cùng số lần họp (`num_meetings`).
select time_slot_id, count(*) as num_meetings
from time_slot
group by time_slot_id
having count(*) > 1;

-- @ex GK1.04  [PE 2.4 superkey]  ★☆☆
-- PE 2.4 — Chèn instructor `('99001', 'Einstein', 'Comp. Sci.', 70000)` rồi trả về các instructor tên `Einstein` (ID, name, dept_name). Database chấp nhận → name không phải superkey.
insert into instructor values ('99001', 'Einstein', 'Comp. Sci.', 70000);
select ID, name, dept_name from instructor where name = 'Einstein';

-- @ex GK1.05  [PE 2.5 σ over ×]  ★☆☆
-- PE 2.5 — Viết SQL cho σ[s_id=ID](student × advisor) (giữ mọi cột của cả hai bảng).
select * from student, advisor where advisor.s_id = student.ID;

-- @ex GK1.06  [PE 2.5 missing tuples]  ★★☆
-- PE 2.5 (mở rộng) — Những sinh viên nào không xuất hiện trong kết quả của σ[s_id=ID](student × advisor)? Trả về ID, name.
-- Gợi ý: Sinh viên không có advisor: dùng except hoặc not in.
select ID, name from student
except
select student.ID, student.name from student, advisor where advisor.s_id = student.ID;

-- @ex GK1.07  [PE 2.6a σ, Π]  ★☆☆
-- PE 2.6a — Π[person_name](σ[city="Miami"](employee)).
-- Π_person_name(σ_city='Miami'(employee))
select distinct person_name from employee where city = 'Miami';

-- @ex GK1.08  [PE 2.6b join]  ★☆☆
-- PE 2.6b — Tên mỗi nhân viên có salary > 100000: Π[person_name](σ[salary>100000](employee ⋈ works)).
-- Π_person_name(σ_salary>100000(employee ⋈ works))
select distinct person_name
from employee natural join works
where salary > 100000;

-- @ex GK1.09  [PE 2.6c join]  ★☆☆
-- PE 2.6c — Tên mỗi nhân viên sống ở Miami và có salary > 100000.
-- Π_person_name(σ_city='Miami' ∧ salary>100000(employee ⋈ works))
select distinct person_name
from employee natural join works
where city = 'Miami' and salary > 100000;

-- @ex GK1.10  [PE 2.7a σ, Π]  ★☆☆
-- PE 2.7a (Bank database) — Tên mỗi branch ở Chicago.
-- Π_branch_name(σ_branch_city='Chicago'(branch))
select distinct branch_name from branch where branch_city = 'Chicago';

-- @ex GK1.11  [PE 2.7b θ-join]  ★☆☆
-- PE 2.7b — ID mỗi borrower có loan ở branch Downtown.
-- Π_ID(σ_branch_name='Downtown'(borrower ⋈_{borrower.loan_number=loan.loan_number} loan))
select distinct borrower.ID
from borrower join loan on borrower.loan_number = loan.loan_number
where loan.branch_name = 'Downtown';

-- @ex GK1.12  [PE 2.8a set difference]  ★★☆
-- PE 2.8a — ID và tên mỗi nhân viên không làm cho BigBank (kể cả người không có trong works). Viết theo đúng cấu trúc đại số: tất cả trừ (`except`) những người làm cho BigBank.
-- Π_ID,person_name(employee) − Π_ID,person_name(employee ⋈ σ_company_name='BigBank'(works))
select ID, person_name from employee
except
select employee.ID, person_name
from employee join works on employee.ID = works.ID
where company_name = 'BigBank';

-- @ex GK1.13  [PE 2.8b rename]  ★★★
-- PE 2.8b — ID và tên mỗi nhân viên có lương ít nhất bằng mọi nhân viên. Viết theo cấu trúc đại số: (người có lương) trừ (người mà có ai đó lương cao hơn — dùng hai bí danh A, B của `employee natural join works`). Không dùng `max`.
-- Gợi ý: from (employee natural join works) as A, (employee natural join works) as B where A.salary < B.salary
-- Π_ID,person_name(employee ⋈ works)
--   − Π_A.ID,A.person_name(ρ_A(employee ⋈ works) ⋈_{A.salary < B.salary} ρ_B(employee ⋈ works))
select ID, person_name from employee natural join works
except
select A.ID, A.person_name
from (employee natural join works) as A, (employee natural join works) as B
where A.salary < B.salary;

-- @ex GK1.14  [PE 2.9a division]  ★★★
-- PE 2.9a (biến thể) — ID các sinh viên đã học tất cả course của khoa Physics: Π[ID,course_id](takes) ÷ Π[course_id](σ[dept_name="Physics"](course)). (Với Comp. Sci. như trong sách, kết quả trên dữ liệu mẫu là rỗng.) Dùng `not exists (... except ...)`.
-- Gợi ý: Với mỗi sinh viên S: không tồn tại course Physics nào mà S chưa học.
select distinct S.ID
from takes as S
where not exists (
  (select course_id from course where dept_name = 'Physics')
  except
  (select T.course_id from takes as T where T.ID = S.ID));

-- @ex GK1.15  [PE 2.9b division by formula]  ★★★
-- PE 2.9b — Viết phép chia bằng công thức Π[ID](r) − Π[ID]((Π[ID](r) × s) − r) với r = Π[ID,course_id](takes) và s = các course mà sinh viên `00128` (Zhang) đã học. Kết quả: ID các sinh viên đã học mọi course của Zhang.
-- Gợi ý: Dùng with r as (...), s as (...); phép × là cross join; − là except.
with r as (select distinct ID, course_id from takes),
     s as (select distinct course_id from takes where ID = '00128')
select ID from r
except
select ID from (
  select c.ID, s.course_id from (select distinct ID from r) as c cross join s
  except
  select ID, course_id from r) as missing;

-- @ex GK1.16  [PE 2.9 division check]  ★★☆
-- PE 2.9 (kiểm tra lại) — Cùng truy vấn với GK1.15 nhưng viết bằng `group by ... having count(distinct course_id) = (select count(*) ...)`: ID các sinh viên đã học mọi course mà `00128` đã học.
-- Gợi ý: Chỉ đếm các course nằm trong tập của Zhang.
select ID
from takes
where course_id in (select course_id from takes where ID = '00128')
group by ID
having count(distinct course_id) = (select count(distinct course_id) from takes where ID = '00128');
