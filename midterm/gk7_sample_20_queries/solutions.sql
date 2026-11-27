-- =====================================================================
-- CS4420 · Đề mẫu · 20 truy vấn — Đề mẫu — 20 truy vấn trên University database (University Database: 20 SQL Query Exercises)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex GK7.01  [Q1 where]  ★☆☆
-- Đề gốc: Q1. Find the IDs and names of all students belonging to the Comp. Sci. department.
--
-- Cho ID và tên của mọi sinh viên thuộc khoa Comp. Sci. Kết quả: `ID, name`.
SELECT ID, name
FROM student
WHERE dept_name = 'Comp. Sci.';

-- @ex GK7.02  [Q2 where >=]  ★☆☆
-- Đề gốc: Q2. List the course IDs, titles, and credits of all courses worth at least 3 credits.
--
-- Liệt kê các môn có ít nhất 3 tín chỉ. Kết quả: `course_id, title, credits`.
SELECT course_id, title, credits
FROM course
WHERE credits >= 3;

-- @ex GK7.03  [Q3 where]  ★☆☆
-- Đề gốc: Q3. List the titles of all courses offered by the Physics department.
--
-- Liệt kê tên (`title`) của mọi môn do khoa Physics mở.
SELECT title
FROM course
WHERE dept_name = 'Physics';

-- @ex GK7.04  [Q4 join]  ★☆☆
-- Đề gốc: Q4. Display each student's ID, name, department name, and the building of that department.
--
-- Với mỗi sinh viên, cho ID, tên, khoa và toà nhà (`building`) của khoa đó. Kết quả: `ID, name, dept_name, building`.
SELECT s.ID, s.name, s.dept_name, d.building
FROM student s
JOIN department d ON d.dept_name = s.dept_name;

-- @ex GK7.05  [Q5 join + distinct]  ★☆☆
-- Đề gốc: Q5. Find the distinct titles of all courses taken by the student with ID 12345, regardless of semester.
--
-- Tên các môn (không trùng) mà sinh viên 12345 đã học, không kể học kỳ nào. Kết quả: `title`.
-- Gợi ý: takes chỉ có course_id; tên môn nằm trong course.
SELECT DISTINCT c.title
FROM takes t
JOIN course c ON c.course_id = t.course_id
WHERE t.ID = '12345';

-- @ex GK7.06  [Q6 join + filter]  ★★☆
-- Đề gốc: Q6. List the IDs and names of students who took CS-101 in Fall 2025.
--
-- ID và tên các sinh viên học CS-101 ở Fall 2025 (mỗi SV một dòng). Kết quả: `ID, name`.
SELECT DISTINCT s.ID, s.name
FROM student s
JOIN takes t ON t.ID = s.ID
WHERE t.course_id = 'CS-101' AND t.semester = 'Fall' AND t.year = 2025;

-- @ex GK7.07  [Q7 3-table join]  ★★☆
-- Đề gốc: Q7. Find instructors who have taught courses offered by a department other than their own. Show instructor name, instructor department, and course title.
--
-- Tìm giảng viên đã dạy môn của khoa khác khoa mình. Kết quả: `name` (giảng viên), `dept_name` (khoa của giảng viên), `title` (tên môn) — mỗi bộ ba một dòng.
-- Gợi ý: So sánh instructor.dept_name với course.dept_name.
SELECT DISTINCT i.name, i.dept_name, c.title
FROM instructor i
JOIN teaches te ON te.ID = i.ID
JOIN course c   ON c.course_id = te.course_id
WHERE c.dept_name <> i.dept_name;

-- @ex GK7.08  [Q8 join + distinct]  ★☆☆
-- Đề gốc: Q8. Find the distinct titles of courses taught by instructor 10101.
--
-- Tên các môn (không trùng) do giảng viên 10101 dạy. Kết quả: `title`.
SELECT DISTINCT c.title
FROM teaches te
JOIN course c ON c.course_id = te.course_id
WHERE te.ID = '10101';

-- @ex GK7.09  [Q9 join, so sánh cột]  ★★☆
-- Đề gốc: Q9. Find the IDs and names of students who have taken at least one course outside their own department.
--
-- ID và tên các sinh viên đã học ít nhất một môn ngoài khoa của mình (mỗi SV một dòng). Kết quả: `ID, name`.
SELECT DISTINCT s.ID, s.name
FROM student s
JOIN takes t  ON t.ID = s.ID
JOIN course c ON c.course_id = t.course_id
WHERE c.dept_name <> s.dept_name;

