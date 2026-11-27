# Đề mẫu · 20 truy vấn — Đề mẫu — 20 truy vấn trên University database

*University Database: 20 SQL Query Exercises · University_Database_20_SQL_Queries.pdf*

> **Cách học:** *Tự luận lý thuyết* → *Bài tập SQL* → *Ghi nhớ nhanh*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk7`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tự luận lý thuyết (4 câu)

**Câu 1.** **Q10** — Viết Q10 ("SV chưa học môn nào") bằng `NOT IN`, `NOT EXISTS` và `LEFT JOIN`. Cách nào có thể sai khi cột so sánh có NULL?

<details><summary>Gợi ý đáp án</summary>

```sql
-- NOT IN
SELECT ID, name FROM student WHERE ID NOT IN (SELECT ID FROM takes);
-- NOT EXISTS
SELECT s.ID, s.name FROM student s WHERE NOT EXISTS (SELECT 1 FROM takes t WHERE t.ID = s.ID);
-- LEFT JOIN
SELECT s.ID, s.name FROM student s LEFT JOIN takes t ON t.ID = s.ID WHERE t.ID IS NULL;
```
`NOT IN` sai khi subquery trả về một giá trị NULL: `x NOT IN (…, NULL)` là *unknown* với mọi x → không trả dòng nào. Ở đây `takes.ID` là một phần primary key nên không NULL, cả ba cách cho cùng kết quả; nhưng `NOT EXISTS` an toàn trong mọi trường hợp.

</details>

**Câu 2.** **Q12** — Giải thích vì sao `NOT EXISTS (A EXCEPT B)` biểu diễn được "đã học **mọi** môn của Comp. Sci.". Nếu khoa Comp. Sci. không có môn nào thì kết quả là gì?

<details><summary>Gợi ý đáp án</summary>

Với mỗi SV: A = tập môn của Comp. Sci., B = tập môn SV đã học. `A EXCEPT B` là các môn của khoa mà SV **chưa** học. Tập đó rỗng ⇔ A ⊆ B ⇔ SV đã học mọi môn của khoa — đó là phép chia (÷) của đại số quan hệ.

Nếu khoa không có môn nào thì A rỗng → `A EXCEPT B` rỗng với mọi SV → **mọi** SV được chọn (đúng theo logic "với mọi phần tử của tập rỗng"). Muốn tránh thì thêm `EXISTS (select 1 from course where dept_name = 'Comp. Sci.')`, giống cách Q19 xử lý năm không có section.

</details>

**Câu 3.** **Q14** — Vì sao trung bình phải tính trên `student LEFT JOIN takes` chứ không phải trên `takes`? Với dữ liệu của đề, hai cách cho trung bình bao nhiêu?

<details><summary>Gợi ý đáp án</summary>

`GROUP BY` trên `takes` chỉ có những SV đã học ít nhất một môn, nên SV 0 môn (Snow) không góp vào mẫu số → trung bình bị đẩy lên. Đề yêu cầu tính cả SV 0 môn, nên phải bắt đầu từ `student` và `LEFT JOIN takes`, đếm `COUNT(DISTINCT t.course_id)` (SV không học môn nào được 0).

Với dữ liệu của đề: 13 SV, tổng 24 lượt môn phân biệt → trung bình ≈ **1.85** (tính cả Snow); bỏ Snow thì là 24/12 = **2**, và khi đó SV học đúng 2 môn sẽ **không** còn "vượt trung bình" nữa — kết quả chỉ còn Shankar.

</details>

**Câu 4.** **Q17 / Q20** — Join `takes` với `teaches` thế nào là "khớp đúng section và học kỳ"? Nêu một ví dụ trong dữ liệu mà join sai cho kết quả sai.

<details><summary>Gợi ý đáp án</summary>

Phải khớp **cả 4 cột** khoá của section:
```sql
takes t JOIN teaches te
  ON te.course_id = t.course_id AND te.sec_id = t.sec_id
 AND te.semester  = t.semester  AND te.year   = t.year
