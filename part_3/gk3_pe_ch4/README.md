# Ôn GK · Phần 3 — Practice Exercises Chương 4 (Intermediate SQL)

*Practice Exercises — Chapter 4 · Practice Exercises 4.1–4.13 · Database System Concepts, 7th Ed.*

> **Cách học:** đọc *Tóm tắt kiến thức* → làm *Trắc nghiệm* → trả lời *Câu hỏi tự luận* → làm *Bài tập SQL* trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk3`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### Cách dùng phần này
Toàn bộ Practice Exercises Chương 4 (4.1–4.13). Nhiều câu Chương 4 hỏi về **trường hợp biên** (section không có giảng viên, khoa không có giảng viên, giá trị null…) mà dữ liệu mẫu không có sẵn. Vì vậy một số bài yêu cầu bạn **tạo view** với tên cho trước; khi chấm, hệ thống **chèn thêm dữ liệu biên** rồi mới đọc view — câu sai (ví dụ dùng inner join, `count(*)`) sẽ lộ ra ngay.

| PE | Nội dung | Bài SQL | Tự luận |
|---|---|---|---|
| 4.1 | Lỗi natural join qua dept_name | GK3.01 | Câu 1 |
| 4.2 a–d | Outer join, scalar subquery, coalesce, đếm 0 | GK3.02–GK3.05 | Câu 2 |
| 4.3 a–b | Viết outer join không dùng outer join | GK3.06–GK3.07 | Câu 3 |
| 4.4 a–b | Thứ tự left outer join và null | GK3.08 | Câu 4 |
| 4.5 a–c | Thiết kế dữ liệu test cho truy vấn | GK3.09 | Câu 5 |
| 4.6 | View student_grades xử lý null | GK3.10 | Câu 6 |
| 4.7 | DDL + referential integrity cho Employee database | GK3.11 | Câu 7 |
| 4.8 a–b | Giảng viên dạy 2 phòng cùng time slot; assertion | GK3.12 | Câu 8 |
| 4.9 | Foreign key tự tham chiếu + on delete cascade | GK3.13 | Câu 9 |
| 4.10 | natural full outer join bằng `on` + coalesce | GK3.14 | Câu 10 |
| 4.11 | Vì sao DB có nhiều loại quyền | — | Câu 11 |
| 4.12 | `granted by current_role` | — | Câu 12 |
| 4.13 | Quyền trên view; insert qua view mà không thấy | GK3.15–GK3.16 | Câu 13 |

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

## 2. Trắc nghiệm (14 câu)

**Câu 1.** PE 4.1 — Câu `select name, title from instructor natural join teaches natural join section natural join course where semester = 'Spring' and year = 2017` sai vì sao?

- A. Lỗi cú pháp
- B. dept_name có ở cả instructor và course nên chỉ giữ môn giảng viên dạy trong khoa mình
- C. Thiếu distinct
- D. section không có cột year

<details><summary>Đáp án</summary>

**B** — Natural join so sánh mọi cột trùng tên, kể cả dept_name.

</details>

**Câu 2.** PE 4.2a — Trong `select ID, count(sec_id) from instructor natural left outer join teaches group by ID`, vì sao không dùng count(*)?

- A. count(*) chậm hơn
- B. count(*) đếm cả dòng có null → giảng viên không dạy gì ra 1
- C. count(*) không dùng được với group by
- D. Không khác nhau

<details><summary>Đáp án</summary>

**B** — Dòng do outer join thêm vào vẫn là một dòng; count(sec_id) bỏ qua null nên ra 0.

</details>

**Câu 3.** PE 4.2a — Dùng cột nào trong count thì SAI?

- A. count(sec_id)
- B. count(course_id)
- C. count(ID)
- D. count(semester)

<details><summary>Đáp án</summary>

**C** — ID là cột chung lấy từ instructor nên không bao giờ null.

</details>

**Câu 4.** PE 4.2c — Hàm PostgreSQL thay cho `decode(name, null, '-', name)`?

- A. nvl(name)
- B. coalesce(name, '-')
- C. ifnull('-')
- D. nullif(name, '-')

<details><summary>Đáp án</summary>

**B** — coalesce trả về đối số khác null đầu tiên.

</details>

**Câu 5.** PE 4.3a — Phần "không khớp" khi viết student natural left outer join takes không dùng outer join là gì?

- A. select * from takes where ID not in (select ID from student)
- B. select ID, name, dept_name, tot_cred, null, null, null, null, null from student S where not exists (select * from takes T where T.ID = S.ID)
- C. select * from student natural join takes
- D. select * from student, takes

<details><summary>Đáp án</summary>

**B** — Sinh viên không có dòng takes, các cột của takes điền null; union với natural join.

</details>

**Câu 6.** PE 4.4 — r(A,B), s(B,C), t(B,D), mọi cột not null. Với r ⟕ (s ⟕ t), khẳng định nào đúng?

- A. C có thể null còn D khác null
- B. Không thể có C null mà D khác null
- C. D không bao giờ null
- D. Kết quả luôn rỗng

<details><summary>Đáp án</summary>

**B** — s ⟕ t tính trước: mọi dòng có C khác null. Khi r không khớp, cả C và D cùng null.

</details>

**Câu 7.** PE 4.5b — Vì sao dữ liệu test nên có tuple ở referenced relation không được tham chiếu (ví dụ instructor không dạy section nào)?

- A. Để test hiệu năng
- B. Để phát hiện truy vấn dùng inner join thay vì outer join (mất dòng có count = 0)
- C. Để vi phạm foreign key
- D. Không cần thiết

<details><summary>Đáp án</summary>

**B** — Ví dụ PE 4.2a: thiếu tuple như vậy thì câu sai vẫn cho kết quả đúng.

</details>

**Câu 8.** PE 4.6 — View student_grades nên trả về gì cho sinh viên chưa có môn nào có điểm?

- A. GPA = 0
- B. GPA = null (tránh chia cho 0)
- C. Không có dòng
- D. Lỗi

<details><summary>Đáp án</summary>

**B** — credit_sum = 0 → chia cho null thay vì 0.

</details>

**Câu 9.** PE 4.8b — `create assertion` trong PostgreSQL?

- A. Được hỗ trợ đầy đủ
- B. Có trong chuẩn SQL nhưng không được hỗ trợ
- C. Chỉ hỗ trợ trên view
- D. Là tên khác của check

<details><summary>Đáp án</summary>

**B** — Không DBMS phổ biến nào hỗ trợ; thay bằng trigger.

</details>

**Câu 10.** PE 4.9 — Bảng manager(employee_ID, manager_ID) với foreign key (manager_ID) references manager on delete cascade. Xoá một manager thì sao?

- A. Chỉ xoá dòng đó
- B. Xoá dòng đó và toàn bộ cấp dưới trực tiếp lẫn gián tiếp
- C. Bị từ chối
- D. manager_ID của cấp dưới thành null

<details><summary>Đáp án</summary>

**B** — Xoá dây chuyền: cấp dưới trực tiếp bị xoá kéo theo cấp dưới của họ…

</details>

**Câu 11.** PE 4.10 — Khi viết a natural full outer join b bằng `on a.name = b.name and a.address = b.address`, làm sao để chỉ có một cột name?

- A. select a.name
- B. select coalesce(a.name, b.name) as name
- C. select distinct name
- D. Không thể

<details><summary>Đáp án</summary>

**B** — a.name null với dòng chỉ có ở b và ngược lại; coalesce lấy giá trị khác null.

</details>

**Câu 12.** PE 4.13 — User được grant select trên view v (định nghĩa từ r). User có cần select trên r không?

- A. Có
- B. Không — cho phép chỉ lộ một phần của r
- C. Chỉ khi v có where
- D. Chỉ với materialized view

<details><summary>Đáp án</summary>

**B** — Đây chính là mục đích dùng view để phân quyền.

</details>

**Câu 13.** PE 4.13 — Ví dụ insert qua view mà tuple không thấy trong `select * from v`?

- A. Tuple vi phạm primary key
- B. Tuple hợp schema của v nhưng không thoả điều kiện where của v
- C. Tuple có null
- D. Không thể xảy ra

<details><summary>Đáp án</summary>

**B** — Ví dụ chèn giảng viên Biology qua view history_instructors (không có with check option).

</details>

**Câu 14.** PE 4.12 — Lợi ích của `granted by current_role`?

- A. Quyền mạnh hơn
- B. Quyền vẫn còn khi tài khoản người cấp bị xoá
- C. Không cần with grant option
- D. Tự động revoke sau một thời gian

<details><summary>Đáp án</summary>

**B** — Grantor là role chứ không phải user cá nhân.

</details>

## 3. Câu hỏi tự luận (13 câu)

**Câu 1.** **PE 4.1** — Truy vấn `select name, title from instructor natural join teaches natural join section natural join course where semester = 'Spring' and year = 2017` muốn liệt kê title của mọi course dạy ở Spring 2017 cùng tên instructor. Sai ở đâu?

<details><summary>Gợi ý đáp án</summary>

Cú pháp đúng nhưng **ý nghĩa sai**: `dept_name` là attribute của cả **course** và **instructor**, nên natural join ghép thêm điều kiện instructor.dept_name = course.dept_name. Kết quả chỉ còn các trường hợp giảng viên dạy môn **thuộc khoa của mình**. Sửa: `instructor natural join teaches natural join section join course using (course_id)` (bài GK3.01).

</details>

**Câu 2.** **PE 4.2** — Viết: (a) mỗi instructor và số section đã dạy, hiện 0 nếu chưa dạy — dùng outer join, không subquery; (b) như (a) nhưng dùng scalar subquery, không outer join; (c) mọi section Spring 2018 cùng ID, tên instructor (section có nhiều instructor xuất hiện nhiều lần, không có instructor thì tên là "−"); (d) mọi department và số instructor, kể cả khoa không có ai, không dùng subquery.

<details><summary>Gợi ý đáp án</summary>

```sql
-- a
select ID, count(sec_id) as number_of_sections
from instructor natural left outer join teaches
group by ID;
-- b
select ID, (select count(*) from teaches T where T.ID = I.ID) as number_of_sections
from instructor I;
-- c
select course_id, sec_id, ID, coalesce(name, '-') as name
from (section natural left outer join teaches) natural left outer join instructor
where semester = 'Spring' and year = 2018;
-- d
select dept_name, count(ID)
from department natural left outer join instructor
group by dept_name;
```
(a) không được dùng `count(*)` vì nó đếm cả dòng null; có thể dùng bất kỳ cột nào của teaches **không** có trong instructor. (c) sách dùng `decode` (Oracle); PostgreSQL dùng `coalesce`.

</details>

**Câu 3.** **PE 4.3** — Viết lại không dùng outer join: (a) `select * from student natural left outer join takes`; (b) `select * from student natural full outer join takes`.

<details><summary>Gợi ý đáp án</summary>

```sql
-- a
select * from student natural join takes
union
select ID, name, dept_name, tot_cred, null, null, null, null, null
from student S1
where not exists (select ID from takes T1 where T1.ID = S1.ID);

