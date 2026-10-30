# Ôn GK · Phần 2 — Practice Exercises Chương 3 (Introduction to SQL)

*Practice Exercises — Chapter 3 · Practice Exercises 3.1–3.10 · Database System Concepts, 7th Ed.*

> **Cách học:** đọc *Tóm tắt kiến thức* → làm *Trắc nghiệm* → trả lời *Câu hỏi tự luận* → làm *Bài tập SQL* trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk2`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### Cách dùng phần này
Toàn bộ Practice Exercises Chương 3 (3.1–3.10, mọi câu a, b, c…) đều có bài SQL **tự chấm** trên dữ liệu mẫu: University, Employee database (Figure 3.19), Bank database (Figure 3.18), Insurance database (Figure 3.17), `grade_points`, `marks`. Xem cột/khoá ở *Công cụ › Lược đồ cơ sở dữ liệu*. Mỗi bài ghi rõ số PE của sách.

| PE | Nội dung | Bài SQL | Tự luận |
|---|---|---|---|
| 3.1 a–g | University: credits, Einstein, max salary, enrollment | GK2.01–GK2.08 | Câu 1, 2 |
| 3.2 a–d | grade_points, tổng điểm, GPA, null grade | GK2.09–GK2.13 | Câu 3, 4 |
| 3.3 a–c | update / delete / insert … select | GK2.14–GK2.16 | Câu 5 |
| 3.4 a–b | Insurance database | GK2.17–GK2.18 | Câu 6 |
| 3.5 a–b | `case` chấm điểm theo marks | GK2.19–GK2.20 | — |
| 3.6 | `lower(...) like` | GK2.21–GK2.22 | — |
| 3.7 | `from p, r1, r2 where ... or ...` khi r1/r2 rỗng | GK2.23 | Câu 7 |
| 3.8 a–c | Bank database | GK2.24–GK2.26 | Câu 8 |
| 3.9 a–g | Employee database: all, not exists/except, having | GK2.27–GK2.33 | Câu 9 |
| 3.10 a–b | update, `case` trong update | GK2.34–GK2.36 | Câu 10 |

### Mẫu câu hay thi
| Yêu cầu trong đề | Mẫu SQL |
|---|---|
| "Find all ... earning the highest" | `where salary = (select max(salary) from ...)` |
| "... of each section, show 0 if none" | **scalar subquery** `(select count(*) ... where ... = section....)` hoặc outer join (Ch.4) |
| "maximum of an aggregate" | `select max(x) from (select ... count(...) as x ... group by ...) t` hoặc `with` |
| "the ... that had the maximum ..." | `with t as (...) select ... from t where x = (select max(x) from t)` |
| "more than every ..." | `> all (subquery)` |
| "located in every city where ..." | `not exists ((A) except (B))` |
| "the company with the most employees (ties)" | `having count(...) >= all (select count(...) ... group by ...)` |
| "average higher than ..." | `group by ... having avg(...) > (select avg(...) ...)` |
| "has X but not Y" | `(select ...) except (select ...)` |
| "case-insensitive" | `lower(col) like '%sci%'` |
| "raise 10% unless ..., then 3%" | **một** `update ... set x = x * case when ... then 1.03 else 1.1 end` |

### Bẫy thường gặp
- **count(*) vs count(col)**: với outer join, `count(*)` đếm cả dòng null → section không có ai vẫn ra 1.
- **Join + group by làm mất nhóm rỗng** (PE 3.1e): section không có sinh viên không có dòng nào để group.
- **Aggregate trên tập rỗng**: `count` → 0, nhưng `sum/max/avg` → **null**; max của kết quả rỗng là *rỗng*, không phải 0 (PE 3.1f).
- **Chia cho 0** khi tính GPA của sinh viên chưa học môn nào (PE 3.2b) → GPA nên là null.
- **null grade** tự bị loại bởi điều kiện `takes.grade = grade_points.grade` (PE 3.2d) — cả credits lẫn points của môn đó đều không được tính.
- **Cartesian product với bảng rỗng là rỗng** (PE 3.7): `from p, r1, r2` trả về rỗng nếu r1 *hoặc* r2 rỗng, dù điều kiện là `or`.
- **Đếm người, không đếm sự kiện** (PE 3.4a): `count(distinct ...)`; và đề hỏi **chủ xe** (owns), không phải **người lái** (participated.driver_id).
- **Thứ tự hai lệnh update** (PE 3.10b): làm 10% trước rồi 3% sẽ tăng lương hai lần cho một số người.
- Schema mẫu có `check (salary > 29000)` trên instructor → lệnh của PE 3.3c (salary 10000) bị **từ chối** (SQLSTATE 23514).
- Lời giải sách PE 3.8b viết `S.customer_id` — cột đúng là `S.ID`.

## 2. Trắc nghiệm (14 câu)

**Câu 1.** PE 3.1e — Câu `select course_id, sec_id, count(ID) from section natural join takes where semester='Fall' and year=2017 group by course_id, sec_id` sai trong trường hợp nào?

- A. Khi một section có 2 instructor
- B. Khi một section không có sinh viên nào — section đó không xuất hiện
- C. Khi grade là null
- D. Không bao giờ sai

<details><summary>Đáp án</summary>

**B** — Join không tạo dòng nào cho section rỗng nên nó biến mất; scalar subquery với count trả về 0.

</details>

**Câu 2.** PE 3.1e — Scalar subquery `(select count(ID) from takes where ...)` trả về gì cho section không có sinh viên?

- A. null
- B. 0
- C. Lỗi
- D. Không có dòng

<details><summary>Đáp án</summary>

**B** — count trên tập rỗng trả về 0.

</details>

**Câu 3.** PE 3.1f — Nếu không section nào ở Fall 2017 có sinh viên, `select max(enrollment) from (... join ... group by ...)` trả về gì?

- A. 0
- B. null (một dòng null)
- C. Lỗi
- D. Hai dòng

<details><summary>Đáp án</summary>

**B** — Subquery rỗng; max trên tập rỗng là null. Sách gọi là "empty, not 0".

</details>

**Câu 4.** PE 3.2b — GPA của sinh viên chưa học môn nào nên được định nghĩa thế nào?

- A. 0
- B. null
- C. 4.0
- D. Bỏ sinh viên đó khỏi mọi báo cáo

<details><summary>Đáp án</summary>

**B** — sum(credits) = 0 → chia cho 0; cách định nghĩa có nghĩa duy nhất là null.

</details>

**Câu 5.** PE 3.2d — Môn có grade null ảnh hưởng thế nào tới truy vấn GPA dùng `takes.grade = grade_points.grade`?

- A. Làm GPA thành null
- B. Môn đó bị loại khỏi cả tử số lẫn mẫu số → GPA vẫn đúng
- C. Gây lỗi chia cho 0
- D. Được tính 0 điểm

<details><summary>Đáp án</summary>

**B** — null = ... cho unknown nên dòng bị loại trước khi aggregate.

</details>

**Câu 6.** PE 3.3b — Câu nào xoá các course chưa bao giờ được mở?

- A. delete from course where course_id in (select course_id from section)
- B. delete from course where course_id not in (select course_id from section)
- C. delete from section where course_id not in (select course_id from course)
- D. delete course where exists (select * from section)

<details><summary>Đáp án</summary>

**B** — Chưa mở = không xuất hiện trong section.

</details>

**Câu 7.** PE 3.3c chạy trên schema của sách (`check (salary > 29000)`) với salary 10000 thì sao?

- A. Chèn thành công
- B. Bị từ chối do vi phạm check constraint
- C. Chèn với salary null
- D. Chỉ chèn sinh viên đầu tiên

<details><summary>Đáp án</summary>

**B** — Check constraint làm cả câu insert ... select thất bại (SQLSTATE 23514).

</details>

**Câu 8.** PE 3.4a — Vì sao phải dùng `count(distinct ...)` và lấy người từ bảng owns?

- A. Để đếm số vụ tai nạn
- B. Một người có thể dính nhiều vụ (đếm một lần) và đề hỏi chủ xe chứ không phải người lái
- C. Vì owns không có khoá
- D. Không cần distinct

<details><summary>Đáp án</summary>

**B** — Đề: "total number of people who OWNED cars that were involved in accidents".

</details>

**Câu 9.** PE 3.7 — `select p.a1 from p, r1, r2 where p.a1 = r1.a1 or p.a1 = r2.a1` trả về gì khi r2 rỗng?

- A. Các giá trị của p có trong r1
- B. Rỗng
- C. Toàn bộ p
- D. Lỗi

<details><summary>Đáp án</summary>

**B** — p × r1 × r2 rỗng khi một thừa số rỗng, nên where không còn dòng nào để xét.

</details>

**Câu 10.** PE 3.8a — "customer có account nhưng không có loan" dùng phép nào?

- A. union
- B. intersect
- C. except
- D. natural join

<details><summary>Đáp án</summary>

**C** — (select ID from depositor) except (select ID from borrower).

</details>

**Câu 11.** PE 3.9d — "ID of each employee who earns more than every employee of Small Bank Corporation" dùng gì?

- A. > some
- B. > all
- C. = any
- D. in

<details><summary>Đáp án</summary>

**B** — salary > all (select salary from works where company_name = ...).

</details>

**Câu 12.** PE 3.9e — Cấu trúc nào diễn đạt "located in every city in which Small Bank is located"?

- A. where city in (select city ...)
- B. where not exists ((cities of Small Bank) except (cities of S))
- C. where exists (cities of Small Bank)
- D. group by city having count(*) > 1

<details><summary>Đáp án</summary>

**B** — A ⊆ B ⇔ not exists (A except B).

</details>

**Câu 13.** PE 3.9f — Vì sao dùng `having count(distinct ID) >= all (...)` thay vì `order by ... limit 1`?

- A. Nhanh hơn
- B. Để trả về TẤT CẢ công ty khi có hoà
- C. limit không có trong SQL
- D. Vì cần distinct

<details><summary>Đáp án</summary>

**B** — Đề yêu cầu "or companies, in the case where there is a tie".

</details>

**Câu 14.** PE 3.10b — Viết hai lệnh update (3% cho người sẽ vượt 100000, 10% cho người còn lại) thì thứ tự nào an toàn?

- A. 10% trước rồi 3%
- B. 3% trước rồi 10%
- C. Thứ tự nào cũng được
- D. Phải chạy đồng thời

<details><summary>Đáp án</summary>

**B** — Nếu tăng 10% trước, một người vừa được tăng có thể thoả điều kiện của lệnh 3% và bị tăng tiếp. An toàn nhất: một lệnh với case.

</details>

## 3. Câu hỏi tự luận (10 câu)

**Câu 1.** **PE 3.1e** — Câu trả lời của sách dùng scalar subquery. Vì sao cách viết `section, takes ... group by` "trông có vẻ đúng" lại sai? Sửa thế nào?

<details><summary>Gợi ý đáp án</summary>

Cách join rồi group by:

```sql
select takes.course_id, takes.sec_id, count(ID)
from section, takes
where takes.course_id = section.course_id and takes.sec_id = section.sec_id
  and takes.semester = section.semester and takes.year = section.year
  and takes.semester = 'Fall' and takes.year = 2017
