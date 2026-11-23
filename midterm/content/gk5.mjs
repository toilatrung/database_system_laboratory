// Đề thi GK — NGUYÊN BẢN: toàn bộ bài tập trong 4 file Word của bạn
// (Excercises = Question 1–19, Exercise chapter 3 / Exercise 3 v2 / Exercise chap 3 part 2 = 3.1–3.13).
export default {
  key: 'gk5',
  slug: 'gk5_exam_original',
  label: 'Đề GK · Nguyên bản',
  navLabel: 'GK Nguyên bản',
  kind: 'Đề thi',
  short: 'GK-N',
  title: 'Midterm Exam — Original Exercises (Questions 1–19, 3.1–3.13)',
  titleVi: 'Đề thi giữa kỳ — Bài tập nguyên bản của bạn',
  source: 'QuangTrungTrinh_1670036_Excercises / Exercise chapter 3 / Exercise 3 v2 / Exercise chap 3 part 2 (.docx)',

  summary: `
### 1. Phần này là gì
Đây là **ngân hàng đề nguyên bản**: đúng các bài trong 4 file Word bài tập của bạn (đề + đáp án trong file Word đã được chạy thử trên dữ liệu mẫu). Đề thi giữa kỳ sẽ lấy từ các bài này, nên mục tiêu là **tự viết lại được từng câu mà không nhìn đáp án**. Phần "Đề GK · Biến tấu" (GK-B) là các bài đổi lược đồ / điều kiện / bẫy NULL để kiểm tra bạn hiểu chứ không học thuộc.

| File Word | Nội dung | Bài trong app |
|---|---|---|
| Excercises / Exercise chap 3 part 2 (trùng nội dung) | Question 1–19: select, where, join kiểu cũ, alias, SOME, LIKE, ORDER BY, NULL, aggregate, GROUP BY | GK5.01–GK5.19 |
| Exercise chapter 3 | 3.1–3.3 (university), 3.4a, 3.5–3.9 (insurance, marks, bank, employee) | GK5.20 → |
| Exercise 3 v2 | 3.4b–3.13 (insert/update/delete, DDL) | GK5.xx |

### 2. Gợi ý cách thi thử (90 phút)
- **A. Tự luận (35 phút):** làm 4–5 câu trong tab *Tự luận lý thuyết* (3.7, 3.2d, 3.12e, NULL, NOT IN…).
- **B. SQL (55 phút):** bốc ngẫu nhiên khoảng 12 bài, ưu tiên các bài ★★★ (division 3.9e, \`>= ALL\` 3.9f, outer join 3.1e, CASE update 3.10b).
- Mỗi lần làm xong một cụm, mở lại **Biến tấu** cùng chủ đề để chắc là hiểu.

### 3. Bẫy hay gặp trong các bài này
- \`FROM a, b, c\` là **tích Descartes**: bảng rỗng → kết quả rỗng (3.7).
- \`grade = NULL\` luôn *unknown*; phải \`IS NULL\` (Q16). \`NOT IN\` gặp NULL trong subquery → không trả dòng nào.
- Inner join làm **mất nhóm 0 phần tử** (3.1e) → dùng \`LEFT OUTER JOIN\` + \`COUNT(cột bảng phải)\`.
- \`COUNT(*)\` đếm cả NULL, \`COUNT(col)\`/\`SUM\`/\`AVG\` bỏ qua NULL.
- Ràng buộc FK khi **delete/insert** (3.4b, 3.12e): xoá bảng được tham chiếu trước → lỗi nếu không cascade.
- Update nhiều mức dùng **một** câu \`CASE\` (3.10b).
- "Tìm người cao nhất, có thể hoà" → \`= (select max ...)\` hoặc \`>= ALL\`.
`,

  quiz: [],

  questions: [
    {
      en: 'Consider the SQL query: SELECT p.a1 FROM p, r1, r2 WHERE p.a1 = r1.a1 OR p.a1 = r2.a1. Under what conditions does the preceding query select values of p.a1 that are either in r1 or in r2? Examine carefully the cases where either r1 or r2 may be empty. (Exercise 3.7)',
      q: '**N1 · 3.7** — Khi nào truy vấn trên thật sự trả về các giá trị của p.a1 nằm trong r1 **hoặc** r2? Xét kỹ khi r1 hoặc r2 rỗng. Viết lại cho đúng ở mọi trường hợp.',
      answer: `FROM tạo tích Descartes p × r1 × r2 rồi WHERE lọc từng bộ.
- **r1 và r2 đều không rỗng:** giá trị p.a1 được chọn đúng khi nó có trong r1.a1 **hoặc** r2.a1 (có thể bị lặp vì ghép với mọi bộ của bảng kia).
- **r1 hoặc r2 rỗng (hay cả hai):** tích Descartes **rỗng** → kết quả rỗng, dù p.a1 có trong bảng còn lại.

Vậy truy vấn chỉ đúng khi **cả hai** bảng không rỗng. Bản đúng mọi trường hợp:
\`\`\`sql
SELECT a1 FROM p
WHERE a1 IN (SELECT a1 FROM r1)
   OR a1 IN (SELECT a1 FROM r2);
\`\`\``,
    },
    {
      en: 'Given the relation grade_points(grade, points), reconsider queries 3.2(a)–(c) under the assumption that some grades might be null. Explain whether your solutions still work and, if not, provide versions that handle nulls properly. (Exercise 3.2d)',
      q: '**N2 · 3.2d** — Nếu có takes.grade = NULL thì các câu tính tổng điểm / GPA (3.2a–c) còn đúng không? Sửa nếu sai.',
      answer: `- **(a)** Vẫn đúng: dòng grade NULL không thoả \`takes.grade = grade_points.grade\` (unknown) nên bị loại khỏi join. Chỉ có điều nếu SV không có môn nào có điểm thì SUM = NULL → dùng \`COALESCE(SUM(...), 0)\`.
- **(b)** Vẫn đúng: môn chưa có điểm bị loại **trước khi** tính cả tử số lẫn mẫu số (tín chỉ môn chưa có điểm không bị tính). Không có môn nào có điểm → NULL (hợp lý).
- **(c)** Đúng với SV có môn có điểm, nhưng SV **không** có môn nào có điểm biến mất khỏi kết quả. Giữ mọi SV bằng scalar subquery:
\`\`\`sql
SELECT student.ID,
       (SELECT SUM(course.credits * grade_points.points) / SUM(course.credits)
        FROM takes, course, grade_points
        WHERE takes.ID = student.ID
          AND takes.course_id = course.course_id
          AND takes.grade = grade_points.grade) AS GPA
FROM student;
\`\`\`
Nếu dùng outer join thì mẫu số phải giới hạn rõ: \`SUM(CASE WHEN takes.grade IS NOT NULL THEN course.credits END)\`.`,
    },
    {
      en: 'Delete the course CS-001. What will happen if you run this delete statement without first deleting offerings (sections) of this course? (Exercise 3.12e)',
      q: '**N3 · 3.12e** — Xoá course CS-001 mà **chưa** xoá các section của nó thì chuyện gì xảy ra? Nếu FK khai báo `on delete cascade` thì sao?',
      answer: `\`section.course_id\` là foreign key tham chiếu \`course\`. Nếu còn section của CS-001 thì \`DELETE FROM course WHERE course_id='CS-001'\` **vi phạm toàn vẹn tham chiếu** → bị từ chối với lỗi (hành động mặc định là restrict / no action) và course **không** bị xoá.

Nếu FK khai báo \`ON DELETE CASCADE\`: các section của CS-001 bị xoá theo cùng course (và tiếp tục cascade xuống các dòng \`takes\` tham chiếu những section đó nếu takes cũng cascade).`,
    },
    {
      en: 'Find the enrollments that have no grade yet (grade is NULL). Why must "grade = NULL" not be used? (Question 16)',
      q: '**N4 · Q16** — Vì sao `where grade = NULL` không bao giờ trả về dòng nào? Điều kiện đúng là gì? Nêu giá trị của `NULL = NULL`, `NULL <> 1`, `NULL AND FALSE`, `NULL OR TRUE`.',
      answer: `Mọi phép so sánh với NULL cho **unknown** (không phải true) và WHERE chỉ giữ dòng có điều kiện **true** → \`grade = NULL\` loại hết. Dùng \`WHERE grade IS NULL\`.

Logic ba giá trị: \`NULL = NULL\` → unknown; \`NULL <> 1\` → unknown; \`NULL AND FALSE\` → **false**; \`NULL OR TRUE\` → **true**.
Hệ quả: \`COUNT(*)\` đếm cả dòng NULL còn \`COUNT(grade)\` thì không.`,
    },
    {
      en: 'Find the ID of each employee who does not work for "First Bank Corporation". (Exercise 3.9c) Does your answer include employees that have no tuple in works at all? When is SELECT ID FROM works WHERE company_name <> \'First Bank Corporation\' equivalent?',
      q: '**N5 · 3.9c** — So sánh `employee ... NOT IN (select ID from works where ...)` với `select ID from works where company_name <> ...`. Hai câu khác nhau ở đâu?',
      answer: `- \`SELECT ID FROM employee WHERE ID NOT IN (SELECT ID FROM works WHERE company_name='First Bank Corporation')\` trả cả **nhân viên không có dòng nào trong works**.
- \`SELECT ID FROM works WHERE company_name <> 'First Bank Corporation'\` chỉ trả người **có** dòng works ở công ty khác. Hai câu tương đương **khi mọi nhân viên đều làm ở đâu đó** (và mỗi người chỉ làm một công ty).
Trong dữ liệu mẫu, nhân viên 10012 (Leo Vu) không có trong works nên hai câu cho kết quả khác nhau.`,
    },
    {
      en: 'Find the enrollment of each section that was offered in Fall 2017. (Exercise 3.1e) Which sections are missing from the result, and how do you list them with enrollment 0?',
      q: '**N6 · 3.1e** — Câu dùng `section natural join takes ... group by` bỏ sót section nào? Sửa thế nào để section 0 sinh viên có enrollment = 0?',
      answer: `Inner join (natural join) loại các section **không có dòng takes** → section 0 SV biến mất.
Sửa: \`section LEFT OUTER JOIN takes USING (course_id, sec_id, semester, year)\` và đếm \`COUNT(takes.ID)\` (**không** dùng \`COUNT(*)\` vì dòng NULL-padding vẫn được đếm thành 1).
Hoặc dùng scalar subquery cho mỗi section.`,
    },
    {
      en: 'Delete all year-2010 cars belonging to the person whose ID is \'12345\'. What must you take care of if owns references car through a foreign key without ON DELETE CASCADE? (Exercise 3.4b)',
      q: '**N7 · 3.4b** — Nếu `owns.license_plate` tham chiếu `car` không có `on delete cascade`, phải làm gì trước khi xoá xe?',
      answer: `Phải xoá các dòng \`owns\` (và \`participated\`) tham chiếu những xe đó **trước**, rồi mới xoá \`car\`; hoặc khai báo FK với \`ON DELETE CASCADE\` để các dòng con tự bị xoá. Nếu không, DELETE trên car bị từ chối vì vi phạm FK.`,
    },
    {
      en: 'Get the names of the instructors whose salary is greater than that of at least one Biology instructor. Write it with SOME and with a self-join. (Question 13)',
      q: '**N8 · Q13** — Viết bằng `> SOME` và bằng self-join; vì sao self-join cần `DISTINCT`? `> ALL` khác gì? Nếu tập con rỗng thì `> SOME` và `> ALL` cho kết quả gì?',
      answer: `\`\`\`sql
SELECT name FROM instructor
WHERE salary > SOME (SELECT salary FROM instructor WHERE dept_name='Biology');

SELECT DISTINCT T.name FROM instructor AS T, instructor AS S
WHERE T.salary > S.salary AND S.dept_name = 'Biology';
\`\`\`
Self-join ghép T với **mọi** S thoả điều kiện nên một người lương cao có thể xuất hiện nhiều lần → cần DISTINCT.
\`> ALL\` đòi lớn hơn **mọi** phần tử (lớn hơn max). Tập con **rỗng**: \`> SOME\` là **false**, \`> ALL\` là **true** (điều kiện "với mọi" đúng một cách tầm thường).`,
    },
  ],

  exercises: [
    // ───────────── Excercises.docx — Question 1–19
    { id: 'GK5.01', topic: 'Q1 select *', level: 1,
      prompt: '**Question 1** — Get all the information about every department.',
      solution: `SELECT * FROM department;` },
    { id: 'GK5.02', topic: 'Q2 projection', level: 1,
      prompt: '**Question 2** — Get the name and salary of every instructor.',
      solution: `SELECT name, salary FROM instructor;` },
    { id: 'GK5.03', topic: 'Q3 distinct', level: 1,
      prompt: '**Question 3** — List the departments that have instructors, showing each department only once.',
      solution: `SELECT DISTINCT dept_name FROM instructor;` },
    { id: 'GK5.04', topic: 'Q4 arithmetic', level: 1,
      prompt: "**Question 4** — Show each instructor's ID, name and salary after a 10% raise.",
      solution: `SELECT ID, name, salary * 1.1 AS new_salary FROM instructor;` },
    { id: 'GK5.05', topic: 'Q5 where', level: 1,
      prompt: '**Question 5** — Get the names of the instructors in the Comp. Sci. department.',
      solution: `SELECT name FROM instructor WHERE dept_name = 'Comp. Sci.';` },
    { id: 'GK5.06', topic: 'Q6 where and', level: 1,
      prompt: '**Question 6** — Get the names of the Comp. Sci. instructors whose salary is greater than 70000.',
      solution: `SELECT name FROM instructor WHERE dept_name = 'Comp. Sci.' AND salary > 70000;` },
    { id: 'GK5.07', topic: 'Q7 in', level: 1,
      prompt: '**Question 7** — Get the name and department of the instructors in Physics or History.',
      solution: `SELECT name, dept_name FROM instructor WHERE dept_name IN ('Physics', 'History');` },
    { id: 'GK5.08', topic: 'Q8 between', level: 1,
      prompt: '**Question 8** — Get the names of the instructors whose salary is between 80000 and 90000.',
      solution: `SELECT name FROM instructor WHERE salary BETWEEN 80000 AND 90000;` },
    { id: 'GK5.09', topic: 'Q9 join in where', level: 1,
      prompt: "**Question 9** — Show each instructor's name together with the IDs of the courses they teach, joining the tables in the WHERE clause.",
      solution: `SELECT instructor.name, teaches.course_id
FROM instructor, teaches
WHERE instructor.ID = teaches.ID;` },
    { id: 'GK5.10', topic: 'Q10 join + filter', level: 1,
      prompt: '**Question 10** — Show the name and the course IDs taught by the instructors of the Comp. Sci. department.',
      solution: `SELECT instructor.name, teaches.course_id
FROM instructor, teaches
WHERE instructor.ID = teaches.ID
  AND instructor.dept_name = 'Comp. Sci.';` },
    { id: 'GK5.11', topic: 'Q11 3-table join', level: 2,
      prompt: "**Question 11** — Show each student's name together with the title of every course they have taken.",
      solution: `SELECT student.name, course.title
FROM student, takes, course
WHERE student.ID = takes.ID
  AND takes.course_id = course.course_id;` },
    { id: 'GK5.12', topic: 'Q12 alias', level: 1,
      prompt: "**Question 12** — Get each instructor's name as instructor_name and their monthly salary as monthly_salary.",
      solution: `SELECT name AS instructor_name, salary / 12 AS monthly_salary FROM instructor;` },
    { id: 'GK5.13', topic: 'Q13 > some', level: 2,
      prompt: '**Question 13** — Get the names of the instructors whose salary is greater than that of at least one Biology instructor.',
      solution: `SELECT name FROM instructor
WHERE salary > SOME (SELECT salary FROM instructor WHERE dept_name = 'Biology');` },
    { id: 'GK5.14', topic: 'Q14 like', level: 1,
      prompt: "**Question 14** — Get the titles of the courses that contain the string 'Comp'.",
      solution: `SELECT title FROM course WHERE title LIKE '%Comp%';` },
    { id: 'GK5.15', topic: 'Q15 order by', level: 1, ordered: true,
      prompt: '**Question 15** — List the instructors by salary in descending order, and by name in ascending order when salaries are equal.',
      solution: `SELECT * FROM instructor ORDER BY salary DESC, name ASC;` },
    { id: 'GK5.16', topic: 'Q16 is null', level: 1,
      prompt: '**Question 16** — Find the enrollments that have no grade yet (grade is NULL).',
      solution: `SELECT * FROM takes WHERE grade IS NULL;` },
    { id: 'GK5.17', topic: 'Q17 aggregates', level: 1,
      prompt: '**Question 17** — Find the average, maximum and minimum salary and the number of instructors in the Comp. Sci. department.',
      solution: `SELECT AVG(salary) AS avg_salary, MAX(salary) AS max_salary,
       MIN(salary) AS min_salary, COUNT(*) AS num_instructors
FROM instructor
WHERE dept_name = 'Comp. Sci.';` },
    { id: 'GK5.18', topic: 'Q18 group by avg', level: 1,
      prompt: '**Question 18** — Find the average instructor salary in each department.',
      solution: `SELECT dept_name, AVG(salary) AS avg_salary FROM instructor GROUP BY dept_name;` },
    { id: 'GK5.19', topic: 'Q19 group by count', level: 1,
      prompt: '**Question 19** — Count the students in each department.',
      solution: `SELECT dept_name, COUNT(*) AS num_students FROM student GROUP BY dept_name;` },

    // ───────────── Exercise 3.1
    { id: 'GK5.20', topic: '3.1a where', level: 1,
      prompt: '**Exercise 3.1a** — Find the titles of courses in the Comp. Sci. department that have 3 credits.',
      solution: `SELECT title FROM course WHERE dept_name = 'Comp. Sci.' AND credits = 3;` },
    { id: 'GK5.21', topic: '3.1b 3-table join', level: 2,
      prompt: '**Exercise 3.1b** — Find the IDs of all students who were taught by an instructor named Einstein; make sure there are no duplicates in the result.',
      solution: `SELECT DISTINCT takes.ID
FROM takes, teaches, instructor
WHERE takes.course_id = teaches.course_id
  AND takes.sec_id    = teaches.sec_id
  AND takes.semester  = teaches.semester
  AND takes.year      = teaches.year
  AND teaches.ID      = instructor.ID
  AND instructor.name = 'Einstein';` },
    { id: 'GK5.22', topic: '3.1c max', level: 1,
      prompt: '**Exercise 3.1c** — Find the highest salary of any instructor.',
      solution: `SELECT MAX(salary) FROM instructor;` },
    { id: 'GK5.23', topic: '3.1d scalar subquery', level: 2,
      prompt: '**Exercise 3.1d** — Find all instructors earning the highest salary (there may be more than one with the same salary).',
      solution: `SELECT * FROM instructor WHERE salary = (SELECT MAX(salary) FROM instructor);` },
    { id: 'GK5.24', topic: '3.1e enrollment', level: 2,
      prompt: '**Exercise 3.1e** — Find the enrollment of each section that was offered in Fall 2017. (Output course_id, sec_id, enrollment — as in the exercise, sections with no students may be left out.)',
      solution: `SELECT course_id, sec_id, COUNT(ID) AS enrollment
FROM section NATURAL JOIN takes
WHERE semester = 'Fall' AND year = 2017
GROUP BY course_id, sec_id;` },
    { id: 'GK5.25', topic: '3.1f max of counts', level: 2,
      prompt: '**Exercise 3.1f** — Find the maximum enrollment, across all sections, in Fall 2017.',
      solution: `SELECT MAX(enrollment)
FROM (SELECT COUNT(ID) AS enrollment
      FROM section NATURAL JOIN takes
      WHERE semester = 'Fall' AND year = 2017
      GROUP BY course_id, sec_id) AS sec_enrollment;` },
    { id: 'GK5.26', topic: '3.1g with + max', level: 3,
      prompt: '**Exercise 3.1g** — Find the sections that had the maximum enrollment in Fall 2017.',
      solution: `WITH sec_enrollment AS (
    SELECT course_id, sec_id, COUNT(ID) AS enrollment
    FROM section NATURAL JOIN takes
    WHERE semester = 'Fall' AND year = 2017
    GROUP BY course_id, sec_id
)
SELECT course_id, sec_id
FROM sec_enrollment
WHERE enrollment = (SELECT MAX(enrollment) FROM sec_enrollment);` },

    // ───────────── Exercise 3.2 (grade_points)
    { id: 'GK5.27', topic: '3.2a sum of products', level: 2,
      prompt: "**Exercise 3.2a** — Given grade_points(grade, points): find the total grade points earned by the student with ID '12345', across all courses taken by the student.",
      solution: `SELECT SUM(course.credits * grade_points.points) AS total_grade_points
FROM takes, course, grade_points
WHERE takes.ID = '12345'
  AND takes.course_id = course.course_id
  AND takes.grade = grade_points.grade;` },
    { id: 'GK5.28', topic: '3.2b GPA', level: 2,
      prompt: '**Exercise 3.2b** — Find the grade point average (GPA) for the above student, that is, the total grade points divided by the total credits for the associated courses.',
      solution: `SELECT SUM(course.credits * grade_points.points) / SUM(course.credits) AS GPA
FROM takes, course, grade_points
WHERE takes.ID = '12345'
  AND takes.course_id = course.course_id
  AND takes.grade = grade_points.grade;` },
    { id: 'GK5.29', topic: '3.2c GPA per student', level: 2,
      prompt: '**Exercise 3.2c** — Find the ID and the grade-point average of each student.',
      solution: `SELECT takes.ID,
       SUM(course.credits * grade_points.points) / SUM(course.credits) AS GPA
FROM takes, course, grade_points
WHERE takes.course_id = course.course_id
  AND takes.grade = grade_points.grade
GROUP BY takes.ID;` },
    { id: 'GK5.30', topic: '3.2d GPA keep all (null)', level: 3,
      prompt: '**Exercise 3.2d** — Reconsider 3.2c when some grades might be null: write the version that keeps **every** student (GPA is NULL when undefined). Output ID and GPA.',
      hint: 'Scalar subquery trong SELECT (xem câu tự luận N2).',
      solution: `SELECT student.ID,
       (SELECT SUM(course.credits * grade_points.points) / SUM(course.credits)
        FROM takes, course, grade_points
        WHERE takes.ID = student.ID
          AND takes.course_id = course.course_id
          AND takes.grade = grade_points.grade) AS GPA
FROM student;` },

    // ───────────── Exercise 3.3 (university DML)
    { id: 'GK5.31', topic: '3.3a update', level: 1,
      prompt: '**Exercise 3.3a** — Increase the salary of each instructor in the Comp. Sci. department by 10%.',
      solution: `UPDATE instructor SET salary = salary * 1.10 WHERE dept_name = 'Comp. Sci.';`,
      check: `SELECT ID, salary FROM instructor ORDER BY ID;` },
    { id: 'GK5.32', topic: '3.3b delete not in', level: 2,
      prompt: '**Exercise 3.3b** — Delete all courses that have never been offered (i.e., do not occur in the section relation).',
      solution: `DELETE FROM course WHERE course_id NOT IN (SELECT course_id FROM section);`,
      check: `SELECT course_id FROM course ORDER BY course_id;` },
    { id: 'GK5.33', topic: '3.3c insert select', level: 2,
      prompt: '**Exercise 3.3c** — Insert every student whose tot_cred attribute is greater than 100 as an instructor in the same department, with a salary of $10,000. *(The lab schema has CHECK salary > 29000, so insert 30000 instead.)*',
      solution: `INSERT INTO instructor
SELECT ID, name, dept_name, 30000 FROM student WHERE tot_cred > 100;`,
      check: `SELECT * FROM instructor ORDER BY ID;` },

    // ───────────── Exercise 3.4 (insurance)
    { id: 'GK5.34', topic: '3.4a count distinct', level: 2,
      prompt: '**Exercise 3.4a** — (Insurance database) Find the total number of people who owned cars that were involved in accidents in 2017.',
      solution: `SELECT COUNT(DISTINCT owns.driver_id)
FROM owns, participated, accident
WHERE owns.license_plate = participated.license_plate
  AND participated.report_number = accident.report_number
  AND accident.year = 2017;` },
    { id: 'GK5.35', topic: '3.4b delete in', level: 2,
      prompt: "**Exercise 3.4b** — Delete all year-2010 cars belonging to the person whose ID is '12345'.",
      solution: `DELETE FROM car
WHERE year = 2010
  AND license_plate IN (SELECT license_plate FROM owns WHERE driver_id = '12345');`,
      check: `SELECT license_plate FROM car ORDER BY license_plate;` },

    // ───────────── Exercise 3.5 / 3.6
    { id: 'GK5.36', topic: '3.5a case', level: 2,
      prompt: '**Exercise 3.5a** — Relation marks(ID, score): grade F if score < 40, C if 40 <= score < 60, B if 60 <= score < 80, A if 80 <= score. Display the grade for each student.',
      solution: `SELECT ID,
       CASE WHEN score < 40 THEN 'F'
            WHEN score < 60 THEN 'C'
            WHEN score < 80 THEN 'B'
            ELSE 'A' END AS grade
FROM marks;` },
    { id: 'GK5.37', topic: '3.5b with + group', level: 2,
      prompt: '**Exercise 3.5b** — Find the number of students with each grade (same grading scheme).',
      solution: `WITH grades AS (
    SELECT ID,
           CASE WHEN score < 40 THEN 'F'
                WHEN score < 60 THEN 'C'
                WHEN score < 80 THEN 'B'
                ELSE 'A' END AS grade
    FROM marks)
SELECT grade, COUNT(ID) AS num_students FROM grades GROUP BY grade;` },
    { id: 'GK5.38', topic: '3.6 lower like', level: 1,
      prompt: '**Exercise 3.6** — Find departments whose names contain the string "sci" as a substring, regardless of the case (use lower()).',
      solution: `SELECT dept_name FROM department WHERE LOWER(dept_name) LIKE '%sci%';` },

    // ───────────── Exercise 3.8 (bank)
    { id: 'GK5.39', topic: '3.8a except', level: 1,
      prompt: '**Exercise 3.8a** — (Bank database) Find the ID of each customer of the bank who has an account but not a loan.',
      solution: `(SELECT ID FROM depositor) EXCEPT (SELECT ID FROM borrower);` },
    { id: 'GK5.40', topic: '3.8b self join', level: 2,
      prompt: "**Exercise 3.8b** — Find the ID of each customer who lives on the same street and in the same city as customer '12345'.",
      solution: `SELECT F.ID
FROM customer AS F, customer AS S
WHERE S.ID = '12345'
  AND F.customer_street = S.customer_street
  AND F.customer_city   = S.customer_city;` },
    { id: 'GK5.41', topic: '3.8c join', level: 2,
      prompt: '**Exercise 3.8c** — Find the name of each branch that has at least one customer who has an account in the bank and who lives in "Harrison".',
      solution: `SELECT DISTINCT account.branch_name
FROM account, depositor, customer
WHERE depositor.ID = customer.ID
  AND depositor.account_number = account.account_number
  AND customer.customer_city = 'Harrison';` },

    // ───────────── Exercise 3.9 (employee)
    { id: 'GK5.42', topic: '3.9a join', level: 1,
      prompt: '**Exercise 3.9a** — (Employee database) Find the ID, name, and city of residence of each employee who works for "First Bank Corporation".',
      solution: `SELECT e.ID, e.person_name, e.city
FROM employee AS e, works AS w
WHERE e.ID = w.ID AND w.company_name = 'First Bank Corporation';` },
    { id: 'GK5.43', topic: '3.9b join + salary', level: 1,
      prompt: '**Exercise 3.9b** — Find the ID, name, and city of residence of each employee who works for "First Bank Corporation" and earns more than $10000.',
      solution: `SELECT e.ID, e.person_name, e.city
FROM employee AS e, works AS w
WHERE e.ID = w.ID AND w.company_name = 'First Bank Corporation' AND w.salary > 10000;` },
    { id: 'GK5.44', topic: '3.9c not in', level: 2,
      prompt: '**Exercise 3.9c** — Find the ID of each employee who does not work for "First Bank Corporation". (Employees with no works tuple count too.)',
      solution: `SELECT ID FROM employee
WHERE ID NOT IN (SELECT ID FROM works WHERE company_name = 'First Bank Corporation');` },
    { id: 'GK5.45', topic: '3.9d > all', level: 2,
      prompt: '**Exercise 3.9d** — Find the ID of each employee who earns more than every employee of "Small Bank Corporation".',
      solution: `SELECT ID FROM works
WHERE salary > ALL (SELECT salary FROM works WHERE company_name = 'Small Bank Corporation');` },
    { id: 'GK5.46', topic: '3.9e division', level: 3,
      prompt: '**Exercise 3.9e** — Assume that companies may be located in several cities. Find the name of each company that is located in every city in which "Small Bank Corporation" is located.',
      hint: 'not exists ((các city của Small Bank) except (các city của company S)).',
      solution: `SELECT S.company_name
FROM company AS S
WHERE NOT EXISTS (
    (SELECT city FROM company WHERE company_name = 'Small Bank Corporation')
    EXCEPT
    (SELECT T.city FROM company AS T WHERE S.company_name = T.company_name));` },
    { id: 'GK5.47', topic: '3.9f >= all (ties)', level: 3,
      prompt: '**Exercise 3.9f** — Find the name of the company that has the most employees (or companies, in the case where there is a tie for the most).',
      solution: `SELECT company_name
FROM works
GROUP BY company_name
HAVING COUNT(DISTINCT ID) >= ALL (SELECT COUNT(DISTINCT ID) FROM works GROUP BY company_name);` },
    { id: 'GK5.48', topic: '3.9g having subquery', level: 2,
      prompt: '**Exercise 3.9g** — Find the name of each company whose employees earn a higher salary, on average, than the average salary at "First Bank Corporation".',
      solution: `SELECT company_name
FROM works
GROUP BY company_name
HAVING AVG(salary) > (SELECT AVG(salary) FROM works WHERE company_name = 'First Bank Corporation');` },

    // ───────────── Exercise 3.10 (employee DML)
    { id: 'GK5.49', topic: '3.10a update', level: 1,
      prompt: "**Exercise 3.10a** — Modify the database so that the employee whose ID is '12345' now lives in \"Newtown\".",
      solution: `UPDATE employee SET city = 'Newtown' WHERE ID = '12345';`,
      check: `SELECT ID, city FROM employee ORDER BY ID;` },
    { id: 'GK5.50', topic: '3.10b update case', level: 3,
      prompt: '**Exercise 3.10b** — Give each manager of "First Bank Corporation" a 10 percent raise unless the salary becomes greater than $100000; in such cases, give only a 3 percent raise. (One UPDATE statement.)',
      solution: `UPDATE works
SET salary = salary * CASE WHEN salary * 1.1 > 100000 THEN 1.03 ELSE 1.1 END
WHERE company_name = 'First Bank Corporation'
  AND ID IN (SELECT manager_id FROM manages);`,
      check: `SELECT ID, salary FROM works ORDER BY ID;` },

    // ───────────── Exercise 3.11 (university)
    { id: 'GK5.51', topic: '3.11a distinct join', level: 2,
      prompt: '**Exercise 3.11a** — Find the ID and name of each student who has taken at least one Comp. Sci. course; make sure there are no duplicate names in the result.',
      solution: `SELECT DISTINCT student.ID, student.name
FROM student, takes, course
WHERE student.ID = takes.ID
  AND takes.course_id = course.course_id
  AND course.dept_name = 'Comp. Sci.';` },
    { id: 'GK5.52', topic: '3.11b not in', level: 2,
      prompt: '**Exercise 3.11b** — Find the ID and name of each student who has not taken any course offered before 2017.',
      solution: `SELECT ID, name FROM student
WHERE ID NOT IN (SELECT ID FROM takes WHERE year < 2017);` },
    { id: 'GK5.53', topic: '3.11c group max', level: 1,
      prompt: '**Exercise 3.11c** — For each department, find the maximum salary of instructors in that department.',
      solution: `SELECT dept_name, MAX(salary) AS max_salary FROM instructor GROUP BY dept_name;` },
    { id: 'GK5.54', topic: '3.11d min of max', level: 2,
      prompt: '**Exercise 3.11d** — Find the lowest, across all departments, of the per-department maximum salary computed by the preceding query.',
      solution: `SELECT MIN(max_salary)
FROM (SELECT dept_name, MAX(salary) AS max_salary FROM instructor GROUP BY dept_name) AS dept_max;` },

    // ───────────── Exercise 3.12 (insert / delete chain, university)
    { id: 'GK5.55', topic: '3.12a insert', level: 1,
      prompt: '**Exercise 3.12a** — Create a new course "CS-001", titled "Weekly Seminar", with 0 credits (department: Comp. Sci.). *(The lab schema has CHECK credits > 0, so use 1 credit.)*',
      solution: `INSERT INTO course (course_id, title, dept_name, credits)
VALUES ('CS-001', 'Weekly Seminar', 'Comp. Sci.', 1);`,
      check: `SELECT * FROM course WHERE course_id = 'CS-001';` },
    { id: 'GK5.56', topic: '3.12b insert nulls', level: 2,
      prompt: '**Exercise 3.12b** — (Run (a) first.) Create a section of this course in Fall 2017, with sec_id of 1, and with the location of this section not yet specified.',
      solution: `INSERT INTO course (course_id, title, dept_name, credits)
VALUES ('CS-001', 'Weekly Seminar', 'Comp. Sci.', 1);
INSERT INTO section (course_id, sec_id, semester, year, building, room_number, time_slot_id)
VALUES ('CS-001', '1', 'Fall', 2017, NULL, NULL, NULL);`,
      check: `SELECT * FROM section WHERE course_id = 'CS-001';` },
    { id: 'GK5.57', topic: '3.12c insert select', level: 2,
      prompt: '**Exercise 3.12c** — (Include (a) and (b) in your script.) Enroll every student in the Comp. Sci. department in the above section.',
      solution: `INSERT INTO course (course_id, title, dept_name, credits)
VALUES ('CS-001', 'Weekly Seminar', 'Comp. Sci.', 1);
INSERT INTO section (course_id, sec_id, semester, year, building, room_number, time_slot_id)
VALUES ('CS-001', '1', 'Fall', 2017, NULL, NULL, NULL);
INSERT INTO takes (ID, course_id, sec_id, semester, year, grade)
SELECT ID, 'CS-001', '1', 'Fall', 2017, NULL FROM student WHERE dept_name = 'Comp. Sci.';`,
      check: `SELECT ID, course_id, sec_id, semester, year, grade FROM takes WHERE course_id = 'CS-001' ORDER BY ID;` },
    { id: 'GK5.58', topic: '3.12d delete', level: 2,
      prompt: "**Exercise 3.12d** — (Include (a)–(c) in your script.) Delete enrollments in the above section where the student's ID is 12345.",
      solution: `INSERT INTO course (course_id, title, dept_name, credits)
VALUES ('CS-001', 'Weekly Seminar', 'Comp. Sci.', 1);
INSERT INTO section (course_id, sec_id, semester, year, building, room_number, time_slot_id)
VALUES ('CS-001', '1', 'Fall', 2017, NULL, NULL, NULL);
INSERT INTO takes (ID, course_id, sec_id, semester, year, grade)
SELECT ID, 'CS-001', '1', 'Fall', 2017, NULL FROM student WHERE dept_name = 'Comp. Sci.';
DELETE FROM takes
WHERE ID = '12345' AND course_id = 'CS-001' AND sec_id = '1' AND semester = 'Fall' AND year = 2017;`,
      check: `SELECT ID FROM takes WHERE course_id = 'CS-001' ORDER BY ID;` },
    { id: 'GK5.59', topic: '3.12e delete course (FK)', level: 3,
      prompt: '**Exercise 3.12e** — (Include (a)–(c) in your script.) Delete the course CS-001 **and make the delete succeed**: remove the dependent rows in the right order (see written question N3 for what happens otherwise).',
      hint: 'takes → section → course (xoá bảng con trước).',
      solution: `INSERT INTO course (course_id, title, dept_name, credits)
VALUES ('CS-001', 'Weekly Seminar', 'Comp. Sci.', 1);
INSERT INTO section (course_id, sec_id, semester, year, building, room_number, time_slot_id)
VALUES ('CS-001', '1', 'Fall', 2017, NULL, NULL, NULL);
INSERT INTO takes (ID, course_id, sec_id, semester, year, grade)
SELECT ID, 'CS-001', '1', 'Fall', 2017, NULL FROM student WHERE dept_name = 'Comp. Sci.';
DELETE FROM takes   WHERE course_id = 'CS-001';
DELETE FROM section WHERE course_id = 'CS-001';
DELETE FROM course  WHERE course_id = 'CS-001';`,
      check: `SELECT (SELECT COUNT(*) FROM course WHERE course_id = 'CS-001') AS c,
       (SELECT COUNT(*) FROM section WHERE course_id = 'CS-001') AS s,
       (SELECT COUNT(*) FROM takes WHERE course_id = 'CS-001') AS t,
       (SELECT COUNT(*) FROM takes) AS all_takes;` },
    { id: 'GK5.60', topic: '3.12f delete lower like', level: 3,
      prompt: "**Exercise 3.12f** — Delete all takes tuples corresponding to any section of any course with the word \"advanced\" as a part of the title; ignore case. *(The sample data has no such course, so your script must first insert course 'CS-777' titled 'Advanced Databases' (Comp. Sci., 3 credits), a section of it (sec_id '1', Fall, 2017, no location) and an enrollment of student '12345'; then do the delete.)*",
      solution: `INSERT INTO course VALUES ('CS-777', 'Advanced Databases', 'Comp. Sci.', 3);
INSERT INTO section VALUES ('CS-777', '1', 'Fall', 2017, NULL, NULL, NULL);
INSERT INTO takes VALUES ('12345', 'CS-777', '1', 'Fall', 2017, NULL);
DELETE FROM takes
WHERE course_id IN (SELECT course_id FROM course WHERE LOWER(title) LIKE '%advanced%');`,
      check: `SELECT (SELECT COUNT(*) FROM course WHERE course_id = 'CS-777') AS course_rows,
       (SELECT COUNT(*) FROM takes WHERE course_id = 'CS-777') AS takes_rows,
       (SELECT COUNT(*) FROM takes) AS all_takes;` },

    // ───────────── Exercise 3.13 (DDL)
    { id: 'GK5.61', topic: '3.13 DDL insurance', level: 3, fresh: true,
      prompt: '**Exercise 3.13** — Write SQL DDL corresponding to the insurance schema (Figure 3.17): person(driver_id, name, address); car(license_plate, model, year); accident(report_number, year, location); owns(driver_id, license_plate); participated(report_number, license_plate, driver_id, damage_amount). Declare primary and foreign keys; use INT for report_number and year, NUMERIC for damage_amount. *(These tables already exist in the lab database — start with `DROP TABLE IF EXISTS participated, owns, accident, car, person CASCADE;`.)*',
      solution: `DROP TABLE IF EXISTS participated, owns, accident, car, person CASCADE;
CREATE TABLE person (
    driver_id  VARCHAR(10),
    name       VARCHAR(50) NOT NULL,
    address    VARCHAR(100),
    PRIMARY KEY (driver_id));
CREATE TABLE car (
    license_plate VARCHAR(10),
    model         VARCHAR(30),
    year          INT,
    PRIMARY KEY (license_plate));
CREATE TABLE accident (
    report_number INT,
    year          INT,
    location      VARCHAR(100),
    PRIMARY KEY (report_number));
CREATE TABLE owns (
    driver_id      VARCHAR(10),
    license_plate  VARCHAR(10),
    PRIMARY KEY (driver_id, license_plate),
    FOREIGN KEY (driver_id)     REFERENCES person (driver_id),
    FOREIGN KEY (license_plate) REFERENCES car (license_plate));
CREATE TABLE participated (
    report_number  INT,
    license_plate  VARCHAR(10),
    driver_id      VARCHAR(10),
    damage_amount  NUMERIC(12,2),
    PRIMARY KEY (report_number, license_plate),
    FOREIGN KEY (report_number)  REFERENCES accident (report_number),
    FOREIGN KEY (license_plate)  REFERENCES car (license_plate),
    FOREIGN KEY (driver_id)      REFERENCES person (driver_id));`,
      check: `SELECT tc.table_name, tc.constraint_type, COUNT(*) AS n
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('person','car','accident','owns','participated')
  AND tc.constraint_type IN ('PRIMARY KEY','FOREIGN KEY')
GROUP BY tc.table_name, tc.constraint_type
UNION ALL
SELECT 'type:' || table_name || '.' || column_name, data_type, 0
FROM information_schema.columns
WHERE table_schema = 'public' AND (table_name, column_name) IN (('accident','report_number'), ('participated','report_number'))
ORDER BY 1, 2;` },
  ],
};