-- b: thêm phần takes không khớp
(select * from student natural join takes)
union
(select ID, name, dept_name, tot_cred, null, null, null, null, null
 from student S1 where not exists (select ID from takes T1 where T1.ID = S1.ID))
union
(select ID, null, null, null, course_id, sec_id, semester, year, grade
 from takes T1 where not exists (select ID from student S1 where T1.ID = S1.ID));
```
Trong PostgreSQL, `null` trong union được suy ra kiểu từ nhánh đầu; nếu báo lỗi kiểu hãy ép `null::varchar`. Vì takes.ID có foreign key tới student, phần thứ ba của (b) luôn rỗng trên dữ liệu hợp lệ.

</details>

**Câu 4.** **PE 4.4** — r(A, B), s(B, C), t(B, D), mọi attribute not null. (a) Cho instance để trong (r natural left outer join s) natural left outer join t, C null nhưng D khác null. (b) Có instance nào để r natural left outer join (s natural left outer join t) có C null mà D khác null không?

<details><summary>Gợi ý đáp án</summary>

a. r = {(a, b)}, s = {(b1, c1)}, t = {(b, d)}. r ⟕ s = (a, b, null) vì không có s với B = b; rồi ⟕ t khớp B = b → **(a, b, null, d)**.

b. **Không.** s ⟕ t được tính trước; s không có null nên mọi dòng của nó có C khác null (D có thể null). Khi ghép r ⟕ (…): dòng r khớp thì C lấy từ s (khác null); dòng r không khớp thì **cả C lẫn D** đều null. Vậy không thể có C null mà D khác null. (Bài GK3.08.)

</details>

**Câu 5.** **PE 4.5** — Kiểm thử truy vấn SQL: (a) cho dataset bắt được lỗi natural join instructor–teaches–course của Section 4.1.1; (b) vì sao dữ liệu test cần tuple ở referenced relation không có tuple tham chiếu tới nó; (c) vì sao cần tuple có foreign key **null** (nếu cột cho phép)?

<details><summary>Gợi ý đáp án</summary>

a. Một giảng viên Physics dạy môn Elec. Eng.:
- instructor = {(12345, 'Gauss', 'Physics', 10000)}
- teaches = {(12345, 'EE321', 1, 'Spring', 2017)}
- course = {('EE321', 'Magnetism', 'Elec. Eng.', 6)}

Natural join ba bảng ra **rỗng** (dept_name khác nhau) trong khi kết quả đúng có một dòng. (Bài GK3.09.)

b. Ví dụ PE 4.2a: giảng viên **chưa dạy section nào** phải hiện số section 0. Nếu mọi instructor đều có trong teaches, câu sai dùng inner join (hoặc count(*)) vẫn cho kết quả đúng → không phát hiện được lỗi.

c. Ví dụ `select * from teaches natural join instructor`: nếu teaches.ID được phép null và có tuple như vậy thì join làm **mất** các section đó. Nếu chỉ vì teaches.ID là foreign key mà ta không tạo tuple null, lỗi này không bao giờ lộ ra khi test.

</details>

**Câu 6.** **PE 4.6** — Định nghĩa view student_grades(ID, GPA) dựa trên PE 3.2, xử lý đúng grade null.

<details><summary>Gợi ý đáp án</summary>

Không cộng credits của môn có grade null; sinh viên chưa có môn nào (tổng credits = 0) phải có GPA **null** chứ không chia cho 0.

```sql
create view student_grades (ID, GPA) as
select ID, credit_points / (case when credit_sum = 0 then null else credit_sum end)
from ((select ID,
              sum(case when grade is null then 0 else credits end) as credit_sum,
              sum(case when grade is null then 0 else credits * points end) as credit_points
       from (takes natural join course) natural left outer join grade_points
       group by ID)
      union
      select ID, null, null from student where ID not in (select ID from takes)) as t;
