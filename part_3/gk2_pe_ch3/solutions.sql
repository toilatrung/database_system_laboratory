-- =====================================================================
-- CS4420 · Ôn GK · Phần 2 — Practice Exercises Chương 3 (Introduction to SQL) (Practice Exercises — Chapter 3)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex GK2.01  [PE 3.1a where]  ★☆☆
-- Đề gốc: Exercise 3.1 (a). Write the following queries in SQL, using the university schema. (We suggest you actually run these queries on a database, using the sample data that we provide on the web site of the book, db-book.com. Instructions for setting up a database, and loading sample data, are provided on the above web site.)
--
-- a. Find the titles of courses in the Comp. Sci. department that have 3 credits.
--
-- PE 3.1a — Title các course của khoa Comp. Sci. có 3 credits.
select title from course where dept_name = 'Comp. Sci.' and credits = 3;

-- @ex GK2.02  [PE 3.1b join, distinct]  ★☆☆
-- Đề gốc: Exercise 3.1 (b). Write the following queries in SQL, using the university schema. (We suggest you actually run these queries on a database, using the sample data that we provide on the web site of the book, db-book.com. Instructions for setting up a database, and loading sample data, are provided on the above web site.)
--
-- b. Find the IDs of all students who were taught by an instructor named Einstein; make sure there are no duplicates in the result.
--
-- PE 3.1b — ID của mọi sinh viên được dạy bởi một instructor tên Einstein, không trùng lặp.
-- Gợi ý: takes khớp teaches trên (course_id, sec_id, semester, year); teaches.ID = instructor.ID.
select distinct takes.ID
from takes, instructor, teaches
where takes.course_id = teaches.course_id
  and takes.sec_id = teaches.sec_id
  and takes.semester = teaches.semester
  and takes.year = teaches.year
  and teaches.ID = instructor.ID
  and instructor.name = 'Einstein';

-- @ex GK2.03  [PE 3.1c max]  ★☆☆
-- Đề gốc: Exercise 3.1 (c). Write the following queries in SQL, using the university schema. (We suggest you actually run these queries on a database, using the sample data that we provide on the web site of the book, db-book.com. Instructions for setting up a database, and loading sample data, are provided on the above web site.)
--
-- c. Find the highest salary of any instructor.
--
-- PE 3.1c — Lương cao nhất của một instructor.
select max(salary) from instructor;

-- @ex GK2.04  [PE 3.1d subquery]  ★☆☆
-- Đề gốc: Exercise 3.1 (d). Write the following queries in SQL, using the university schema. (We suggest you actually run these queries on a database, using the sample data that we provide on the web site of the book, db-book.com. Instructions for setting up a database, and loading sample data, are provided on the above web site.)
--
-- d. Find all instructors earning the highest salary (there may be more than one with the same salary).
--
-- PE 3.1d — ID, name của mọi instructor có lương cao nhất (có thể nhiều người).
select ID, name from instructor where salary = (select max(salary) from instructor);

-- @ex GK2.05  [PE 3.1e scalar subquery]  ★★☆
-- Đề gốc: Exercise 3.1 (e). Write the following queries in SQL, using the university schema. (We suggest you actually run these queries on a database, using the sample data that we provide on the web site of the book, db-book.com. Instructions for setting up a database, and loading sample data, are provided on the above web site.)
--
-- e. Find the enrollment of each section that was offered in Fall 2017.
--
-- PE 3.1e — Enrollment (số sinh viên) của mỗi section mở ở Fall 2017: course_id, sec_id, enrollment. Section không có sinh viên phải có enrollment 0.
-- Gợi ý: Scalar subquery trong select.
select course_id, sec_id,
       (select count(ID) from takes
        where takes.year = section.year and takes.semester = section.semester
          and takes.course_id = section.course_id and takes.sec_id = section.sec_id) as enrollment
from section
where semester = 'Fall' and year = 2017;

