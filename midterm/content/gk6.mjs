// Đề thi GK — BIẾN TẤU: biến thể của các bài trong 4 file Word (đổi điều kiện, thêm bẫy NULL / FK / hoà / nhóm rỗng).
export default {
  key: 'gk6',
  slug: 'gk6_exam_variants',
  label: 'Đề GK · Biến tấu',
  navLabel: 'GK Biến tấu',
  kind: 'Đề thi',
  short: 'GK-B',
  title: 'Midterm Exam — Variants of the Original Exercises',
  titleVi: 'Đề thi giữa kỳ — Biến tấu từ bài tập của bạn',
  source: 'Biến thể của Question 1–19 và Exercise 3.1–3.13 (4 file .docx)',

  summary: `
### 1. Cách dùng
Mỗi bài ở đây là **biến thể** của một bài nguyên bản (ghi rõ "← Q.. / 3.x" trong đề): đổi điều kiện, đổi lược đồ, thêm bẫy NULL, nhóm rỗng, hoà (ties), thứ tự xoá theo foreign key. Làm sau khi đã làm được bài gốc ở **GK Nguyên bản**.

### 2. Đề thi thử trọn bộ (90 phút) — gợi ý chọn bài
| Phần | Chọn | Điểm |
|---|---|---|
| **A. Tự luận (35')** | B1, B2, B4, B6 (bốn câu bất kỳ trong 8 câu) | 4,0 |
| **B. SQL (55')** | GK6.03, .06, .10, .12, .16, .19, .22, .25, .28, .32, .36, .40 | 6,0 |

### 3. Quy tắc biến tấu thường gặp (để tự dự đoán đề thật)
1. **Đổi hằng số/điều kiện** (khoa, năm, ngưỡng lương) — chỉ sửa WHERE.
2. **Đổi \`SOME\` ↔ \`ALL\`, \`MAX\` ↔ \`MIN\`**, \`IN\` ↔ \`NOT IN\`, \`>\` ↔ \`>=\`.
3. **Thêm nhóm 0 phần tử** (giảng viên chưa dạy gì, section chưa ai học) → outer join.
4. **Hoà (ties)** → \`= (select max ..)\` hoặc \`>= ALL\` thay vì \`LIMIT 1\`.
5. **Đổi lược đồ**: cùng dạng câu hỏi nhưng trên bank / employee / insurance.
6. **Thêm ràng buộc**: xoá/chèn đúng thứ tự vì foreign key.
7. **Thêm NULL**: \`= NULL\`, \`NOT IN\` với NULL, \`COUNT(*)\` vs \`COUNT(col)\`.
`,

  quiz: [],

  questions: [
    {
      en: 'Consider SELECT p.a1 FROM p, r1, r2 WHERE p.a1 = r1.a1 AND p.a1 = r2.a1. What does it return when r1 or r2 is empty? Is the result what you would expect for "values in both r1 and r2"? (Variant of Exercise 3.7)',
      q: '**B1 ← 3.7** — Đổi OR thành **AND**: `select p.a1 from p, r1, r2 where p.a1 = r1.a1 and p.a1 = r2.a1`. Truy vấn trả gì khi r1 hoặc r2 rỗng? Có trùng lặp không? Viết lại bằng `INTERSECT`.',
      answer: `Tích Descartes p × r1 × r2: nếu r1 **hoặc** r2 rỗng thì kết quả **rỗng**. Với phép "có trong cả hai", kết quả rỗng lại **đúng** (giao với tập rỗng là rỗng) — khác với trường hợp OR ở 3.7, nơi rỗng làm mất giá trị hợp lệ.
Nhưng kết quả có thể **lặp** dòng: một giá trị a1 xuất hiện k₁ lần trong r1 và k₂ lần trong r2 sẽ được trả k₁·k₂ lần (nhân thêm số lần trong p). Bản gọn, không lặp:
\`\`\`sql
SELECT a1 FROM p INTERSECT SELECT a1 FROM r1 INTERSECT SELECT a1 FROM r2;
\`\`\`
(INTERSECT mặc định loại trùng.)`,
    },
    {
      en: 'Consider the query SELECT AVG(points), COUNT(*), COUNT(takes.grade) FROM takes LEFT JOIN grade_points ON takes.grade = grade_points.grade. Explain how NULL grades affect each of the aggregates. (Variant of Exercise 3.2d)',
      q: '**B2 ← 3.2d** — Dữ liệu có 22 dòng takes, **1 dòng** grade NULL (98988, BIO-301). Với `takes left join grade_points`, hãy cho biết `count(*)`, `count(takes.grade)`, `count(grade_points.points)` lần lượt bằng bao nhiêu và `avg(points)` có tính dòng NULL không? Vì sao?',
      answer: `Left join giữ cả 22 dòng takes; dòng grade NULL không khớp grade_points nên các cột của grade_points là NULL.
- \`count(*)\` = **22** (đếm dòng, kể cả NULL).
- \`count(takes.grade)\` = **21** (bỏ NULL).
- \`count(grade_points.points)\` = **21**.
- \`avg(points)\` **bỏ qua** NULL → chia cho 21 chứ không phải 22; "GPA" không bị kéo xuống bởi môn chưa có điểm.
Tổng quát: aggregate (trừ \`count(*)\`) bỏ qua NULL; nếu mọi giá trị đều NULL thì \`sum/avg/min/max\` = NULL còn \`count\` = 0.`,
    },
    {
      en: 'Given t(x) = {1, 2} and s(y) = {1, NULL}: what does SELECT x FROM t WHERE x NOT IN (SELECT y FROM s) return? Rewrite it with NOT EXISTS so it means "x does not occur in s". (Variant of Exercise 3.9c)',
      q: '**B3 ← 3.9c** — Bảng t(x) = {1, 2} và s(y) = {1, NULL}. (a) `select x from t where x not in (select y from s)` trả gì? (b) Viết lại bằng `not exists` để cho kết quả đúng ý "x không có trong s".',
      answer: `(a) \`2 NOT IN (1, NULL)\` = \`2<>1 AND 2<>NULL\` = true AND **unknown** = **unknown** → dòng bị loại. Kết quả **rỗng** (x=1 bị loại vì 1 ∈ s, x=2 vì unknown).
(b)
\`\`\`sql
SELECT x FROM t WHERE NOT EXISTS (SELECT 1 FROM s WHERE s.y = t.x);   -- trả 2
\`\`\`
NOT EXISTS không bị NULL làm hỏng: \`s.y = t.x\` unknown chỉ làm dòng đó không thoả trong subquery, nên NOT EXISTS vẫn true.`,
    },
    {
      en: 'Compare three declarations of the foreign key section.course_id → course: default (restrict), ON DELETE CASCADE, ON DELETE SET NULL. What happens when a course with sections is deleted? Can SET NULL be used when course_id is part of the primary key of section? (Variant of Exercise 3.12e)',
      q: '**B4 ← 3.12e** — So sánh 3 cách khai báo FK `section.course_id → course`: (1) mặc định (restrict), (2) `on delete cascade`, (3) `on delete set null`. Khi xoá course CS-101 (đã có section + takes) mỗi cách cho kết quả gì? Cách (3) có dùng được nếu `course_id` là một phần của primary key section không?',
      answer: `1. **Restrict/no action:** DELETE bị từ chối (lỗi vi phạm FK), không có gì bị xoá.
2. **Cascade:** xoá course → xoá mọi section của nó → (nếu takes → section cũng cascade) xoá mọi dòng takes liên quan. Cả dây chuyền trong một transaction.
3. **Set null:** các section giữ lại nhưng \`course_id\` = NULL.

**Cách (3) không dùng được** khi \`course_id\` thuộc primary key của section (thuộc tính khoá không được NULL) → phải chọn cascade hoặc restrict. SET NULL chỉ hợp với cột cho phép NULL (ví dụ \`advisor.i_ID\`).`,
    },
    {
      en: 'What does SELECT name FROM instructor WHERE salary > ALL (SELECT salary FROM instructor WHERE dept_name = \'Astronomy\') return, given that no department Astronomy exists? What if SOME is used instead of ALL? (Variant of Question 13)',
      q: '**B5 ← Q13** — `salary > all (select salary ... where dept_name = \'Astronomy\')` và bản `> some` trả về gì khi subquery rỗng? Giải thích bằng logic.',
      answer: `Khoa Astronomy không tồn tại → subquery rỗng.
- \`> ALL (∅)\` là **true** cho mọi dòng ("với mọi phần tử của tập rỗng" luôn đúng) → trả **tất cả 12 giảng viên**.
- \`> SOME (∅)\` là **false** ("tồn tại phần tử" của tập rỗng sai) → **rỗng**.
Cẩn thận khi câu hỏi "lương cao hơn mọi giảng viên khoa X" mà X không có ai: kết quả là tất cả.`,
    },
    {
      en: 'For takes with 22 rows, one with a NULL grade, what are the values of (a) SELECT COUNT(*) FROM takes WHERE grade <> \'A\' and (b) the same query with OR grade IS NULL? (Variant of Question 16)',
      q: '**B6 ← Q16** — Với dữ liệu mẫu, `count(*) ... where grade <> \'A\'` và `... where grade <> \'A\' or grade is null` khác nhau thế nào? Tính ra con số.',
      answer: `Có 22 dòng takes; grade = 'A' ở **7** dòng (00128 CS-101; 12345 CS-190/2, CS-315, CS-347; 76543 CS-101, CS-319/2; 98988 BIO-101); 1 dòng NULL; còn lại 14 dòng có grade khác A.
- (a) \`grade <> 'A'\` loại dòng NULL (unknown) → **14**.
- (b) thêm \`OR grade IS NULL\` → **15**.
Bài học: \`<>\` không bao giờ chọn NULL; muốn "không phải A kể cả chưa có điểm" phải viết tường minh.`,
    },
    {
      en: 'For each instructor, find the number of sections taught (0 if none). Why does COUNT(*) give a wrong answer with a LEFT OUTER JOIN? Is there an alternative to the outer join? (Variant of Exercise 3.1e)',
      q: '**B7 ← 3.1e** — Với bài "mỗi giảng viên dạy bao nhiêu section (0 nếu chưa dạy)": vì sao `count(*)` sai, `count(teaches.course_id)` đúng? Có cách nào khác ngoài outer join?',
      answer: `Left join tạo một dòng "NULL-padded" cho giảng viên chưa dạy; \`COUNT(*)\` đếm dòng đó thành **1**, còn \`COUNT(teaches.course_id)\` bỏ qua NULL → **0**.
Cách khác: scalar subquery trong SELECT:
\`\`\`sql
SELECT ID, name, (SELECT COUNT(*) FROM teaches t WHERE t.ID = i.ID) AS n FROM instructor i;
\`\`\``,
    },
    {
      en: 'Give two different ways to find every instructor who earns the maximum salary of his or her own department, and explain which handles ties. (Variant of Exercises 3.1d and 3.11c)',
      q: '**B8 ← 3.1d, 3.11c** — Tìm giảng viên có lương cao nhất **trong khoa của mình**: viết bằng (a) correlated subquery, (b) join với bảng max theo khoa. Cách nào xử lý hoà?',
      answer: `\`\`\`sql
-- (a)
SELECT * FROM instructor i
WHERE salary = (SELECT MAX(salary) FROM instructor WHERE dept_name = i.dept_name);
-- (b)
SELECT i.* FROM instructor i
JOIN (SELECT dept_name, MAX(salary) AS m FROM instructor GROUP BY dept_name) d
  ON i.dept_name = d.dept_name AND i.salary = d.m;
\`\`\`
Cả hai so bằng (\`=\`) nên **trả cả những người hoà** lương cao nhất. Dùng \`LIMIT 1\` mới làm mất người hoà.`,
    },
  ],

  exercises: [
    // ───────────── từ Question 1–19
    { id: 'GK6.01', topic: 'Q4 ← raise + filter', level: 1,
      prompt: '**← Question 4.** Show ID, name and the salary after a 10% raise, **only** for the instructors whose raised salary would exceed 80000.',
      solution: `SELECT ID, name, salary * 1.1 AS new_salary FROM instructor WHERE salary * 1.1 > 80000;` },
    { id: 'GK6.02', topic: 'Q7 ← not in', level: 1,
      prompt: '**← Question 7.** Get the name and department of the instructors who are **not** in Physics or History.',
      solution: `SELECT name, dept_name FROM instructor WHERE dept_name NOT IN ('Physics', 'History');` },
    { id: 'GK6.03', topic: 'Q8 ← not between', level: 1,
      prompt: '**← Question 8.** Get the names and salaries of the instructors whose salary is **not** between 60000 and 90000.',
      solution: `SELECT name, salary FROM instructor WHERE salary NOT BETWEEN 60000 AND 90000;` },
    { id: 'GK6.04', topic: 'Q10 ← join on syntax', level: 2,
      prompt: '**← Question 10.** Re-write it with explicit `JOIN ... ON`: name and course ID taught by instructors of the Comp. Sci. department, for sections taught in **Spring** only.',
      solution: `SELECT i.name, t.course_id
FROM instructor i JOIN teaches t ON i.ID = t.ID
WHERE i.dept_name = 'Comp. Sci.' AND t.semester = 'Spring';` },
    { id: 'GK6.05', topic: 'Q11 ← filter grade', level: 2, ordered: true,
      prompt: "**← Question 11.** Show each student's name with the title of every course in which they got **A or A-**, ordered by student name then title.",
      solution: `SELECT student.name, course.title
FROM student, takes, course
WHERE student.ID = takes.ID AND takes.course_id = course.course_id
  AND takes.grade IN ('A', 'A-')
ORDER BY student.name, course.title;` },
    { id: 'GK6.06', topic: 'Q13 ← > all', level: 2,
      prompt: '**← Question 13.** Get the names of the instructors whose salary is greater than that of **every** Finance instructor.',
      solution: `SELECT name FROM instructor
WHERE salary > ALL (SELECT salary FROM instructor WHERE dept_name = 'Finance');` },
    { id: 'GK6.07', topic: 'Q14 ← like variants', level: 1,
      prompt: "**← Question 14.** Get the titles of courses that start with 'Intro' **or** end with 'Systems'.",
      solution: `SELECT title FROM course WHERE title LIKE 'Intro%' OR title LIKE '%Systems';` },
    { id: 'GK6.08', topic: 'Q15 ← order by 3 keys', level: 1, ordered: true,
      prompt: '**← Question 15.** List ID, name, dept_name, salary of the instructors by department ascending, then salary descending, then name ascending.',
      solution: `SELECT ID, name, dept_name, salary FROM instructor ORDER BY dept_name ASC, salary DESC, name ASC;` },
    { id: 'GK6.09', topic: 'Q16 ← not null', level: 1,
      prompt: "**← Question 16.** Find the enrollments that **do** have a grade and whose grade is neither 'A' nor 'A-'. Output ID, course_id, grade.",
      solution: `SELECT ID, course_id, grade FROM takes WHERE grade IS NOT NULL AND grade NOT IN ('A', 'A-');` },
    { id: 'GK6.10', topic: 'Q17 ← group having', level: 2,
      prompt: '**← Question 17/18.** For every department that has **at least 2** instructors, show dept_name, number of instructors, minimum, maximum and average salary.',
      solution: `SELECT dept_name, COUNT(*) AS n, MIN(salary) AS min_sal, MAX(salary) AS max_sal, AVG(salary) AS avg_sal
FROM instructor GROUP BY dept_name HAVING COUNT(*) >= 2;` },
    { id: 'GK6.11', topic: 'Q18 ← having avg', level: 2,
      prompt: '**← Question 18.** Show dept_name and average salary only for the departments whose average salary is greater than 70000.',
      solution: `SELECT dept_name, AVG(salary) AS avg_salary FROM instructor GROUP BY dept_name HAVING AVG(salary) > 70000;` },
    { id: 'GK6.12', topic: 'Q19 ← left join count', level: 2,
      prompt: '**← Question 19 / 3.1e.** For **every** instructor, show ID, name and the number of sections taught (0 if none) as `num_sections`.',
      hint: 'left outer join + count(cột bảng phải); count(*) sẽ sai.',
      solution: `SELECT i.ID, i.name, COUNT(t.course_id) AS num_sections
FROM instructor i LEFT OUTER JOIN teaches t ON i.ID = t.ID
GROUP BY i.ID, i.name;` },

    // ───────────── từ 3.1
    { id: 'GK6.13', topic: '3.1a ← not in dept', level: 1,
      prompt: '**← Exercise 3.1a.** Find the titles of courses with **4 credits** that do **not** belong to the Comp. Sci. department.',
      solution: `SELECT title FROM course WHERE credits = 4 AND dept_name <> 'Comp. Sci.';` },
    { id: 'GK6.14', topic: '3.1b ← other instructor', level: 2,
      prompt: '**← Exercise 3.1b.** Find the IDs of all students who were taught by an instructor named **Srinivasan** (no duplicates).',
      solution: `SELECT DISTINCT takes.ID
FROM takes, teaches, instructor
WHERE takes.course_id = teaches.course_id AND takes.sec_id = teaches.sec_id
  AND takes.semester = teaches.semester AND takes.year = teaches.year
  AND teaches.ID = instructor.ID AND instructor.name = 'Srinivasan';` },
    { id: 'GK6.15', topic: '3.1d ← second highest', level: 3,
      prompt: '**← Exercise 3.1c/d.** Find all instructors who earn the **second highest** salary (ties included).',
      solution: `SELECT * FROM instructor
WHERE salary = (SELECT MAX(salary) FROM instructor
                WHERE salary < (SELECT MAX(salary) FROM instructor));` },
    { id: 'GK6.16', topic: '3.1e ← enrollment incl. 0', level: 3,
      prompt: '**← Exercise 3.1e.** Find the enrollment of **each** section offered in **Spring 2017**, including sections with no student (enrollment 0). Output course_id, sec_id, enrollment.',
      solution: `SELECT s.course_id, s.sec_id, COUNT(t.ID) AS enrollment
FROM section s LEFT OUTER JOIN takes t
  ON s.course_id = t.course_id AND s.sec_id = t.sec_id AND s.semester = t.semester AND s.year = t.year
WHERE s.semester = 'Spring' AND s.year = 2017
GROUP BY s.course_id, s.sec_id;` },
    { id: 'GK6.17', topic: '3.1g ← max over all terms', level: 3,
      prompt: '**← Exercise 3.1g.** Find the section(s) with the maximum enrollment over **all** semesters and years. Output course_id, sec_id, semester, year.',
      solution: `WITH e AS (
  SELECT course_id, sec_id, semester, year, COUNT(ID) AS n FROM takes GROUP BY course_id, sec_id, semester, year)
SELECT course_id, sec_id, semester, year FROM e WHERE n = (SELECT MAX(n) FROM e);` },

    // ───────────── từ 3.2 / 3.3
    { id: 'GK6.18', topic: '3.2 ← passed credits', level: 3,
      prompt: '**← Exercise 3.2.** For **every** student (including those with no course) output ID and `passed_credits`: total credits of courses where the grade is not null and not F (0 if none).',
      solution: `SELECT s.ID,
       COALESCE((SELECT SUM(c.credits) FROM takes t, course c
                 WHERE t.ID = s.ID AND t.course_id = c.course_id
                   AND t.grade IS NOT NULL AND t.grade <> 'F'), 0) AS passed_credits
FROM student s;` },
    { id: 'GK6.19', topic: '3.3a ← update case', level: 3,
      prompt: '**← Exercise 3.3a.** In one UPDATE: Comp. Sci. instructors earning less than 70000 get a 15% raise, the other Comp. Sci. instructors get 5%.',
      solution: `UPDATE instructor
SET salary = salary * CASE WHEN salary < 70000 THEN 1.15 ELSE 1.05 END
WHERE dept_name = 'Comp. Sci.';`,
      check: `SELECT ID, salary FROM instructor ORDER BY ID;` },
    { id: 'GK6.20', topic: '3.3b ← delete idle instructors', level: 2,
      prompt: '**← Exercise 3.3b.** Delete all instructors who have never taught a section (do not occur in teaches).',
      solution: `DELETE FROM instructor WHERE ID NOT IN (SELECT ID FROM teaches);`,
      check: `SELECT ID FROM instructor ORDER BY ID;` },
    { id: 'GK6.21', topic: '3.3c ← insert not exists', level: 3,
      prompt: '**← Exercise 3.3c.** Enroll every Physics student in PHY-101, section 1, Fall 2017 with a NULL grade, **skipping** students already enrolled in it.',
      solution: `INSERT INTO takes
SELECT s.ID, 'PHY-101', '1', 'Fall', 2017, NULL
FROM student s
WHERE s.dept_name = 'Physics'
  AND NOT EXISTS (SELECT 1 FROM takes t
                  WHERE t.ID = s.ID AND t.course_id = 'PHY-101' AND t.sec_id = '1'
                    AND t.semester = 'Fall' AND t.year = 2017);`,
      check: `SELECT ID, grade FROM takes WHERE course_id = 'PHY-101' ORDER BY ID;` },

    // ───────────── từ 3.4 (insurance)
    { id: 'GK6.22', topic: '3.4a ← accidents per car', level: 2,
      prompt: '**← Exercise 3.4a.** (Insurance) For **every** car show license_plate, model and the number of accidents it participated in (0 if none) as `num_accidents`.',
      solution: `SELECT c.license_plate, c.model, COUNT(p.report_number) AS num_accidents
FROM car c LEFT OUTER JOIN participated p ON c.license_plate = p.license_plate
GROUP BY c.license_plate, c.model;` },
    { id: 'GK6.23', topic: '3.4b ← delete FK order', level: 3,
      prompt: '**← Exercise 3.4b.** Delete every 2017 accident whose **total** damage_amount is at most 1000. Remember the foreign key from participated.',
      hint: 'Xoá participated trước, accident sau.',
      solution: `DELETE FROM participated
WHERE report_number IN (SELECT a.report_number FROM accident a, participated p
                        WHERE a.report_number = p.report_number AND a.year = 2017
                        GROUP BY a.report_number HAVING SUM(p.damage_amount) <= 1000);
DELETE FROM accident
WHERE year = 2017 AND report_number NOT IN (SELECT report_number FROM participated);`,
      check: `SELECT report_number FROM accident ORDER BY report_number;` },
    { id: 'GK6.24', topic: '3.4 ← owner total damage', level: 2,
      prompt: "**← Exercise 3.4.** For each person who owns a car that took part in an accident, show the person's name and the **total damage_amount** of those participations as `total_damage`.",
      solution: `SELECT pe.name, SUM(pa.damage_amount) AS total_damage
FROM person pe, owns o, participated pa
WHERE pe.driver_id = o.driver_id AND o.license_plate = pa.license_plate
GROUP BY pe.driver_id, pe.name;` },

    // ───────────── từ 3.5 / 3.6
    { id: 'GK6.25', topic: '3.5 ← new scale + count', level: 2,
      prompt: '**← Exercise 3.5.** With a new scale (A if score >= 90, B if >= 80, C if >= 70, D if >= 60, otherwise F) output grade and number of students per grade.',
      solution: `WITH g AS (
  SELECT ID, CASE WHEN score >= 90 THEN 'A' WHEN score >= 80 THEN 'B'
                  WHEN score >= 70 THEN 'C' WHEN score >= 60 THEN 'D' ELSE 'F' END AS grade
  FROM marks)
SELECT grade, COUNT(ID) FROM g GROUP BY grade;` },
    { id: 'GK6.26', topic: '3.6 ← lower like', level: 1,
      prompt: '**← Exercise 3.6.** Find the titles of courses that contain "comput" regardless of case.',
      solution: `SELECT title FROM course WHERE LOWER(title) LIKE '%comput%';` },

    // ───────────── từ 3.8 (bank)
    { id: 'GK6.27', topic: '3.8a ← loan but no account', level: 1,
      prompt: '**← Exercise 3.8a.** (Bank) Find the ID of each customer who has a loan but **not** an account.',
      solution: `(SELECT ID FROM borrower) EXCEPT (SELECT ID FROM depositor);` },
    { id: 'GK6.28', topic: '3.8b ← same city diff street', level: 2,
      prompt: "**← Exercise 3.8b.** Find the ID of each customer who lives in the same city as customer '12345' but on a **different street**.",
      solution: `SELECT F.ID FROM customer F, customer S
WHERE S.ID = '12345' AND F.customer_city = S.customer_city AND F.customer_street <> S.customer_street;` },
    { id: 'GK6.29', topic: '3.8c ← both loan & account branch', level: 2,
      prompt: '**← Exercise 3.8c.** Find the name of each branch that has **both** at least one loan **and** at least one account.',
      solution: `(SELECT branch_name FROM loan) INTERSECT (SELECT branch_name FROM account);` },

    // ───────────── từ 3.9 (employee)
    { id: 'GK6.30', topic: '3.9a ← miami companies', level: 2,
      prompt: '**← Exercise 3.9a.** (Employee) Find the ID and name of every employee who works for a company that is located in Miami.',
      solution: `SELECT DISTINCT e.ID, e.person_name
FROM employee e, works w, company c
WHERE e.ID = w.ID AND w.company_name = c.company_name AND c.city = 'Miami';` },
    { id: 'GK6.31', topic: '3.9d ← > all (Mega)', level: 2,
      prompt: '**← Exercise 3.9d.** Find the ID of each employee who earns more than every employee of "Mega Corp".',
      solution: `SELECT ID FROM works WHERE salary > ALL (SELECT salary FROM works WHERE company_name = 'Mega Corp');` },
    { id: 'GK6.32', topic: '3.9e ← division BigBank', level: 3,
      prompt: '**← Exercise 3.9e.** Find the name of each company that is located in **every** city in which "BigBank" is located (BigBank itself included).',
      solution: `SELECT DISTINCT S.company_name FROM company S
WHERE NOT EXISTS (
  (SELECT city FROM company WHERE company_name = 'BigBank')
  EXCEPT
  (SELECT T.city FROM company T WHERE T.company_name = S.company_name));` },
    { id: 'GK6.33', topic: '3.9f ← fewest employees', level: 3,
      prompt: '**← Exercise 3.9f.** Find the name of the company that has the **fewest** employees (all of them in case of a tie).',
      solution: `SELECT company_name FROM works GROUP BY company_name
HAVING COUNT(DISTINCT ID) <= ALL (SELECT COUNT(DISTINCT ID) FROM works GROUP BY company_name);` },
    { id: 'GK6.34', topic: '3.9g ← below overall avg', level: 2,
      prompt: '**← Exercise 3.9g.** Find the name of each company whose average salary is **lower** than the average salary of **all** employees.',
      solution: `SELECT company_name FROM works GROUP BY company_name
HAVING AVG(salary) < (SELECT AVG(salary) FROM works);` },

    // ───────────── từ 3.10
    { id: 'GK6.35', topic: '3.10a ← update two cond', level: 1,
      prompt: '**← Exercise 3.10a.** Employees of "Small Bank Corporation" who live in Miami now live in "Orlando".',
      solution: `UPDATE employee SET city = 'Orlando'
WHERE city = 'Miami' AND ID IN (SELECT ID FROM works WHERE company_name = 'Small Bank Corporation');`,
      check: `SELECT ID, city FROM employee ORDER BY ID;` },
    { id: 'GK6.36', topic: '3.10b ← manager raise case', level: 3,
      prompt: '**← Exercise 3.10b.** Give each manager of "Mega Corp" an 8 percent raise unless the new salary would exceed 60000; in such cases give only 2 percent. (One UPDATE.)',
      solution: `UPDATE works
SET salary = salary * CASE WHEN salary * 1.08 > 60000 THEN 1.02 ELSE 1.08 END
WHERE company_name = 'Mega Corp' AND ID IN (SELECT manager_id FROM manages);`,
      check: `SELECT ID, salary FROM works ORDER BY ID;` },

    // ───────────── từ 3.11
    { id: 'GK6.37', topic: '3.11a ← division 4-credit CS', level: 3,
      prompt: '**← Exercise 3.11a.** Find the ID and name of each student who has taken **every** Comp. Sci. course with 4 credits.',
      solution: `SELECT s.ID, s.name FROM student s
WHERE NOT EXISTS (
  (SELECT course_id FROM course WHERE dept_name = 'Comp. Sci.' AND credits = 4)
  EXCEPT
  (SELECT course_id FROM takes WHERE takes.ID = s.ID));` },
    { id: 'GK6.38', topic: '3.11b ← only 2018', level: 2,
      prompt: '**← Exercise 3.11b.** Find the ID and name of each student who has **not** taken any course offered before 2018.',
      solution: `SELECT ID, name FROM student WHERE ID NOT IN (SELECT ID FROM takes WHERE year < 2018);` },
    { id: 'GK6.39', topic: '3.11d ← dept with min of max', level: 3,
      prompt: '**← Exercise 3.11d.** Find the department(s) whose maximum instructor salary is the **lowest** among all departments. Output dept_name and that salary.',
      solution: `WITH m AS (SELECT dept_name, MAX(salary) AS mx FROM instructor GROUP BY dept_name)
SELECT dept_name, mx FROM m WHERE mx = (SELECT MIN(mx) FROM m);` },

    // ───────────── từ 3.12 / 3.13
    { id: 'GK6.40', topic: '3.12a-c ← chain', level: 3,
      prompt: '**← Exercise 3.12a–c.** In one script: create course "CS-002" titled "Lab Seminar" (Comp. Sci., 1 credit); create its section 1 in Spring 2019 with no location; enroll **every student with tot_cred < 50** (any department) in it.',
      solution: `INSERT INTO course VALUES ('CS-002', 'Lab Seminar', 'Comp. Sci.', 1);
INSERT INTO section VALUES ('CS-002', '1', 'Spring', 2019, NULL, NULL, NULL);
INSERT INTO takes SELECT ID, 'CS-002', '1', 'Spring', 2019, NULL FROM student WHERE tot_cred < 50;`,
      check: `SELECT ID FROM takes WHERE course_id = 'CS-002' ORDER BY ID;` },
    { id: 'GK6.41', topic: '3.12f ← intro delete', level: 3,
      prompt: '**← Exercise 3.12f.** Delete all takes tuples of any section of any course with the word "intro" as part of the title, ignoring case.',
      solution: `DELETE FROM takes WHERE course_id IN (SELECT course_id FROM course WHERE LOWER(title) LIKE '%intro%');`,
      check: `SELECT COUNT(*) AS remaining FROM takes;` },
    { id: 'GK6.42', topic: '3.13 ← DDL library', level: 3, fresh: true,
      prompt: '**← Exercise 3.13.** Write DDL for a small library: `lib_book(isbn varchar(13) PK, title varchar(100) not null, year int)`, `lib_member(member_id int PK, name varchar(50) not null, email varchar(80) unique)`, `lib_loan(member_id, isbn, loan_date date, return_date date; PK (member_id, isbn, loan_date); FK member_id → lib_member **on delete cascade**; FK isbn → lib_book)`.',
      solution: `CREATE TABLE lib_book (
  isbn  VARCHAR(13) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  year  INT);
CREATE TABLE lib_member (
  member_id INT PRIMARY KEY,
  name      VARCHAR(50) NOT NULL,
  email     VARCHAR(80) UNIQUE);
CREATE TABLE lib_loan (
  member_id   INT REFERENCES lib_member ON DELETE CASCADE,
  isbn        VARCHAR(13) REFERENCES lib_book,
  loan_date   DATE,
  return_date DATE,
  PRIMARY KEY (member_id, isbn, loan_date));`,
      check: `SELECT try_sql($$insert into lib_book values ('111', 'DB Concepts', 2020)$$) AS book,
       try_sql($$insert into lib_member values (1, 'An', 'an@x.com')$$) AS member,
       try_sql($$insert into lib_member values (2, 'Binh', 'an@x.com')$$) AS dup_email,
       try_sql($$insert into lib_loan values (1, '111', date '2024-01-01', null)$$) AS loan_ok,
       try_sql($$insert into lib_loan values (9, '111', date '2024-01-01', null)$$) AS loan_bad_member,
       try_sql($$delete from lib_member where member_id = 1$$) AS delete_member,
       sql_value('select count(*) from lib_loan') AS loans_left;` },
  ],
};
