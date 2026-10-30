-- =====================================================================
-- CS4420 · Chương 3 — Nhập môn SQL (Introduction to SQL)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex 3.01  [select]  ★☆☆
-- Tìm tên của tất cả instructor.
select name from instructor;

-- @ex 3.02  [distinct]  ★☆☆
-- Tìm tên các khoa (dept_name) có giảng viên, không lặp lại.
select distinct dept_name from instructor;

-- @ex 3.03  [arithmetic]  ★☆☆
-- Liệt kê ID, name và lương tháng (salary / 12) của mỗi instructor, đặt tên cột là `monthly_salary`.
select ID, name, salary / 12 as monthly_salary from instructor;

-- @ex 3.04  [where]  ★☆☆
-- Tên các instructor khoa `Comp. Sci.` có lương lớn hơn 70000.
select name from instructor where dept_name = 'Comp. Sci.' and salary > 70000;

-- @ex 3.05  [between]  ★☆☆
-- Tên các instructor có lương từ 90000 đến 100000 (bao gồm cả hai đầu).
select name from instructor where salary between 90000 and 100000;

-- @ex 3.06  [order by]  ★☆☆
-- Liệt kê dept_name, name, salary của instructor, sắp xếp theo dept_name tăng dần, trong cùng khoa thì salary giảm dần.
-- (Thứ tự dòng được chấm.)
select dept_name, name, salary from instructor order by dept_name asc, salary desc;

-- @ex 3.07  [like]  ★☆☆
-- Tìm title của các course có chứa chuỗi `Intro` ở đầu tên.
-- Gợi ý: Pattern 'Intro%'
select title from course where title like 'Intro%';

-- @ex 3.08  [like]  ★★☆
-- Tìm tên instructor có đúng 5 ký tự và chứa chữ `i`.
-- Gợi ý: Kết hợp '_____' và '%i%'.
select name from instructor where name like '_____' and name like '%i%';

-- @ex 3.09  [string functions]  ★★☆
-- Với mỗi course, trả về một cột duy nhất dạng `CS-101: Intro. to Computer Science` (course_id, dấu hai chấm, khoảng trắng, title), đặt tên `label`.
-- Gợi ý: Toán tử nối chuỗi ||
select course_id || ': ' || title as label from course;

-- @ex 3.10  [from (join)]  ★☆☆
-- Tên instructor và course_id của các môn họ đã dạy.
select name, course_id from instructor, teaches where instructor.ID = teaches.ID;

-- @ex 3.11  [from (join)]  ★★☆
-- Tên instructor khoa `Comp. Sci.` và title các môn họ đã dạy (không lặp lại).
-- Gợi ý: Cần 3 bảng: instructor, teaches, course.
select distinct name, title
from instructor, teaches, course
where instructor.ID = teaches.ID
  and teaches.course_id = course.course_id
  and instructor.dept_name = 'Comp. Sci.';

-- @ex 3.12  [rename]  ★★☆
-- Tên (không lặp) các instructor có lương cao hơn ít nhất một instructor khoa `Comp. Sci.` — dùng rename `T`, `S` (không dùng some).
select distinct T.name
from instructor as T, instructor as S
where T.salary > S.salary and S.dept_name = 'Comp. Sci.';

-- @ex 3.13  [self join]  ★★☆
-- Bảng `emp_super(person, supervisor)`: tìm supervisor của supervisor của `Bob`.
select s2.supervisor
from emp_super s1, emp_super s2
where s1.person = 'Bob' and s1.supervisor = s2.person;

-- @ex 3.14  [tuple comparison]  ★★☆
-- Dùng tuple comparison `(a, b) = (x, y)`: tìm name, course_id của instructor khoa `Comp. Sci.` cùng các môn họ dạy.
select name, course_id
from instructor, teaches
where (instructor.ID, dept_name) = (teaches.ID, 'Comp. Sci.');

-- @ex 3.15  [union]  ★☆☆
-- Các course_id mở ở Fall 2017 hoặc Spring 2018.
(select course_id from section where semester = 'Fall' and year = 2017)
union
(select course_id from section where semester = 'Spring' and year = 2018);

