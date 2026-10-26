# Chương 4 — SQL trung cấp

*Intermediate SQL · Database System Concepts, 7th Ed.*

> **Cách học:** đọc *Tóm tắt kiến thức* → làm *Trắc nghiệm* → trả lời *Câu hỏi tự luận* → làm *Bài tập SQL* trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm bằng `npm run grade -- ch4`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Join expressions
| Cú pháp | Ý nghĩa |
|---|---|
| `r natural join s` | ghép theo **mọi** thuộc tính trùng tên, giữ 1 bản của cột chung |
| `r join s using (A)` | ghép theo các cột được liệt kê |
| `r [inner] join s on P` | ghép theo điều kiện P (giữ cả 2 cột chung) |
| `r left outer join s ...` | như inner + các tuple của **r** không khớp (cột của s = null) |
| `r right outer join s ...` | như inner + các tuple của **s** không khớp |
| `r full outer join s ...` | như inner + tuple không khớp của **cả hai** |

**Nguy hiểm của natural join**: `student natural join takes natural join course` ghép thêm theo **dept_name** (vì student và course đều có dept_name) → mất các cặp mà sinh viên học môn của khoa khác. Cách đúng: `student natural join takes join course using (course_id)`.

*Join condition* quyết định tuple nào khớp; *join type* quyết định xử lý tuple **không** khớp.

### 2. Views
```sql
create view faculty as select ID, name, dept_name from instructor;
create view departments_total_salary (dept_name, total_salary) as
  select dept_name, sum(salary) from instructor group by dept_name;
```
- View là **virtual relation**: chỉ lưu biểu thức, khi dùng thì được **view expansion** (thay tên view bằng định nghĩa, lặp lại tới khi hết view; dừng được nếu không recursive).
- View có thể định nghĩa từ view khác (depend directly / depend on / recursive).
- **Materialized view**: lưu kết quả vật lý → nhanh nhưng phải **maintain** khi bảng gốc đổi (PostgreSQL: `refresh materialized view`).
- **Update qua view** chỉ được với *simple view*: from 1 bảng, select chỉ là tên cột (không biểu thức/aggregate/distinct), không group by/having; cột không có trong view sẽ là null.
- `with check option`: cấm insert/update tạo ra dòng không thoả where của view.

### 3. Transactions
- Một dãy câu lệnh là một **đơn vị công việc**; bắt đầu ngầm định, kết thúc bằng **commit work** (lưu vĩnh viễn) hoặc **rollback work** (huỷ tất cả).
- **Atomic** (thực hiện hết hoặc như chưa từng xảy ra) và **isolated** khỏi các transaction đồng thời.
- PostgreSQL: `begin; ... commit;` / `rollback;` / `savepoint s; rollback to s;`.

### 4. Integrity constraints
- Trên 1 relation: `not null`, `primary key`, `unique (A1..Am)` (candidate key, **được phép null**), `check (P)`.
- **Referential integrity**: `foreign key (A) references r [(cols)]`, mặc định tham chiếu primary key.
- Hành động khi vi phạm: mặc định **reject**; hoặc `on delete/on update` **cascade | set null | set default**.
- Vòng tham chiếu (person.mother → person): chèn cha mẹ trước, hoặc để null rồi update, hoặc **defer constraint checking** (`deferrable initially deferred` — kiểm tra lúc commit).
- `check` có subquery và `create assertion` là chuẩn SQL nhưng hầu như **không DBMS nào hỗ trợ** (PostgreSQL cũng không) → dùng trigger.

### 5. Kiểu dữ liệu & schema
- `date '2005-7-27'`, `time '09:00:30'`, `timestamp '2005-7-27 09:00:30.75'`, `interval '1' day`. Trừ hai date/time → interval; cộng interval vào date/time.
- **Large objects**: `blob` (binary), `clob` (character) — truy vấn trả về con trỏ (PostgreSQL: `bytea`, `text`).
- `create type Dollars as numeric(12,2) final` (chuẩn SQL) ~ PostgreSQL dùng `create domain`.
- `create domain degree_level varchar(10) constraint degree_level_test check (value in ('Bachelors', 'Masters', 'Doctorate'))` — domain có thể có ràng buộc.

### 6. Index
`create index <name> on <relation> (attribute)` — tìm tuple theo giá trị mà không phải quét cả bảng.