-- @ex GK2.06  [PE 3.1e empty section]  ★★☆
-- Đề gốc: Exercise 3.1 (e). Write the following queries in SQL, using the university schema. (We suggest you actually run these queries on a database, using the sample data that we provide on the web site of the book, db-book.com. Instructions for setting up a database, and loading sample data, are provided on the above web site.)
--
-- e. Find the enrollment of each section that was offered in Fall 2017.
--
-- PE 3.1e (bẫy section rỗng) — Tạo view `gk_fall2017_enrollment(course_id, sec_id, enrollment)` chứa enrollment của mỗi section Fall 2017. Khi chấm, hệ thống thêm một section Fall 2017 không có sinh viên rồi đọc view: section đó phải có enrollment 0.
-- Gợi ý: Cách join + group by sẽ làm mất section mới.
create view gk_fall2017_enrollment (course_id, sec_id, enrollment) as
select course_id, sec_id,
       (select count(ID) from takes
        where takes.year = section.year and takes.semester = section.semester
          and takes.course_id = section.course_id and takes.sec_id = section.sec_id)
from section
where semester = 'Fall' and year = 2017;

-- Câu truy vấn hệ thống dùng để chấm:
--   insert into section values ('CS-190', '3', 'Fall', 2017, 'Taylor', '3128', 'B');
--   select * from gk_fall2017_enrollment;

-- @ex GK2.07  [PE 3.1f max of aggregate]  ★★☆
-- Đề gốc: Exercise 3.1 (f). Write the following queries in SQL, using the university schema. (We suggest you actually run these queries on a database, using the sample data that we provide on the web site of the book, db-book.com. Instructions for setting up a database, and loading sample data, are provided on the above web site.)
--
-- f. Find the maximum enrollment, across all sections, in Fall 2017.
--
-- PE 3.1f — Enrollment lớn nhất trên mọi section ở Fall 2017 (một giá trị).
select max(enrollment)
from (select count(ID) as enrollment
      from section, takes
      where takes.year = section.year and takes.semester = section.semester
        and takes.course_id = section.course_id and takes.sec_id = section.sec_id
        and takes.semester = 'Fall' and takes.year = 2017
      group by takes.course_id, takes.sec_id) as t;

-- @ex GK2.08  [PE 3.1g with]  ★★☆
-- Đề gốc: Exercise 3.1 (g). Write the following queries in SQL, using the university schema. (We suggest you actually run these queries on a database, using the sample data that we provide on the web site of the book, db-book.com. Instructions for setting up a database, and loading sample data, are provided on the above web site.)
--
-- g. Find the sections that had the maximum enrollment in Fall 2017.
--
-- PE 3.1g — Các section (course_id, sec_id) có enrollment lớn nhất ở Fall 2017. Dùng `with`.
with sec_enrollment as (
  select takes.course_id, takes.sec_id, count(ID) as enrollment
  from section, takes
  where takes.year = section.year and takes.semester = section.semester
    and takes.course_id = section.course_id and takes.sec_id = section.sec_id
    and takes.semester = 'Fall' and takes.year = 2017
  group by takes.course_id, takes.sec_id)
select course_id, sec_id
from sec_enrollment
where enrollment = (select max(enrollment) from sec_enrollment);

-- @ex GK2.09  [PE 3.2a grade points]  ★★☆
-- Đề gốc: Exercise 3.2 (a). Suppose you are given a relation *grade_points*(*grade*, *points*) that provides a conversion from letter grades in the *takes* relation to numeric scores; for example, an “A” grade could be specified to correspond to 4 points, an “A−” to 3.7 points, a “B+” to 3.3 points, a “B” to 3 points, and so on. The grade points earned by a student for a course offering (section) is defined as the number of credits for the course multiplied by the numeric points for the grade that the student received.
--
-- Given the preceding relation, and our university schema, write each of the following queries in SQL. You may assume for simplicity that no *takes* tuple has the *null* value for *grade*.
--
-- a. Find the total grade points earned by the student with ID '12345', across all courses taken by the student.
--
-- PE 3.2a — Tổng grade points (credits × points) mà sinh viên `12345` đạt được qua mọi course đã học. Bảng `grade_points(grade, points)` có sẵn.
select sum(credits * points)
from takes, course, grade_points
where takes.grade = grade_points.grade
  and takes.course_id = course.course_id
  and ID = '12345';

