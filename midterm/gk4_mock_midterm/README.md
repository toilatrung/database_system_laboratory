# Đề thi thử GK — Đề thi thử giữa kỳ — Chương 1–4

*Mock Midterm (Chapters 1–4) · Biến thể của Practice Exercises chương 1–4, Database System Concepts 7th Ed.*

> **Cách học:** *Tự luận lý thuyết* → *Bài tập SQL* → *Ghi nhớ nhanh*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk4`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tự luận lý thuyết (8 câu)

**Câu 1.** **A1** — Cho bank database. (a) Chỉ ra primary key và mọi foreign key của borrower và depositor. (b) Cho một ví dụ insert và một ví dụ delete vi phạm FK depositor.account_number → account.

<details><summary>Gợi ý đáp án</summary>

**(a)** borrower(**ID, loan_number**): FK ID → customer, loan_number → loan. depositor(**ID, account_number**): FK ID → customer, account_number → account. Khoá gồm cả hai cột vì quan hệ nhiều–nhiều (một khách nhiều tài khoản, tài khoản đứng tên chung).

**(b)** Insert `('12345', 'A-999')` vào depositor khi account không có A-999. Delete `A-101` khỏi account khi depositor còn `('67890', 'A-101')` (nếu FK không có on delete cascade).

</details>

**Câu 2.** **A2** — Viết đại số quan hệ trên bank database: (a) tên các branch ở thành phố Horseneck có assets > 1.000.000; (b) ID khách có loan ở **mọi** branch của thành phố Brooklyn.

<details><summary>Gợi ý đáp án</summary>

**(a)** Π<sub>branch_name</sub>(σ<sub>branch_city = "Horseneck" ∧ assets > 1000000</sub>(branch))

**(b)** Dùng division: r ← Π<sub>ID, branch_name</sub>(borrower ⋈ loan), s ← Π<sub>branch_name</sub>(σ<sub>branch_city = "Brooklyn"</sub>(branch)); kết quả **r ÷ s**.

Không dùng ÷: Π<sub>ID</sub>(r) − Π<sub>ID</sub>((Π<sub>ID</sub>(r) × s) − r).

</details>

**Câu 3.** **A3** — Giải thích vì sao truy vấn sau cho kết quả sai khi một section chưa có sinh viên, và sửa lại: `select course_id, sec_id, count(*) from section natural join takes where semester = 'Fall' and year = 2017 group by course_id, sec_id`.

<details><summary>Gợi ý đáp án</summary>

**Lỗi:** inner join loại các section không có dòng takes → section 0 sinh viên **biến mất** (PE 3.1e). (Ngoài ra nếu đổi sang outer join thì phải dùng `count(takes.ID)`, không dùng `count(*)`.)

**Sửa 1 — scalar subquery:**
```sql
select course_id, sec_id,
       (select count(ID) from takes t
        where t.course_id = s.course_id and t.sec_id = s.sec_id
          and t.semester = s.semester and t.year = s.year) as enrollment
from section s where semester = 'Fall' and year = 2017;
```
**Sửa 2 — outer join:** `section left outer join takes using (course_id, sec_id, semester, year)` + `count(takes.ID)`.

</details>

**Câu 4.** **A4** — Viết DDL cho insurance database (person, car, accident, owns, participated) với đầy đủ primary key, foreign key. Khi xoá một car, ta muốn các dòng owns của xe đó bị xoá theo — khai báo thế nào?

<details><summary>Gợi ý đáp án</summary>

```sql
create table person (driver_id varchar(5) primary key, name varchar(30) not null, address varchar(50));
create table car (license_plate varchar(10) primary key, model varchar(30), year integer);
create table accident (report_number varchar(10) primary key, year integer, location varchar(50));
create table owns (
  driver_id varchar(5) references person,
  license_plate varchar(10) references car on delete cascade,
  primary key (driver_id, license_plate));
create table participated (
  report_number varchar(10) references accident,
  license_plate varchar(10) references car,
  driver_id varchar(5) references person,
  damage_amount numeric(10,2),
  primary key (report_number, license_plate));
