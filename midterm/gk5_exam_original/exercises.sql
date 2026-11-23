-- =====================================================================
-- CS4420 · Đề GK · Nguyên bản — Đề thi giữa kỳ — Bài tập nguyên bản của bạn (Midterm Exam — Original Exercises (Questions 1–19, 3.1–3.13))
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- gk5
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex GK5.01  [Q1 select *]  ★☆☆
-- Question 1 — Get all the information about every department.




-- @ex GK5.02  [Q2 projection]  ★☆☆
-- Question 2 — Get the name and salary of every instructor.




-- @ex GK5.03  [Q3 distinct]  ★☆☆
-- Question 3 — List the departments that have instructors, showing each department only once.




-- @ex GK5.04  [Q4 arithmetic]  ★☆☆
-- Question 4 — Show each instructor's ID, name and salary after a 10% raise.




-- @ex GK5.05  [Q5 where]  ★☆☆
-- Question 5 — Get the names of the instructors in the Comp. Sci. department.




-- @ex GK5.06  [Q6 where and]  ★☆☆
-- Question 6 — Get the names of the Comp. Sci. instructors whose salary is greater than 70000.




-- @ex GK5.07  [Q7 in]  ★☆☆
-- Question 7 — Get the name and department of the instructors in Physics or History.




-- @ex GK5.08  [Q8 between]  ★☆☆
-- Question 8 — Get the names of the instructors whose salary is between 80000 and 90000.




-- @ex GK5.09  [Q9 join in where]  ★☆☆
-- Question 9 — Show each instructor's name together with the IDs of the courses they teach, joining the tables in the WHERE clause.




-- @ex GK5.10  [Q10 join + filter]  ★☆☆
-- Question 10 — Show the name and the course IDs taught by the instructors of the Comp. Sci. department.




-- @ex GK5.11  [Q11 3-table join]  ★★☆
-- Question 11 — Show each student's name together with the title of every course they have taken.




-- @ex GK5.12  [Q12 alias]  ★☆☆
-- Question 12 — Get each instructor's name as instructor_name and their monthly salary as monthly_salary.




-- @ex GK5.13  [Q13 > some]  ★★☆
-- Question 13 — Get the names of the instructors whose salary is greater than that of at least one Biology instructor.




-- @ex GK5.14  [Q14 like]  ★☆☆
-- Question 14 — Get the titles of the courses that contain the string 'Comp'.




-- @ex GK5.15  [Q15 order by]  ★☆☆
-- Question 15 — List the instructors by salary in descending order, and by name in ascending order when salaries are equal.
-- (Thứ tự dòng được chấm.)




-- @ex GK5.16  [Q16 is null]  ★☆☆
-- Question 16 — Find the enrollments that have no grade yet (grade is NULL).




-- @ex GK5.17  [Q17 aggregates]  ★☆☆
-- Question 17 — Find the average, maximum and minimum salary and the number of instructors in the Comp. Sci. department.




-- @ex GK5.18  [Q18 group by avg]  ★☆☆
-- Question 18 — Find the average instructor salary in each department.




-- @ex GK5.19  [Q19 group by count]  ★☆☆
-- Question 19 — Count the students in each department.




-- @ex GK5.20  [3.1a where]  ★☆☆
-- Exercise 3.1a — Find the titles of courses in the Comp. Sci. department that have 3 credits.




-- @ex GK5.21  [3.1b 3-table join]  ★★☆
-- Exercise 3.1b — Find the IDs of all students who were taught by an instructor named Einstein; make sure there are no duplicates in the result.




-- @ex GK5.22  [3.1c max]  ★☆☆
-- Exercise 3.1c — Find the highest salary of any instructor.




-- @ex GK5.23  [3.1d scalar subquery]  ★★☆
-- Exercise 3.1d — Find all instructors earning the highest salary (there may be more than one with the same salary).




-- @ex GK5.24  [3.1e enrollment]  ★★☆
-- Exercise 3.1e — Find the enrollment of each section that was offered in Fall 2017. (Output course_id, sec_id, enrollment — as in the exercise, sections with no students may be left out.)