group by takes.course_id, takes.sec_id
```

Section **không có sinh viên** sẽ không có dòng nào trong join nên **không xuất hiện** (lẽ ra phải có enrollment 0). Sửa: dùng scalar subquery (count trên tập rỗng = 0) như lời giải, hoặc `section left outer join takes` với `count(takes.ID)` (Chương 4). Bài GK2.06 kiểm tra đúng tình huống này.

</details>

**Câu 2.** **PE 3.1f, 3.1g** — Có bẫy gì khi tìm enrollment lớn nhất, và vì sao nên dùng with clause cho 3.1g?

<details><summary>Gợi ý đáp án</summary>

- 3.1f: nếu không section nào có sinh viên, subquery group by rỗng → `max` trả về **null** chứ không phải 0. Dùng phiên bản scalar subquery của 3.1e làm subquery thì sẽ ra 0.
- 3.1g: cần dùng kết quả enrollment **hai lần** (lọc và tính max). `with sec_enrollment as (...)` đặt tên cho nó, tránh lặp lại subquery. `count(distinct ID)` không cần vì (ID, course_id, sec_id, semester, year) là khoá của takes.

</details>

**Câu 3.** **PE 3.2a, 3.2b, 3.2c** — Sinh viên chưa học môn nào được xử lý thế nào trong các truy vấn tổng điểm và GPA?

<details><summary>Gợi ý đáp án</summary>

- 3.2a: truy vấn join không có dòng nào cho sinh viên đó → kết quả rỗng thay vì 0. Thêm:
```sql
union
select 0 from student
where ID = '12345' and not exists (select * from takes where ID = '12345')
```
- 3.2b: thêm nữa là **chia cho 0** (tổng credits = 0) → GPA hợp lý nhất là **null**: `union select null as GPA from student where ... not exists ...`.
- 3.2c: `union select ID, null as GPA from student where not exists (select * from takes where takes.ID = student.ID)` (bài GK2.12).

</details>

**Câu 4.** **PE 3.2d** — Nếu một số grade là null, các lời giải ở 3.2 còn đúng không?

<details><summary>Gợi ý đáp án</summary>

**Vẫn đúng.** Mọi truy vấn đều có điều kiện `takes.grade = grade_points.grade`; với grade null, so sánh cho *unknown* nên dòng takes đó bị loại **trước khi** aggregate — cả points lẫn **credits** của môn đó đều không được cộng. Vì vậy GPA chỉ tính trên các môn đã có điểm. (Nếu dùng outer join với grade_points thì phải tự loại credits của môn có grade null — xem PE 4.6.)

</details>

**Câu 5.** **PE 3.3** — Viết các lệnh: (a) tăng 10% lương instructor khoa Comp. Sci.; (b) xoá course chưa bao giờ mở; (c) chèn mọi student có tot_cred > 100 làm instructor cùng khoa, lương 10000. Điều gì xảy ra với (c) trên schema của sách?

<details><summary>Gợi ý đáp án</summary>

```sql
update instructor set salary = salary * 1.10 where dept_name = 'Comp. Sci.';
delete from course where course_id not in (select course_id from section);
insert into instructor select ID, name, dept_name, 10000 from student where tot_cred > 100;
```
Schema DDL của sách khai báo `salary numeric(8,2) check (salary > 29000)` → lệnh (c) vi phạm check constraint và **cả câu** bị huỷ (SQLSTATE 23514). Bài GK2.16 dùng lương 30000. Với (b), xoá course có thể kéo theo xoá prereq (`on delete cascade`).

</details>

**Câu 6.** **PE 3.4** — (a) Tổng số người sở hữu xe dính tai nạn năm 2017; (b) xoá mọi xe đời 2010 của người có ID 12345. Lưu ý gì?

<details><summary>Gợi ý đáp án</summary>

a. Không phải tổng số vụ tai nạn: người dính nhiều vụ chỉ đếm **một lần** (`count(distinct ...)`), và phải lấy **chủ xe** qua owns — chủ xe có thể không phải người lái.
```sql
select count(distinct owns.driver_id)
from accident, participated, owns
where accident.report_number = participated.report_number
  and owns.license_plate = participated.license_plate
  and accident.year = 2017;
