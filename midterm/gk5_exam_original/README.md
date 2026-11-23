# Đề GK · Nguyên bản — Đề thi giữa kỳ — Bài tập nguyên bản của bạn

*Midterm Exam — Original Exercises (Questions 1–19, 3.1–3.13) · QuangTrungTrinh_1670036_Excercises / Exercise chapter 3 / Exercise 3 v2 / Exercise chap 3 part 2 (.docx)*

> **Cách học:** *Tự luận lý thuyết* → *Bài tập SQL* → *Ghi nhớ nhanh*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk5`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tự luận lý thuyết (8 câu)

**Câu 1.** 

> Consider the SQL query: SELECT p.a1 FROM p, r1, r2 WHERE p.a1 = r1.a1 OR p.a1 = r2.a1. Under what conditions does the preceding query select values of p.a1 that are either in r1 or in r2? Examine carefully the cases where either r1 or r2 may be empty. (Exercise 3.7)

**N1 · 3.7** — Khi nào truy vấn trên thật sự trả về các giá trị của p.a1 nằm trong r1 **hoặc** r2? Xét kỹ khi r1 hoặc r2 rỗng. Viết lại cho đúng ở mọi trường hợp.

<details><summary>Gợi ý đáp án</summary>

FROM tạo tích Descartes p × r1 × r2 rồi WHERE lọc từng bộ.
- **r1 và r2 đều không rỗng:** giá trị p.a1 được chọn đúng khi nó có trong r1.a1 **hoặc** r2.a1 (có thể bị lặp vì ghép với mọi bộ của bảng kia).
- **r1 hoặc r2 rỗng (hay cả hai):** tích Descartes **rỗng** → kết quả rỗng, dù p.a1 có trong bảng còn lại.

Vậy truy vấn chỉ đúng khi **cả hai** bảng không rỗng. Bản đúng mọi trường hợp:
```sql
SELECT a1 FROM p
WHERE a1 IN (SELECT a1 FROM r1)
   OR a1 IN (SELECT a1 FROM r2);
```

</details>

**Câu 2.** 

> Given the relation grade_points(grade, points), reconsider queries 3.2(a)–(c) under the assumption that some grades might be null. Explain whether your solutions still work and, if not, provide versions that handle nulls properly. (Exercise 3.2d)

**N2 · 3.2d** — Nếu có takes.grade = NULL thì các câu tính tổng điểm / GPA (3.2a–c) còn đúng không? Sửa nếu sai.

<details><summary>Gợi ý đáp án</summary>

- **(a)** Vẫn đúng: dòng grade NULL không thoả `takes.grade = grade_points.grade` (unknown) nên bị loại khỏi join. Chỉ có điều nếu SV không có môn nào có điểm thì SUM = NULL → dùng `COALESCE(SUM(...), 0)`.
- **(b)** Vẫn đúng: môn chưa có điểm bị loại **trước khi** tính cả tử số lẫn mẫu số (tín chỉ môn chưa có điểm không bị tính). Không có môn nào có điểm → NULL (hợp lý).
- **(c)** Đúng với SV có môn có điểm, nhưng SV **không** có môn nào có điểm biến mất khỏi kết quả. Giữ mọi SV bằng scalar subquery:
```sql
SELECT student.ID,
       (SELECT SUM(course.credits * grade_points.points) / SUM(course.credits)
        FROM takes, course, grade_points
        WHERE takes.ID = student.ID
          AND takes.course_id = course.course_id
          AND takes.grade = grade_points.grade) AS GPA