-- @ex 3.16  [union all]  ★★☆
-- Như câu trên nhưng giữ lại dòng trùng (một môn mở ở cả hai kỳ xuất hiện 2 lần; môn có 2 section trong một kỳ cũng xuất hiện 2 lần).
(select course_id from section where semester = 'Fall' and year = 2017)
union all
(select course_id from section where semester = 'Spring' and year = 2018);

-- @ex 3.17  [except]  ★★☆
-- ID của các sinh viên chưa từng học môn nào (dùng except).
select ID from student
except
select ID from takes;

-- @ex 3.18  [null]  ★☆☆
-- Tìm ID, course_id của các bản ghi takes chưa có điểm (grade là null).
select ID, course_id from takes where grade is null;

-- @ex 3.19  [null]  ★★☆
-- Đếm số bản ghi takes có điểm và khác F. Lưu ý null: `grade <> 'F'` với grade null cho kết quả gì?
-- Gợi ý: grade <> 'F' với null → unknown → bị loại. Thử tự kiểm chứng!
select count(*) from takes where grade <> 'F';

-- @ex 3.20  [aggregate]  ★☆☆
-- Lương trung bình của instructor khoa `Comp. Sci.`
select avg(salary) from instructor where dept_name = 'Comp. Sci.';

-- @ex 3.21  [count distinct]  ★☆☆
-- Số instructor (khác nhau) dạy ít nhất một môn trong học kỳ Spring 2018.
select count(distinct ID) from teaches where semester = 'Spring' and year = 2018;

-- @ex 3.22  [group by]  ★☆☆
-- Với mỗi khoa: dept_name và lương trung bình (`avg_salary`).
select dept_name, avg(salary) as avg_salary from instructor group by dept_name;

-- @ex 3.23  [having]  ★★☆
-- dept_name và lương trung bình của các khoa có lương trung bình > 42000.
select dept_name, avg(salary) as avg_salary
from instructor
group by dept_name
having avg(salary) > 42000;

-- @ex 3.24  [group by]  ★★☆
-- Với mỗi section (course_id, sec_id, semester, year) có sinh viên học: số sinh viên đăng ký.
select course_id, sec_id, semester, year, count(ID) as enrollment
from takes
group by course_id, sec_id, semester, year;

-- @ex 3.25  [group by + join]  ★★☆
-- Với mỗi sinh viên có học môn: ID, name và tổng số tín chỉ của các môn đã học (tính cả môn trượt), sắp theo ID.
-- (Thứ tự dòng được chấm.)
select student.ID, name, sum(credits) as total
from student, takes, course
where student.ID = takes.ID and takes.course_id = course.course_id
group by student.ID, name
order by student.ID;

-- @ex 3.26  [having]  ★★★
-- Với mỗi khoa có ít nhất 2 instructor: dept_name, số instructor, lương lớn nhất. Chỉ tính instructor có lương > 50000.
-- Gợi ý: where lọc lương trước, having lọc nhóm sau.
select dept_name, count(*) as num, max(salary) as max_salary
from instructor
where salary > 50000
group by dept_name
having count(*) >= 2;

-- @ex 3.27  [in]  ★★☆
-- Dùng in: các course_id (không lặp) mở ở Fall 2017 và Spring 2018.
select distinct course_id
from section
where semester = 'Fall' and year = 2017
  and course_id in (select course_id from section
                    where semester = 'Spring' and year = 2018);

-- @ex 3.28  [not in]  ★★☆
-- Dùng not in: các course_id mở ở Fall 2017 nhưng không mở ở Spring 2018.
select distinct course_id
from section
where semester = 'Fall' and year = 2017
  and course_id not in (select course_id from section
                        where semester = 'Spring' and year = 2018);

-- @ex 3.29  [in (tuple)]  ★★☆
-- Đếm số sinh viên (khác nhau) đã học các section do instructor `10101` dạy — dùng `(course_id, sec_id, semester, year) in (...)`.
select count(distinct ID)
from takes
where (course_id, sec_id, semester, year) in
      (select course_id, sec_id, semester, year
       from teaches
       where teaches.ID = '10101');