-- @ex GK2.10  [PE 3.2b GPA]  ★★☆
-- Đề gốc: Exercise 3.2 (b). Suppose you are given a relation *grade_points*(*grade*, *points*) that provides a conversion from letter grades in the *takes* relation to numeric scores; for example, an “A” grade could be specified to correspond to 4 points, an “A−” to 3.7 points, a “B+” to 3.3 points, a “B” to 3 points, and so on. The grade points earned by a student for a course offering (section) is defined as the number of credits for the course multiplied by the numeric points for the grade that the student received.
--
-- Given the preceding relation, and our university schema, write each of the following queries in SQL. You may assume for simplicity that no *takes* tuple has the *null* value for *grade*.
--
-- b. Find the grade point average (*GPA*) for the above student, that is, the total grade points divided by the total credits for the associated courses.
--
-- PE 3.2b — GPA của sinh viên `12345`: tổng grade points chia tổng credits của các course tương ứng. Đặt tên cột `GPA`.
select sum(credits * points) / sum(credits) as GPA
from takes, course, grade_points
where takes.grade = grade_points.grade
  and takes.course_id = course.course_id
  and ID = '12345';

-- @ex GK2.11  [PE 3.2c group by]  ★★☆
-- Đề gốc: Exercise 3.2 (c). Suppose you are given a relation *grade_points*(*grade*, *points*) that provides a conversion from letter grades in the *takes* relation to numeric scores; for example, an “A” grade could be specified to correspond to 4 points, an “A−” to 3.7 points, a “B+” to 3.3 points, a “B” to 3 points, and so on. The grade points earned by a student for a course offering (section) is defined as the number of credits for the course multiplied by the numeric points for the grade that the student received.
--
-- Given the preceding relation, and our university schema, write each of the following queries in SQL. You may assume for simplicity that no *takes* tuple has the *null* value for *grade*.
--
-- c. Find the ID and the grade-point average of each student.
--
-- PE 3.2c — ID và GPA của mỗi sinh viên (chỉ những sinh viên có ít nhất một môn đã có điểm).
select ID, sum(credits * points) / sum(credits) as GPA
from takes, course, grade_points
where takes.grade = grade_points.grade
  and takes.course_id = course.course_id
group by ID;

-- @ex GK2.12  [PE 3.2c union null]  ★★★
-- Đề gốc: Exercise 3.2 (c). Suppose you are given a relation *grade_points*(*grade*, *points*) that provides a conversion from letter grades in the *takes* relation to numeric scores; for example, an “A” grade could be specified to correspond to 4 points, an “A−” to 3.7 points, a “B+” to 3.3 points, a “B” to 3 points, and so on. The grade points earned by a student for a course offering (section) is defined as the number of credits for the course multiplied by the numeric points for the grade that the student received.
--
-- Given the preceding relation, and our university schema, write each of the following queries in SQL. You may assume for simplicity that no *takes* tuple has the *null* value for *grade*.
--
-- c. Find the ID and the grade-point average of each student.
--
-- PE 3.2c (đầy đủ) — Như GK2.11 nhưng sinh viên chưa học môn nào cũng xuất hiện với GPA = null. Không dùng outer join (dùng `union` như lời giải sách).
select ID, sum(credits * points) / sum(credits) as GPA
from takes, course, grade_points
where takes.grade = grade_points.grade
  and takes.course_id = course.course_id
group by ID
union
select ID, null
from student
where not exists (select * from takes where takes.ID = student.ID);