```
Sách viết bằng `decode` (Oracle); bản trên dùng `case` cho PostgreSQL (và subquery trong from phải có alias). Có thể thay phần union bằng `student natural left outer join ...`. (Bài GK3.10.)

</details>

**Câu 7.** **PE 4.7** — Viết DDL cho Employee database (employee, works, company, manages), xác định và khai báo các ràng buộc referential integrity.

<details><summary>Gợi ý đáp án</summary>

```sql
create table employee
  (ID numeric(6,0), person_name char(20), street char(30), city char(30),
   primary key (ID));
create table company
  (company_name char(15), city char(30),
   primary key (company_name));
create table works
  (ID numeric(6,0), company_name char(15), salary integer,
   primary key (ID),
   foreign key (ID) references employee,
   foreign key (company_name) references company);
create table manages
  (ID numeric(6,0), manager_id numeric(6,0),
   primary key (ID),
   foreign key (ID) references employee,
   foreign key (manager_id) references employee (ID));
```
Bốn foreign key: works.ID → employee, works.company_name → company, manages.ID → employee, manages.manager_id → employee. Lời giải sách viết `manager_iid` (lỗi gõ). Kiểu dữ liệu và not null có thể chọn khác. Lưu ý company phải được tạo **trước** works. (Bài GK3.11.)

</details>

**Câu 8.** **PE 4.8** — Ràng buộc: một instructor không thể dạy các section ở **hai phòng khác nhau** trong cùng semester, cùng time slot. (a) Viết truy vấn trả về các (instructor, section) vi phạm. (b) Viết assertion ép ràng buộc này.

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

**Câu 9.** **PE 4.9** — Cho bảng manager(employee_ID, manager_ID) với foreign key (manager_ID) references manager(employee_ID) on delete cascade. Giải thích chính xác điều gì xảy ra khi xoá một tuple.

<details><summary>Gợi ý đáp án</summary>

**Toàn bộ nhân viên dưới quyền manager đó, ở mọi cấp, đều bị xoá.** Xoá tuple ban đầu kích hoạt xoá các tuple của nhân viên **trực tiếp** (manager_ID = người bị xoá); các lần xoá này lại kích hoạt xoá nhân viên cấp hai, và cứ thế cho tới khi hết nhân viên trực tiếp lẫn gián tiếp. (Bài GK3.13.)

</details>

**Câu 10.** **PE 4.10** — Cho a(name, address, title) và b(name, address, salary). Viết a natural full outer join b bằng full outer join với điều kiện on và coalesce, không có hai bản sao name/address, đúng cả khi name/address có null.

<details><summary>Gợi ý đáp án</summary>

```sql
select coalesce(a.name, b.name) as name,
       coalesce(a.address, b.address) as address,
       a.title, b.salary
