# Đề thi thử GK — Đề thi thử giữa kỳ — Chương 1–4

*Mock Midterm (Chapters 1–4) · Biến thể của Practice Exercises chương 1–4, Database System Concepts 7th Ed.*

> **Cách học:** đọc *Tóm tắt kiến thức* → làm *Trắc nghiệm* → trả lời *Câu hỏi tự luận* → làm *Bài tập SQL* trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk4`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Cách làm đề thi thử
- **Thời gian gợi ý: 90 phút**, làm liền một mạch, không mở slide.
- Làm **Trắc nghiệm** và **Tự luận** ra giấy trước (khoảng 45 phút), sau đó mới làm **Bài tập SQL** (khoảng 45 phút). Trong phòng thi thật thường phải viết SQL trên giấy — hãy viết nháp trước khi bấm chạy.
- Các câu ở đây là **biến thể** của Practice Exercises (đổi lược đồ, đổi hằng số, thêm "bẫy") để kiểm tra bạn hiểu chứ không phải nhớ đáp án. Nếu sai câu nào, quay lại phần ôn tương ứng (GK1–GK3).

| Phần | Nội dung | Điểm |
|---|---|---|
| A. Trắc nghiệm | 25 câu × 0,2 | 5,0 |
| B. Tự luận | 5 câu | 2,5 |
| C. SQL | 12 bài | 2,5 |
| **Tổng** | | **10** |

Tự chấm: trắc nghiệm chấm tự động; tự luận so với *gợi ý đáp án* (mỗi ý in đậm là một ý chấm điểm); SQL chấm tự động bằng nút **Kiểm tra**.

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

## 2. Trắc nghiệm (25 câu)

**Câu 1.** Relation account(account_number, branch_name, balance) có primary key account_number. Tập nào là superkey nhưng KHÔNG phải candidate key?

- A. {account_number}
- B. {account_number, balance}
- C. {branch_name}
- D. {branch_name, balance}

<details><summary>Đáp án</summary>

**B** — Chứa candidate key {account_number} nên là superkey, nhưng không tối thiểu.

</details>

**Câu 2.** Bank database: loan.branch_name là foreign key tham chiếu branch. Thao tác nào CÓ THỂ vi phạm ràng buộc này?

- A. Insert một branch mới
- B. Delete một loan
- C. Delete một branch đang có loan
- D. Update amount của một loan

<details><summary>Đáp án</summary>

**C** — Xoá tuple ở referenced relation (branch) mà vẫn còn tuple referencing (loan) trỏ tới.

</details>

**Câu 3.** Bảng takes có primary key (ID, course_id, sec_id, semester, year). Vì sao grade KHÔNG nằm trong khoá?

- A. Vì grade có thể null
- B. Vì một sinh viên học một section chỉ có một điểm — grade được xác định bởi khoá
- C. Vì grade là chuỗi
- D. Vì SQL cấm

<details><summary>Đáp án</summary>

**B** — Giống lý luận end_time trong time_slot (PE 2.3): thuộc tính được xác định duy nhất bởi các thuộc tính khoá thì không cần đưa vào khoá.

</details>

**Câu 4.** Kết quả của σ<sub>borrower.loan_number = loan.loan_number</sub>(borrower × loan) chứa những customer nào?

- A. Mọi customer
- B. Chỉ customer có ít nhất một loan; customer có 2 loan xuất hiện 2 lần
- C. Chỉ customer có đúng một loan
- D. Customer không có loan với cột loan = null

<details><summary>Đáp án</summary>

**B** — Giống PE 2.5: tích + chọn = join; tuple không khớp bị loại, mỗi cặp khớp sinh một dòng.

</details>

**Câu 5.** Biểu thức nào tìm ID khách hàng có account nhưng KHÔNG có loan?

- A. Π<sub>ID</sub>(depositor) ∩ Π<sub>ID</sub>(borrower)
- B. Π<sub>ID</sub>(depositor) − Π<sub>ID</sub>(borrower)
- C. Π<sub>ID</sub>(borrower) − Π<sub>ID</sub>(depositor)
- D. Π<sub>ID</sub>(depositor × borrower)

<details><summary>Đáp án</summary>

**B** — Set difference: có trong depositor mà không có trong borrower.

</details>

**Câu 6.** r(A,B) ÷ s(B) trả về gì?

- A. Các A xuất hiện với ít nhất một B của s
- B. Các A xuất hiện với MỌI B của s
- C. Các B không có trong r
- D. r × s

<details><summary>Đáp án</summary>

**B** — Division là phép "với mọi" (PE 2.9).

</details>

**Câu 7.** Muốn tìm nhân viên lương cao nhất bằng đại số quan hệ chỉ dùng 6 phép cơ bản, ta cần phép nào để so sánh hai bản sao của works?

- A. Union
- B. Rename ρ
- C. Projection
- D. Không cần phép nào

<details><summary>Đáp án</summary>

**B** — PE 2.8b: ρ<sub>A</sub>(works) và ρ<sub>B</sub>(works), tìm người có A.salary < B.salary rồi lấy phần bù.

</details>

**Câu 8.** Câu `select p.a from p, r1, r2 where p.a = r1.a or p.a = r2.a` trả về rỗng khi nào dù p và r1 đều có giá trị khớp?

- A. Khi r2 rỗng
- B. Khi p có null
- C. Khi r1 có trùng lặp
- D. Không bao giờ

<details><summary>Đáp án</summary>

**A** — PE 3.7: from p, r1, r2 là tích Descartes; một bảng rỗng → tích rỗng.

</details>

**Câu 9.** `select count(grade) from takes where ID = '98988'` trả về gì nếu sinh viên này có 2 dòng takes, một dòng grade = null?

- A. 0
- B. 1
- C. 2
- D. null

<details><summary>Đáp án</summary>

**B** — count(cột) bỏ qua null; count(*) mới đếm 2.

</details>

**Câu 10.** Cho branch có 9 dòng và loan chỉ tham chiếu 7 branch. `select branch_name, count(*) from branch natural left outer join loan group by branch_name` sai ở đâu?

- A. Thiếu branch
- B. Branch không có loan được đếm là 1 thay vì 0
- C. Lỗi cú pháp
- D. Đếm trùng loan

<details><summary>Đáp án</summary>

**B** — Dòng bù null vẫn là một dòng: phải dùng count(loan_number) (PE 4.2a).

</details>

**Câu 11.** Điều kiện nào đúng cho "ID nhân viên lương cao hơn MỌI nhân viên của Small Bank Corporation"?

- A. salary > some (select salary ... )
- B. salary > all (select salary ... )
- C. salary in (select salary ...)
- D. exists (select salary ...)

<details><summary>Đáp án</summary>

**B** — > all = lớn hơn giá trị lớn nhất (PE 3.9d).

</details>

**Câu 12.** Nếu subquery của `salary > all (subquery)` trả về tập rỗng thì điều kiện có giá trị gì?

- A. false
- B. unknown
- C. true
- D. Lỗi

<details><summary>Đáp án</summary>

**C** — "Lớn hơn mọi phần tử của tập rỗng" luôn đúng (vacuous truth).

</details>

**Câu 13.** Truy vấn "công ty đặt ở MỌI thành phố mà Small Bank Corporation đặt" thường viết bằng cấu trúc nào?

- A. group by ... having count(*) > 1
- B. not exists ((thành phố của Small Bank) except (thành phố của công ty S))
- C. in (select city ...)
- D. left outer join

<details><summary>Đáp án</summary>

**B** — PE 3.9e: A ⊆ B ⇔ A − B = ∅.

</details>

**Câu 14.** `where name like '%sci%'` không khớp "Comp. Sci." vì sao, và sửa thế nào?

- A. like không hỗ trợ dấu chấm; dùng =
- B. like phân biệt hoa thường; dùng lower(name) like '%sci%'
- C. Phải dùng _ thay vì %
- D. Thiếu escape

<details><summary>Đáp án</summary>

**B** — PE 3.6.

</details>

**Câu 15.** Lệnh nào tăng 10% cho lương ≤ 50000 và 4% cho phần còn lại mà KHÔNG phụ thuộc thứ tự thực hiện?

- A. Hai câu update, câu 10% trước
- B. Hai câu update, câu 4% trước
- C. Một câu update với set salary = salary * case when salary <= 50000 then 1.10 else 1.04 end
- D. Không thể làm được

<details><summary>Đáp án</summary>

**C** — PE 3.10b: hai câu update riêng có thể "tăng hai lần" cho dòng vượt ngưỡng sau câu đầu.

</details>

**Câu 16.** `instructor natural join teaches natural join section natural join course` (PE 4.1) bị sai vì?

- A. section và course không có cột chung
- B. Ghép thêm theo dept_name nên mất các môn dạy ngoài khoa của giảng viên
- C. Natural join không kết hợp được
- D. Thiếu group by

<details><summary>Đáp án</summary>

**B** — instructor và course đều có dept_name.

</details>

**Câu 17.** r(A,B), s(B,C), t(B,D), mọi thuộc tính not null. Trong r ⟕ (s ⟕ t), cột nào có thể null?

- A. Chỉ C
- B. Chỉ D; nếu C null thì D cũng null
- C. Cả hai, độc lập nhau
- D. Không cột nào

<details><summary>Đáp án</summary>

**B** — PE 4.4b: s ⟕ t tính trước nên C luôn có giá trị khi tuple s tồn tại.

</details>

**Câu 18.** Viết a ⟗ b (natural) bằng `full outer join ... on` mà không có hai bản cột name: cần hàm nào?

- A. nullif
- B. coalesce(a.name, b.name)
- C. cast
- D. decode(a.name)

<details><summary>Đáp án</summary>

**B** — PE 4.10.

</details>

**Câu 19.** View `v` định nghĩa `select * from branch where branch_city = 'Brooklyn'` (không check option). Insert qua v tuple có branch_city = 'Rye' thì sao?

- A. Bị từ chối
- B. Được chèn vào branch nhưng không thấy khi select * from v
- C. Chèn với branch_city = null
- D. Chèn vào cả hai

<details><summary>Đáp án</summary>

**B** — PE 4.13 ý 3; with check option mới chặn.

</details>

**Câu 20.** User được grant select trên view v (định nghĩa trên r). User có cần quyền select trên r?

- A. Có
- B. Không — đó chính là lợi ích của view
- C. Chỉ khi v là materialized
- D. Chỉ với update

<details><summary>Đáp án</summary>

**B** — PE 4.13 ý 1.

</details>

**Câu 21.** Bảng manager(employee_ID PK, manager_ID FK → manager on delete cascade). Xoá một giám đốc cấp cao nhất thì?

- A. Chỉ xoá giám đốc
- B. Xoá giám đốc và nhân viên trực tiếp
- C. Xoá toàn bộ nhân viên cấp dưới ở mọi cấp
- D. Báo lỗi

<details><summary>Đáp án</summary>

**C** — PE 4.9: cascade lan dần theo từng cấp.

</details>

**Câu 22.** `grant select on works to amit granted by current_role` khác gì so với không có mệnh đề granted by?

- A. Không khác
- B. Quyền gắn với role, còn hiệu lực khi người cấp bị xoá tài khoản
- C. Amit được cấp lại quyền cho người khác
- D. Chỉ áp dụng trong transaction hiện tại

<details><summary>Đáp án</summary>

**B** — PE 4.12.

</details>

**Câu 23.** Ràng buộc "instructor không dạy hai phòng khác nhau trong cùng time slot và học kỳ" — PostgreSQL hiện thực thế nào thay cho create assertion?

- A. check với subquery
- B. Trigger (hoặc truy vấn kiểm tra định kỳ)
- C. unique
- D. not null

<details><summary>Đáp án</summary>

**B** — PE 4.8: assertion và check có subquery không được hỗ trợ.

</details>

**Câu 24.** Vì sao test database cần có tuple ở referenced relation KHÔNG được tham chiếu (ví dụ department không có instructor)?

- A. Để tăng tốc
- B. Để phát hiện truy vấn quên outer join (department có 0 giảng viên bị mất)
- C. Bắt buộc bởi SQL
- D. Để kiểm tra primary key

<details><summary>Đáp án</summary>

**B** — PE 4.5b.

</details>

**Câu 25.** So với một ngôn ngữ lập trình, DDL của DBMS KHÔNG có đặc điểm nào sau đây?

- A. Khai báo ràng buộc toàn vẹn (FK, check)
- B. Tạo đối tượng tồn tại lâu dài trong database
- C. Hệ kiểu phong phú hơn kiểu của Java/C++
- D. Hỗ trợ phân quyền

<details><summary>Đáp án</summary>

**C** — PE 1.2: hệ kiểu của ngôn ngữ lập trình thường phong phú hơn SQL.

</details>

## 3. Câu hỏi tự luận (5 câu)

**Câu 1.** (0,5đ) Cho bank database. (a) Chỉ ra primary key và mọi foreign key của borrower và depositor. (b) Cho một ví dụ insert và một ví dụ delete vi phạm FK depositor.account_number → account.

<details><summary>Gợi ý đáp án</summary>

**(a)** borrower(**ID, loan_number**): FK ID → customer, loan_number → loan. depositor(**ID, account_number**): FK ID → customer, account_number → account. Khoá gồm cả hai cột vì quan hệ nhiều–nhiều (một khách nhiều tài khoản, tài khoản đứng tên chung).

**(b)** Insert `('12345', 'A-999')` vào depositor khi account không có A-999. Delete `A-101` khỏi account khi depositor còn `('67890', 'A-101')` (nếu FK không có on delete cascade).

</details>

**Câu 2.** (0,5đ) Viết đại số quan hệ trên bank database: (a) tên các branch ở thành phố Horseneck có assets > 1.000.000; (b) ID khách có loan ở **mọi** branch của thành phố Brooklyn.

<details><summary>Gợi ý đáp án</summary>

**(a)** Π<sub>branch_name</sub>(σ<sub>branch_city = "Horseneck" ∧ assets > 1000000</sub>(branch))

**(b)** Dùng division: r ← Π<sub>ID, branch_name</sub>(borrower ⋈ loan), s ← Π<sub>branch_name</sub>(σ<sub>branch_city = "Brooklyn"</sub>(branch)); kết quả **r ÷ s**.

Không dùng ÷: Π<sub>ID</sub>(r) − Π<sub>ID</sub>((Π<sub>ID</sub>(r) × s) − r).

</details>

**Câu 3.** (0,5đ) Giải thích vì sao truy vấn sau cho kết quả sai khi một section chưa có sinh viên, và sửa lại: `select course_id, sec_id, count(*) from section natural join takes where semester = 'Fall' and year = 2017 group by course_id, sec_id`.

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

**Câu 4.** (0,5đ) Viết DDL cho insurance database (person, car, accident, owns, participated) với đầy đủ primary key, foreign key. Khi xoá một car, ta muốn các dòng owns của xe đó bị xoá theo — khai báo thế nào?

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

**Câu 5.** (0,5đ) Định nghĩa view `customer_balance(ID, total_balance)` cho tổng số dư mỗi khách, **kể cả khách không có tài khoản (tổng = 0)**. View này có update được không? User chỉ có quyền select trên view thì có đọc được bảng account không?

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

## 4. Bài tập SQL (12 bài)

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