```
Nếu chỉ join trên `course_id`: CS-101 được dạy ở Fall 2017 (Srinivasan), Spring 2018 (Katz) và Fall 2025 (Srinivasan + Einstein). Khi đó SV học CS-101 Fall 2017 (ví dụ 00128 Zhang) sẽ bị ghép với cả Katz và Einstein dù họ không dạy lớp đó → số giảng viên ở Q17 và điểm trung bình theo giảng viên ở Q20 đều sai.

</details>

## 2. Bài tập SQL (20 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK7.01 | Q1 where | ★☆☆ | Q1. Find the IDs and names of all students belonging to the Comp. Sci. department.<br>Cho ID và tên của mọi sinh viên thuộc khoa Comp. Sci. Kết quả: `ID, name`. |
| GK7.02 | Q2 where >= | ★☆☆ | Q2. List the course IDs, titles, and credits of all courses worth at least 3 credits.<br>Liệt kê các môn có ít nhất 3 tín chỉ. Kết quả: `course_id, title, credits`. |
| GK7.03 | Q3 where | ★☆☆ | Q3. List the titles of all courses offered by the Physics department.<br>Liệt kê tên (`title`) của mọi môn do khoa Physics mở. |
| GK7.04 | Q4 join | ★☆☆ | Q4. Display each student's ID, name, department name, and the building of that department.<br>Với mỗi sinh viên, cho ID, tên, khoa và toà nhà (`building`) của khoa đó. Kết quả: `ID, name, dept_name, building`. |
| GK7.05 | Q5 join + distinct | ★☆☆ | Q5. Find the distinct titles of all courses taken by the student with ID 12345, regardless of semester.<br>Tên các môn (không trùng) mà sinh viên 12345 đã học, không kể học kỳ nào. Kết quả: `title`. |
| GK7.06 | Q6 join + filter | ★★☆ | Q6. List the IDs and names of students who took CS-101 in Fall 2025.<br>ID và tên các sinh viên học CS-101 ở Fall 2025 (mỗi SV một dòng). Kết quả: `ID, name`. |
| GK7.07 | Q7 3-table join | ★★☆ | Q7. Find instructors who have taught courses offered by a department other than their own. Show instructor name, instructor department, and course title.<br>Tìm giảng viên đã dạy môn của khoa khác khoa mình. Kết quả: `name` (giảng viên), `dept_name` (khoa của giảng viên), `title` (tên môn) — mỗi bộ ba một dòng. |
| GK7.08 | Q8 join + distinct | ★☆☆ | Q8. Find the distinct titles of courses taught by instructor 10101.<br>Tên các môn (không trùng) do giảng viên 10101 dạy. Kết quả: `title`. |
| GK7.09 | Q9 join, so sánh cột | ★★☆ | Q9. Find the IDs and names of students who have taken at least one course outside their own department.<br>ID và tên các sinh viên đã học ít nhất một môn ngoài khoa của mình (mỗi SV một dòng). Kết quả: `ID, name`. |
| GK7.10 | Q10 not exists | ★★☆ | Q10. Find the IDs and names of students who have never taken any course.<br>ID và tên các sinh viên chưa từng học môn nào. Kết quả: `ID, name`. |
| GK7.11 | Q11 not exists | ★★☆ | Q11. Find the IDs and titles of courses that have never been taken by any student.<br>Mã và tên các môn chưa từng có sinh viên nào học. Kết quả: `course_id, title`. |
| GK7.12 | Q12 phép chia | ★★★ | Q12. Find the IDs and names of students who have taken every course offered by the Comp. Sci. department, regardless of semester.<br>ID và tên các sinh viên đã học mọi môn của khoa Comp. Sci. (học kỳ nào cũng được). Kết quả: `ID, name`. |
| GK7.13 | Q13 not exists, khoá 4 cột | ★★☆ | Q13. Find all course sections that have no assigned instructor. Show course ID, section ID, semester, and year.<br>Tìm các section chưa được phân công giảng viên. Kết quả: `course_id, sec_id, semester, year`. |
| GK7.14 | Q14 so với trung bình | ★★★ | Q14. Find students whose number of distinct courses taken exceeds the average number of distinct courses taken per student. Include students with zero courses when calculating the average. Show ID, name, and course count.<br>Tìm sinh viên có số môn khác nhau đã học lớn hơn trung bình số môn khác nhau của mỗi sinh viên (trung bình tính cả SV chưa học môn nào). Kết quả: `ID, name, course_count`. |
| GK7.15 | Q15 đếm cặp phân biệt | ★★★ | Q15. Find students who took the same course in more than one distinct semester-year combination. Show student ID, name, course ID, and number of distinct terms.<br>Tìm sinh viên học cùng một môn ở nhiều hơn một cặp (học kỳ, năm) khác nhau. Kết quả: `ID, name, course_id, term_count`. |
| GK7.16 | Q16 max kể cả hoà | ★★★ | Q16. Find the department(s) with the highest total instructor salary expenditure, including ties and departments with no instructors.<br>Tìm (các) khoa có tổng lương giảng viên cao nhất, giữ cả trường hợp hoà, và tính cả khoa không có giảng viên (tổng = 0). Kết quả: `dept_name, total_salary`. |
| GK7.17 | Q17 join takes–teaches | ★★★ | Q17. Find students who took courses taught by at least three distinct instructors. Match instructors to the exact course section and academic term. Show student ID, name, and instructor count.<br>Tìm sinh viên đã học với ít nhất 3 giảng viên khác nhau; giảng viên phải dạy đúng section và học kỳ SV học. Kết quả: `ID, name, instructor_count`. |
| GK7.18 | Q18 not exists lồng | ★★★ | Q18. Find students who have taken at least one course with prerequisites and have completed every prerequisite of every course they took. For this question, completion means a non-NULL grade other than F; prerequisite completion need not precede taking the dependent course.<br>Tìm sinh viên đã học ít nhất một môn có môn tiên quyết, và đã hoàn thành mọi môn tiên quyết của mọi môn mình học. "Hoàn thành" = có điểm khác NULL và khác `F`; không cần học môn tiên quyết trước. Kết quả: `ID, name`. |
| GK7.19 | Q19 phép chia + tập rỗng | ★★★ | Q19. Find instructors who taught at least one section in every distinct semester offered during 2025. Show instructor ID and name. Return no instructors if there were no sections in 2025.<br>Tìm giảng viên đã dạy ít nhất một section ở mọi học kỳ có mở lớp trong năm 2025. Nếu năm 2025 không có section nào thì không trả về giảng viên nào. Kết quả: `ID, name`. |
| GK7.20 | Q20 quy đổi điểm + avg | ★★★ | Q20. Find instructors whose average student grade is greater than the average across all graded enrollments. Use A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, C-=1.7, D=1.0, F=0.0; exclude NULL or unrecognized grades. Count each enrollment for every instructor teaching that section. Show instructor ID, name, and average grade.<br>Tìm giảng viên có điểm trung bình của SV mình dạy lớn hơn trung bình chung của mọi lượt học có điểm. Quy đổi A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, C-=1.7, D=1.0, F=0.0; bỏ điểm NULL và điểm lạ. Một lượt học tính cho mọi giảng viên dạy section đó. Kết quả: `ID, name, avg_grade` (không làm tròn). |

## 3. Ghi nhớ nhanh

### 1. Đề này là gì
Đề mẫu gồm **20 truy vấn** trên University database của sách, chia 3 mức: cơ bản (Q1–5), trung bình (Q6–13), khó (Q14–20). Đề gốc viết cho MySQL; ở đây chạy trên PostgreSQL, nhưng mọi câu đều viết được bằng SQL chuẩn (join, `not exists`, `group by … having`, subquery, `with`).

Khi làm bài, bấm nút **Database** ở góc phải dưới để mở popup: xem cột và dữ liệu của 11 bảng, và chạy thử truy vấn bất kỳ (không làm đổi dữ liệu).

### 2. Dữ liệu năm 2025
Dữ liệu mẫu của sách chỉ có năm 2017–2018, còn đề hỏi *Fall 2025* (Q6) và *mọi học kỳ năm 2025* (Q19). Vì vậy đề này nạp thêm [`lab/db/exam_sample_2025.sql`](../../lab/db/exam_sample_2025.sql):

| Bảng | Dòng thêm |
|---|---|
| section | CS-101 Spring/Fall 2025, CS-347 Summer 2025, CS-319 Fall 2025, HIS-351 Fall 2025 (**chưa có giảng viên**) |
| teaches | 10101 dạy cả 3 học kỳ 2025; 22222 (Physics) cùng dạy CS-101 Fall 2025; 45565 dạy CS-319 Fall 2025 |
| takes | 98765 học lại CS-101; 44553 (Physics) học CS-101; 12345 học CS-319 (đủ mọi môn Comp. Sci.); 23121 có điểm `W` (ngoài thang điểm) |

### 3. Mẫu lời giải cần thuộc
| Dạng | Câu | Cách viết |
|---|---|---|
| "chưa từng / không có" | Q10, Q11, Q13 | `NOT EXISTS (select 1 … where khớp khoá)` hoặc `LEFT JOIN … WHERE phải IS NULL` |
| Phép chia "mọi …" | Q12, Q19 | `NOT EXISTS (tập cần có EXCEPT tập đã có)` |
| So với trung bình | Q14, Q20 | `WITH` tính từng nhóm, rồi `> (select avg … )` |
| Lớn nhất, kể cả hoà | Q16 | `= (select max …)` hoặc `>= ALL` |
| Đếm phân biệt theo cặp cột | Q15 | `select distinct` trong subquery rồi `count(*)` |
| Khớp đúng section | Q17, Q20 | join `takes`–`teaches` trên **cả 4 cột** `course_id, sec_id, semester, year` |

### 4. Bẫy hay gặp
- **Q5, Q7, Q8, Q9:** join làm lặp dòng (học lại, dạy nhiều section) → cần `DISTINCT`.
- **Q14:** "kể cả SV không học môn nào" → `LEFT JOIN` + `COUNT(DISTINCT t.course_id)` (đếm cột bảng phải, NULL không được đếm).
- **Q16:** khoa không có giảng viên → `LEFT JOIN` + `COALESCE(SUM(salary), 0)`.
- **Q17/Q20:** join `takes`–`teaches` chỉ trên `course_id` là sai: ghép SV với giảng viên của học kỳ khác.
- **Q18:** "hoàn thành" = `grade IS NOT NULL AND grade <> 'F'`; SV không học môn nào có tiên quyết thì **không** được chọn.
- **Q19:** năm 2025 không có section thì phép chia trả về **mọi** giảng viên (tập rỗng ⊆ mọi tập) → thêm `EXISTS (select … where year = 2025)`.
- **Q20:** bỏ điểm NULL và điểm lạ như `W` bằng **inner join** với bảng quy đổi; trung bình chung tính trên từng lượt học có điểm.