```
**Ý chấm:** khoá kép của owns và participated; FK đủ chiều; `on delete cascade` đặt ở **owns.license_plate** (bảng referencing). Nếu participated không cascade, xoá xe đã gặp tai nạn sẽ bị từ chối — phải quyết định có giữ lịch sử tai nạn hay không.

</details>

**Câu 5.** **A5** — Định nghĩa view `customer_balance(ID, total_balance)` cho tổng số dư mỗi khách, **kể cả khách không có tài khoản (tổng = 0)**. View này có update được không? User chỉ có quyền select trên view thì có đọc được bảng account không?

<details><summary>Gợi ý đáp án</summary>

```sql
create view customer_balance (ID, total_balance) as
select c.ID, coalesce(sum(a.balance), 0)
from customer c left outer join depositor d on c.ID = d.ID
                left outer join account a on a.account_number = d.account_number
group by c.ID;
```
**Ý chấm:** cần **left outer join** + `coalesce` (sum trên tập rỗng = null). View có join và aggregate nên **không** updatable. Quyền select trên view **không** cho đọc account (PE 4.13) — chỉ thấy dữ liệu đã tổng hợp.

</details>

**Câu 6.** 

> Suppose you want to build a course-registration system for a university. Consider each of the points listed in Section 1.2 as disadvantages of keeping data in a file-processing system. Discuss the relevance of each point to this application. (Variant of Exercise 1.4)

**A6 · biến thể PE 1.1/1.4** — Trường muốn làm hệ thống đăng ký môn học. Với **từng** nhược điểm của file-processing system (Section 1.2), nêu một tình huống cụ thể của hệ thống này mà nhược điểm đó gây ra. Sau đó nêu **hai nhược điểm** khi dùng DBMS thay cho file.

<details><summary>Gợi ý đáp án</summary>

**Nhược điểm của file-processing (mỗi ý một tình huống):**
- **Data redundancy & inconsistency:** địa chỉ sinh viên lưu ở file phòng đào tạo và file thư viện → sửa một nơi, nơi kia sai.
- **Difficulty in accessing data:** muốn "sinh viên đăng ký trên 18 tín chỉ" phải viết chương trình mới.
- **Data isolation:** dữ liệu rải nhiều file, nhiều định dạng → khó viết chương trình lấy dữ liệu.
- **Integrity problems:** "lớp không quá sức chứa phòng", "tot_cred ≥ 0" bị chôn trong code, khó thêm/sửa.
- **Atomicity problems:** chuyển lớp = huỷ lớp cũ + đăng ký lớp mới; máy hỏng giữa chừng → mất chỗ cả hai lớp.
- **Concurrent-access anomalies:** hai sinh viên cùng lấy chỗ cuối cùng → lớp vượt sĩ số.
- **Security problems:** giảng viên chỉ được xem điểm lớp mình, khó phân quyền trên file.

**Nhược điểm DBMS (PE 1.1):** cài đặt tốn **chi phí, kiến thức, thời gian**; độ **phức tạp** có thể làm hiệu năng kém với ứng dụng đơn giản.

</details>

**Câu 7.** 

> Consider the relation takes(ID, course_id, sec_id, semester, year, grade). Explain why grade is not part of the primary key. Could {ID, course_id} alone be a primary key? (Variant of Exercises 2.3 and 2.4)

**A7 · biến thể PE 2.3/2.4** — Bảng takes(ID, course_id, sec_id, semester, year, grade). (a) Vì sao grade **không** thuộc primary key? (b) {ID, course_id} có làm primary key được không? (c) Trong dữ liệu mẫu hiện tại không có hai dòng trùng (ID, course_id). Điều đó có chứng minh được (b) không?

<details><summary>Gợi ý đáp án</summary>

**(a)** Mỗi sinh viên học một section (course_id, sec_id, semester, year) chỉ có **một** grade → grade **được xác định** bởi các cột khoá, đưa vào khoá là thừa và cho phép hai điểm khác nhau cho cùng một lần học (giống lý luận end_time của time_slot, PE 2.3).

**(b) Không:** sinh viên có thể **học lại** cùng course ở học kỳ khác → hai dòng trùng (ID, course_id). Khoá phải gồm cả section: (ID, course_id, sec_id, semester, year).

**(c) Không** (PE 2.4): key là ràng buộc trên **schema**, áp cho **mọi** instance hợp lệ; một instance cụ thể không trùng không chứng minh được gì.

</details>

**Câu 8.** 

> Explain exactly what happens when a tuple is deleted from emp_tree(employee_id primary key, manager_id references emp_tree(employee_id) on delete cascade). What changes if the clause is on delete set null instead? (Variant of Exercise 4.9)

**A8 · biến thể PE 4.9, 4.13** — (a) Bảng emp_tree(employee_id primary key, manager_id) với manager_id là foreign key tham chiếu emp_tree(employee_id) **on delete cascade**. Giải thích chính xác điều gì xảy ra khi xoá một nhân viên; nếu đổi thành **on delete set null** thì sao? (b) User được grant **select** trên một view v (chỉ dựa trên bảng r) có cần quyền select trên r không? Còn **update** trên v thì sao?

<details><summary>Gợi ý đáp án</summary>

**(a) on delete cascade:** xoá nhân viên X → mọi dòng có manager_id = X bị xoá, rồi **đệ quy** xoá cấp dưới của những người đó… → **toàn bộ cây** dưới X biến mất (PE 4.9). Cả dây chuyền nằm trong cùng một transaction: một bước lỗi thì không dòng nào bị xoá.
**on delete set null:** chỉ xoá X; cấp dưới **trực tiếp** của X có manager_id = null, cấp dưới gián tiếp không đổi.

**(b)** Select trên v: **không cần** quyền trên r — view là cách cấp quyền chỉ trên một phần dữ liệu (PE 4.13). Update trên v: theo sách **có cần** — update qua v thực chất là update r, nên phải được phép cập nhật r. *(PostgreSQL chạy view bằng quyền của chủ view, nên trên thực tế user chỉ cần quyền update trên view.)*

</details>

## 2. Bài tập SQL (12 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK4.01 | outer join + count | ★★☆ | Bank database. Với mọi branch: branch_name và số loan của branch đó (`num_loans`, bằng 0 nếu không có). Không dùng subquery. |
| GK4.02 | intersect | ★☆☆ | ID các khách hàng vừa có account vừa có loan. |
| GK4.03 | division (for all) | ★★★ | ID và customer_name của khách có account ở mọi branch đặt tại thành phố `Brooklyn`. |
| GK4.04 | with + max (ties) | ★★☆ | Branch có tổng số tiền cho vay (sum amount của loan) lớn nhất — nếu hoà thì trả về tất cả. Trả về branch_name và total_amount. |
| GK4.05 | having + subquery | ★★☆ | Các branch có số dư trung bình (avg balance của account) lớn hơn số dư trung bình của toàn bộ account. Trả về branch_name. |
| GK4.06 | correlated subquery | ★★☆ | Employee database. ID, person_name và salary của nhân viên có lương cao hơn lương trung bình của chính công ty mình. |
| GK4.07 | update + case | ★★☆ | Nhân viên của `Mega Corp`: lương dưới 50000 tăng 8%, còn lại tăng 4%. Viết một câu update (an toàn với thứ tự). |
| GK4.08 | insert ... select | ★★★ | Mỗi khách có loan ở branch `Downtown` được mở một account mới tại Downtown: account_number là `'A-9' \|\| ID`, balance 100; đồng thời thêm dòng depositor tương ứng. |
| GK4.09 | view with check option | ★★☆ | Tạo view `brooklyn_branches` gồm mọi cột của branch ở thành phố `Brooklyn`, with check option. |
| GK4.10 | FK self cascade | ★★★ | Tạo bảng `emp_tree(employee_id varchar(5) primary key, manager_id varchar(5))` với manager_id là foreign key tham chiếu chính emp_tree, on delete cascade. Nạp mọi nhân viên của employee (manager_id lấy từ manages, null nếu không có quản lý), rồi xoá nhân viên `'10004'`. |
| GK4.11 | grant on view | ★★☆ | Tạo view `small_bank_staff(ID, person_name, city)` — nhân viên của `Small Bank Corporation`. Tạo role `hr_clerk`, cấp quyền select trên view (không cấp gì trên employee/works). |
| GK4.12 | RA → SQL | ★☆☆ | Viết SQL cho Π[ID](σ[city = "Miami"](employee)) − Π[ID](σ[company_name = "First Bank Corporation"](works)). |

## 3. Ghi nhớ nhanh

### 1. Cách làm đề thi thử
- **Thời gian gợi ý: 90 phút**, làm liền một mạch, không mở slide.
- Đề có **hai phần giống đề thật**: **A. Tự luận lý thuyết** (viết ra giấy, khoảng 35 phút) và **B. SQL** (khoảng 55 phút). Không có trắc nghiệm. Trong phòng thi phải viết SQL trên giấy — hãy viết nháp hết rồi mới gõ vào máy để chạy kiểm tra.
- Các câu là Practice Exercises của sách hoặc **biến thể** của chúng (đổi lược đồ, đổi hằng số, thêm "bẫy"). Câu nào sai thì quay lại phần ôn tương ứng (GK1–GK3).

| Phần | Nội dung | Điểm |
|---|---|---|
| A. Tự luận lý thuyết | 8 câu × 0,5 | 4,0 |
| B. SQL | 12 bài × 0,5 | 6,0 |
| **Tổng** | | **10** |

Tự chấm: tự luận so với *gợi ý đáp án* (mỗi ý in đậm là một ý chấm điểm), rồi đánh dấu "Đã tự chấm"; SQL chấm tự động bằng nút **Kiểm tra**.

### 2. Kế hoạch 7 ngày (tuần 7 → thi tuần 8)
| Ngày | Việc cần làm | Ở đâu |
|---|---|---|
| 1 | Ôn Chương 1–2: keys, foreign key, 6 phép đại số quan hệ + join, division | Part 1 · Chương 1, 2 → **GK1** |
| 2 | Practice Exercises 3.1–3.4 (select/aggregate/subquery, insert/delete/update) | Part 1 · Chương 3 → **GK2** |
| 3 | Practice Exercises 3.5–3.10 (case, like, bank, employee: all/some, not exists, having) | **GK2** |
| 4 | Practice Exercises 4.1–4.6 (natural join trap, outer join, view GPA) | Part 1 · Chương 4 → **GK3** |
| 5 | Practice Exercises 4.7–4.13 (DDL + FK, assertion, cascade, coalesce, authorization) | **GK3** |
| 6 | Làm đề thi thử này trong 90 phút, chấm điểm, ghi lại câu sai | **Đề GK** |
| 7 | Làm lại các câu sai + bài ★★★ của GK1–GK3; đọc lại bảng "phải thuộc" bên dưới | GK1–GK3 |

### 3. Checklist "phải thuộc"
- Superkey ⊇ candidate key (tối thiểu) ⊇ primary key (được chọn); foreign key: referencing → referenced; insert vào referencing / delete ở referenced có thể vi phạm.
- σ, Π (loại trùng), ∪, −, ×, ρ là 6 phép cơ bản; ∩, ⋈, ÷, ← suy ra được. Division "**với mọi**" ↔ SQL `not exists (A except B)`.
- `from r1, r2` là tích Descartes: nếu một bảng rỗng thì kết quả rỗng (PE 3.7).
- Aggregate bỏ qua null, trừ `count(*)`; `count` trên tập rỗng = 0, `sum/avg/max` = null.
- "Tìm X có giá trị lớn nhất (có thể hoà)": `with t as (...) select ... where v = (select max(v) from t)` hoặc `having ... >= all (...)`.
- Cột trong `select` không nằm trong aggregate phải có trong `group by`; điều kiện trên nhóm đặt ở `having`.
- Đếm cả nhóm 0 phần tử: **left outer join** + `count(cột của bảng bên phải)` hoặc **scalar subquery**.
- Bẫy natural join: `instructor natural join teaches natural join course` ghép thêm theo dept_name.
- `update` theo nhiều mức: dùng `case` trong một câu (thứ tự 2 câu update có thể làm sai kết quả).
- View đơn giản mới update được; `with check option` chặn dòng không thoả where. Quyền select trên view không cần quyền trên bảng gốc.
- `on delete cascade` trên FK tự tham chiếu xoá **toàn bộ cây** cấp dưới (PE 4.9).
