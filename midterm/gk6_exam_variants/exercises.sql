-- =====================================================================
-- CS4420 · Đề GK · Biến tấu — Đề thi giữa kỳ — Biến tấu từ bài tập của bạn (Midterm Exam — Variants of the Original Exercises)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- gk6
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex GK6.01  [Q4 ← raise + filter]  ★☆☆
-- ← Question 4. Show ID, name and the salary after a 10% raise, only for the instructors whose raised salary would exceed 80000.




-- @ex GK6.02  [Q7 ← not in]  ★☆☆
-- ← Question 7. Get the name and department of the instructors who are not in Physics or History.




-- @ex GK6.03  [Q8 ← not between]  ★☆☆
-- ← Question 8. Get the names and salaries of the instructors whose salary is not between 60000 and 90000.




-- @ex GK6.04  [Q10 ← join on syntax]  ★★☆
-- ← Question 10. Re-write it with explicit `JOIN ... ON`: name and course ID taught by instructors of the Comp. Sci. department, for sections taught in Spring only.




-- @ex GK6.05  [Q11 ← filter grade]  ★★☆
-- ← Question 11. Show each student's name with the title of every course in which they got A or A-, ordered by student name then title.
-- (Thứ tự dòng được chấm.)




-- @ex GK6.06  [Q13 ← > all]  ★★☆
-- ← Question 13. Get the names of the instructors whose salary is greater than that of every Finance instructor.




-- @ex GK6.07  [Q14 ← like variants]  ★☆☆
-- ← Question 14. Get the titles of courses that start with 'Intro' or end with 'Systems'.




-- @ex GK6.08  [Q15 ← order by 3 keys]  ★☆☆
-- ← Question 15. List ID, name, dept_name, salary of the instructors by department ascending, then salary descending, then name ascending.
-- (Thứ tự dòng được chấm.)




-- @ex GK6.09  [Q16 ← not null]  ★☆☆
-- ← Question 16. Find the enrollments that do have a grade and whose grade is neither 'A' nor 'A-'. Output ID, course_id, grade.




-- @ex GK6.10  [Q17 ← group having]  ★★☆
-- ← Question 17/18. For every department that has at least 2 instructors, show dept_name, number of instructors, minimum, maximum and average salary.




-- @ex GK6.11  [Q18 ← having avg]  ★★☆
-- ← Question 18. Show dept_name and average salary only for the departments whose average salary is greater than 70000.




-- @ex GK6.12  [Q19 ← left join count]  ★★☆
-- ← Question 19 / 3.1e. For every instructor, show ID, name and the number of sections taught (0 if none) as `num_sections`.
-- Gợi ý: left outer join + count(cột bảng phải); count(*) sẽ sai.




-- @ex GK6.13  [3.1a ← not in dept]  ★☆☆
-- ← Exercise 3.1a. Find the titles of courses with 4 credits that do not belong to the Comp. Sci. department.




-- @ex GK6.14  [3.1b ← other instructor]  ★★☆
-- ← Exercise 3.1b. Find the IDs of all students who were taught by an instructor named Srinivasan (no duplicates).




-- @ex GK6.15  [3.1d ← second highest]  ★★★
-- ← Exercise 3.1c/d. Find all instructors who earn the second highest salary (ties included).




-- @ex GK6.16  [3.1e ← enrollment incl. 0]  ★★★
-- ← Exercise 3.1e. Find the enrollment of each section offered in Spring 2017, including sections with no student (enrollment 0). Output course_id, sec_id, enrollment.




-- @ex GK6.17  [3.1g ← max over all terms]  ★★★
-- ← Exercise 3.1g. Find the section(s) with the maximum enrollment over all semesters and years. Output course_id, sec_id, semester, year.




-- @ex GK6.18  [3.2 ← passed credits]  ★★★
-- ← Exercise 3.2. For every student (including those with no course) output ID and `passed_credits`: total credits of courses where the grade is not null and not F (0 if none).




-- @ex GK6.19  [3.3a ← update case]  ★★★
-- ← Exercise 3.3a. In one UPDATE: Comp. Sci. instructors earning less than 70000 get a 15% raise, the other Comp. Sci. instructors get 5%.




-- @ex GK6.20  [3.3b ← delete idle instructors]  ★★☆
-- ← Exercise 3.3b. Delete all instructors who have never taught a section (do not occur in teaches).




-- @ex GK6.21  [3.3c ← insert not exists]  ★★★
-- ← Exercise 3.3c. Enroll every Physics student in PHY-101, section 1, Fall 2017 with a NULL grade, skipping students already enrolled in it.