-- @ex GK2.13  [PE 3.2d null grade]  ★★★
-- Đề gốc: Exercise 3.2 (d). Suppose you are given a relation *grade_points*(*grade*, *points*) that provides a conversion from letter grades in the *takes* relation to numeric scores; for example, an “A” grade could be specified to correspond to 4 points, an “A−” to 3.7 points, a “B+” to 3.3 points, a “B” to 3 points, and so on. The grade points earned by a student for a course offering (section) is defined as the number of credits for the course multiplied by the numeric points for the grade that the student received.
--
-- Given the preceding relation, and our university schema, write each of the following queries in SQL. You may assume for simplicity that no *takes* tuple has the *null* value for *grade*.
--
-- d. Now reconsider your answers to the earlier parts of this exercise under the assumption that some grades might be null. Explain whether your solutions still work and, if not, provide versions that handle nulls properly.
--
-- PE 3.2d — Sinh viên `98988` (Tanaka) có một môn chưa có điểm (grade null). Trả về hai cột: `naive_gpa` = sum(credits × points) / sum(credits) tính trên `takes natural join course left join grade_points using (grade)` (không lọc gì), và `correct_gpa` = GPA chỉ tính các môn đã có điểm.
-- Gợi ý: Ở cách naive, credits của môn null vẫn bị cộng vào mẫu số (vì sum(credits) không bỏ qua dòng có points null). Dùng case when grade is null then 0 else credits end.
select sum(credits * points) / sum(credits) as naive_gpa,
       sum(credits * points) / sum(case when grade is null then 0 else credits end) as correct_gpa
from takes natural join course left join grade_points using (grade)
where ID = '98988';

-- @ex GK2.14  [PE 3.3a update]  ★☆☆
-- Đề gốc: Exercise 3.3 (a). Write the following inserts, deletes, or updates in SQL, using the university schema.
--
-- a. Increase the salary of each instructor in the Comp. Sci. department by 10%.
--
-- PE 3.3a — Tăng 10% lương của mỗi instructor khoa Comp. Sci.
update instructor set salary = salary * 1.10 where dept_name = 'Comp. Sci.';

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, salary from instructor order by ID;

-- @ex GK2.15  [PE 3.3b delete]  ★☆☆
-- Đề gốc: Exercise 3.3 (b). Write the following inserts, deletes, or updates in SQL, using the university schema.
--
-- b. Delete all courses that have never been offered (i.e., do not occur in the *section* relation).
--
-- PE 3.3b — Xoá mọi course chưa bao giờ được mở (không xuất hiện trong section).
delete from course where course_id not in (select course_id from section);

-- Câu truy vấn hệ thống dùng để chấm:
--   select course_id from course order by course_id;

-- @ex GK2.16  [PE 3.3c insert select]  ★★☆
-- Đề gốc: Exercise 3.3 (c). Write the following inserts, deletes, or updates in SQL, using the university schema.
--
-- c. Insert every student whose *tot_cred* attribute is greater than 100 as an instructor in the same department, with a salary of $10,000.
--
-- PE 3.3c — Chèn mọi student có `tot_cred > 100` làm instructor cùng khoa. Sách dùng lương 10000, nhưng schema có `check (salary > 29000)` nên lệnh đó bị từ chối (23514) — hãy dùng lương 30000.
insert into instructor
select ID, name, dept_name, 30000
from student
where tot_cred > 100;

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, name, dept_name, salary from instructor where salary = 30000 order by ID;

