# Đề GK · Biến tấu — Đề thi giữa kỳ — Biến tấu từ bài tập của bạn

*Midterm Exam — Variants of the Original Exercises · Biến thể của Question 1–19 và Exercise 3.1–3.13 (4 file .docx)*

> **Cách học:** *Tự luận lý thuyết* → *Bài tập SQL* → *Ghi nhớ nhanh*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk6`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tự luận lý thuyết (8 câu)

**Câu 1.** 

> Consider SELECT p.a1 FROM p, r1, r2 WHERE p.a1 = r1.a1 AND p.a1 = r2.a1. What does it return when r1 or r2 is empty? Is the result what you would expect for "values in both r1 and r2"? (Variant of Exercise 3.7)

**B1 ← 3.7** — Đổi OR thành **AND**: `select p.a1 from p, r1, r2 where p.a1 = r1.a1 and p.a1 = r2.a1`. Truy vấn trả gì khi r1 hoặc r2 rỗng? Có trùng lặp không? Viết lại bằng `INTERSECT`.

<details><summary>Gợi ý đáp án</summary>

Tích Descartes p × r1 × r2: nếu r1 **hoặc** r2 rỗng thì kết quả **rỗng**. Với phép "có trong cả hai", kết quả rỗng lại **đúng** (giao với tập rỗng là rỗng) — khác với trường hợp OR ở 3.7, nơi rỗng làm mất giá trị hợp lệ.
Nhưng kết quả có thể **lặp** dòng: một giá trị a1 xuất hiện k₁ lần trong r1 và k₂ lần trong r2 sẽ được trả k₁·k₂ lần (nhân thêm số lần trong p). Bản gọn, không lặp:
```sql
SELECT a1 FROM p INTERSECT SELECT a1 FROM r1 INTERSECT SELECT a1 FROM r2;
```
(INTERSECT mặc định loại trùng.)

</details>

**Câu 2.** 

> Consider the query SELECT AVG(points), COUNT(*), COUNT(takes.grade) FROM takes LEFT JOIN grade_points ON takes.grade = grade_points.grade. Explain how NULL grades affect each of the aggregates. (Variant of Exercise 3.2d)

**B2 ← 3.2d** — Dữ liệu có 22 dòng takes, **1 dòng** grade NULL (98988, BIO-301). Với `takes left join grade_points`, hãy cho biết `count(*)`, `count(takes.grade)`, `count(grade_points.points)` lần lượt bằng bao nhiêu và `avg(points)` có tính dòng NULL không? Vì sao?

<details><summary>Gợi ý đáp án</summary>

Left join giữ cả 22 dòng takes; dòng grade NULL không khớp grade_points nên các cột của grade_points là NULL.
- `count(*)` = **22** (đếm dòng, kể cả NULL).
- `count(takes.grade)` = **21** (bỏ NULL).
- `count(grade_points.points)` = **21**.
- `avg(points)` **bỏ qua** NULL → chia cho 21 chứ không phải 22; "GPA" không bị kéo xuống bởi môn chưa có điểm.
Tổng quát: aggregate (trừ `count(*)`) bỏ qua NULL; nếu mọi giá trị đều NULL thì `sum/avg/min/max` = NULL còn `count` = 0.

</details>

**Câu 3.** 

> Given t(x) = {1, 2} and s(y) = {1, NULL}: what does SELECT x FROM t WHERE x NOT IN (SELECT y FROM s) return? Rewrite it with NOT EXISTS so it means "x does not occur in s". (Variant of Exercise 3.9c)

**B3 ← 3.9c** — Bảng t(x) = {1, 2} và s(y) = {1, NULL}. (a) `select x from t where x not in (select y from s)` trả gì? (b) Viết lại bằng `not exists` để cho kết quả đúng ý "x không có trong s".

<details><summary>Gợi ý đáp án</summary>

(a) `2 NOT IN (1, NULL)` = `2<>1 AND 2<>NULL` = true AND **unknown** = **unknown** → dòng bị loại. Kết quả **rỗng** (x=1 bị loại vì 1 ∈ s, x=2 vì unknown).
(b)
```sql
SELECT x FROM t WHERE NOT EXISTS (SELECT 1 FROM s WHERE s.y = t.x);   -- trả 2
```
NOT EXISTS không bị NULL làm hỏng: `s.y = t.x` unknown chỉ làm dòng đó không thoả trong subquery, nên NOT EXISTS vẫn true.

</details>

**Câu 4.** 

> Compare three declarations of the foreign key section.course_id → course: default (restrict), ON DELETE CASCADE, ON DELETE SET NULL. What happens when a course with sections is deleted? Can SET NULL be used when course_id is part of the primary key of section? (Variant of Exercise 3.12e)

**B4 ← 3.12e** — So sánh 3 cách khai báo FK `section.course_id → course`: (1) mặc định (restrict), (2) `on delete cascade`, (3) `on delete set null`. Khi xoá course CS-101 (đã có section + takes) mỗi cách cho kết quả gì? Cách (3) có dùng được nếu `course_id` là một phần của primary key section không?

<details><summary>Gợi ý đáp án</summary>

1. **Restrict/no action:** DELETE bị từ chối (lỗi vi phạm FK), không có gì bị xoá.
2. **Cascade:** xoá course → xoá mọi section của nó → (nếu takes → section cũng cascade) xoá mọi dòng takes liên quan. Cả dây chuyền trong một transaction.
3. **Set null:** các section giữ lại nhưng `course_id` = NULL.

**Cách (3) không dùng được** khi `course_id` thuộc primary key của section (thuộc tính khoá không được NULL) → phải chọn cascade hoặc restrict. SET NULL chỉ hợp với cột cho phép NULL (ví dụ `advisor.i_ID`).

</details>

**Câu 5.** 

> What does SELECT name FROM instructor WHERE salary > ALL (SELECT salary FROM instructor WHERE dept_name = 'Astronomy') return, given that no department Astronomy exists? What if SOME is used instead of ALL? (Variant of Question 13)

**B5 ← Q13** — `salary > all (select salary ... where dept_name = 'Astronomy')` và bản `> some` trả về gì khi subquery rỗng? Giải thích bằng logic.

<details><summary>Gợi ý đáp án</summary>

Khoa Astronomy không tồn tại → subquery rỗng.
- `> ALL (∅)` là **true** cho mọi dòng ("với mọi phần tử của tập rỗng" luôn đúng) → trả **tất cả 12 giảng viên**.
- `> SOME (∅)` là **false** ("tồn tại phần tử" của tập rỗng sai) → **rỗng**.
Cẩn thận khi câu hỏi "lương cao hơn mọi giảng viên khoa X" mà X không có ai: kết quả là tất cả.

</details>

**Câu 6.** 

> For takes with 22 rows, one with a NULL grade, what are the values of (a) SELECT COUNT(*) FROM takes WHERE grade <> 'A' and (b) the same query with OR grade IS NULL? (Variant of Question 16)

**B6 ← Q16** — Với dữ liệu mẫu, `count(*) ... where grade <> 'A'` và `... where grade <> 'A' or grade is null` khác nhau thế nào? Tính ra con số.

<details><summary>Gợi ý đáp án</summary>

Có 22 dòng takes; grade = 'A' ở **7** dòng (00128 CS-101; 12345 CS-190/2, CS-315, CS-347; 76543 CS-101, CS-319/2; 98988 BIO-101); 1 dòng NULL; còn lại 14 dòng có grade khác A.
- (a) `grade <> 'A'` loại dòng NULL (unknown) → **14**.
- (b) thêm `OR grade IS NULL` → **15**.
Bài học: `<>` không bao giờ chọn NULL; muốn "không phải A kể cả chưa có điểm" phải viết tường minh.

</details>

**Câu 7.** 

> For each instructor, find the number of sections taught (0 if none). Why does COUNT(*) give a wrong answer with a LEFT OUTER JOIN? Is there an alternative to the outer join? (Variant of Exercise 3.1e)

**B7 ← 3.1e** — Với bài "mỗi giảng viên dạy bao nhiêu section (0 nếu chưa dạy)": vì sao `count(*)` sai, `count(teaches.course_id)` đúng? Có cách nào khác ngoài outer join?

<details><summary>Gợi ý đáp án</summary>

Left join tạo một dòng "NULL-padded" cho giảng viên chưa dạy; `COUNT(*)` đếm dòng đó thành **1**, còn `COUNT(teaches.course_id)` bỏ qua NULL → **0**.
Cách khác: scalar subquery trong SELECT:
```sql
SELECT ID, name, (SELECT COUNT(*) FROM teaches t WHERE t.ID = i.ID) AS n FROM instructor i;
```

</details>

**Câu 8.** 

> Give two different ways to find every instructor who earns the maximum salary of his or her own department, and explain which handles ties. (Variant of Exercises 3.1d and 3.11c)

**B8 ← 3.1d, 3.11c** — Tìm giảng viên có lương cao nhất **trong khoa của mình**: viết bằng (a) correlated subquery, (b) join với bảng max theo khoa. Cách nào xử lý hoà?

<details><summary>Gợi ý đáp án</summary>

```sql
-- (a)
SELECT * FROM instructor i
WHERE salary = (SELECT MAX(salary) FROM instructor WHERE dept_name = i.dept_name);
-- (b)
SELECT i.* FROM instructor i
JOIN (SELECT dept_name, MAX(salary) AS m FROM instructor GROUP BY dept_name) d
  ON i.dept_name = d.dept_name AND i.salary = d.m;