-- @ex 3.30  [some]  ★★☆
-- Dùng > some: tên instructor có lương lớn hơn lương của ít nhất một instructor khoa `Biology`.
select name
from instructor
where salary > some (select salary from instructor where dept_name = 'Biology');

-- @ex 3.31  [all]  ★★☆
-- Dùng > all: tên instructor có lương lớn hơn lương của tất cả instructor khoa `Finance`.
select name
from instructor
where salary > all (select salary from instructor where dept_name = 'Finance');

-- @ex 3.32  [all]  ★★★
-- Tìm (các) khoa có lương trung bình cao nhất — dùng `>= all`.
select dept_name
from instructor
group by dept_name
having avg(salary) >= all (select avg(salary) from instructor group by dept_name);

-- @ex 3.33  [exists]  ★★☆
-- Dùng exists (correlated subquery): các course_id mở ở Fall 2017 và Spring 2018.
select course_id
from section as S
where semester = 'Fall' and year = 2017
  and exists (select *
              from section as T
              where semester = 'Spring' and year = 2018
                and S.course_id = T.course_id);

-- @ex 3.34  [not exists]  ★★★
-- ID và name của các sinh viên đã học tất cả các môn của khoa `Biology` *đã từng mở lớp* (course_id xuất hiện trong section). Dùng `not exists (... except ...)`.
-- Gợi ý: X = các môn Biology có trong section; Y = các môn sinh viên S đã học. X ⊆ Y.
select S.ID, S.name
from student as S
where not exists ((select course_id from course
                   where dept_name = 'Biology'
                     and course_id in (select course_id from section))
                  except
                  (select T.course_id from takes as T where S.ID = T.ID));

-- @ex 3.35  [not exists]  ★★★
-- ID và name các sinh viên đã học tất cả các môn khoa `Biology` (kể cả môn chưa mở — đúng như slide). Kết quả rỗng có hợp lý không?
select distinct S.ID, S.name
from student as S
where not exists ((select course_id from course where dept_name = 'Biology')
                  except
                  (select T.course_id from takes as T where S.ID = T.ID));

-- @ex 3.36  ["unique"]  ★★★
-- Các course_id được mở nhiều nhất một lần trong năm 2017 (gồm cả môn không mở lần nào). PostgreSQL không có `unique (subquery)` — hãy dùng scalar subquery đếm.
select T.course_id
from course as T
where (select count(*) from section as R
       where T.course_id = R.course_id and R.year = 2017) <= 1;

-- @ex 3.37  [from subquery]  ★★☆
-- Không dùng having: dept_name và avg_salary của các khoa có lương trung bình > 42000 (subquery trong from).
select dept_name, avg_salary
from (select dept_name, avg(salary) as avg_salary
      from instructor
      group by dept_name) as dept_avg
where avg_salary > 42000;

-- @ex 3.38  [with]  ★★☆
-- Dùng with: tìm dept_name của (các) khoa có budget lớn nhất.
with max_budget (value) as
  (select max(budget) from department)
select department.dept_name
from department, max_budget
where department.budget = max_budget.value;

-- @ex 3.39  [with]  ★★★
-- Dùng with 2 bảng tạm: các khoa có tổng lương lớn hơn trung bình của tổng lương các khoa.
with dept_total (dept_name, value) as
  (select dept_name, sum(salary) from instructor group by dept_name),
dept_total_avg (value) as
  (select avg(value) from dept_total)
select dept_name
from dept_total, dept_total_avg
where dept_total.value > dept_total_avg.value;

-- @ex 3.40  [scalar subquery]  ★★☆
-- Liệt kê mọi khoa cùng số instructor của khoa đó (`num_instructors`) — dùng scalar subquery trong select.
select dept_name,
       (select count(*) from instructor
        where department.dept_name = instructor.dept_name) as num_instructors
from department;