-- @ex GK2.17  [PE 3.4a count distinct]  ★★☆
-- Đề gốc: Exercise 3.4 (a). Consider the insurance database of Figure 3.17, where the primary keys are underlined. Construct the following SQL queries for this relational database.
--
-- a. Find the total number of people who owned cars that were involved in accidents in 2017.
--
-- *Figure 3.17 — Insurance database* (primary keys underlined):
--
-- - person (driver_id, name, address)
-- - car (license_plate, model, year)
-- - accident (report_number, year, location)
-- - owns (driver_id, license_plate)
-- - participated (report_number, license_plate, driver_id, damage_amount)
--
-- PE 3.4a (Insurance database) — Tổng số người sở hữu xe có dính tai nạn năm 2017.
-- Gợi ý: accident → participated → owns (theo license_plate); count(distinct ...).
select count(distinct owns.driver_id)
from accident, participated, owns
where accident.report_number = participated.report_number
  and owns.license_plate = participated.license_plate
  and accident.year = 2017;

-- @ex GK2.18  [PE 3.4b delete in]  ★★☆
-- Đề gốc: Exercise 3.4 (b). Consider the insurance database of Figure 3.17, where the primary keys are underlined. Construct the following SQL queries for this relational database.
--
-- b. Delete all year-2010 cars belonging to the person whose ID is '12345'.
--
-- *Figure 3.17 — Insurance database* (primary keys underlined):
--
-- - person (driver_id, name, address)
-- - car (license_plate, model, year)
-- - accident (report_number, year, location)
-- - owns (driver_id, license_plate)
-- - participated (report_number, license_plate, driver_id, damage_amount)
--
-- PE 3.4b — Xoá mọi xe đời 2010 thuộc về người có driver_id `12345`. (owns và participated khai báo `on delete cascade` tới car.)
delete from car
where year = 2010
  and license_plate in (select license_plate from owns where driver_id = '12345');

-- Câu truy vấn hệ thống dùng để chấm:
--   select license_plate, year,
--          (select count(*) from owns o where o.license_plate = car.license_plate) as num_owners
--   from car order by license_plate;

-- @ex GK2.19  [PE 3.5a case]  ★☆☆
-- Đề gốc: Exercise 3.5 (a). Suppose that we have a relation *marks*(*ID*, *score*) and we wish to assign grades to students based on the score as follows: grade F if score < 40, grade C if 40 ≤ score < 60, grade B if 60 ≤ score < 80, and grade A if 80 ≤ score. Write SQL queries to do the following:
--
-- a. Display the grade for each student, based on the *marks* relation.
--
-- PE 3.5a — Hiển thị ID và grade của mỗi sinh viên trong `marks(ID, score)`: F nếu score < 40, C nếu 40 ≤ score < 60, B nếu 60 ≤ score < 80, A nếu score ≥ 80.
select ID,
       case
         when score < 40 then 'F'
         when score < 60 then 'C'
         when score < 80 then 'B'
         else 'A'
       end as grade
from marks;

-- @ex GK2.20  [PE 3.5b group by case]  ★★☆
-- Đề gốc: Exercise 3.5 (b). Suppose that we have a relation *marks*(*ID*, *score*) and we wish to assign grades to students based on the score as follows: grade F if score < 40, grade C if 40 ≤ score < 60, grade B if 60 ≤ score < 80, and grade A if 80 ≤ score. Write SQL queries to do the following:
--
-- b. Find the number of students with each grade.
--
-- PE 3.5b — Số sinh viên đạt mỗi grade (grade, count).
with grades as (
  select ID,
         case
           when score < 40 then 'F'
           when score < 60 then 'C'
           when score < 80 then 'B'
           else 'A'
         end as grade
  from marks)
select grade, count(ID)
from grades
group by grade;

-- @ex GK2.21  [PE 3.6 lower like]  ★☆☆
-- Đề gốc: Exercise 3.6. The SQL like operator is case sensitive (in most systems), but the lower() function on strings can be used to perform case-insensitive matching. To show how, write a query that finds departments whose names contain the string “sci” as a substring, regardless of the case.
--
-- PE 3.6 — Tên các department có chứa chuỗi `sci` (không phân biệt hoa thường).
select dept_name from department where lower(dept_name) like '%sci%';