```
b.
```sql
delete from car
where year = 2010 and license_plate in (select license_plate from owns where driver_id = '12345');
```
Sách lưu ý: các dòng owns/participated của xe đã xoá **vẫn còn** (sách không khai báo foreign key). Trong Practice Lab, owns và participated khai báo `references car on delete cascade` nên chúng bị xoá theo; không có cascade thì PostgreSQL từ chối lệnh delete.

</details>

**Câu 7.** **PE 3.7** — Với `select p.a1 from p, r1, r2 where p.a1 = r1.a1 or p.a1 = r2.a1`, khi nào câu truy vấn chọn đúng các giá trị p.a1 nằm trong r1 hoặc r2? Xét kỹ trường hợp r1 hoặc r2 rỗng.

<details><summary>Gợi ý đáp án</summary>

Câu truy vấn chọn đúng các p.a1 bằng một giá trị nào đó của r1.a1 hoặc r2.a1 **khi và chỉ khi cả r1 và r2 đều khác rỗng**. Nếu r1 hoặc r2 (hoặc p) rỗng thì tích Descartes p × r1 × r2 rỗng → kết quả rỗng, dù điều kiện dùng `or`.

Cách viết đúng: `select a1 from p where a1 in (select a1 from r1) or a1 in (select a1 from r2)` hoặc `select a1 from p where a1 in (select a1 from r1 union select a1 from r2)` (bài GK2.23). Ngoài ra bản gốc còn trả về **trùng lặp** (mỗi cặp khớp một dòng).

</details>

**Câu 8.** **PE 3.8** — Bank database: (a) ID khách có account nhưng không có loan; (b) ID khách sống cùng street và city với khách 12345; (c) tên branch có ít nhất một khách có account và sống ở Harrison. Có lỗi gì trong lời giải của sách?

<details><summary>Gợi ý đáp án</summary>

```sql
-- a
(select ID from depositor) except (select ID from borrower);
-- b
select F.ID from customer as F, customer as S
where F.customer_street = S.customer_street and F.customer_city = S.customer_city
  and S.ID = '12345';