-- @ex GK6.22  [3.4a ← accidents per car]  ★★☆
-- ← Exercise 3.4a. (Insurance) For every car show license_plate, model and the number of accidents it participated in (0 if none) as `num_accidents`.




-- @ex GK6.23  [3.4b ← delete FK order]  ★★★
-- ← Exercise 3.4b. Delete every 2017 accident whose total damage_amount is at most 1000. Remember the foreign key from participated.
-- Gợi ý: Xoá participated trước, accident sau.




-- @ex GK6.24  [3.4 ← owner total damage]  ★★☆
-- ← Exercise 3.4. For each person who owns a car that took part in an accident, show the person's name and the total damage_amount of those participations as `total_damage`.




-- @ex GK6.25  [3.5 ← new scale + count]  ★★☆
-- ← Exercise 3.5. With a new scale (A if score >= 90, B if >= 80, C if >= 70, D if >= 60, otherwise F) output grade and number of students per grade.




-- @ex GK6.26  [3.6 ← lower like]  ★☆☆
-- ← Exercise 3.6. Find the titles of courses that contain "comput" regardless of case.




-- @ex GK6.27  [3.8a ← loan but no account]  ★☆☆
-- ← Exercise 3.8a. (Bank) Find the ID of each customer who has a loan but not an account.




-- @ex GK6.28  [3.8b ← same city diff street]  ★★☆
-- ← Exercise 3.8b. Find the ID of each customer who lives in the same city as customer '12345' but on a different street.




-- @ex GK6.29  [3.8c ← both loan & account branch]  ★★☆
-- ← Exercise 3.8c. Find the name of each branch that has both at least one loan and at least one account.




-- @ex GK6.30  [3.9a ← miami companies]  ★★☆
-- ← Exercise 3.9a. (Employee) Find the ID and name of every employee who works for a company that is located in Miami.




-- @ex GK6.31  [3.9d ← > all (Mega)]  ★★☆
-- ← Exercise 3.9d. Find the ID of each employee who earns more than every employee of "Mega Corp".




-- @ex GK6.32  [3.9e ← division BigBank]  ★★★
-- ← Exercise 3.9e. Find the name of each company that is located in every city in which "BigBank" is located (BigBank itself included).




-- @ex GK6.33  [3.9f ← fewest employees]  ★★★
-- ← Exercise 3.9f. Find the name of the company that has the fewest employees (all of them in case of a tie).




-- @ex GK6.34  [3.9g ← below overall avg]  ★★☆
-- ← Exercise 3.9g. Find the name of each company whose average salary is lower than the average salary of all employees.




-- @ex GK6.35  [3.10a ← update two cond]  ★☆☆
-- ← Exercise 3.10a. Employees of "Small Bank Corporation" who live in Miami now live in "Orlando".




-- @ex GK6.36  [3.10b ← manager raise case]  ★★★
-- ← Exercise 3.10b. Give each manager of "Mega Corp" an 8 percent raise unless the new salary would exceed 60000; in such cases give only 2 percent. (One UPDATE.)




-- @ex GK6.37  [3.11a ← division 4-credit CS]  ★★★
-- ← Exercise 3.11a. Find the ID and name of each student who has taken every Comp. Sci. course with 4 credits.




-- @ex GK6.38  [3.11b ← only 2018]  ★★☆
-- ← Exercise 3.11b. Find the ID and name of each student who has not taken any course offered before 2018.




-- @ex GK6.39  [3.11d ← dept with min of max]  ★★★
-- ← Exercise 3.11d. Find the department(s) whose maximum instructor salary is the lowest among all departments. Output dept_name and that salary.




-- @ex GK6.40  [3.12a-c ← chain]  ★★★
-- ← Exercise 3.12a–c. In one script: create course "CS-002" titled "Lab Seminar" (Comp. Sci., 1 credit); create its section 1 in Spring 2019 with no location; enroll every student with tot_cred < 50 (any department) in it.




-- @ex GK6.41  [3.12f ← intro delete]  ★★★
-- ← Exercise 3.12f. Delete all takes tuples of any section of any course with the word "intro" as part of the title, ignoring case.




-- @ex GK6.42  [3.13 ← DDL library]  ★★★
-- ← Exercise 3.13. Write DDL for a small library: `lib_book(isbn varchar(13) PK, title varchar(100) not null, year int)`, `lib_member(member_id int PK, name varchar(50) not null, email varchar(80) unique)`, `lib_loan(member_id, isbn, loan_date date, return_date date; PK (member_id, isbn, loan_date); FK member_id → lib_member on delete cascade; FK isbn → lib_book)`.
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)