-- @ex GK2.22  [PE 3.6 lower like]  ★☆☆
-- Đề gốc: Exercise 3.6. The SQL like operator is case sensitive (in most systems), but the lower() function on strings can be used to perform case-insensitive matching. To show how, write a query that finds departments whose names contain the string “sci” as a substring, regardless of the case.
--
-- PE 3.6 (biến thể) — Title các course chứa chuỗi `INTRO` không phân biệt hoa thường. (Thử `like '%INTRO%'` trước để thấy like phân biệt hoa thường.)
select title from course where lower(title) like '%intro%';

-- @ex GK2.23  [PE 3.7 empty relation]  ★★★
-- Đề gốc: Exercise 3.7. Consider the SQL query
--
-- ```sql
-- select p.a1
-- from p, r1, r2
-- where p.a1 = r1.a1 or p.a1 = r2.a1
-- ```
--
-- Under what conditions does the preceding query select values of p.a1 that are either in r1 or in r2? Examine carefully the cases where either r1 or r2 may be empty.
--
-- PE 3.7 — Tạo bảng `gk_p(a1 int)` = {1, 2, 3}, `gk_r1(a1 int)` = {1, 2} và `gk_r2(a1 int)` rỗng. Câu của sách `select gk_p.a1 from gk_p, gk_r1, gk_r2 where gk_p.a1 = gk_r1.a1 or gk_p.a1 = gk_r2.a1` trả về rỗng. Viết câu đúng trả về các giá trị của gk_p có trong gk_r1 hoặc gk_r2.
-- Gợi ý: in (select ... union select ...).
create table gk_p (a1 int);
create table gk_r1 (a1 int);
create table gk_r2 (a1 int);
insert into gk_p values (1), (2), (3);
insert into gk_r1 values (1), (2);
select a1 from gk_p
where a1 in (select a1 from gk_r1 union select a1 from gk_r2);

-- @ex GK2.24  [PE 3.8a except]  ★☆☆
-- Đề gốc: Exercise 3.8 (a). Consider the bank database of Figure 3.18, where the primary keys are underlined. Construct the following SQL queries for this relational database.
--
-- a. Find the ID of each customer of the bank who has an account but not a loan.
--
-- *Figure 3.18 — Banking database* (primary keys underlined):
--
-- - branch (branch_name, branch_city, assets)
-- - customer (ID, customer_name, customer_street, customer_city)
-- - loan (loan_number, branch_name, amount)
-- - borrower (ID, loan_number)
-- - account (account_number, branch_name, balance)
-- - depositor (ID, account_number)
--
-- PE 3.8a (Bank database) — ID của mỗi khách hàng có account nhưng không có loan.
(select ID from depositor)
except
(select ID from borrower);

-- @ex GK2.25  [PE 3.8b self join]  ★★☆
-- Đề gốc: Exercise 3.8 (b). Consider the bank database of Figure 3.18, where the primary keys are underlined. Construct the following SQL queries for this relational database.
--
-- b. Find the ID of each customer who lives on the same street and in the same city as customer '12345'.
--
-- *Figure 3.18 — Banking database* (primary keys underlined):
--
-- - branch (branch_name, branch_city, assets)
-- - customer (ID, customer_name, customer_street, customer_city)
-- - loan (loan_number, branch_name, amount)
-- - borrower (ID, loan_number)
-- - account (account_number, branch_name, balance)
-- - depositor (ID, account_number)
--
-- PE 3.8b — ID của mỗi khách hàng sống cùng street và cùng city với khách hàng `12345` (kể cả chính 12345). Lưu ý: lời giải sách viết `S.customer_id` — cột đúng là `ID`.
select F.ID
from customer as F, customer as S
where F.customer_street = S.customer_street
  and F.customer_city = S.customer_city
  and S.ID = '12345';