### 7. Authorization
- Privilege trên dữ liệu: **select (read), insert, update, delete**, `all privileges`. Trên schema: index, resources, alteration, drop.
- `grant <privileges> on <relation|view> to <user|public|role>`; `revoke <privileges> on ... from ...` (`cascade` mặc định / `restrict`).
- Grant trên view **không** kéo theo quyền trên bảng gốc. Người grant phải có quyền đó (hoặc là DBA).
- **Role**: `create role instructor; grant instructor to Amit; grant select on takes to instructor;` Role có thể grant cho role khác → chuỗi kế thừa (teaching_assistant → instructor → dean).
- `grant references (dept_name) on department to Mariano` — quyền tạo foreign key (vì FK hạn chế việc xoá/sửa bảng được tham chiếu).
- `with grant option` — cho phép người nhận grant tiếp.

## 2. Trắc nghiệm (13 câu)

**Câu 1.** Khác biệt giữa `course inner join prereq on course.course_id = prereq.course_id` và `course natural join prereq`?

- A. Không khác gì cả
- B. Inner join on giữ 2 cột course_id; natural join chỉ giữ 1
- C. Natural join giữ lại tuple không khớp
- D. Inner join on không được dùng điều kiện bằng

<details><summary>Đáp án</summary>

**B** — Kết quả tương ứng cùng các cặp tuple, nhưng natural join gộp cột chung thành một cột.

</details>

**Câu 2.** `student natural join takes natural join course` sai ở đâu?

- A. Không sai
- B. Ghép thêm theo dept_name nên mất các môn học ngoài khoa của sinh viên
- C. Sinh ra Cartesian product
- D. Lỗi cú pháp

<details><summary>Đáp án</summary>

**B** — student và course đều có cột dept_name nên natural join so sánh luôn cột này.

</details>

**Câu 3.** `course left outer join prereq` trả về course không có prereq như thế nào?

- A. Bị loại bỏ
- B. Có mặt, các cột của prereq là null
- C. Có mặt, cột prereq_id = course_id
- D. Báo lỗi

<details><summary>Đáp án</summary>

**B** — Outer join tránh mất thông tin bằng cách điền null.

</details>

**Câu 4.** View nào sau đây có thể update được trong hầu hết DBMS?

- A. select dept_name, avg(salary) from instructor group by dept_name
- B. select ID, name, dept_name from instructor
- C. select distinct dept_name from instructor
- D. select ID, name, building from instructor, department where ...

<details><summary>Đáp án</summary>

**B** — Simple view: một bảng, chỉ tên cột, không aggregate/distinct/group by.

</details>

**Câu 5.** Materialized view khác view thường ở điểm nào?

- A. Không thể truy vấn
- B. Kết quả được lưu vật lý và cần được maintain khi bảng gốc thay đổi
- C. Không thể định nghĩa bằng select
- D. Tự động cho phép update

<details><summary>Đáp án</summary>

**B** — View thường chỉ lưu biểu thức và được expand khi dùng.

</details>

**Câu 6.** Khác biệt giữa unique và primary key?

- A. Unique không xác định candidate key
- B. Thuộc tính unique được phép null, primary key thì không
- C. Một bảng chỉ có 1 unique constraint
- D. Không có khác biệt

<details><summary>Đáp án</summary>

**B** — Candidate key khai báo bằng unique được phép null.

</details>

**Câu 7.** Bảng course có `foreign key (dept_name) references department on delete cascade`. Xoá khoa Biology thì?

- A. Bị từ chối
- B. Các course của Biology bị xoá theo
- C. dept_name của các course đó thành null
- D. Không ảnh hưởng gì

<details><summary>Đáp án</summary>

**B** — cascade lan truyền việc xoá sang bảng tham chiếu. (set null mới đặt null.)

</details>

**Câu 8.** Làm sao chèn người mà cha mẹ chưa có trong bảng person khi father/mother là foreign key NOT NULL?

- A. Không thể
- B. Defer constraint checking tới cuối transaction
- C. Dùng on delete cascade
- D. Dùng unique

<details><summary>Đáp án</summary>

**B** — Với not null thì không thể chèn null trước; phải defer (deferrable initially deferred).

</details>

**Câu 9.** Kết quả của `timestamp '2018-03-02 10:00' - timestamp '2018-03-01 08:00'` có kiểu gì?