-- @ex GK7.10  [Q10 not exists]  ★★☆
-- Đề gốc: Q10. Find the IDs and names of students who have never taken any course.
--
-- ID và tên các sinh viên chưa từng học môn nào. Kết quả: `ID, name`.
-- Gợi ý: NOT EXISTS, hoặc LEFT JOIN takes rồi lọc takes.ID IS NULL.
SELECT s.ID, s.name
FROM student s
WHERE NOT EXISTS (SELECT 1 FROM takes t WHERE t.ID = s.ID);

-- @ex GK7.11  [Q11 not exists]  ★★☆
-- Đề gốc: Q11. Find the IDs and titles of courses that have never been taken by any student.
--
-- Mã và tên các môn chưa từng có sinh viên nào học. Kết quả: `course_id, title`.
SELECT c.course_id, c.title
FROM course c
WHERE NOT EXISTS (SELECT 1 FROM takes t WHERE t.course_id = c.course_id);

-- @ex GK7.12  [Q12 phép chia]  ★★★
-- Đề gốc: Q12. Find the IDs and names of students who have taken every course offered by the Comp. Sci. department, regardless of semester.
--
-- ID và tên các sinh viên đã học mọi môn của khoa Comp. Sci. (học kỳ nào cũng được). Kết quả: `ID, name`.
-- Gợi ý: NOT EXISTS (các môn của Comp. Sci. EXCEPT các môn SV đã học).
SELECT s.ID, s.name
FROM student s
WHERE NOT EXISTS (
  SELECT course_id FROM course WHERE dept_name = 'Comp. Sci.'
  EXCEPT
  SELECT t.course_id FROM takes t WHERE t.ID = s.ID
);

-- @ex GK7.13  [Q13 not exists, khoá 4 cột]  ★★☆
-- Đề gốc: Q13. Find all course sections that have no assigned instructor. Show course ID, section ID, semester, and year.
--
-- Tìm các section chưa được phân công giảng viên. Kết quả: `course_id, sec_id, semester, year`.
-- Gợi ý: Một section được xác định bởi cả 4 cột; teaches phải khớp cả 4.
SELECT se.course_id, se.sec_id, se.semester, se.year
FROM section se
WHERE NOT EXISTS (
  SELECT 1 FROM teaches te
  WHERE te.course_id = se.course_id AND te.sec_id = se.sec_id
    AND te.semester  = se.semester  AND te.year   = se.year
);

-- @ex GK7.14  [Q14 so với trung bình]  ★★★
-- Đề gốc: Q14. Find students whose number of distinct courses taken exceeds the average number of distinct courses taken per student. Include students with zero courses when calculating the average. Show ID, name, and course count.
--
-- Tìm sinh viên có số môn khác nhau đã học lớn hơn trung bình số môn khác nhau của mỗi sinh viên (trung bình tính cả SV chưa học môn nào). Kết quả: `ID, name, course_count`.
-- Gợi ý: WITH cnt AS (student LEFT JOIN takes, COUNT(DISTINCT t.course_id)), rồi so với (SELECT AVG(...) FROM cnt).
WITH cnt AS (
  SELECT s.ID, s.name, COUNT(DISTINCT t.course_id) AS course_count
  FROM student s
  LEFT JOIN takes t ON t.ID = s.ID
  GROUP BY s.ID, s.name
)
SELECT ID, name, course_count
FROM cnt
WHERE course_count > (SELECT AVG(course_count) FROM cnt);

-- @ex GK7.15  [Q15 đếm cặp phân biệt]  ★★★
-- Đề gốc: Q15. Find students who took the same course in more than one distinct semester-year combination. Show student ID, name, course ID, and number of distinct terms.
--
-- Tìm sinh viên học cùng một môn ở nhiều hơn một cặp (học kỳ, năm) khác nhau. Kết quả: `ID, name, course_id, term_count`.
-- Gợi ý: Lấy DISTINCT (ID, course_id, semester, year) trước rồi mới đếm.
SELECT s.ID, s.name, x.course_id, COUNT(*) AS term_count
FROM (SELECT DISTINCT ID, course_id, semester, year FROM takes) x
JOIN student s ON s.ID = x.ID
GROUP BY s.ID, s.name, x.course_id
HAVING COUNT(*) > 1;

