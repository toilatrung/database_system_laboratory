// Đề mẫu — "University Database: 20 MySQL Query Exercises" (University_Database_20_SQL_Queries.pdf).
// Lược đồ University của sách (Figure 2.9). Đề hỏi năm 2025, nên lab/db/exam_sample_2025.sql
// thêm vài section/teaches/takes năm 2025; file đó chỉ được nạp cho các bài của phần này.
export default {
  key: 'gk7',
  slug: 'gk7_sample_20_queries',
  label: 'Đề mẫu · 20 truy vấn',
  navLabel: 'Đề mẫu',
  kind: 'Đề thi',
  short: 'GK-M',
  title: 'University Database: 20 SQL Query Exercises',
  titleVi: 'Đề mẫu — 20 truy vấn trên University database',
  source: 'University_Database_20_SQL_Queries.pdf',
  seed: 'exam_sample_2025.sql',
  dbPanel: true,

  summary: `
### 1. Đề này là gì
Đề mẫu gồm **20 truy vấn** trên University database của sách, chia 3 mức: cơ bản (Q1–5), trung bình (Q6–13), khó (Q14–20). Đề gốc viết cho MySQL; ở đây chạy trên PostgreSQL, nhưng mọi câu đều viết được bằng SQL chuẩn (join, \`not exists\`, \`group by … having\`, subquery, \`with\`).

Khi làm bài, bấm nút **Database** ở góc phải dưới để mở popup: xem cột và dữ liệu của 11 bảng, và chạy thử truy vấn bất kỳ (không làm đổi dữ liệu).

### 2. Dữ liệu năm 2025
Dữ liệu mẫu của sách chỉ có năm 2017–2018, còn đề hỏi *Fall 2025* (Q6) và *mọi học kỳ năm 2025* (Q19). Vì vậy đề này nạp thêm [\`lab/db/exam_sample_2025.sql\`](../../lab/db/exam_sample_2025.sql):

| Bảng | Dòng thêm |
|---|---|
| section | CS-101 Spring/Fall 2025, CS-347 Summer 2025, CS-319 Fall 2025, HIS-351 Fall 2025 (**chưa có giảng viên**) |
| teaches | 10101 dạy cả 3 học kỳ 2025; 22222 (Physics) cùng dạy CS-101 Fall 2025; 45565 dạy CS-319 Fall 2025 |
| takes | 98765 học lại CS-101; 44553 (Physics) học CS-101; 12345 học CS-319 (đủ mọi môn Comp. Sci.); 23121 có điểm \`W\` (ngoài thang điểm) |

### 3. Mẫu lời giải cần thuộc
| Dạng | Câu | Cách viết |
|---|---|---|
| "chưa từng / không có" | Q10, Q11, Q13 | \`NOT EXISTS (select 1 … where khớp khoá)\` hoặc \`LEFT JOIN … WHERE phải IS NULL\` |
| Phép chia "mọi …" | Q12, Q19 | \`NOT EXISTS (tập cần có EXCEPT tập đã có)\` |
| So với trung bình | Q14, Q20 | \`WITH\` tính từng nhóm, rồi \`> (select avg … )\` |
| Lớn nhất, kể cả hoà | Q16 | \`= (select max …)\` hoặc \`>= ALL\` |
| Đếm phân biệt theo cặp cột | Q15 | \`select distinct\` trong subquery rồi \`count(*)\` |
| Khớp đúng section | Q17, Q20 | join \`takes\`–\`teaches\` trên **cả 4 cột** \`course_id, sec_id, semester, year\` |

### 4. Bẫy hay gặp
- **Q5, Q7, Q8, Q9:** join làm lặp dòng (học lại, dạy nhiều section) → cần \`DISTINCT\`.
- **Q14:** "kể cả SV không học môn nào" → \`LEFT JOIN\` + \`COUNT(DISTINCT t.course_id)\` (đếm cột bảng phải, NULL không được đếm).
- **Q16:** khoa không có giảng viên → \`LEFT JOIN\` + \`COALESCE(SUM(salary), 0)\`.
- **Q17/Q20:** join \`takes\`–\`teaches\` chỉ trên \`course_id\` là sai: ghép SV với giảng viên của học kỳ khác.
- **Q18:** "hoàn thành" = \`grade IS NOT NULL AND grade <> 'F'\`; SV không học môn nào có tiên quyết thì **không** được chọn.
- **Q19:** năm 2025 không có section thì phép chia trả về **mọi** giảng viên (tập rỗng ⊆ mọi tập) → thêm \`EXISTS (select … where year = 2025)\`.
- **Q20:** bỏ điểm NULL và điểm lạ như \`W\` bằng **inner join** với bảng quy đổi; trung bình chung tính trên từng lượt học có điểm.
`,

  quiz: [],

  questions: [
    {
      q: '**Q10** — Viết Q10 ("SV chưa học môn nào") bằng `NOT IN`, `NOT EXISTS` và `LEFT JOIN`. Cách nào có thể sai khi cột so sánh có NULL?',
      answer: `\`\`\`sql
-- NOT IN
SELECT ID, name FROM student WHERE ID NOT IN (SELECT ID FROM takes);
-- NOT EXISTS
SELECT s.ID, s.name FROM student s WHERE NOT EXISTS (SELECT 1 FROM takes t WHERE t.ID = s.ID);
-- LEFT JOIN
SELECT s.ID, s.name FROM student s LEFT JOIN takes t ON t.ID = s.ID WHERE t.ID IS NULL;
\`\`\`
\`NOT IN\` sai khi subquery trả về một giá trị NULL: \`x NOT IN (…, NULL)\` là *unknown* với mọi x → không trả dòng nào. Ở đây \`takes.ID\` là một phần primary key nên không NULL, cả ba cách cho cùng kết quả; nhưng \`NOT EXISTS\` an toàn trong mọi trường hợp.`,
    },
    {
      q: '**Q12** — Giải thích vì sao `NOT EXISTS (A EXCEPT B)` biểu diễn được "đã học **mọi** môn của Comp. Sci.". Nếu khoa Comp. Sci. không có môn nào thì kết quả là gì?',
      answer: `Với mỗi SV: A = tập môn của Comp. Sci., B = tập môn SV đã học. \`A EXCEPT B\` là các môn của khoa mà SV **chưa** học. Tập đó rỗng ⇔ A ⊆ B ⇔ SV đã học mọi môn của khoa — đó là phép chia (÷) của đại số quan hệ.

Nếu khoa không có môn nào thì A rỗng → \`A EXCEPT B\` rỗng với mọi SV → **mọi** SV được chọn (đúng theo logic "với mọi phần tử của tập rỗng"). Muốn tránh thì thêm \`EXISTS (select 1 from course where dept_name = 'Comp. Sci.')\`, giống cách Q19 xử lý năm không có section.`,
    },
    {
      q: '**Q14** — Vì sao trung bình phải tính trên `student LEFT JOIN takes` chứ không phải trên `takes`? Với dữ liệu của đề, hai cách cho trung bình bao nhiêu?',
      answer: `\`GROUP BY\` trên \`takes\` chỉ có những SV đã học ít nhất một môn, nên SV 0 môn (Snow) không góp vào mẫu số → trung bình bị đẩy lên. Đề yêu cầu tính cả SV 0 môn, nên phải bắt đầu từ \`student\` và \`LEFT JOIN takes\`, đếm \`COUNT(DISTINCT t.course_id)\` (SV không học môn nào được 0).

Với dữ liệu của đề: 13 SV, tổng 24 lượt môn phân biệt → trung bình ≈ **1.85** (tính cả Snow); bỏ Snow thì là 24/12 = **2**, và khi đó SV học đúng 2 môn sẽ **không** còn "vượt trung bình" nữa — kết quả chỉ còn Shankar.`,
    },
    {
      q: '**Q17 / Q20** — Join `takes` với `teaches` thế nào là "khớp đúng section và học kỳ"? Nêu một ví dụ trong dữ liệu mà join sai cho kết quả sai.',
      answer: `Phải khớp **cả 4 cột** khoá của section:
\`\`\`sql
takes t JOIN teaches te
  ON te.course_id = t.course_id AND te.sec_id = t.sec_id
 AND te.semester  = t.semester  AND te.year   = t.year
\`\`\`
Nếu chỉ join trên \`course_id\`: CS-101 được dạy ở Fall 2017 (Srinivasan), Spring 2018 (Katz) và Fall 2025 (Srinivasan + Einstein). Khi đó SV học CS-101 Fall 2017 (ví dụ 00128 Zhang) sẽ bị ghép với cả Katz và Einstein dù họ không dạy lớp đó → số giảng viên ở Q17 và điểm trung bình theo giảng viên ở Q20 đều sai.`,
    },
  ],

  exercises: [
    // ───────────── Basic Queries (1–5)
    { id: 'GK7.01', topic: 'Q1 where', level: 1,
      en: 'Q1. Find the IDs and names of all students belonging to the Comp. Sci. department.',
      prompt: 'Cho ID và tên của mọi sinh viên thuộc khoa **Comp. Sci.** Kết quả: `ID, name`.',
      solution: `SELECT ID, name
FROM student
WHERE dept_name = 'Comp. Sci.';` },
    { id: 'GK7.02', topic: 'Q2 where >=', level: 1,
      en: 'Q2. List the course IDs, titles, and credits of all courses worth at least 3 credits.',
      prompt: 'Liệt kê các môn có **ít nhất 3 tín chỉ**. Kết quả: `course_id, title, credits`.',
      solution: `SELECT course_id, title, credits
FROM course
WHERE credits >= 3;` },
    { id: 'GK7.03', topic: 'Q3 where', level: 1,
      en: 'Q3. List the titles of all courses offered by the Physics department.',
      prompt: 'Liệt kê tên (`title`) của mọi môn do khoa **Physics** mở.',
      solution: `SELECT title
FROM course
WHERE dept_name = 'Physics';` },
    { id: 'GK7.04', topic: 'Q4 join', level: 1,
      en: "Q4. Display each student's ID, name, department name, and the building of that department.",
      prompt: 'Với mỗi sinh viên, cho ID, tên, khoa và toà nhà (`building`) của khoa đó. Kết quả: `ID, name, dept_name, building`.',
      solution: `SELECT s.ID, s.name, s.dept_name, d.building
FROM student s
JOIN department d ON d.dept_name = s.dept_name;` },
    { id: 'GK7.05', topic: 'Q5 join + distinct', level: 1,
      en: 'Q5. Find the distinct titles of all courses taken by the student with ID 12345, regardless of semester.',
      prompt: 'Tên các môn (không trùng) mà sinh viên **12345** đã học, không kể học kỳ nào. Kết quả: `title`.',
      hint: 'takes chỉ có course_id; tên môn nằm trong course.',
      solution: `SELECT DISTINCT c.title
FROM takes t
JOIN course c ON c.course_id = t.course_id
WHERE t.ID = '12345';` },

    // ───────────── Intermediate Queries (6–13)
    { id: 'GK7.06', topic: 'Q6 join + filter', level: 2,
      en: 'Q6. List the IDs and names of students who took CS-101 in Fall 2025.',
      prompt: 'ID và tên các sinh viên học **CS-101** ở **Fall 2025** (mỗi SV một dòng). Kết quả: `ID, name`.',
      solution: `SELECT DISTINCT s.ID, s.name
FROM student s
JOIN takes t ON t.ID = s.ID
WHERE t.course_id = 'CS-101' AND t.semester = 'Fall' AND t.year = 2025;` },
    { id: 'GK7.07', topic: 'Q7 3-table join', level: 2,
      en: 'Q7. Find instructors who have taught courses offered by a department other than their own. Show instructor name, instructor department, and course title.',
      prompt: 'Tìm giảng viên đã dạy môn của **khoa khác** khoa mình. Kết quả: `name` (giảng viên), `dept_name` (khoa của giảng viên), `title` (tên môn) — mỗi bộ ba một dòng.',
      hint: 'So sánh instructor.dept_name với course.dept_name.',
      solution: `SELECT DISTINCT i.name, i.dept_name, c.title
FROM instructor i
JOIN teaches te ON te.ID = i.ID
JOIN course c   ON c.course_id = te.course_id
WHERE c.dept_name <> i.dept_name;` },
    { id: 'GK7.08', topic: 'Q8 join + distinct', level: 1,
      en: 'Q8. Find the distinct titles of courses taught by instructor 10101.',
      prompt: 'Tên các môn (không trùng) do giảng viên **10101** dạy. Kết quả: `title`.',
      solution: `SELECT DISTINCT c.title
FROM teaches te
JOIN course c ON c.course_id = te.course_id
WHERE te.ID = '10101';` },
    { id: 'GK7.09', topic: 'Q9 join, so sánh cột', level: 2,
      en: 'Q9. Find the IDs and names of students who have taken at least one course outside their own department.',
      prompt: 'ID và tên các sinh viên đã học **ít nhất một môn ngoài khoa của mình** (mỗi SV một dòng). Kết quả: `ID, name`.',
      solution: `SELECT DISTINCT s.ID, s.name
FROM student s
JOIN takes t  ON t.ID = s.ID
JOIN course c ON c.course_id = t.course_id
WHERE c.dept_name <> s.dept_name;` },
    { id: 'GK7.10', topic: 'Q10 not exists', level: 2,
      en: 'Q10. Find the IDs and names of students who have never taken any course.',
      prompt: 'ID và tên các sinh viên **chưa từng học môn nào**. Kết quả: `ID, name`.',
      hint: 'NOT EXISTS, hoặc LEFT JOIN takes rồi lọc takes.ID IS NULL.',
      solution: `SELECT s.ID, s.name
FROM student s
WHERE NOT EXISTS (SELECT 1 FROM takes t WHERE t.ID = s.ID);` },
    { id: 'GK7.11', topic: 'Q11 not exists', level: 2,
      en: 'Q11. Find the IDs and titles of courses that have never been taken by any student.',
      prompt: 'Mã và tên các môn **chưa từng có sinh viên nào học**. Kết quả: `course_id, title`.',
      solution: `SELECT c.course_id, c.title
FROM course c
WHERE NOT EXISTS (SELECT 1 FROM takes t WHERE t.course_id = c.course_id);` },
    { id: 'GK7.12', topic: 'Q12 phép chia', level: 3,
      en: 'Q12. Find the IDs and names of students who have taken every course offered by the Comp. Sci. department, regardless of semester.',
      prompt: 'ID và tên các sinh viên đã học **mọi** môn của khoa **Comp. Sci.** (học kỳ nào cũng được). Kết quả: `ID, name`.',
      hint: 'NOT EXISTS (các môn của Comp. Sci. EXCEPT các môn SV đã học).',
      solution: `SELECT s.ID, s.name
FROM student s
WHERE NOT EXISTS (
  SELECT course_id FROM course WHERE dept_name = 'Comp. Sci.'
  EXCEPT
  SELECT t.course_id FROM takes t WHERE t.ID = s.ID
);` },
    { id: 'GK7.13', topic: 'Q13 not exists, khoá 4 cột', level: 2,
      en: 'Q13. Find all course sections that have no assigned instructor. Show course ID, section ID, semester, and year.',
      prompt: 'Tìm các section **chưa được phân công giảng viên**. Kết quả: `course_id, sec_id, semester, year`.',
      hint: 'Một section được xác định bởi cả 4 cột; teaches phải khớp cả 4.',
      solution: `SELECT se.course_id, se.sec_id, se.semester, se.year
FROM section se
WHERE NOT EXISTS (
  SELECT 1 FROM teaches te
  WHERE te.course_id = se.course_id AND te.sec_id = se.sec_id
    AND te.semester  = se.semester  AND te.year   = se.year
);` },

    // ───────────── Challenging Queries (14–20)
    { id: 'GK7.14', topic: 'Q14 so với trung bình', level: 3,
      en: 'Q14. Find students whose number of distinct courses taken exceeds the average number of distinct courses taken per student. Include students with zero courses when calculating the average. Show ID, name, and course count.',
      prompt: 'Tìm sinh viên có **số môn khác nhau đã học** lớn hơn **trung bình** số môn khác nhau của mỗi sinh viên (trung bình tính **cả SV chưa học môn nào**). Kết quả: `ID, name, course_count`.',
      hint: 'WITH cnt AS (student LEFT JOIN takes, COUNT(DISTINCT t.course_id)), rồi so với (SELECT AVG(...) FROM cnt).',
      solution: `WITH cnt AS (
  SELECT s.ID, s.name, COUNT(DISTINCT t.course_id) AS course_count
  FROM student s
  LEFT JOIN takes t ON t.ID = s.ID
  GROUP BY s.ID, s.name
)
SELECT ID, name, course_count
FROM cnt
WHERE course_count > (SELECT AVG(course_count) FROM cnt);` },
    { id: 'GK7.15', topic: 'Q15 đếm cặp phân biệt', level: 3,
      en: 'Q15. Find students who took the same course in more than one distinct semester-year combination. Show student ID, name, course ID, and number of distinct terms.',
      prompt: 'Tìm sinh viên học **cùng một môn** ở **nhiều hơn một** cặp (học kỳ, năm) khác nhau. Kết quả: `ID, name, course_id, term_count`.',
      hint: 'Lấy DISTINCT (ID, course_id, semester, year) trước rồi mới đếm.',
      solution: `SELECT s.ID, s.name, x.course_id, COUNT(*) AS term_count
FROM (SELECT DISTINCT ID, course_id, semester, year FROM takes) x
JOIN student s ON s.ID = x.ID
GROUP BY s.ID, s.name, x.course_id
HAVING COUNT(*) > 1;` },
    { id: 'GK7.16', topic: 'Q16 max kể cả hoà', level: 3,
      en: 'Q16. Find the department(s) with the highest total instructor salary expenditure, including ties and departments with no instructors.',
      prompt: 'Tìm (các) khoa có **tổng lương giảng viên cao nhất**, giữ cả trường hợp **hoà**, và tính cả khoa **không có giảng viên** (tổng = 0). Kết quả: `dept_name, total_salary`.',
      hint: 'department LEFT JOIN instructor, COALESCE(SUM(salary), 0); rồi = (SELECT MAX(...)).',
      solution: `WITH tot AS (
  SELECT d.dept_name, COALESCE(SUM(i.salary), 0) AS total_salary
  FROM department d
  LEFT JOIN instructor i ON i.dept_name = d.dept_name
  GROUP BY d.dept_name
)
SELECT dept_name, total_salary
FROM tot
WHERE total_salary = (SELECT MAX(total_salary) FROM tot);` },
    { id: 'GK7.17', topic: 'Q17 join takes–teaches', level: 3,
      en: 'Q17. Find students who took courses taught by at least three distinct instructors. Match instructors to the exact course section and academic term. Show student ID, name, and instructor count.',
      prompt: 'Tìm sinh viên đã học với **ít nhất 3 giảng viên khác nhau**; giảng viên phải dạy **đúng section và học kỳ** SV học. Kết quả: `ID, name, instructor_count`.',
      hint: 'Join takes với teaches trên cả 4 cột course_id, sec_id, semester, year.',
      solution: `SELECT s.ID, s.name, COUNT(DISTINCT te.ID) AS instructor_count
FROM takes t
JOIN teaches te ON te.course_id = t.course_id AND te.sec_id = t.sec_id
               AND te.semester  = t.semester  AND te.year   = t.year
JOIN student s  ON s.ID = t.ID
GROUP BY s.ID, s.name
HAVING COUNT(DISTINCT te.ID) >= 3;` },
    { id: 'GK7.18', topic: 'Q18 not exists lồng', level: 3,
      en: 'Q18. Find students who have taken at least one course with prerequisites and have completed every prerequisite of every course they took. For this question, completion means a non-NULL grade other than F; prerequisite completion need not precede taking the dependent course.',
      prompt: 'Tìm sinh viên đã học **ít nhất một môn có môn tiên quyết**, và đã **hoàn thành mọi môn tiên quyết** của **mọi** môn mình học. "Hoàn thành" = có điểm khác NULL và khác `F`; không cần học môn tiên quyết trước. Kết quả: `ID, name`.',
      hint: 'EXISTS (môn có prereq) AND NOT EXISTS (một prereq của môn đã học mà không có lượt học đạt).',
      solution: `SELECT s.ID, s.name
FROM student s
WHERE EXISTS (
        SELECT 1 FROM takes t JOIN prereq p ON p.course_id = t.course_id
        WHERE t.ID = s.ID)
  AND NOT EXISTS (
        SELECT 1 FROM takes t JOIN prereq p ON p.course_id = t.course_id
        WHERE t.ID = s.ID
          AND NOT EXISTS (
                SELECT 1 FROM takes t2
                WHERE t2.ID = s.ID AND t2.course_id = p.prereq_id
                  AND t2.grade IS NOT NULL AND t2.grade <> 'F'));` },
    { id: 'GK7.19', topic: 'Q19 phép chia + tập rỗng', level: 3,
      en: 'Q19. Find instructors who taught at least one section in every distinct semester offered during 2025. Show instructor ID and name. Return no instructors if there were no sections in 2025.',
      prompt: 'Tìm giảng viên đã dạy ít nhất một section ở **mọi học kỳ có mở lớp trong năm 2025**. Nếu năm 2025 không có section nào thì **không** trả về giảng viên nào. Kết quả: `ID, name`.',
      hint: 'NOT EXISTS (các semester của 2025 EXCEPT các semester GV dạy năm 2025), cộng thêm EXISTS (section năm 2025).',
      solution: `SELECT i.ID, i.name
FROM instructor i
WHERE EXISTS (SELECT 1 FROM section WHERE year = 2025)
  AND NOT EXISTS (
        SELECT semester FROM section WHERE year = 2025
        EXCEPT
        SELECT te.semester FROM teaches te WHERE te.ID = i.ID AND te.year = 2025);` },
    { id: 'GK7.20', topic: 'Q20 quy đổi điểm + avg', level: 3,
      en: 'Q20. Find instructors whose average student grade is greater than the average across all graded enrollments. Use A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, C-=1.7, D=1.0, F=0.0; exclude NULL or unrecognized grades. Count each enrollment for every instructor teaching that section. Show instructor ID, name, and average grade.',
      prompt: 'Tìm giảng viên có **điểm trung bình của SV mình dạy** lớn hơn **trung bình chung của mọi lượt học có điểm**. Quy đổi A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, C-=1.7, D=1.0, F=0.0; bỏ điểm NULL và điểm lạ. Một lượt học tính cho **mọi** giảng viên dạy section đó. Kết quả: `ID, name, avg_grade` (không làm tròn).',
      hint: 'Bảng quy đổi bằng WITH gp(grade, points) AS (VALUES (...)); inner join với takes tự bỏ NULL và điểm lạ.',
      solution: `WITH gp(grade, points) AS (
  VALUES ('A', 4.0), ('A-', 3.7), ('B+', 3.3), ('B', 3.0), ('B-', 2.7),
         ('C+', 2.3), ('C', 2.0), ('C-', 1.7), ('D', 1.0), ('F', 0.0)
),
enr AS (
  SELECT t.course_id, t.sec_id, t.semester, t.year, gp.points
  FROM takes t
  JOIN gp ON gp.grade = t.grade
)
SELECT i.ID, i.name, AVG(e.points) AS avg_grade
FROM enr e
JOIN teaches te  ON te.course_id = e.course_id AND te.sec_id = e.sec_id
                AND te.semester  = e.semester  AND te.year   = e.year
JOIN instructor i ON i.ID = te.ID
GROUP BY i.ID, i.name
HAVING AVG(e.points) > (SELECT AVG(points) FROM enr);` },
  ],
};