- A. date
- B. integer
- C. interval
- D. timestamp

<details><summary>Đáp án</summary>

**C** — Hiệu hai giá trị thời gian là interval (ở đây 1 day 02:00:00).

</details>

**Câu 10.** Domain khác type (trong chuẩn SQL) ở điểm nào?

- A. Domain có thể có ràng buộc như not null, check
- B. Type có thể có check
- C. Domain chỉ dùng cho số
- D. Không khác

<details><summary>Đáp án</summary>

**A** — Domain có thể khai báo constraint; type (strongly typed) thì không.

</details>

**Câu 11.** User U có quyền select trên view geo_instructor nhưng không có quyền trên instructor. U chạy `select * from geo_instructor`?

- A. Bị từ chối
- B. Thành công (nếu người tạo view có quyền trên instructor)
- C. Chỉ thấy cột ID
- D. View bị xoá

<details><summary>Đáp án</summary>

**B** — Grant trên view không cần quyền trên bảng gốc; nhưng người tạo view phải có quyền đó.

</details>

**Câu 12.** `revoke select on department from Amit cascade` khi Amit đã grant tiếp cho Satoshi (with grant option)?

- A. Satoshi vẫn giữ quyền
- B. Satoshi cũng mất quyền (nếu không được ai khác cấp)
- C. Lỗi
- D. Amit vẫn giữ quyền

<details><summary>Đáp án</summary>

**B** — Mọi privilege phụ thuộc privilege bị revoke cũng bị revoke. restrict thì báo lỗi thay vì cascade.

</details>

**Câu 13.** Vì sao cần privilege references để tạo foreign key?

- A. Vì FK làm chậm truy vấn
- B. Vì FK có thể hạn chế việc xoá/cập nhật trên bảng được tham chiếu của người khác
- C. Vì FK tạo index
- D. Không cần

<details><summary>Đáp án</summary>

**B** — Ai đó tạo FK tới bảng department sẽ ngăn chủ bảng xoá khoa đang được tham chiếu.

</details>

## 3. Câu hỏi tự luận (6 câu)

**Câu 1.** View `instructor_info(ID, name, building)` = instructor ⋈ department. Vì sao `insert into instructor_info values ('69987', 'White', 'Taylor')` không dịch được một cách duy nhất?

<details><summary>Gợi ý đáp án</summary>

Phải chèn vào instructor một dept_name — nhưng toà Taylor có **nhiều khoa** (Comp. Sci., Elec. Eng.) → không biết chọn khoa nào; nếu **không** khoa nào ở Taylor thì không thể chèn sao cho tuple xuất hiện trong view.

</details>

**Câu 2.** Chèn `('25566', 'Brown', 'Biology', 100000)` vào view `history_instructors` (where dept_name = 'History') thì sao? Làm cách nào để chặn?

<details><summary>Gợi ý đáp án</summary>

Mặc định tuple được chèn vào instructor nhưng **không xuất hiện** trong view (vì không thoả where). Thêm `with check option` vào định nghĩa view để DBMS từ chối.

</details>

**Câu 3.** Viết lại (view expansion) `physics_fall_2017_watson` thành một câu không còn dùng view nào.

<details><summary>Gợi ý đáp án</summary>

```sql
select course_id, room_number
from (select course.course_id, building, room_number
      from course, section
      where course.course_id = section.course_id
        and course.dept_name = 'Physics'
        and section.semester = 'Fall'
        and section.year = 2017) as t
where building = 'Watson';
```

</details>

**Câu 4.** Một transaction gồm 2 câu update chuyển 10 000 budget từ Finance sang History. Câu thứ 2 vi phạm check constraint. Điều gì xảy ra với câu thứ nhất?

<details><summary>Gợi ý đáp án</summary>

Transaction là atomic: khi một câu lỗi, transaction phải **rollback** toàn bộ, nên câu thứ nhất cũng bị huỷ — database như chưa từng có transaction. (Trong PostgreSQL, sau lỗi transaction ở trạng thái aborted, `commit` cũng chỉ thực hiện rollback.)

</details>

**Câu 5.** Viết assertion (chuẩn SQL): tot_cred của mỗi sinh viên bằng tổng credits các môn đã qua. Vì sao thực tế ít DBMS hỗ trợ?

<details><summary>Gợi ý đáp án</summary>