FROM student;
```
Nếu dùng outer join thì mẫu số phải giới hạn rõ: `SUM(CASE WHEN takes.grade IS NOT NULL THEN course.credits END)`.

</details>

**Câu 3.** 

> Delete the course CS-001. What will happen if you run this delete statement without first deleting offerings (sections) of this course? (Exercise 3.12e)

**N3 · 3.12e** — Xoá course CS-001 mà **chưa** xoá các section của nó thì chuyện gì xảy ra? Nếu FK khai báo `on delete cascade` thì sao?

<details><summary>Gợi ý đáp án</summary>

`section.course_id` là foreign key tham chiếu `course`. Nếu còn section của CS-001 thì `DELETE FROM course WHERE course_id='CS-001'` **vi phạm toàn vẹn tham chiếu** → bị từ chối với lỗi (hành động mặc định là restrict / no action) và course **không** bị xoá.

Nếu FK khai báo `ON DELETE CASCADE`: các section của CS-001 bị xoá theo cùng course (và tiếp tục cascade xuống các dòng `takes` tham chiếu những section đó nếu takes cũng cascade).

</details>

**Câu 4.** 

> Find the enrollments that have no grade yet (grade is NULL). Why must "grade = NULL" not be used? (Question 16)

**N4 · Q16** — Vì sao `where grade = NULL` không bao giờ trả về dòng nào? Điều kiện đúng là gì? Nêu giá trị của `NULL = NULL`, `NULL <> 1`, `NULL AND FALSE`, `NULL OR TRUE`.

<details><summary>Gợi ý đáp án</summary>

Mọi phép so sánh với NULL cho **unknown** (không phải true) và WHERE chỉ giữ dòng có điều kiện **true** → `grade = NULL` loại hết. Dùng `WHERE grade IS NULL`.

Logic ba giá trị: `NULL = NULL` → unknown; `NULL <> 1` → unknown; `NULL AND FALSE` → **false**; `NULL OR TRUE` → **true**.
Hệ quả: `COUNT(*)` đếm cả dòng NULL còn `COUNT(grade)` thì không.

</details>

**Câu 5.** 

> Find the ID of each employee who does not work for "First Bank Corporation". (Exercise 3.9c) Does your answer include employees that have no tuple in works at all? When is SELECT ID FROM works WHERE company_name <> 'First Bank Corporation' equivalent?

**N5 · 3.9c** — So sánh `employee ... NOT IN (select ID from works where ...)` với `select ID from works where company_name <> ...`. Hai câu khác nhau ở đâu?

<details><summary>Gợi ý đáp án</summary>

- `SELECT ID FROM employee WHERE ID NOT IN (SELECT ID FROM works WHERE company_name='First Bank Corporation')` trả cả **nhân viên không có dòng nào trong works**.
- `SELECT ID FROM works WHERE company_name <> 'First Bank Corporation'` chỉ trả người **có** dòng works ở công ty khác. Hai câu tương đương **khi mọi nhân viên đều làm ở đâu đó** (và mỗi người chỉ làm một công ty).
Trong dữ liệu mẫu, nhân viên 10012 (Leo Vu) không có trong works nên hai câu cho kết quả khác nhau.

</details>

**Câu 6.** 

> Find the enrollment of each section that was offered in Fall 2017. (Exercise 3.1e) Which sections are missing from the result, and how do you list them with enrollment 0?

**N6 · 3.1e** — Câu dùng `section natural join takes ... group by` bỏ sót section nào? Sửa thế nào để section 0 sinh viên có enrollment = 0?

<details><summary>Gợi ý đáp án</summary>

Inner join (natural join) loại các section **không có dòng takes** → section 0 SV biến mất.
Sửa: `section LEFT OUTER JOIN takes USING (course_id, sec_id, semester, year)` và đếm `COUNT(takes.ID)` (**không** dùng `COUNT(*)` vì dòng NULL-padding vẫn được đếm thành 1).
Hoặc dùng scalar subquery cho mỗi section.

</details>

**Câu 7.** 

> Delete all year-2010 cars belonging to the person whose ID is '12345'. What must you take care of if owns references car through a foreign key without ON DELETE CASCADE? (Exercise 3.4b)

**N7 · 3.4b** — Nếu `owns.license_plate` tham chiếu `car` không có `on delete cascade`, phải làm gì trước khi xoá xe?

<details><summary>Gợi ý đáp án</summary>

Phải xoá các dòng `owns` (và `participated`) tham chiếu những xe đó **trước**, rồi mới xoá `car`; hoặc khai báo FK với `ON DELETE CASCADE` để các dòng con tự bị xoá. Nếu không, DELETE trên car bị từ chối vì vi phạm FK.

</details>

**Câu 8.** 

> Get the names of the instructors whose salary is greater than that of at least one Biology instructor. Write it with SOME and with a self-join. (Question 13)

**N8 · Q13** — Viết bằng `> SOME` và bằng self-join; vì sao self-join cần `DISTINCT`? `> ALL` khác gì? Nếu tập con rỗng thì `> SOME` và `> ALL` cho kết quả gì?

<details><summary>Gợi ý đáp án</summary>

```sql
SELECT name FROM instructor
WHERE salary > SOME (SELECT salary FROM instructor WHERE dept_name='Biology');