-- c
select distinct branch_name
from account, depositor, customer
where customer.ID = depositor.ID and depositor.account_number = account.account_number
  and customer_city = 'Harrison';
```
Lời giải (b) của sách viết `S.customer_id = 12345` nhưng schema chỉ có cột **ID** → phải là `S.ID`. Kết quả (b) có cả chính khách 12345; thêm `and F.ID <> S.ID` nếu muốn loại.

</details>

**Câu 9.** **PE 3.9** — Employee database: tóm tắt cách giải a–g và những biến thể cần lưu ý.

<details><summary>Gợi ý đáp án</summary>

- a, b: join employee với works (hoặc `ID in (select ID from works where ...)`).
- c: `select ID from works where company_name <> 'First Bank Corporation'` chỉ đúng nếu mọi employee đều có trong works. Nếu có người không làm ở đâu (Leo Vu trong dữ liệu mẫu), dùng `select ID from employee where ID not in (select ID from works where company_name = 'First Bank Corporation')` hoặc outer join.
- d: `salary > all (select salary from works where company_name = 'Small Bank Corporation')`. Nếu một người làm nhiều công ty và cần tổng thu nhập thì phức tạp hơn — nhưng ID là khoá của works nên không xảy ra.
- e: `not exists ((cities of Small Bank) except (cities of S))` — tập con.
- f: `group by company_name having count(distinct ID) >= all (select count(distinct ID) from works group by company_name)` — trả về mọi công ty hoà nhau.
- g: `group by company_name having avg(salary) > (select avg(salary) from works where company_name = 'First Bank Corporation')`.

</details>

**Câu 10.** **PE 3.10** — (a) Nhân viên 12345 chuyển tới Newtown; (b) tăng 10% lương cho mỗi manager của First Bank Corporation, trừ khi lương sau tăng vượt 100000 thì chỉ tăng 3%. Vì sao lời giải hai lệnh update của sách phải chạy đúng thứ tự?

<details><summary>Gợi ý đáp án</summary>

```sql
update employee set city = 'Newtown' where ID = '12345';