```sql
create assertion credits_earned_constraint check (
  not exists (select ID from student
              where tot_cred <> (select coalesce(sum(credits), 0)
                                 from takes natural join course
                                 where student.ID = takes.ID
                                   and grade is not null and grade <> 'F')));
```
Kiểm tra assertion sau **mọi** thay đổi trên student, takes, course rất tốn kém → hầu hết DBMS không hỗ trợ; thay bằng trigger.

</details>

**Câu 6.** Phân biệt 4 loại privilege thay đổi schema (index, resources, alteration, drop).

<details><summary>Gợi ý đáp án</summary>

**index**: tạo/xoá index · **resources**: tạo relation mới · **alteration**: thêm/xoá thuộc tính · **drop**: xoá relation.

</details>

## 4. Bài tập SQL (34 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| 4.01 | natural join | ★☆☆ | Dùng natural join: name của sinh viên và course_id các môn họ đã học. |
| 4.02 | natural join (đúng) | ★★☆ | name của sinh viên và title các môn họ đã học — cách đúng, tránh bẫy natural join với dept_name. |
| 4.03 | natural join (bẫy) | ★★☆ | Đếm số dòng của cách sai `student natural join takes natural join course`. So sánh với số dòng của 4.02 để thấy bao nhiêu cặp bị mất. |
| 4.04 | join using | ★☆☆ | Dùng `join ... using`: ID instructor, course_id và building nơi section đó học (instructor dạy section). |
| 4.05 | inner join on | ★☆☆ | Dùng `inner join ... on`: tất cả cột của course và prereq ghép theo course_id. |
| 4.06 | left outer join | ★★☆ | Mọi course cùng prereq_id của nó (course không có prereq vẫn xuất hiện với prereq_id = null). Trả về course_id, title, prereq_id. |
| 4.07 | left outer join | ★★☆ | Dùng left outer join (không dùng except/not in): ID và name của sinh viên chưa học môn nào. |
| 4.08 | right outer join | ★★☆ | Dùng right outer join giữa section và course: liệt kê course_id, title, semester, year của mọi course, kể cả course chưa từng mở section. |
| 4.09 | full outer join | ★★★ | Dùng full outer join hai tập course_id (không trùng): mở ở Fall 2017 và mở ở Spring 2018. Trả về 2 cột `fall_2017`, `spring_2018`; môn chỉ mở một kỳ thì cột kia là null. |
| 4.10 | outer join + count | ★★☆ | Với mọi instructor: ID, name và số section đã dạy (`num_sections`, bằng 0 nếu chưa dạy). |
| 4.11 | create view | ★☆☆ | Tạo view `faculty` gồm ID, name, dept_name của instructor (ẩn salary). Sau đó dùng view tìm tên giảng viên khoa `Biology`. |
| 4.12 | create view | ★☆☆ | Tạo view `departments_total_salary(dept_name, total_salary)` chứa tổng lương mỗi khoa. |
| 4.13 | view of view | ★★☆ | Tạo view `physics_fall_2017(course_id, sec_id, building, room_number)` — các section của khoa Physics mở ở Fall 2017; rồi view `physics_fall_2017_watson(course_id, room_number)` dựa trên view thứ nhất, chỉ lấy building `Watson`. |
| 4.14 | update view | ★★☆ | Tạo view `faculty` (như 4.11) rồi insert qua view giảng viên `('30765', 'Green', 'Music')`. Salary trong bảng instructor sẽ là gì? |
| 4.15 | with check option | ★★☆ | Tạo view `history_instructors` (mọi cột của instructor khoa History) with check option, để chèn giảng viên khoa khác qua view sẽ bị từ chối. |
| 4.16 | materialized view | ★★★ | Tạo materialized view `dept_stats(dept_name, num_instructors)`. Sau đó chèn instructor `('99999', 'Lee', 'Music', 50000)` và refresh view để số liệu được cập nhật. |
| 4.17 | commit | ★★☆ | Viết một transaction chuyển 10000 budget từ khoa `Finance` sang khoa `History` rồi commit. *(Bài này chạy trên CSDL mới, được phép dùng begin/commit.)* |
| 4.18 | rollback | ★☆☆ | Mở transaction, xoá toàn bộ takes, đếm số dòng của takes (trong transaction), rồi rollback. Câu lệnh cuối cùng của bạn: đếm lại số dòng của takes sau khi rollback. |
| 4.19 | savepoint | ★★★ | Trong một transaction: tăng 10% lương khoa `Comp. Sci.`; tạo `savepoint s1`; xoá instructor khoa `Music`; quay lại `s1` (huỷ việc xoá); commit. |
| 4.20 | check / pk / fk | ★★☆ | Tạo bảng `scholarship`: - `student_id varchar(5)` tham chiếu student (xoá sinh viên thì xoá học bổng — on delete cascade) - `semester varchar(6)` chỉ nhận Fall, Winter, Spring, Summer - `year numeric(4,0)` - `amount numeric(8,2)` not null, phải > 0 - primary key (student_id, semester, year) |
| 4.21 | unique | ★★☆ | Thêm cột `email varchar(50)` vào instructor với ràng buộc unique. (Hệ thống sẽ thử: gán cùng một email cho 2 người phải lỗi, nhưng nhiều người cùng email null thì được.) |
| 4.22 | on delete set null | ★★☆ | Tạo bảng `lab(lab_id varchar(5) primary key, dept_name varchar(20))` với foreign key dept_name → department on delete set null. Chèn `('L1', 'Physics')`, `('L2', 'Music')`, rồi xoá khoa `Music`. |
| 4.23 | deferred constraint | ★★★ | Tạo bảng `person(ID char(10) primary key, name char(40), mother char(10), father char(10))`, mother và father là foreign key tham chiếu chính person và là deferrable initially deferred. Trong một transaction, chèn con `('P3', 'Child', 'P1', 'P2')` trước, rồi mới chèn `('P1', 'Mom', null, null)`, `('P2', 'Dad', null, null)`, rồi commit. |
| 4.24 | timestamp / interval | ★★☆ | Bảng `account_txn(account_number, date_time, value)`: với mỗi tài khoản, trả về account_number và khoảng thời gian giữa giao dịch đầu tiên và cuối cùng (`span`, kiểu interval). |
| 4.25 | date + interval | ★★☆ | Từ `daily_sales`: trả về sale_date và ngày sau đó 1 tuần (`one_week_later`), chỉ cho các ngày có value > 100, sắp theo sale_date. |
| 4.26 | domain | ★★☆ | Tạo domain `degree_level varchar(10)` chỉ nhận `Bachelors`, `Masters`, `Doctorate` (đặt tên constraint `degree_level_test`). Thêm cột `degree degree_level` vào student. |
| 4.27 | domain as type | ★★☆ | Chuẩn SQL viết `create type Dollars as numeric(12,2) final`. Trong PostgreSQL hãy tạo domain `dollars` là numeric(12,2) và không âm, rồi tạo bảng `donation(donor varchar(30), amount dollars)` và chèn `('Alice', 1500.5)`. |
| 4.28 | index | ★☆☆ | Tạo index tên `instructor_dept_idx` trên cột dept_name của instructor. |
| 4.29 | grant | ★★☆ | Tạo role `grader`. Cấp cho grader quyền select trên takes và quyền update chỉ trên cột grade của takes. |
| 4.30 | revoke | ★★☆ | Tạo role `clerk`, cấp select, insert, update trên department; sau đó thu hồi insert và update. |
| 4.31 | roles chain | ★★★ | Tạo chuỗi role như slide: `teaching_assistant`, `instructor_role`, `dean`. Grant select trên takes cho teaching_assistant; grant teaching_assistant cho instructor_role; grant instructor_role cho dean. (dean phải kế thừa quyền select trên takes.) |
| 4.32 | authorization on views | ★★★ | Tạo view `physics_instructor` (mọi cột instructor khoa Physics) và role `phys_staff`; chỉ grant select trên view cho phys_staff. (Hệ thống sẽ `set role phys_staff` rồi đọc view: phải đọc được view nhưng không đọc được bảng instructor.) |
| 4.33 | with grant option | ★★★ | Tạo role `amit`, `satoshi`. Grant select trên department cho amit with grant option. Sau đó đóng vai amit (`set role amit`) grant select tiếp cho satoshi, rồi `reset role`. |
| 4.34 | revoke cascade | ★★★ | Làm lại toàn bộ 4.33, sau đó revoke quyền select của amit với cascade. Quyền mà amit đã cấp cho satoshi cũng phải biến mất. (Thử đổi cascade thành restrict xem lỗi gì!) |