-- @ex GK5.25  [3.1f max of counts]  ★★☆
-- Exercise 3.1f — Find the maximum enrollment, across all sections, in Fall 2017.




-- @ex GK5.26  [3.1g with + max]  ★★★
-- Exercise 3.1g — Find the sections that had the maximum enrollment in Fall 2017.




-- @ex GK5.27  [3.2a sum of products]  ★★☆
-- Exercise 3.2a — Given grade_points(grade, points): find the total grade points earned by the student with ID '12345', across all courses taken by the student.




-- @ex GK5.28  [3.2b GPA]  ★★☆
-- Exercise 3.2b — Find the grade point average (GPA) for the above student, that is, the total grade points divided by the total credits for the associated courses.




-- @ex GK5.29  [3.2c GPA per student]  ★★☆
-- Exercise 3.2c — Find the ID and the grade-point average of each student.




-- @ex GK5.30  [3.2d GPA keep all (null)]  ★★★
-- Exercise 3.2d — Reconsider 3.2c when some grades might be null: write the version that keeps every student (GPA is NULL when undefined). Output ID and GPA.
-- Gợi ý: Scalar subquery trong SELECT (xem câu tự luận N2).




-- @ex GK5.31  [3.3a update]  ★☆☆
-- Exercise 3.3a — Increase the salary of each instructor in the Comp. Sci. department by 10%.




-- @ex GK5.32  [3.3b delete not in]  ★★☆
-- Exercise 3.3b — Delete all courses that have never been offered (i.e., do not occur in the section relation).




-- @ex GK5.33  [3.3c insert select]  ★★☆
-- Exercise 3.3c — Insert every student whose tot_cred attribute is greater than 100 as an instructor in the same department, with a salary of $10,000. *(The lab schema has CHECK salary > 29000, so insert 30000 instead.)*




-- @ex GK5.34  [3.4a count distinct]  ★★☆
-- Exercise 3.4a — (Insurance database) Find the total number of people who owned cars that were involved in accidents in 2017.




-- @ex GK5.35  [3.4b delete in]  ★★☆
-- Exercise 3.4b — Delete all year-2010 cars belonging to the person whose ID is '12345'.




-- @ex GK5.36  [3.5a case]  ★★☆
-- Exercise 3.5a — Relation marks(ID, score): grade F if score < 40, C if 40 <= score < 60, B if 60 <= score < 80, A if 80 <= score. Display the grade for each student.




-- @ex GK5.37  [3.5b with + group]  ★★☆
-- Exercise 3.5b — Find the number of students with each grade (same grading scheme).




-- @ex GK5.38  [3.6 lower like]  ★☆☆
-- Exercise 3.6 — Find departments whose names contain the string "sci" as a substring, regardless of the case (use lower()).




-- @ex GK5.39  [3.8a except]  ★☆☆
-- Exercise 3.8a — (Bank database) Find the ID of each customer of the bank who has an account but not a loan.




-- @ex GK5.40  [3.8b self join]  ★★☆
-- Exercise 3.8b — Find the ID of each customer who lives on the same street and in the same city as customer '12345'.




-- @ex GK5.41  [3.8c join]  ★★☆
-- Exercise 3.8c — Find the name of each branch that has at least one customer who has an account in the bank and who lives in "Harrison".




-- @ex GK5.42  [3.9a join]  ★☆☆
-- Exercise 3.9a — (Employee database) Find the ID, name, and city of residence of each employee who works for "First Bank Corporation".




-- @ex GK5.43  [3.9b join + salary]  ★☆☆
-- Exercise 3.9b — Find the ID, name, and city of residence of each employee who works for "First Bank Corporation" and earns more than $10000.




-- @ex GK5.44  [3.9c not in]  ★★☆
-- Exercise 3.9c — Find the ID of each employee who does not work for "First Bank Corporation". (Employees with no works tuple count too.)




-- @ex GK5.45  [3.9d > all]  ★★☆
-- Exercise 3.9d — Find the ID of each employee who earns more than every employee of "Small Bank Corporation".