-- @ex 3.41  [insert]  ★☆☆
-- Thêm môn `CS-437`, title `Database Systems`, khoa `Comp. Sci.`, 4 tín chỉ. (Hệ thống sẽ kiểm tra bảng course sau khi chạy.)
insert into course values ('CS-437', 'Database Systems', 'Comp. Sci.', 4);

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from course order by course_id;

-- @ex 3.42  [insert null]  ★☆☆
-- Thêm sinh viên `3003`, tên `Green`, khoa `Finance`, tot_cred null — chỉ liệt kê các cột cần thiết.
insert into student (ID, name, dept_name) values ('3003', 'Green', 'Finance');

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from student order by ID;

-- @ex 3.43  [insert ... select]  ★★☆
-- Biến mọi sinh viên khoa `Comp. Sci.` có tot_cred > 100 thành instructor cùng khoa với lương 30000 (insert … select).
insert into instructor
select ID, name, dept_name, 30000
from student
where dept_name = 'Comp. Sci.' and tot_cred > 100;

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from instructor order by ID;

-- @ex 3.44  [delete]  ★★☆
-- Xoá mọi instructor thuộc các khoa đặt ở toà nhà `Watson`.
delete from instructor
where dept_name in (select dept_name from department where building = 'Watson');

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from instructor order by ID;

-- @ex 3.45  [delete]  ★★☆
-- Xoá mọi instructor có lương thấp hơn lương trung bình của tất cả instructor.
delete from instructor
where salary < (select avg(salary) from instructor);

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from instructor order by ID;

-- @ex 3.46  [update]  ★☆☆
-- Tăng 5% lương cho các instructor có lương dưới 70000.
update instructor set salary = salary * 1.05 where salary < 70000;

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, salary from instructor order by ID;

-- @ex 3.47  [update case]  ★★☆
-- Dùng một câu update với `case`: lương > 90000 tăng 3%, còn lại tăng 5%.
update instructor
set salary = case
               when salary <= 90000 then salary * 1.05
               else salary * 1.03
             end;

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, salary from instructor order by ID;

-- @ex 3.48  [update scalar subquery]  ★★★
-- Tính lại `tot_cred` cho mọi sinh viên = tổng credits các môn đã qua (grade khác F và khác null). Sinh viên chưa qua môn nào thì tot_cred = 0 (không phải null).
-- Gợi ý: coalesce(sum(credits), 0) hoặc case when sum(credits) is not null then ... else 0 end
update student S
set tot_cred = (select coalesce(sum(credits), 0)
                from takes, course
                where takes.course_id = course.course_id
                  and S.ID = takes.ID
                  and takes.grade <> 'F'
                  and takes.grade is not null);

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, tot_cred from student order by ID;

-- @ex 3.49  [alter table]  ★★☆
-- Thêm cột `email varchar(50)` vào bảng student. Sau đó gán email `zhang@uni.edu` cho sinh viên `00128`.
alter table student add email varchar(50);
update student set email = 'zhang@uni.edu' where ID = '00128';

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, email from student order by ID;

-- @ex 3.50  [create table]  ★★☆
-- Tạo bảng `club(club_id char(4), name varchar(30) not null, dept_name varchar(20))` với primary key club_id và foreign key dept_name tham chiếu department. Thêm câu lạc bộ `C001`, `Robotics Club`, `Comp. Sci.`.
create table club (
  club_id   char(4),
  name      varchar(30) not null,
  dept_name varchar(20),
  primary key (club_id),
  foreign key (dept_name) references department);
insert into club values ('C001', 'Robotics Club', 'Comp. Sci.');

-- Câu truy vấn hệ thống dùng để chấm:
--   select c.column_name, c.data_type, c.is_nullable,
--          (select count(*) from information_schema.table_constraints tc
--           where tc.table_name = 'club' and tc.constraint_type in ('PRIMARY KEY', 'FOREIGN KEY')) as key_constraints,
--          (select count(*) from club) as num_rows
--   from information_schema.columns c
--   where c.table_name = 'club'
--   order by c.ordinal_position;