-- @ex GK7.16  [Q16 max kể cả hoà]  ★★★
-- Đề gốc: Q16. Find the department(s) with the highest total instructor salary expenditure, including ties and departments with no instructors.
--
-- Tìm (các) khoa có tổng lương giảng viên cao nhất, giữ cả trường hợp hoà, và tính cả khoa không có giảng viên (tổng = 0). Kết quả: `dept_name, total_salary`.
-- Gợi ý: department LEFT JOIN instructor, COALESCE(SUM(salary), 0); rồi = (SELECT MAX(...)).
WITH tot AS (
  SELECT d.dept_name, COALESCE(SUM(i.salary), 0) AS total_salary
  FROM department d
  LEFT JOIN instructor i ON i.dept_name = d.dept_name
  GROUP BY d.dept_name
)
SELECT dept_name, total_salary
FROM tot
WHERE total_salary = (SELECT MAX(total_salary) FROM tot);

-- @ex GK7.17  [Q17 join takes–teaches]  ★★★
-- Đề gốc: Q17. Find students who took courses taught by at least three distinct instructors. Match instructors to the exact course section and academic term. Show student ID, name, and instructor count.
--
-- Tìm sinh viên đã học với ít nhất 3 giảng viên khác nhau; giảng viên phải dạy đúng section và học kỳ SV học. Kết quả: `ID, name, instructor_count`.
-- Gợi ý: Join takes với teaches trên cả 4 cột course_id, sec_id, semester, year.
SELECT s.ID, s.name, COUNT(DISTINCT te.ID) AS instructor_count
FROM takes t
JOIN teaches te ON te.course_id = t.course_id AND te.sec_id = t.sec_id
               AND te.semester  = t.semester  AND te.year   = t.year
JOIN student s  ON s.ID = t.ID
GROUP BY s.ID, s.name
HAVING COUNT(DISTINCT te.ID) >= 3;

-- @ex GK7.18  [Q18 not exists lồng]  ★★★
-- Đề gốc: Q18. Find students who have taken at least one course with prerequisites and have completed every prerequisite of every course they took. For this question, completion means a non-NULL grade other than F; prerequisite completion need not precede taking the dependent course.
--
-- Tìm sinh viên đã học ít nhất một môn có môn tiên quyết, và đã hoàn thành mọi môn tiên quyết của mọi môn mình học. "Hoàn thành" = có điểm khác NULL và khác `F`; không cần học môn tiên quyết trước. Kết quả: `ID, name`.
-- Gợi ý: EXISTS (môn có prereq) AND NOT EXISTS (một prereq của môn đã học mà không có lượt học đạt).
SELECT s.ID, s.name
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
                  AND t2.grade IS NOT NULL AND t2.grade <> 'F'));

-- @ex GK7.19  [Q19 phép chia + tập rỗng]  ★★★
-- Đề gốc: Q19. Find instructors who taught at least one section in every distinct semester offered during 2025. Show instructor ID and name. Return no instructors if there were no sections in 2025.
--
-- Tìm giảng viên đã dạy ít nhất một section ở mọi học kỳ có mở lớp trong năm 2025. Nếu năm 2025 không có section nào thì không trả về giảng viên nào. Kết quả: `ID, name`.
-- Gợi ý: NOT EXISTS (các semester của 2025 EXCEPT các semester GV dạy năm 2025), cộng thêm EXISTS (section năm 2025).
SELECT i.ID, i.name
FROM instructor i
WHERE EXISTS (SELECT 1 FROM section WHERE year = 2025)
  AND NOT EXISTS (
        SELECT semester FROM section WHERE year = 2025
        EXCEPT
        SELECT te.semester FROM teaches te WHERE te.ID = i.ID AND te.year = 2025);

-- @ex GK7.20  [Q20 quy đổi điểm + avg]  ★★★
-- Đề gốc: Q20. Find instructors whose average student grade is greater than the average across all graded enrollments. Use A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, C-=1.7, D=1.0, F=0.0; exclude NULL or unrecognized grades. Count each enrollment for every instructor teaching that section. Show instructor ID, name, and average grade.
--
-- Tìm giảng viên có điểm trung bình của SV mình dạy lớn hơn trung bình chung của mọi lượt học có điểm. Quy đổi A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, C-=1.7, D=1.0, F=0.0; bỏ điểm NULL và điểm lạ. Một lượt học tính cho mọi giảng viên dạy section đó. Kết quả: `ID, name, avg_grade` (không làm tròn).
-- Gợi ý: Bảng quy đổi bằng WITH gp(grade, points) AS (VALUES (...)); inner join với takes tự bỏ NULL và điểm lạ.
WITH gp(grade, points) AS (
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
HAVING AVG(e.points) > (SELECT AVG(points) FROM enr);