from a full outer join b on a.name = b.name and a.address = b.address;
```
Dòng có null ở name hoặc address không bao giờ khớp (null = … là unknown), nên xuất hiện như dòng chỉ có ở một bên — giống hệt natural full outer join. coalesce lấy giá trị từ bên có dữ liệu. (Bài GK3.14 dùng emp_title, emp_salary.)

</details>

**Câu 11.** **PE 4.11** — Hệ điều hành thường chỉ có quyền read và write trên file. Vì sao database có nhiều loại quyền?

<details><summary>Gợi ý đáp án</summary>

Có nhiều lý do, ví dụ:
- Cho user chỉ **thêm** dữ liệu mới (insert) mà không sửa dữ liệu cũ.
- Cho user truy cập relation nhưng **không đổi schema** (alter, drop).
- Hạn chế những thao tác không hẳn là truy cập dữ liệu nhưng ảnh hưởng tài nguyên, như **tạo index**.
- Phân quyền chi tiết tới **cột** (update(grade)), quyền **references** (tạo foreign key), quyền trên **view**…

</details>

**Câu 12.** **PE 4.12** — Khi grant select cho user khác, vì sao nên (hoặc không nên) thêm `granted by current_role`?

<details><summary>Gợi ý đáp án</summary>

Cả hai cách cho cùng quyền **tại thời điểm** grant, nhưng hiệu ứng lâu dài khác nhau. Nếu grant dựa trên **role**, quyền vẫn còn hiệu lực ngay cả khi user thực hiện grant rời tổ chức và tài khoản bị xoá (khi xoá user, các quyền do user đó cấp sẽ bị thu hồi dây chuyền). Tốt hay xấu tuỳ tình huống, nhưng thường grant qua role phù hợp hơn với một tổ chức vận hành tốt.

</details>

**Câu 13.** **PE 4.13** — View v chỉ tham chiếu relation r. (1) User được grant select trên v có cần select trên r? (2) User được grant update trên v có cần update trên r? (3) Cho ví dụ insert vào v một tuple t không thấy trong `select * from v`.

<details><summary>Gợi ý đáp án</summary>

1. **Không.** Nhờ vậy có thể cho user truy cập **một phần** của r (bài GK3.15).
2. Theo sách: **có** — update hợp lệ qua v phải cập nhật r thì mới được lưu. *(Ghi chú PostgreSQL: view được thực thi với quyền của **chủ view**, nên user chỉ cần quyền update trên view; người tạo view phải có quyền trên r.)*
3. Bất kỳ tuple nào hợp schema của v nhưng **không thoả where** của v. Ví dụ view history_instructors = instructor của khoa History (không có `with check option`): insert ('25566', 'Brown', 'Biology', 100000) qua view thành công, tuple vào instructor nhưng không hiện trong view (bài GK3.16).

</details>

## 4. Bài tập SQL (16 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK3.01 | PE 4.1 natural join trap | ★★☆ | PE 4.1 — Tạo view `gk_spring2017_titles(name, title)`: tên instructor và title của mỗi course họ dạy ở Spring 2017, sửa lỗi natural join của sách. Khi chấm, hệ thống cho Einstein (Physics) dạy thêm CS-190 section 1 Spring 2017 rồi đọc view. |
| GK3.02 | PE 4.2a left outer join | ★☆☆ | PE 4.2a — ID của mỗi instructor và số section đã dạy (0 nếu chưa dạy). Dùng outer join, không dùng subquery. |
| GK3.03 | PE 4.2b scalar subquery | ★☆☆ | PE 4.2b — Như PE 4.2a nhưng dùng scalar subquery, không dùng outer join. |
| GK3.04 | PE 4.2c coalesce | ★★☆ | PE 4.2c — Tạo view `gk_spring2018_sections(course_id, sec_id, ID, name)`: mọi section mở ở Spring 2018 cùng ID và tên instructor; section nhiều instructor xuất hiện nhiều lần; section không có instructor vẫn xuất hiện với name = `-`. Khi chấm, hệ thống thêm một section Spring 2018 chưa có ai dạy. |
| GK3.05 | PE 4.2d count zero | ★★☆ | PE 4.2d — Tạo view `gk_dept_instructors(dept_name, num_instructors)`: mọi department với tổng số instructor, khoa không có ai phải hiện 0. Không dùng subquery. Khi chấm, hệ thống thêm khoa `Statistics` chưa có instructor. |
| GK3.06 | PE 4.3a left join rewrite | ★★☆ | PE 4.3a — Viết `select * from student natural left outer join takes` không dùng outer join (natural join + union + not exists). |
| GK3.07 | PE 4.3b full join rewrite | ★★★ | PE 4.3b — Viết `select * from student natural full outer join takes` không dùng outer join. |
| GK3.08 | PE 4.4 outer join order | ★★★ | PE 4.4 — Tạo `gk_r(a, b)`, `gk_s(b, c)`, `gk_t(b, d)` (mọi cột `not null`) và chèn dữ liệu sao cho trong `(gk_r natural left outer join gk_s) natural left outer join gk_t` có dòng với c null nhưng d khác null. Hệ thống kiểm tra điều đó, và kiểm tra rằng với `gk_r natural left outer join (gk_s natural left outer join gk_t)` thì không có dòng như vậy (PE 4.4b). |
| GK3.09 | PE 4.5a test data | ★★☆ | PE 4.5a — Tạo bộ dữ liệu test bắt được lỗi natural join của Section 4.1.1: các bảng `gk_instructor(ID, name, dept_name, salary)`, `gk_teaches(ID, course_id, sec_id, semester, year)`, `gk_course(course_id, title, dept_name, credits)` sao cho `gk_instructor natural join gk_teaches natural join gk_course` có ít dòng hơn `gk_instructor natural join gk_teaches join gk_course using (course_id)`. |
| GK3.10 | PE 4.6 view with nulls | ★★★ | PE 4.6 — Tạo view `gk_student_grades(ID, GPA)` cho mọi sinh viên: môn có grade null không tính vào cả tử số lẫn mẫu số; sinh viên chưa có môn nào có điểm (hoặc chưa học môn nào) có GPA = null. Dùng `case` thay cho `decode` của sách. |
| GK3.11 | PE 4.7 DDL foreign keys | ★★☆ | PE 4.7 — Viết DDL cho Employee database với tên `gk_employee(ID, person_name, street, city)`, `gk_company(company_name, city)`, `gk_works(ID, company_name, salary)`, `gk_manages(ID, manager_id)`: primary key như PE 2.1 (gk_manages: ID) và đủ bốn foreign key. |
| GK3.12 | PE 4.8a constraint query | ★★★ | PE 4.8a — Tạo view `gk_room_conflicts(ID, name, semester, year, time_slot_id, num_rooms)`: các instructor dạy section ở nhiều hơn một phòng trong cùng semester, year và time slot. (Sửa hai lỗi của lời giải sách: bỏ sec_id khỏi group by; viết `count(distinct (building, room_number))`.) Khi chấm, hệ thống cho Katz dạy thêm một section ở phòng khác cùng time slot F, Spring 2018. |
| GK3.13 | PE 4.9 cascade chain | ★★☆ | PE 4.9 — Tạo `gk_manager(employee_id varchar(20) primary key, manager_id varchar(20))` với foreign key (manager_id) tham chiếu `gk_manager(employee_id)` on delete cascade. Chèn: (Alice, null), (Bob, Alice), (Carol, Alice), (Dave, Bob), (Eve, Dave), (Frank, null), (Grace, Frank). Sau đó xoá Bob và trả về các dòng còn lại. |
| GK3.14 | PE 4.10 full outer join on | ★★★ | PE 4.10 — Với `emp_title(name, address, title)` và `emp_salary(name, address, salary)` (có null ở name/address), viết tương đương `emp_title natural full outer join emp_salary` bằng full outer join ... on và coalesce: cột name, address, title, salary (mỗi cột chung chỉ một bản). |
| GK3.15 | PE 4.13 view authorization | ★★★ | PE 4.13 (1) — Tạo view `gk_physics_staff(ID, name)` (instructor khoa Physics) và role `gk_viewer`; grant select chỉ trên view cho gk_viewer. Hệ thống sẽ `set role gk_viewer`: đọc được view nhưng không đọc được bảng instructor. |
| GK3.16 | PE 4.13 invisible insert | ★★☆ | PE 4.13 (3) — Tạo view `gk_history_instructors` (mọi cột của instructor khoa History, không có with check option), rồi insert qua view giảng viên `('25566', 'Brown', 'Biology', 100000)`. Hệ thống kiểm tra: tuple có trong instructor nhưng không thấy qua view. |