-- @ex GK2.26  [PE 3.8c join]  ★★☆
-- Đề gốc: Exercise 3.8 (c). Consider the bank database of Figure 3.18, where the primary keys are underlined. Construct the following SQL queries for this relational database.
--
-- c. Find the name of each branch that has at least one customer who has an account in the bank and who lives in “Harrison”.
--
-- *Figure 3.18 — Banking database* (primary keys underlined):
--
-- - branch (branch_name, branch_city, assets)
-- - customer (ID, customer_name, customer_street, customer_city)
-- - loan (loan_number, branch_name, amount)
-- - borrower (ID, loan_number)
-- - account (account_number, branch_name, balance)
-- - depositor (ID, account_number)
--
-- PE 3.8c — Tên mỗi branch có ít nhất một khách hàng có account ở đó và sống ở Harrison.
select distinct branch_name
from account, depositor, customer
where customer.ID = depositor.ID
  and depositor.account_number = account.account_number
  and customer_city = 'Harrison';

-- @ex GK2.27  [PE 3.9a join]  ★☆☆
-- Đề gốc: Exercise 3.9 (a). Consider the relational database of Figure 3.19, where the primary keys are underlined. Give an expression in SQL for each of the following queries.
--
-- a. Find the ID, name, and city of residence of each employee who works for “First Bank Corporation”.
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.9a (Employee database) — ID, tên và thành phố cư trú của mỗi nhân viên làm cho First Bank Corporation.
select e.ID, e.person_name, e.city
from employee as e, works as w
where w.company_name = 'First Bank Corporation' and w.ID = e.ID;

-- @ex GK2.28  [PE 3.9b in]  ★☆☆
-- Đề gốc: Exercise 3.9 (b). Consider the relational database of Figure 3.19, where the primary keys are underlined. Give an expression in SQL for each of the following queries.
--
-- b. Find the ID, name, and city of residence of each employee who works for “First Bank Corporation” and earns more than $10000.
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.9b — ID, tên, thành phố của mỗi nhân viên làm cho First Bank Corporation và có lương > 10000.
select ID, person_name, city
from employee
where ID in (select ID from works
             where company_name = 'First Bank Corporation' and salary > 10000);

-- @ex GK2.29  [PE 3.9c not in]  ★★☆
-- Đề gốc: Exercise 3.9 (c). Consider the relational database of Figure 3.19, where the primary keys are underlined. Give an expression in SQL for each of the following queries.
--
-- c. Find the ID of each employee who does not work for “First Bank Corporation”.
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.9c — ID của mỗi nhân viên không làm cho First Bank Corporation, kể cả người không có trong works.
-- Gợi ý: company_name <> ... trên works sẽ bỏ sót người không có trong works.
select ID from employee
where ID not in (select ID from works where company_name = 'First Bank Corporation');

-- @ex GK2.30  [PE 3.9d > all]  ★★☆
-- Đề gốc: Exercise 3.9 (d). Consider the relational database of Figure 3.19, where the primary keys are underlined. Give an expression in SQL for each of the following queries.
--
-- d. Find the ID of each employee who earns more than every employee of “Small Bank Corporation”.
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.9d — ID của mỗi nhân viên có lương cao hơn mọi nhân viên của Small Bank Corporation.
select ID from works
where salary > all (select salary from works where company_name = 'Small Bank Corporation');

-- @ex GK2.31  [PE 3.9e not exists except]  ★★★
-- Đề gốc: Exercise 3.9 (e). Consider the relational database of Figure 3.19, where the primary keys are underlined. Give an expression in SQL for each of the following queries.
--
-- e. Assume that companies may be located in several cities. Find the name of each company that is located in every city in which “Small Bank Corporation” is located.
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.9e — Một công ty có thể đặt ở nhiều thành phố (`company(company_name, city)`). Tên mỗi công ty đặt ở mọi thành phố mà Small Bank Corporation có mặt.
select distinct S.company_name
from company as S
where not exists ((select city from company where company_name = 'Small Bank Corporation')
                  except
                  (select city from company as T where S.company_name = T.company_name));