```
Cả hai so bằng (`=`) nên **trả cả những người hoà** lương cao nhất. Dùng `LIMIT 1` mới làm mất người hoà.

</details>

## 2. Bài tập SQL (42 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK6.01 | Q4 ← raise + filter | ★☆☆ | ← Question 4. Show ID, name and the salary after a 10% raise, only for the instructors whose raised salary would exceed 80000. |
| GK6.02 | Q7 ← not in | ★☆☆ | ← Question 7. Get the name and department of the instructors who are not in Physics or History. |
| GK6.03 | Q8 ← not between | ★☆☆ | ← Question 8. Get the names and salaries of the instructors whose salary is not between 60000 and 90000. |
| GK6.04 | Q10 ← join on syntax | ★★☆ | ← Question 10. Re-write it with explicit `JOIN ... ON`: name and course ID taught by instructors of the Comp. Sci. department, for sections taught in Spring only. |
| GK6.05 | Q11 ← filter grade | ★★☆ | ← Question 11. Show each student's name with the title of every course in which they got A or A-, ordered by student name then title. |
| GK6.06 | Q13 ← > all | ★★☆ | ← Question 13. Get the names of the instructors whose salary is greater than that of every Finance instructor. |
| GK6.07 | Q14 ← like variants | ★☆☆ | ← Question 14. Get the titles of courses that start with 'Intro' or end with 'Systems'. |
| GK6.08 | Q15 ← order by 3 keys | ★☆☆ | ← Question 15. List ID, name, dept_name, salary of the instructors by department ascending, then salary descending, then name ascending. |
| GK6.09 | Q16 ← not null | ★☆☆ | ← Question 16. Find the enrollments that do have a grade and whose grade is neither 'A' nor 'A-'. Output ID, course_id, grade. |
| GK6.10 | Q17 ← group having | ★★☆ | ← Question 17/18. For every department that has at least 2 instructors, show dept_name, number of instructors, minimum, maximum and average salary. |
| GK6.11 | Q18 ← having avg | ★★☆ | ← Question 18. Show dept_name and average salary only for the departments whose average salary is greater than 70000. |
| GK6.12 | Q19 ← left join count | ★★☆ | ← Question 19 / 3.1e. For every instructor, show ID, name and the number of sections taught (0 if none) as `num_sections`. |
| GK6.13 | 3.1a ← not in dept | ★☆☆ | ← Exercise 3.1a. Find the titles of courses with 4 credits that do not belong to the Comp. Sci. department. |
| GK6.14 | 3.1b ← other instructor | ★★☆ | ← Exercise 3.1b. Find the IDs of all students who were taught by an instructor named Srinivasan (no duplicates). |
| GK6.15 | 3.1d ← second highest | ★★★ | ← Exercise 3.1c/d. Find all instructors who earn the second highest salary (ties included). |
| GK6.16 | 3.1e ← enrollment incl. 0 | ★★★ | ← Exercise 3.1e. Find the enrollment of each section offered in Spring 2017, including sections with no student (enrollment 0). Output course_id, sec_id, enrollment. |
| GK6.17 | 3.1g ← max over all terms | ★★★ | ← Exercise 3.1g. Find the section(s) with the maximum enrollment over all semesters and years. Output course_id, sec_id, semester, year. |
| GK6.18 | 3.2 ← passed credits | ★★★ | ← Exercise 3.2. For every student (including those with no course) output ID and `passed_credits`: total credits of courses where the grade is not null and not F (0 if none). |
| GK6.19 | 3.3a ← update case | ★★★ | ← Exercise 3.3a. In one UPDATE: Comp. Sci. instructors earning less than 70000 get a 15% raise, the other Comp. Sci. instructors get 5%. |
| GK6.20 | 3.3b ← delete idle instructors | ★★☆ | ← Exercise 3.3b. Delete all instructors who have never taught a section (do not occur in teaches). |
| GK6.21 | 3.3c ← insert not exists | ★★★ | ← Exercise 3.3c. Enroll every Physics student in PHY-101, section 1, Fall 2017 with a NULL grade, skipping students already enrolled in it. |
| GK6.22 | 3.4a ← accidents per car | ★★☆ | ← Exercise 3.4a. (Insurance) For every car show license_plate, model and the number of accidents it participated in (0 if none) as `num_accidents`. |
| GK6.23 | 3.4b ← delete FK order | ★★★ | ← Exercise 3.4b. Delete every 2017 accident whose total damage_amount is at most 1000. Remember the foreign key from participated. |
| GK6.24 | 3.4 ← owner total damage | ★★☆ | ← Exercise 3.4. For each person who owns a car that took part in an accident, show the person's name and the total damage_amount of those participations as `total_damage`. |
| GK6.25 | 3.5 ← new scale + count | ★★☆ | ← Exercise 3.5. With a new scale (A if score >= 90, B if >= 80, C if >= 70, D if >= 60, otherwise F) output grade and number of students per grade. |
| GK6.26 | 3.6 ← lower like | ★☆☆ | ← Exercise 3.6. Find the titles of courses that contain "comput" regardless of case. |
| GK6.27 | 3.8a ← loan but no account | ★☆☆ | ← Exercise 3.8a. (Bank) Find the ID of each customer who has a loan but not an account. |
| GK6.28 | 3.8b ← same city diff street | ★★☆ | ← Exercise 3.8b. Find the ID of each customer who lives in the same city as customer '12345' but on a different street. |
| GK6.29 | 3.8c ← both loan & account branch | ★★☆ | ← Exercise 3.8c. Find the name of each branch that has both at least one loan and at least one account. |
| GK6.30 | 3.9a ← miami companies | ★★☆ | ← Exercise 3.9a. (Employee) Find the ID and name of every employee who works for a company that is located in Miami. |
| GK6.31 | 3.9d ← > all (Mega) | ★★☆ | ← Exercise 3.9d. Find the ID of each employee who earns more than every employee of "Mega Corp". |
| GK6.32 | 3.9e ← division BigBank | ★★★ | ← Exercise 3.9e. Find the name of each company that is located in every city in which "BigBank" is located (BigBank itself included). |
| GK6.33 | 3.9f ← fewest employees | ★★★ | ← Exercise 3.9f. Find the name of the company that has the fewest employees (all of them in case of a tie). |
| GK6.34 | 3.9g ← below overall avg | ★★☆ | ← Exercise 3.9g. Find the name of each company whose average salary is lower than the average salary of all employees. |
| GK6.35 | 3.10a ← update two cond | ★☆☆ | ← Exercise 3.10a. Employees of "Small Bank Corporation" who live in Miami now live in "Orlando". |
| GK6.36 | 3.10b ← manager raise case | ★★★ | ← Exercise 3.10b. Give each manager of "Mega Corp" an 8 percent raise unless the new salary would exceed 60000; in such cases give only 2 percent. (One UPDATE.) |
| GK6.37 | 3.11a ← division 4-credit CS | ★★★ | ← Exercise 3.11a. Find the ID and name of each student who has taken every Comp. Sci. course with 4 credits. |
| GK6.38 | 3.11b ← only 2018 | ★★☆ | ← Exercise 3.11b. Find the ID and name of each student who has not taken any course offered before 2018. |
| GK6.39 | 3.11d ← dept with min of max | ★★★ | ← Exercise 3.11d. Find the department(s) whose maximum instructor salary is the lowest among all departments. Output dept_name and that salary. |
| GK6.40 | 3.12a-c ← chain | ★★★ | ← Exercise 3.12a–c. In one script: create course "CS-002" titled "Lab Seminar" (Comp. Sci., 1 credit); create its section 1 in Spring 2019 with no location; enroll every student with tot_cred < 50 (any department) in it. |
| GK6.41 | 3.12f ← intro delete | ★★★ | ← Exercise 3.12f. Delete all takes tuples of any section of any course with the word "intro" as part of the title, ignoring case. |
| GK6.42 | 3.13 ← DDL library | ★★★ | ← Exercise 3.13. Write DDL for a small library: `lib_book(isbn varchar(13) PK, title varchar(100) not null, year int)`, `lib_member(member_id int PK, name varchar(50) not null, email varchar(80) unique)`, `lib_loan(member_id, isbn, loan_date date, return_date date; PK (member_id, isbn, loan_date); FK member_id → lib_member on delete cascade; FK isbn → lib_book)`. |

## 3. Ghi nhớ nhanh

### 1. Cách dùng
Mỗi bài ở đây là **biến thể** của một bài nguyên bản (ghi rõ "← Q.. / 3.x" trong đề): đổi điều kiện, đổi lược đồ, thêm bẫy NULL, nhóm rỗng, hoà (ties), thứ tự xoá theo foreign key. Làm sau khi đã làm được bài gốc ở **GK Nguyên bản**.

### 2. Đề thi thử trọn bộ (90 phút) — gợi ý chọn bài
| Phần | Chọn | Điểm |
|---|---|---|
| **A. Tự luận (35')** | B1, B2, B4, B6 (bốn câu bất kỳ trong 8 câu) | 4,0 |
| **B. SQL (55')** | GK6.03, .06, .10, .12, .16, .19, .22, .25, .28, .32, .36, .40 | 6,0 |

### 3. Quy tắc biến tấu thường gặp (để tự dự đoán đề thật)
1. **Đổi hằng số/điều kiện** (khoa, năm, ngưỡng lương) — chỉ sửa WHERE.
2. **Đổi `SOME` ↔ `ALL`, `MAX` ↔ `MIN`**, `IN` ↔ `NOT IN`, `>` ↔ `>=`.
3. **Thêm nhóm 0 phần tử** (giảng viên chưa dạy gì, section chưa ai học) → outer join.
4. **Hoà (ties)** → `= (select max ..)` hoặc `>= ALL` thay vì `LIMIT 1`.
5. **Đổi lược đồ**: cùng dạng câu hỏi nhưng trên bank / employee / insurance.
6. **Thêm ràng buộc**: xoá/chèn đúng thứ tự vì foreign key.
7. **Thêm NULL**: `= NULL`, `NOT IN` với NULL, `COUNT(*)` vs `COUNT(col)`.