update works T
set salary = T.salary * (case when T.salary * 1.1 > 100000 then 1.03 else 1.1 end)
where T.ID in (select manager_id from manages)
  and T.company_name = 'First Bank Corporation';
```
Bản hai lệnh: lệnh 3% (điều kiện `salary * 1.1 > 100000`) phải chạy **trước** lệnh 10% (`salary * 1.1 <= 100000`). Nếu chạy 10% trước, một manager vừa được tăng 10% có thể thoả điều kiện của lệnh 3% và **bị tăng hai lần**. Một lệnh với `case` tránh hẳn vấn đề này. (Lời giải in trong sách có ký hiệu `<` và `1:1` do lỗi font — ý là `*` và `1.1`.)

Dữ liệu mẫu: manager của First Bank là 10001 (85000 → 93500, tăng 10%) và 10004 (92000 → 94760, tăng 3% vì 92000 × 1.1 > 100000).

</details>

## 4. Bài tập SQL (36 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK2.01 | PE 3.1a where | ★☆☆ | PE 3.1a — Title các course của khoa Comp. Sci. có 3 credits. |
| GK2.02 | PE 3.1b join, distinct | ★☆☆ | PE 3.1b — ID của mọi sinh viên được dạy bởi một instructor tên Einstein, không trùng lặp. |
| GK2.03 | PE 3.1c max | ★☆☆ | PE 3.1c — Lương cao nhất của một instructor. |
| GK2.04 | PE 3.1d subquery | ★☆☆ | PE 3.1d — ID, name của mọi instructor có lương cao nhất (có thể nhiều người). |
| GK2.05 | PE 3.1e scalar subquery | ★★☆ | PE 3.1e — Enrollment (số sinh viên) của mỗi section mở ở Fall 2017: course_id, sec_id, enrollment. Section không có sinh viên phải có enrollment 0. |
| GK2.06 | PE 3.1e empty section | ★★☆ | PE 3.1e (bẫy section rỗng) — Tạo view `gk_fall2017_enrollment(course_id, sec_id, enrollment)` chứa enrollment của mỗi section Fall 2017. Khi chấm, hệ thống thêm một section Fall 2017 không có sinh viên rồi đọc view: section đó phải có enrollment 0. |
| GK2.07 | PE 3.1f max of aggregate | ★★☆ | PE 3.1f — Enrollment lớn nhất trên mọi section ở Fall 2017 (một giá trị). |
| GK2.08 | PE 3.1g with | ★★☆ | PE 3.1g — Các section (course_id, sec_id) có enrollment lớn nhất ở Fall 2017. Dùng `with`. |
| GK2.09 | PE 3.2a grade points | ★★☆ | PE 3.2a — Tổng grade points (credits × points) mà sinh viên `12345` đạt được qua mọi course đã học. Bảng `grade_points(grade, points)` có sẵn. |
| GK2.10 | PE 3.2b GPA | ★★☆ | PE 3.2b — GPA của sinh viên `12345`: tổng grade points chia tổng credits của các course tương ứng. Đặt tên cột `GPA`. |
| GK2.11 | PE 3.2c group by | ★★☆ | PE 3.2c — ID và GPA của mỗi sinh viên (chỉ những sinh viên có ít nhất một môn đã có điểm). |
| GK2.12 | PE 3.2c union null | ★★★ | PE 3.2c (đầy đủ) — Như GK2.11 nhưng sinh viên chưa học môn nào cũng xuất hiện với GPA = null. Không dùng outer join (dùng `union` như lời giải sách). |
| GK2.13 | PE 3.2d null grade | ★★★ | PE 3.2d — Sinh viên `98988` (Tanaka) có một môn chưa có điểm (grade null). Trả về hai cột: `naive_gpa` = sum(credits × points) / sum(credits) tính trên `takes natural join course left join grade_points using (grade)` (không lọc gì), và `correct_gpa` = GPA chỉ tính các môn đã có điểm. |
| GK2.14 | PE 3.3a update | ★☆☆ | PE 3.3a — Tăng 10% lương của mỗi instructor khoa Comp. Sci. |
| GK2.15 | PE 3.3b delete | ★☆☆ | PE 3.3b — Xoá mọi course chưa bao giờ được mở (không xuất hiện trong section). |
| GK2.16 | PE 3.3c insert select | ★★☆ | PE 3.3c — Chèn mọi student có `tot_cred > 100` làm instructor cùng khoa. Sách dùng lương 10000, nhưng schema có `check (salary > 29000)` nên lệnh đó bị từ chối (23514) — hãy dùng lương 30000. |
| GK2.17 | PE 3.4a count distinct | ★★☆ | PE 3.4a (Insurance database) — Tổng số người sở hữu xe có dính tai nạn năm 2017. |
| GK2.18 | PE 3.4b delete in | ★★☆ | PE 3.4b — Xoá mọi xe đời 2010 thuộc về người có driver_id `12345`. (owns và participated khai báo `on delete cascade` tới car.) |
| GK2.19 | PE 3.5a case | ★☆☆ | PE 3.5a — Hiển thị ID và grade của mỗi sinh viên trong `marks(ID, score)`: F nếu score < 40, C nếu 40 ≤ score < 60, B nếu 60 ≤ score < 80, A nếu score ≥ 80. |
| GK2.20 | PE 3.5b group by case | ★★☆ | PE 3.5b — Số sinh viên đạt mỗi grade (grade, count). |
| GK2.21 | PE 3.6 lower like | ★☆☆ | PE 3.6 — Tên các department có chứa chuỗi `sci` (không phân biệt hoa thường). |
| GK2.22 | PE 3.6 lower like | ★☆☆ | PE 3.6 (biến thể) — Title các course chứa chuỗi `INTRO` không phân biệt hoa thường. (Thử `like '%INTRO%'` trước để thấy like phân biệt hoa thường.) |
| GK2.23 | PE 3.7 empty relation | ★★★ | PE 3.7 — Tạo bảng `gk_p(a1 int)` = {1, 2, 3}, `gk_r1(a1 int)` = {1, 2} và `gk_r2(a1 int)` rỗng. Câu của sách `select gk_p.a1 from gk_p, gk_r1, gk_r2 where gk_p.a1 = gk_r1.a1 or gk_p.a1 = gk_r2.a1` trả về rỗng. Viết câu đúng trả về các giá trị của gk_p có trong gk_r1 hoặc gk_r2. |
| GK2.24 | PE 3.8a except | ★☆☆ | PE 3.8a (Bank database) — ID của mỗi khách hàng có account nhưng không có loan. |
| GK2.25 | PE 3.8b self join | ★★☆ | PE 3.8b — ID của mỗi khách hàng sống cùng street và cùng city với khách hàng `12345` (kể cả chính 12345). Lưu ý: lời giải sách viết `S.customer_id` — cột đúng là `ID`. |
| GK2.26 | PE 3.8c join | ★★☆ | PE 3.8c — Tên mỗi branch có ít nhất một khách hàng có account ở đó và sống ở Harrison. |
| GK2.27 | PE 3.9a join | ★☆☆ | PE 3.9a (Employee database) — ID, tên và thành phố cư trú của mỗi nhân viên làm cho First Bank Corporation. |
| GK2.28 | PE 3.9b in | ★☆☆ | PE 3.9b — ID, tên, thành phố của mỗi nhân viên làm cho First Bank Corporation và có lương > 10000. |
| GK2.29 | PE 3.9c not in | ★★☆ | PE 3.9c — ID của mỗi nhân viên không làm cho First Bank Corporation, kể cả người không có trong works. |
| GK2.30 | PE 3.9d > all | ★★☆ | PE 3.9d — ID của mỗi nhân viên có lương cao hơn mọi nhân viên của Small Bank Corporation. |
| GK2.31 | PE 3.9e not exists except | ★★★ | PE 3.9e — Một công ty có thể đặt ở nhiều thành phố (`company(company_name, city)`). Tên mỗi công ty đặt ở mọi thành phố mà Small Bank Corporation có mặt. |
| GK2.32 | PE 3.9f having >= all | ★★★ | PE 3.9f — Tên công ty có nhiều nhân viên nhất (trả về tất cả nếu hoà). |
| GK2.33 | PE 3.9g having avg | ★★☆ | PE 3.9g — Tên mỗi công ty có lương trung bình của nhân viên cao hơn lương trung bình ở First Bank Corporation. |
| GK2.34 | PE 3.10a update | ★☆☆ | PE 3.10a — Nhân viên có ID `12345` nay sống ở Newtown. |
| GK2.35 | PE 3.10b update case | ★★★ | PE 3.10b — Tăng 10% lương cho mỗi manager (xuất hiện trong `manages.manager_id`) làm cho First Bank Corporation, trừ khi lương sau khi tăng vượt 100000 — khi đó chỉ tăng 3%. Viết một lệnh update dùng `case`. |
| GK2.36 | PE 3.10b two updates | ★★★ | PE 3.10b (hai lệnh) — Viết lại GK2.35 bằng hai lệnh update không dùng case, theo đúng thứ tự để không ai bị tăng hai lần. Kết quả phải giống GK2.35. |