SELECT DISTINCT T.name FROM instructor AS T, instructor AS S
WHERE T.salary > S.salary AND S.dept_name = 'Biology';
```
Self-join ghép T với **mọi** S thoả điều kiện nên một người lương cao có thể xuất hiện nhiều lần → cần DISTINCT.
`> ALL` đòi lớn hơn **mọi** phần tử (lớn hơn max). Tập con **rỗng**: `> SOME` là **false**, `> ALL` là **true** (điều kiện "với mọi" đúng một cách tầm thường).

</details>

## 2. Bài tập SQL (61 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK5.01 | Q1 select * | ★☆☆ | Question 1 — Get all the information about every department. |
| GK5.02 | Q2 projection | ★☆☆ | Question 2 — Get the name and salary of every instructor. |
| GK5.03 | Q3 distinct | ★☆☆ | Question 3 — List the departments that have instructors, showing each department only once. |
| GK5.04 | Q4 arithmetic | ★☆☆ | Question 4 — Show each instructor's ID, name and salary after a 10% raise. |
| GK5.05 | Q5 where | ★☆☆ | Question 5 — Get the names of the instructors in the Comp. Sci. department. |
| GK5.06 | Q6 where and | ★☆☆ | Question 6 — Get the names of the Comp. Sci. instructors whose salary is greater than 70000. |
| GK5.07 | Q7 in | ★☆☆ | Question 7 — Get the name and department of the instructors in Physics or History. |
| GK5.08 | Q8 between | ★☆☆ | Question 8 — Get the names of the instructors whose salary is between 80000 and 90000. |
| GK5.09 | Q9 join in where | ★☆☆ | Question 9 — Show each instructor's name together with the IDs of the courses they teach, joining the tables in the WHERE clause. |
| GK5.10 | Q10 join + filter | ★☆☆ | Question 10 — Show the name and the course IDs taught by the instructors of the Comp. Sci. department. |
| GK5.11 | Q11 3-table join | ★★☆ | Question 11 — Show each student's name together with the title of every course they have taken. |
| GK5.12 | Q12 alias | ★☆☆ | Question 12 — Get each instructor's name as instructor_name and their monthly salary as monthly_salary. |
| GK5.13 | Q13 > some | ★★☆ | Question 13 — Get the names of the instructors whose salary is greater than that of at least one Biology instructor. |
| GK5.14 | Q14 like | ★☆☆ | Question 14 — Get the titles of the courses that contain the string 'Comp'. |
| GK5.15 | Q15 order by | ★☆☆ | Question 15 — List the instructors by salary in descending order, and by name in ascending order when salaries are equal. |
| GK5.16 | Q16 is null | ★☆☆ | Question 16 — Find the enrollments that have no grade yet (grade is NULL). |
| GK5.17 | Q17 aggregates | ★☆☆ | Question 17 — Find the average, maximum and minimum salary and the number of instructors in the Comp. Sci. department. |
| GK5.18 | Q18 group by avg | ★☆☆ | Question 18 — Find the average instructor salary in each department. |
| GK5.19 | Q19 group by count | ★☆☆ | Question 19 — Count the students in each department. |
| GK5.20 | 3.1a where | ★☆☆ | Exercise 3.1a — Find the titles of courses in the Comp. Sci. department that have 3 credits. |
| GK5.21 | 3.1b 3-table join | ★★☆ | Exercise 3.1b — Find the IDs of all students who were taught by an instructor named Einstein; make sure there are no duplicates in the result. |
| GK5.22 | 3.1c max | ★☆☆ | Exercise 3.1c — Find the highest salary of any instructor. |
| GK5.23 | 3.1d scalar subquery | ★★☆ | Exercise 3.1d — Find all instructors earning the highest salary (there may be more than one with the same salary). |
| GK5.24 | 3.1e enrollment | ★★☆ | Exercise 3.1e — Find the enrollment of each section that was offered in Fall 2017. (Output course_id, sec_id, enrollment — as in the exercise, sections with no students may be left out.) |
| GK5.25 | 3.1f max of counts | ★★☆ | Exercise 3.1f — Find the maximum enrollment, across all sections, in Fall 2017. |
| GK5.26 | 3.1g with + max | ★★★ | Exercise 3.1g — Find the sections that had the maximum enrollment in Fall 2017. |
| GK5.27 | 3.2a sum of products | ★★☆ | Exercise 3.2a — Given grade_points(grade, points): find the total grade points earned by the student with ID '12345', across all courses taken by the student. |
| GK5.28 | 3.2b GPA | ★★☆ | Exercise 3.2b — Find the grade point average (GPA) for the above student, that is, the total grade points divided by the total credits for the associated courses. |
| GK5.29 | 3.2c GPA per student | ★★☆ | Exercise 3.2c — Find the ID and the grade-point average of each student. |
| GK5.30 | 3.2d GPA keep all (null) | ★★★ | Exercise 3.2d — Reconsider 3.2c when some grades might be null: write the version that keeps every student (GPA is NULL when undefined). Output ID and GPA. |
| GK5.31 | 3.3a update | ★☆☆ | Exercise 3.3a — Increase the salary of each instructor in the Comp. Sci. department by 10%. |
| GK5.32 | 3.3b delete not in | ★★☆ | Exercise 3.3b — Delete all courses that have never been offered (i.e., do not occur in the section relation). |
| GK5.33 | 3.3c insert select | ★★☆ | Exercise 3.3c — Insert every student whose tot_cred attribute is greater than 100 as an instructor in the same department, with a salary of $10,000. *(The lab schema has CHECK salary > 29000, so insert 30000 instead.)* |
| GK5.34 | 3.4a count distinct | ★★☆ | Exercise 3.4a — (Insurance database) Find the total number of people who owned cars that were involved in accidents in 2017. |
| GK5.35 | 3.4b delete in | ★★☆ | Exercise 3.4b — Delete all year-2010 cars belonging to the person whose ID is '12345'. |
| GK5.36 | 3.5a case | ★★☆ | Exercise 3.5a — Relation marks(ID, score): grade F if score < 40, C if 40 <= score < 60, B if 60 <= score < 80, A if 80 <= score. Display the grade for each student. |
| GK5.37 | 3.5b with + group | ★★☆ | Exercise 3.5b — Find the number of students with each grade (same grading scheme). |
| GK5.38 | 3.6 lower like | ★☆☆ | Exercise 3.6 — Find departments whose names contain the string "sci" as a substring, regardless of the case (use lower()). |
| GK5.39 | 3.8a except | ★☆☆ | Exercise 3.8a — (Bank database) Find the ID of each customer of the bank who has an account but not a loan. |
| GK5.40 | 3.8b self join | ★★☆ | Exercise 3.8b — Find the ID of each customer who lives on the same street and in the same city as customer '12345'. |
| GK5.41 | 3.8c join | ★★☆ | Exercise 3.8c — Find the name of each branch that has at least one customer who has an account in the bank and who lives in "Harrison". |
| GK5.42 | 3.9a join | ★☆☆ | Exercise 3.9a — (Employee database) Find the ID, name, and city of residence of each employee who works for "First Bank Corporation". |
| GK5.43 | 3.9b join + salary | ★☆☆ | Exercise 3.9b — Find the ID, name, and city of residence of each employee who works for "First Bank Corporation" and earns more than $10000. |
| GK5.44 | 3.9c not in | ★★☆ | Exercise 3.9c — Find the ID of each employee who does not work for "First Bank Corporation". (Employees with no works tuple count too.) |
| GK5.45 | 3.9d > all | ★★☆ | Exercise 3.9d — Find the ID of each employee who earns more than every employee of "Small Bank Corporation". |
| GK5.46 | 3.9e division | ★★★ | Exercise 3.9e — Assume that companies may be located in several cities. Find the name of each company that is located in every city in which "Small Bank Corporation" is located. |
| GK5.47 | 3.9f >= all (ties) | ★★★ | Exercise 3.9f — Find the name of the company that has the most employees (or companies, in the case where there is a tie for the most). |
| GK5.48 | 3.9g having subquery | ★★☆ | Exercise 3.9g — Find the name of each company whose employees earn a higher salary, on average, than the average salary at "First Bank Corporation". |
| GK5.49 | 3.10a update | ★☆☆ | Exercise 3.10a — Modify the database so that the employee whose ID is '12345' now lives in "Newtown". |
| GK5.50 | 3.10b update case | ★★★ | Exercise 3.10b — Give each manager of "First Bank Corporation" a 10 percent raise unless the salary becomes greater than $100000; in such cases, give only a 3 percent raise. (One UPDATE statement.) |
| GK5.51 | 3.11a distinct join | ★★☆ | Exercise 3.11a — Find the ID and name of each student who has taken at least one Comp. Sci. course; make sure there are no duplicate names in the result. |
| GK5.52 | 3.11b not in | ★★☆ | Exercise 3.11b — Find the ID and name of each student who has not taken any course offered before 2017. |
| GK5.53 | 3.11c group max | ★☆☆ | Exercise 3.11c — For each department, find the maximum salary of instructors in that department. |
| GK5.54 | 3.11d min of max | ★★☆ | Exercise 3.11d — Find the lowest, across all departments, of the per-department maximum salary computed by the preceding query. |
| GK5.55 | 3.12a insert | ★☆☆ | Exercise 3.12a — Create a new course "CS-001", titled "Weekly Seminar", with 0 credits (department: Comp. Sci.). *(The lab schema has CHECK credits > 0, so use 1 credit.)* |
| GK5.56 | 3.12b insert nulls | ★★☆ | Exercise 3.12b — (Run (a) first.) Create a section of this course in Fall 2017, with sec_id of 1, and with the location of this section not yet specified. |
| GK5.57 | 3.12c insert select | ★★☆ | Exercise 3.12c — (Include (a) and (b) in your script.) Enroll every student in the Comp. Sci. department in the above section. |
| GK5.58 | 3.12d delete | ★★☆ | Exercise 3.12d — (Include (a)–(c) in your script.) Delete enrollments in the above section where the student's ID is 12345. |
| GK5.59 | 3.12e delete course (FK) | ★★★ | Exercise 3.12e — (Include (a)–(c) in your script.) Delete the course CS-001 and make the delete succeed: remove the dependent rows in the right order (see written question N3 for what happens otherwise). |
| GK5.60 | 3.12f delete lower like | ★★★ | Exercise 3.12f — Delete all takes tuples corresponding to any section of any course with the word "advanced" as a part of the title; ignore case. *(The sample data has no such course, so your script must first insert course 'CS-777' titled 'Advanced Databases' (Comp. Sci., 3 credits), a section of it (sec_id '1', Fall, 2017, no location) and an enrollment of student '12345'; then do the delete.)* |
| GK5.61 | 3.13 DDL insurance | ★★★ | Exercise 3.13 — Write SQL DDL corresponding to the insurance schema (Figure 3.17): person(driver_id, name, address); car(license_plate, model, year); accident(report_number, year, location); owns(driver_id, license_plate); participated(report_number, license_plate, driver_id, damage_amount). Declare primary and foreign keys; use INT for report_number and year, NUMERIC for damage_amount. *(These tables already exist in the lab database — start with `DROP TABLE IF EXISTS participated, owns, accident, car, person CASCADE;`.)* |

## 3. Ghi nhớ nhanh

### 1. Phần này là gì
Đây là **ngân hàng đề nguyên bản**: đúng các bài trong 4 file Word bài tập của bạn (đề + đáp án trong file Word đã được chạy thử trên dữ liệu mẫu). Đề thi giữa kỳ sẽ lấy từ các bài này, nên mục tiêu là **tự viết lại được từng câu mà không nhìn đáp án**. Phần "Đề GK · Biến tấu" (GK-B) là các bài đổi lược đồ / điều kiện / bẫy NULL để kiểm tra bạn hiểu chứ không học thuộc.

| File Word | Nội dung | Bài trong app |
|---|---|---|
| Excercises / Exercise chap 3 part 2 (trùng nội dung) | Question 1–19: select, where, join kiểu cũ, alias, SOME, LIKE, ORDER BY, NULL, aggregate, GROUP BY | GK5.01–GK5.19 |
| Exercise chapter 3 | 3.1–3.3 (university), 3.4a, 3.5–3.9 (insurance, marks, bank, employee) | GK5.20 → |
| Exercise 3 v2 | 3.4b–3.13 (insert/update/delete, DDL) | GK5.xx |

### 2. Gợi ý cách thi thử (90 phút)
- **A. Tự luận (35 phút):** làm 4–5 câu trong tab *Tự luận lý thuyết* (3.7, 3.2d, 3.12e, NULL, NOT IN…).
- **B. SQL (55 phút):** bốc ngẫu nhiên khoảng 12 bài, ưu tiên các bài ★★★ (division 3.9e, `>= ALL` 3.9f, outer join 3.1e, CASE update 3.10b).
- Mỗi lần làm xong một cụm, mở lại **Biến tấu** cùng chủ đề để chắc là hiểu.

### 3. Bẫy hay gặp trong các bài này
- `FROM a, b, c` là **tích Descartes**: bảng rỗng → kết quả rỗng (3.7).
- `grade = NULL` luôn *unknown*; phải `IS NULL` (Q16). `NOT IN` gặp NULL trong subquery → không trả dòng nào.
- Inner join làm **mất nhóm 0 phần tử** (3.1e) → dùng `LEFT OUTER JOIN` + `COUNT(cột bảng phải)`.
- `COUNT(*)` đếm cả NULL, `COUNT(col)`/`SUM`/`AVG` bỏ qua NULL.
- Ràng buộc FK khi **delete/insert** (3.4b, 3.12e): xoá bảng được tham chiếu trước → lỗi nếu không cascade.
- Update nhiều mức dùng **một** câu `CASE` (3.10b).
- "Tìm người cao nhất, có thể hoà" → `= (select max ...)` hoặc `>= ALL`.
