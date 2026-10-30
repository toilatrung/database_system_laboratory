# Ôn GK · Phần 3 — Practice Exercises Chương 4 (Intermediate SQL)

*Practice Exercises — Chapter 4 · Practice Exercises 4.1–4.13 · Database System Concepts, 7th Ed.*

> **Cách học:** *Tự luận lý thuyết* → *Bài tập SQL* → *Ghi nhớ nhanh*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk3`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tự luận lý thuyết (8 câu)

**Câu 1.** 

> **Exercise 4.1.** Consider the following SQL query that seeks to find a list of titles of all courses taught in Spring 2017 along with the name of the instructor.
> 
> ```sql
> select name, title
> from instructor natural join teaches natural join section natural join course
> where semester = 'Spring' and year = 2017
> ```
> 
> What is wrong with this query?

**PE 4.1** — Truy vấn `select name, title from instructor natural join teaches natural join section natural join course where semester = 'Spring' and year = 2017` muốn liệt kê title của mọi course dạy ở Spring 2017 cùng tên instructor. Sai ở đâu?

<details><summary>Gợi ý đáp án</summary>

Cú pháp đúng nhưng **ý nghĩa sai**: `dept_name` là attribute của cả **course** và **instructor**, nên natural join ghép thêm điều kiện instructor.dept_name = course.dept_name. Kết quả chỉ còn các trường hợp giảng viên dạy môn **thuộc khoa của mình**. Sửa: `instructor natural join teaches natural join section join course using (course_id)` (bài GK3.01).

</details>

**Câu 2.** 

> **Exercise 4.4.** Suppose we have three relations r(A, B), s(B, C), and t(B, D), with all attributes declared as **not null**.
> 
> a. Give instances of relations r, s, and t such that in the result of
> 
> (r **natural left outer join** s) **natural left outer join** t
> 
> attribute C has a null value but attribute D has a non-null value.
> 
> b. Are there instances of r, s, and t such that the result of
> 
> r **natural left outer join** (s **natural left outer join** t)
> 
> has a null value for C but a non-null value for D? Explain why or why not.

**PE 4.4** — r(A, B), s(B, C), t(B, D), mọi attribute not null. (a) Cho instance để trong (r natural left outer join s) natural left outer join t, C null nhưng D khác null. (b) Có instance nào để r natural left outer join (s natural left outer join t) có C null mà D khác null không?

<details><summary>Gợi ý đáp án</summary>

a. r = {(a, b)}, s = {(b1, c1)}, t = {(b, d)}. r ⟕ s = (a, b, null) vì không có s với B = b; rồi ⟕ t khớp B = b → **(a, b, null, d)**.

b. **Không.** s ⟕ t được tính trước; s không có null nên mọi dòng của nó có C khác null (D có thể null). Khi ghép r ⟕ (…): dòng r khớp thì C lấy từ s (khác null); dòng r không khớp thì **cả C lẫn D** đều null. Vậy không thể có C null mà D khác null. (Bài GK3.08.)

</details>

**Câu 3.** 

> **Exercise 4.5.** Testing SQL queries: To test if a query specified in English has been correctly written in SQL, the SQL query is typically executed on multiple test databases, and a human checks if the SQL query result on each test database matches the intention of the specification in English.
> 
> a. In Section 4.1.1 we saw an example of an erroneous SQL query which was intended to find which courses had been taught by each instructor; the query computed the natural join of *instructor*, *teaches*, and *course*, and as a result it unintentionally equated the *dept_name* attribute of *instructor* and *course*. Give an example of a dataset that would help catch this particular error.
> 
> b. When creating test databases, it is important to create tuples in referenced relations that do not have any matching tuple in the referencing relation for each foreign key. Explain why, using an example query on the university database.
> 
> c. When creating test databases, it is important to create tuples with null values for foreign-key attributes, provided the attribute is nullable (SQL allows foreign-key attributes to take on null values, as long as they are not part of the primary key and have not been declared as **not null**). Explain why, using an example query on the university database.
> 
> Hint: Use the queries from Exercise 4.2.

**PE 4.5** — Kiểm thử truy vấn SQL: (a) cho dataset bắt được lỗi natural join instructor–teaches–course của Section 4.1.1; (b) vì sao dữ liệu test cần tuple ở referenced relation không có tuple tham chiếu tới nó; (c) vì sao cần tuple có foreign key **null** (nếu cột cho phép)?

<details><summary>Gợi ý đáp án</summary>

a. Một giảng viên Physics dạy môn Elec. Eng.:
- instructor = {(12345, 'Gauss', 'Physics', 10000)}
- teaches = {(12345, 'EE321', 1, 'Spring', 2017)}
- course = {('EE321', 'Magnetism', 'Elec. Eng.', 6)}

Natural join ba bảng ra **rỗng** (dept_name khác nhau) trong khi kết quả đúng có một dòng. (Bài GK3.09.)

b. Ví dụ PE 4.2a: giảng viên **chưa dạy section nào** phải hiện số section 0. Nếu mọi instructor đều có trong teaches, câu sai dùng inner join (hoặc count(*)) vẫn cho kết quả đúng → không phát hiện được lỗi.

c. Ví dụ `select * from teaches natural join instructor`: nếu teaches.ID được phép null và có tuple như vậy thì join làm **mất** các section đó. Nếu chỉ vì teaches.ID là foreign key mà ta không tạo tuple null, lỗi này không bao giờ lộ ra khi test.

</details>

**Câu 4.** 

> **Exercise 4.8.** As discussed in Section 4.4.8, we expect the constraint “an instructor cannot teach sections in two different classrooms in a semester in the same time slot” to hold.
> 
> a. Write an SQL query that returns all (*instructor*, *section*) combinations that violate this constraint.
> 
> b. Write an SQL assertion to enforce this constraint (as discussed in Section 4.4.8, current generation database systems do not support such assertions, although they are part of the SQL standard).

**PE 4.8** — Ràng buộc: một instructor không thể dạy các section ở **hai phòng khác nhau** trong cùng semester, cùng time slot. (a) Viết truy vấn trả về các (instructor, section) vi phạm. (b) Viết assertion ép ràng buộc này.

<details><summary>Gợi ý đáp án</summary>

a. Lời giải sách:
```sql
select ID, name, sec_id, semester, year, time_slot_id, count(distinct building, room_number)
from instructor natural join teaches natural join section
group by (ID, name, sec_id, semester, year, time_slot_id)
having count(building, room_number) > 1
```
`distinct` cần thiết để hai section dạy **cùng phòng** cùng lúc (ghép lớp) không bị báo vi phạm. Tuy nhiên có hai vấn đề: PostgreSQL không cho `count(distinct a, b)` → viết `count(distinct (building, room_number))`; và group by **sec_id** khiến mỗi nhóm chỉ là một section (một phòng) nên không bao giờ > 1. Bản đúng:
```sql
select ID, name, semester, year, time_slot_id, count(distinct (building, room_number)) as num_rooms
from instructor natural join teaches natural join section
group by ID, name, semester, year, time_slot_id
having count(distinct (building, room_number)) > 1;
```
b. `create assertion check not exists (<truy vấn trên>)`. Assertion có trong chuẩn SQL nhưng **không** DBMS phổ biến nào hỗ trợ → trong thực tế dùng trigger trên teaches/section. (Bài GK3.12.)

</details>

**Câu 5.** 

> **Exercise 4.9.** SQL allows a foreign-key dependency to refer to the same relation, as in the following example:
> 
> ```sql
> create table manager
>   (employee_ID char(20),
>    manager_ID  char(20),
>    primary key employee_ID,
>    foreign key (manager_ID) references manager(employee_ID)
>      on delete cascade )
> ```
> 
> Here, *employee_ID* is a key to the table *manager*, meaning that each employee has at most one manager. The foreign-key clause requires that every manager also be an employee. Explain exactly what happens when a tuple in the relation *manager* is deleted.

**PE 4.9** — Cho bảng manager(employee_ID, manager_ID) với foreign key (manager_ID) references manager(employee_ID) on delete cascade. Giải thích chính xác điều gì xảy ra khi xoá một tuple.

<details><summary>Gợi ý đáp án</summary>

**Toàn bộ nhân viên dưới quyền manager đó, ở mọi cấp, đều bị xoá.** Xoá tuple ban đầu kích hoạt xoá các tuple của nhân viên **trực tiếp** (manager_ID = người bị xoá); các lần xoá này lại kích hoạt xoá nhân viên cấp hai, và cứ thế cho tới khi hết nhân viên trực tiếp lẫn gián tiếp. (Bài GK3.13.)

</details>

**Câu 6.** 

> **Exercise 4.11.** Operating systems usually offer only two types of authorization control for data files: read access and write access. Why do database systems offer so many kinds of authorization?

**PE 4.11** — Hệ điều hành thường chỉ có quyền read và write trên file. Vì sao database có nhiều loại quyền?

<details><summary>Gợi ý đáp án</summary>

Có nhiều lý do, ví dụ:
- Cho user chỉ **thêm** dữ liệu mới (insert) mà không sửa dữ liệu cũ.
- Cho user truy cập relation nhưng **không đổi schema** (alter, drop).
- Hạn chế những thao tác không hẳn là truy cập dữ liệu nhưng ảnh hưởng tài nguyên, như **tạo index**.
- Phân quyền chi tiết tới **cột** (update(grade)), quyền **references** (tạo foreign key), quyền trên **view**…

</details>

**Câu 7.** 

> **Exercise 4.12.** Suppose a user wants to grant **select** access on a relation to another user. Why should the user include (or not include) the clause **granted by current role** in the **grant** statement?

**PE 4.12** — Khi grant select cho user khác, vì sao nên (hoặc không nên) thêm `granted by current_role`?

<details><summary>Gợi ý đáp án</summary>

Cả hai cách cho cùng quyền **tại thời điểm** grant, nhưng hiệu ứng lâu dài khác nhau. Nếu grant dựa trên **role**, quyền vẫn còn hiệu lực ngay cả khi user thực hiện grant rời tổ chức và tài khoản bị xoá (khi xoá user, các quyền do user đó cấp sẽ bị thu hồi dây chuyền). Tốt hay xấu tuỳ tình huống, nhưng thường grant qua role phù hợp hơn với một tổ chức vận hành tốt.

</details>

**Câu 8.** 

> **Exercise 4.13.** Consider a view v whose definition references only relation r.
> 
> - If a user is granted **select** authorization on v, does that user need to have **select** authorization on r as well? Why or why not?
> - If a user is granted **update** authorization on v, does that user need to have **update** authorization on r as well? Why or why not?
> - Give an example of an **insert** operation on a view v to add a tuple t that is not visible in the result of **select** * **from** v. Explain your answer.

**PE 4.13** — View v chỉ tham chiếu relation r. (1) User được grant select trên v có cần select trên r? (2) User được grant update trên v có cần update trên r? (3) Cho ví dụ insert vào v một tuple t không thấy trong `select * from v`.

<details><summary>Gợi ý đáp án</summary>

1. **Không.** Nhờ vậy có thể cho user truy cập **một phần** của r (bài GK3.15).
2. Theo sách: **có** — update hợp lệ qua v phải cập nhật r thì mới được lưu. *(Ghi chú PostgreSQL: view được thực thi với quyền của **chủ view**, nên user chỉ cần quyền update trên view; người tạo view phải có quyền trên r.)*
3. Bất kỳ tuple nào hợp schema của v nhưng **không thoả where** của v. Ví dụ view history_instructors = instructor của khoa History (không có `with check option`): insert ('25566', 'Brown', 'Biology', 100000) qua view thành công, tuple vào instructor nhưng không hiện trong view (bài GK3.16).

</details>

## 2. Bài tập SQL (16 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK3.01 | PE 4.1 natural join trap | ★★☆ | Exercise 4.1. Consider the following SQL query that seeks to find a list of titles of all courses taught in Spring 2017 along with the name of the instructor.  ```sql select name, title from instructor natural join teaches natural join section natural join course where semester = 'Spring' and year = 2017 ```  What is wrong with this query?<br>PE 4.1 — Tạo view `gk_spring2017_titles(name, title)`: tên instructor và title của mỗi course họ dạy ở Spring 2017, sửa lỗi natural join của sách. Khi chấm, hệ thống cho Einstein (Physics) dạy thêm CS-190 section 1 Spring 2017 rồi đọc view. |
| GK3.02 | PE 4.2a left outer join | ★☆☆ | Exercise 4.2 (a). Write the following queries in SQL:  a. Display a list of all instructors, showing each instructor’s ID and the number of sections taught. Make sure to show the number of sections as 0 for instructors who have not taught any section. Your query should use an outer join, and should not use subqueries.<br>PE 4.2a — ID của mỗi instructor và số section đã dạy (0 nếu chưa dạy). Dùng outer join, không dùng subquery. |
| GK3.03 | PE 4.2b scalar subquery | ★☆☆ | Exercise 4.2 (a, b). Write the following queries in SQL:  a. Display a list of all instructors, showing each instructor’s ID and the number of sections taught. Make sure to show the number of sections as 0 for instructors who have not taught any section. Your query should use an outer join, and should not use subqueries.  b. Write the same query as in part a, but using a scalar subquery and not using outer join.<br>PE 4.2b — Như PE 4.2a nhưng dùng scalar subquery, không dùng outer join. |
| GK3.04 | PE 4.2c coalesce | ★★☆ | Exercise 4.2 (c). Write the following queries in SQL:  c. Display the list of all course sections offered in Spring 2018, along with the ID and name of each instructor teaching the section. If a section has more than one instructor, that section should appear as many times in the result as it has instructors. If a section does not have any instructor, it should still appear in the result with the instructor name set to “−”.<br>PE 4.2c — Tạo view `gk_spring2018_sections(course_id, sec_id, ID, name)`: mọi section mở ở Spring 2018 cùng ID và tên instructor; section nhiều instructor xuất hiện nhiều lần; section không có instructor vẫn xuất hiện với name = `-`. Khi chấm, hệ thống thêm một section Spring 2018 chưa có ai dạy. |
| GK3.05 | PE 4.2d count zero | ★★☆ | Exercise 4.2 (d). Write the following queries in SQL:  d. Display the list of all departments, with the total number of instructors in each department, without using subqueries. Make sure to show departments that have no instructors, and list those departments with an instructor count of zero.<br>PE 4.2d — Tạo view `gk_dept_instructors(dept_name, num_instructors)`: mọi department với tổng số instructor, khoa không có ai phải hiện 0. Không dùng subquery. Khi chấm, hệ thống thêm khoa `Statistics` chưa có instructor. |
| GK3.06 | PE 4.3a left join rewrite | ★★☆ | Exercise 4.3 (a). Outer join expressions can be computed in SQL without using the SQL outer join operation. To illustrate this fact, show how to rewrite each of the following SQL queries without using the outer join expression.  a. `select * from student natural left outer join takes`<br>PE 4.3a — Viết `select * from student natural left outer join takes` không dùng outer join (natural join + union + not exists). |
| GK3.07 | PE 4.3b full join rewrite | ★★★ | Exercise 4.3 (b). Outer join expressions can be computed in SQL without using the SQL outer join operation. To illustrate this fact, show how to rewrite each of the following SQL queries without using the outer join expression.  b. `select * from student natural full outer join takes`<br>PE 4.3b — Viết `select * from student natural full outer join takes` không dùng outer join. |
| GK3.08 | PE 4.4 outer join order | ★★★ | Exercise 4.4. Suppose we have three relations r(A, B), s(B, C), and t(B, D), with all attributes declared as not null.  a. Give instances of relations r, s, and t such that in the result of  (r natural left outer join s) natural left outer join t  attribute C has a null value but attribute D has a non-null value.  b. Are there instances of r, s, and t such that the result of  r natural left outer join (s natural left outer join t)  has a null value for C but a non-null value for D? Explain why or why not.<br>PE 4.4 — Tạo `gk_r(a, b)`, `gk_s(b, c)`, `gk_t(b, d)` (mọi cột `not null`) và chèn dữ liệu sao cho trong `(gk_r natural left outer join gk_s) natural left outer join gk_t` có dòng với c null nhưng d khác null. Hệ thống kiểm tra điều đó, và kiểm tra rằng với `gk_r natural left outer join (gk_s natural left outer join gk_t)` thì không có dòng như vậy (PE 4.4b). |
| GK3.09 | PE 4.5a test data | ★★☆ | Exercise 4.5 (a). Testing SQL queries: To test if a query specified in English has been correctly written in SQL, the SQL query is typically executed on multiple test databases, and a human checks if the SQL query result on each test database matches the intention of the specification in English.  a. In Section 4.1.1 we saw an example of an erroneous SQL query which was intended to find which courses had been taught by each instructor; the query computed the natural join of *instructor*, *teaches*, and *course*, and as a result it unintentionally equated the *dept_name* attribute of *instructor* and *course*. Give an example of a dataset that would help catch this particular error.<br>PE 4.5a — Tạo bộ dữ liệu test bắt được lỗi natural join của Section 4.1.1: các bảng `gk_instructor(ID, name, dept_name, salary)`, `gk_teaches(ID, course_id, sec_id, semester, year)`, `gk_course(course_id, title, dept_name, credits)` sao cho `gk_instructor natural join gk_teaches natural join gk_course` có ít dòng hơn `gk_instructor natural join gk_teaches join gk_course using (course_id)`. |
| GK3.10 | PE 4.6 view with nulls | ★★★ | Exercise 4.6. Show how to define the view *student_grades* (*ID*, *GPA*) giving the grade-point average of each student, based on the query in Exercise 3.2; recall that we used a relation *grade_points*(*grade*, *points*) to get the numeric points associated with a letter grade. Make sure your view definition correctly handles the case of *null* values for the *grade* attribute of the *takes* relation.<br>PE 4.6 — Tạo view `gk_student_grades(ID, GPA)` cho mọi sinh viên: môn có grade null không tính vào cả tử số lẫn mẫu số; sinh viên chưa có môn nào có điểm (hoặc chưa học môn nào) có GPA = null. Dùng `case` thay cho `decode` của sách. |
| GK3.11 | PE 4.7 DDL foreign keys | ★★☆ | Exercise 4.7. Consider the employee database of Figure 4.12. Give an SQL DDL definition of this database. Identify referential-integrity constraints that should hold, and include them in the DDL definition.  *Figure 4.12 — Employee database* (primary keys underlined):  - employee (ID, person_name, street, city) - works (ID, company_name, salary) - company (company_name, city) - manages (ID, manager_id)<br>PE 4.7 — Viết DDL cho Employee database với tên `gk_employee(ID, person_name, street, city)`, `gk_company(company_name, city)`, `gk_works(ID, company_name, salary)`, `gk_manages(ID, manager_id)`: primary key như PE 2.1 (gk_manages: ID) và đủ bốn foreign key. |
| GK3.12 | PE 4.8a constraint query | ★★★ | Exercise 4.8. As discussed in Section 4.4.8, we expect the constraint “an instructor cannot teach sections in two different classrooms in a semester in the same time slot” to hold.  a. Write an SQL query that returns all (*instructor*, *section*) combinations that violate this constraint.  b. Write an SQL assertion to enforce this constraint (as discussed in Section 4.4.8, current generation database systems do not support such assertions, although they are part of the SQL standard).<br>PE 4.8a — Tạo view `gk_room_conflicts(ID, name, semester, year, time_slot_id, num_rooms)`: các instructor dạy section ở nhiều hơn một phòng trong cùng semester, year và time slot. (Sửa hai lỗi của lời giải sách: bỏ sec_id khỏi group by; viết `count(distinct (building, room_number))`.) Khi chấm, hệ thống cho Katz dạy thêm một section ở phòng khác cùng time slot F, Spring 2018. |
| GK3.13 | PE 4.9 cascade chain | ★★☆ | Exercise 4.9. SQL allows a foreign-key dependency to refer to the same relation, as in the following example:  ```sql create table manager   (employee_ID char(20),    manager_ID  char(20),    primary key employee_ID,    foreign key (manager_ID) references manager(employee_ID)      on delete cascade ) ```  Here, *employee_ID* is a key to the table *manager*, meaning that each employee has at most one manager. The foreign-key clause requires that every manager also be an employee. Explain exactly what happens when a tuple in the relation *manager* is deleted.<br>PE 4.9 — Tạo `gk_manager(employee_id varchar(20) primary key, manager_id varchar(20))` với foreign key (manager_id) tham chiếu `gk_manager(employee_id)` on delete cascade. Chèn: (Alice, null), (Bob, Alice), (Carol, Alice), (Dave, Bob), (Eve, Dave), (Frank, null), (Grace, Frank). Sau đó xoá Bob và trả về các dòng còn lại. |
| GK3.14 | PE 4.10 full outer join on | ★★★ | Exercise 4.10. Given the relations a(*name*, *address*, *title*) and b(*name*, *address*, *salary*), show how to express a natural full outer join b using the full outer-join operation with an on condition rather than using the natural join syntax. This can be done using the coalesce operation. Make sure that the result relation does not contain two copies of the attributes *name* and *address* and that the solution is correct even if some tuples in a and b have null values for attributes *name* or *address*.<br>PE 4.10 — Với `emp_title(name, address, title)` và `emp_salary(name, address, salary)` (có null ở name/address), viết tương đương `emp_title natural full outer join emp_salary` bằng full outer join ... on và coalesce: cột name, address, title, salary (mỗi cột chung chỉ một bản). |
| GK3.15 | PE 4.13 view authorization | ★★★ | Exercise 4.13. Consider a view v whose definition references only relation r.  - If a user is granted select authorization on v, does that user need to have select authorization on r as well? Why or why not? - If a user is granted update authorization on v, does that user need to have update authorization on r as well? Why or why not? - Give an example of an insert operation on a view v to add a tuple t that is not visible in the result of select * from v. Explain your answer.<br>PE 4.13 (1) — Tạo view `gk_physics_staff(ID, name)` (instructor khoa Physics) và role `gk_viewer`; grant select chỉ trên view cho gk_viewer. Hệ thống sẽ `set role gk_viewer`: đọc được view nhưng không đọc được bảng instructor. |
| GK3.16 | PE 4.13 invisible insert | ★★☆ | Exercise 4.13. Consider a view v whose definition references only relation r.  - If a user is granted select authorization on v, does that user need to have select authorization on r as well? Why or why not? - If a user is granted update authorization on v, does that user need to have update authorization on r as well? Why or why not? - Give an example of an insert operation on a view v to add a tuple t that is not visible in the result of select * from v. Explain your answer.<br>PE 4.13 (3) — Tạo view `gk_history_instructors` (mọi cột của instructor khoa History, không có with check option), rồi insert qua view giảng viên `('25566', 'Brown', 'Biology', 100000)`. Hệ thống kiểm tra: tuple có trong instructor nhưng không thấy qua view. |

## 3. Ghi nhớ nhanh

### Cách dùng phần này
Toàn bộ Practice Exercises Chương 4 (4.1–4.13). Nhiều câu Chương 4 hỏi về **trường hợp biên** (section không có giảng viên, khoa không có giảng viên, giá trị null…) mà dữ liệu mẫu không có sẵn. Vì vậy một số bài yêu cầu bạn **tạo view** với tên cho trước; khi chấm, hệ thống **chèn thêm dữ liệu biên** rồi mới đọc view — câu sai (ví dụ dùng inner join, `count(*)`) sẽ lộ ra ngay.

| PE | Nội dung | Bài SQL | Tự luận |
|---|---|---|---|
| 4.1 | Lỗi natural join qua dept_name | GK3.01 | Câu 1 |
| 4.2 a–d | Outer join, scalar subquery, coalesce, đếm 0 | GK3.02–GK3.05 | — |
| 4.3 a–b | Viết outer join không dùng outer join | GK3.06–GK3.07 | — |
| 4.4 a–b | Thứ tự left outer join và null | GK3.08 | Câu 2 |
| 4.5 a–c | Thiết kế dữ liệu test cho truy vấn | GK3.09 | Câu 3 |
| 4.6 | View student_grades xử lý null | GK3.10 | — |
| 4.7 | DDL + referential integrity cho Employee database | GK3.11 | — |
| 4.8 a–b | Giảng viên dạy 2 phòng cùng time slot; assertion | GK3.12 | Câu 4 |
| 4.9 | Foreign key tự tham chiếu + on delete cascade | GK3.13 | Câu 5 |
| 4.10 | natural full outer join bằng `on` + coalesce | GK3.14 | — |
| 4.11 | Vì sao DB có nhiều loại quyền | — | Câu 6 |
| 4.12 | `granted by current_role` | — | Câu 7 |
| 4.13 | Quyền trên view; insert qua view mà không thấy | GK3.15–GK3.16 | Câu 8 |

### Outer join — cheat sheet
| Yêu cầu | Mẫu |
|---|---|
| Đếm, hiện 0 cho nhóm rỗng | `r left outer join s ... group by ... count(s.col)` — **không** `count(*)` |
| Đếm không dùng outer join | scalar subquery `(select count(*) from s where s.k = r.k)` |
| Thay null bằng ký hiệu | `coalesce(name, '-')` (Oracle: `decode(name, null, '-', name)`) |
| r ⟕ s không dùng outer join | `r ⋈ s union (r không khớp, null cho các cột của s)` với `not exists` |
| r ⟗ s | r ⋈ s ∪ (r không khớp) ∪ (s không khớp) |
| natural full outer join bằng `on` | `coalesce(a.k, b.k) as k` cho cột chung |

**Chọn cột để count:** cột của bảng bên phải mà **không** có ở bảng bên trái (ví dụ `sec_id` của teaches) — cột chung như `ID` không bao giờ null trong natural left outer join.

### Ràng buộc & quyền
- Foreign key tự tham chiếu + `on delete cascade` → xoá **dây chuyền** toàn bộ cây cấp dưới (PE 4.9).
- `create assertion` có trong chuẩn SQL nhưng **không DBMS phổ biến nào hỗ trợ** (PE 4.8b) → dùng trigger hoặc truy vấn kiểm tra.
- Quyền trên view **không** cần quyền select trên bảng gốc → che giấu một phần dữ liệu (PE 4.13).
- Insert qua view có thể tạo tuple **không nhìn thấy** qua view (không thoả where) — trừ khi `with check option`.
- `granted by current_role`: quyền gắn với **role**, vẫn còn khi tài khoản người cấp bị xoá (PE 4.12).

### Bẫy & lỗi trong lời giải sách
- PE 4.1: `instructor natural join teaches natural join section natural join course` ghép thêm theo **dept_name** (instructor và course đều có) → mất các môn giảng viên dạy ngoài khoa mình.
- PE 4.2a: dùng `count(*)` sẽ cho 1 thay vì 0.
- PE 4.6: sách dùng `decode` (Oracle) → PostgreSQL dùng `case`.
- PE 4.7: lời giải viết `manager_iid` — là lỗi gõ của `manager_id`.
- PE 4.8a: `count(distinct building, room_number)` không hợp lệ trong PostgreSQL → `count(distinct (building, room_number))`. Ngoài ra lời giải group by cả `sec_id` — mỗi section chỉ có một phòng nên **không bao giờ** phát hiện được vi phạm; phải bỏ sec_id khỏi group by.