-- @ex GK2.32  [PE 3.9f having >= all]  ★★★
-- Đề gốc: Exercise 3.9 (f). Consider the relational database of Figure 3.19, where the primary keys are underlined. Give an expression in SQL for each of the following queries.
--
-- f. Find the name of the company that has the most employees (or companies, in the case where there is a tie for the most).
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.9f — Tên công ty có nhiều nhân viên nhất (trả về tất cả nếu hoà).
select company_name
from works
group by company_name
having count(distinct ID) >= all (select count(distinct ID) from works group by company_name);

-- @ex GK2.33  [PE 3.9g having avg]  ★★☆
-- Đề gốc: Exercise 3.9 (g). Consider the relational database of Figure 3.19, where the primary keys are underlined. Give an expression in SQL for each of the following queries.
--
-- g. Find the name of each company whose employees earn a higher salary, on average, than the average salary at “First Bank Corporation”.
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.9g — Tên mỗi công ty có lương trung bình của nhân viên cao hơn lương trung bình ở First Bank Corporation.
select company_name
from works
group by company_name
having avg(salary) > (select avg(salary) from works where company_name = 'First Bank Corporation');

-- @ex GK2.34  [PE 3.10a update]  ★☆☆
-- Đề gốc: Exercise 3.10 (a). Consider the relational database of Figure 3.19. Give an expression in SQL for each of the following:
--
-- a. Modify the database so that the employee whose ID is '12345' now lives in “Newtown”.
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.10a — Nhân viên có ID `12345` nay sống ở Newtown.
update employee set city = 'Newtown' where ID = '12345';

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, city from employee order by ID;

-- @ex GK2.35  [PE 3.10b update case]  ★★★
-- Đề gốc: Exercise 3.10 (b). Consider the relational database of Figure 3.19. Give an expression in SQL for each of the following:
--
-- b. Give each manager of “First Bank Corporation” a 10 percent raise unless the salary becomes greater than $100000; in such cases, give only a 3 percent raise.
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.10b — Tăng 10% lương cho mỗi manager (xuất hiện trong `manages.manager_id`) làm cho First Bank Corporation, trừ khi lương sau khi tăng vượt 100000 — khi đó chỉ tăng 3%. Viết một lệnh update dùng `case`.
update works as T
set salary = T.salary * (case when T.salary * 1.1 > 100000 then 1.03 else 1.1 end)
where T.ID in (select manager_id from manages)
  and T.company_name = 'First Bank Corporation';

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, salary from works order by ID;

-- @ex GK2.36  [PE 3.10b two updates]  ★★★
-- Đề gốc: Exercise 3.10 (b). Consider the relational database of Figure 3.19. Give an expression in SQL for each of the following:
--
-- b. Give each manager of “First Bank Corporation” a 10 percent raise unless the salary becomes greater than $100000; in such cases, give only a 3 percent raise.
--
-- *Figure 3.19 — Employee database* (primary keys underlined):
--
-- - employee (ID, person_name, street, city)
-- - works (ID, company_name, salary)
-- - company (company_name, city)
-- - manages (ID, manager_id)
--
-- PE 3.10b (hai lệnh) — Viết lại GK2.35 bằng hai lệnh update không dùng case, theo đúng thứ tự để không ai bị tăng hai lần. Kết quả phải giống GK2.35.
-- Gợi ý: Lệnh 3% (salary * 1.1 > 100000) chạy trước.
update works as T
set salary = T.salary * 1.03
where T.ID in (select manager_id from manages)
  and T.salary * 1.1 > 100000
  and T.company_name = 'First Bank Corporation';
update works as T
set salary = T.salary * 1.1
where T.ID in (select manager_id from manages)
  and T.salary * 1.1 <= 100000
  and T.company_name = 'First Bank Corporation';

-- Câu truy vấn hệ thống dùng để chấm:
--   select ID, salary from works order by ID;