-- @ex GK5.46  [3.9e division]  ★★★
-- Exercise 3.9e — Assume that companies may be located in several cities. Find the name of each company that is located in every city in which "Small Bank Corporation" is located.
-- Gợi ý: not exists ((các city của Small Bank) except (các city của company S)).




-- @ex GK5.47  [3.9f >= all (ties)]  ★★★
-- Exercise 3.9f — Find the name of the company that has the most employees (or companies, in the case where there is a tie for the most).




-- @ex GK5.48  [3.9g having subquery]  ★★☆
-- Exercise 3.9g — Find the name of each company whose employees earn a higher salary, on average, than the average salary at "First Bank Corporation".




-- @ex GK5.49  [3.10a update]  ★☆☆
-- Exercise 3.10a — Modify the database so that the employee whose ID is '12345' now lives in "Newtown".




-- @ex GK5.50  [3.10b update case]  ★★★
-- Exercise 3.10b — Give each manager of "First Bank Corporation" a 10 percent raise unless the salary becomes greater than $100000; in such cases, give only a 3 percent raise. (One UPDATE statement.)




-- @ex GK5.51  [3.11a distinct join]  ★★☆
-- Exercise 3.11a — Find the ID and name of each student who has taken at least one Comp. Sci. course; make sure there are no duplicate names in the result.




-- @ex GK5.52  [3.11b not in]  ★★☆
-- Exercise 3.11b — Find the ID and name of each student who has not taken any course offered before 2017.




-- @ex GK5.53  [3.11c group max]  ★☆☆
-- Exercise 3.11c — For each department, find the maximum salary of instructors in that department.




-- @ex GK5.54  [3.11d min of max]  ★★☆
-- Exercise 3.11d — Find the lowest, across all departments, of the per-department maximum salary computed by the preceding query.




-- @ex GK5.55  [3.12a insert]  ★☆☆
-- Exercise 3.12a — Create a new course "CS-001", titled "Weekly Seminar", with 0 credits (department: Comp. Sci.). *(The lab schema has CHECK credits > 0, so use 1 credit.)*




-- @ex GK5.56  [3.12b insert nulls]  ★★☆
-- Exercise 3.12b — (Run (a) first.) Create a section of this course in Fall 2017, with sec_id of 1, and with the location of this section not yet specified.




-- @ex GK5.57  [3.12c insert select]  ★★☆
-- Exercise 3.12c — (Include (a) and (b) in your script.) Enroll every student in the Comp. Sci. department in the above section.




-- @ex GK5.58  [3.12d delete]  ★★☆
-- Exercise 3.12d — (Include (a)–(c) in your script.) Delete enrollments in the above section where the student's ID is 12345.




-- @ex GK5.59  [3.12e delete course (FK)]  ★★★
-- Exercise 3.12e — (Include (a)–(c) in your script.) Delete the course CS-001 and make the delete succeed: remove the dependent rows in the right order (see written question N3 for what happens otherwise).
-- Gợi ý: takes → section → course (xoá bảng con trước).




-- @ex GK5.60  [3.12f delete lower like]  ★★★
-- Exercise 3.12f — Delete all takes tuples corresponding to any section of any course with the word "advanced" as a part of the title; ignore case. *(The sample data has no such course, so your script must first insert course 'CS-777' titled 'Advanced Databases' (Comp. Sci., 3 credits), a section of it (sec_id '1', Fall, 2017, no location) and an enrollment of student '12345'; then do the delete.)*




-- @ex GK5.61  [3.13 DDL insurance]  ★★★
-- Exercise 3.13 — Write SQL DDL corresponding to the insurance schema (Figure 3.17): person(driver_id, name, address); car(license_plate, model, year); accident(report_number, year, location); owns(driver_id, license_plate); participated(report_number, license_plate, driver_id, damage_amount). Declare primary and foreign keys; use INT for report_number and year, NUMERIC for damage_amount. *(These tables already exist in the lab database — start with `DROP TABLE IF EXISTS participated, owns, accident, car, person CASCADE;`.)*
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)


