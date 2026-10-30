# Chương 3 — Nhập môn SQL

*Introduction to SQL · Database System Concepts, 7th Ed.*

> **Cách học:** đọc *Tóm tắt kiến thức* → làm *Trắc nghiệm* → trả lời *Câu hỏi tự luận* → làm *Bài tập SQL* trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch3`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Các phần của SQL
DML · DDL (schema, integrity, view) · transaction control · embedded/dynamic SQL · authorization.

### 2. DDL & kiểu dữ liệu
`char(n)`, `varchar(n)`, `int`, `smallint`, `numeric(p,d)` (p chữ số, d chữ số sau dấu phẩy — numeric(3,1) lưu được 44.5 nhưng không lưu được 444.5), `real`, `double precision`, `float(n)`.

```sql
create table instructor (
  ID        char(5),
  name      varchar(20) not null,
  dept_name varchar(20),
  salary    numeric(8,2),
  primary key (ID),
  foreign key (dept_name) references department);
```
- `insert into r values (...)`, `delete from r` (xoá dữ liệu, giữ bảng), `drop table r` (xoá cả bảng).
- `alter table r add A D` (dòng cũ nhận null), `alter table r drop A`.

### 3. Cấu trúc truy vấn cơ bản
```sql
select A1, ..., An      -- Π (project) — KHÔNG tự loại trùng
from   r1, ..., rm      -- × (Cartesian product)
where  P                -- σ (select)
```
- `distinct` loại trùng; `all` giữ trùng (mặc định); `*` mọi cột; có thể dùng biểu thức `salary/12 as monthly_salary`.
- Logic: `and`, `or`, `not`; so sánh `< <= > >= = <>`; `between ... and ...` (bao gồm 2 đầu); tuple comparison `(a, b) = (x, y)`.
- **Rename**: `instructor as T` (từ khoá as có thể bỏ) — cần cho **self join**.
- **String**: `like` với `%` (chuỗi bất kỳ) và `_` (đúng 1 ký tự); `escape '\'`; phân biệt hoa thường; `||` nối chuỗi, `upper`, `lower`, `length`, `substring`.
- `order by A [asc|desc], B ...`

### 4. Set operations
`union`, `intersect`, `except` — **tự loại trùng**; thêm `all` để giữ trùng (`union all`…).

### 5. Null
- Phép toán số học với null → null.
- So sánh với null → **unknown**. Dùng `is null` / `is not null`.
- Logic 3 giá trị: true **and** unknown = unknown; false **and** unknown = false; true **or** unknown = true; false **or** unknown = unknown; **not** unknown = unknown.
- where coi unknown như **false**.
- Aggregate bỏ qua null (trừ `count(*)`).

### 6. Aggregate functions
`avg`, `min`, `max`, `sum`, `count` · `count(distinct ID)` · `count(*)`.
- Thuộc tính trong select **không nằm trong aggregate** phải có trong `group by`.
- `where` lọc **trước** khi nhóm; `having` lọc **sau** khi nhóm.

### 7. Nested subqueries
| Cấu trúc | Ý nghĩa |
|---|---|
| `A in (subquery)` / `not in` | set membership |
| `A > some (subquery)` | lớn hơn **ít nhất một** giá trị (= some ≡ in, nhưng ≠ some ≢ not in) |
| `A > all (subquery)` | lớn hơn **mọi** giá trị (≠ all ≡ not in, nhưng = all ≢ in) |
| `exists (subquery)` / `not exists` | subquery khác rỗng / rỗng |
| `unique (subquery)` | không có tuple trùng — *PostgreSQL không hỗ trợ*, thay bằng `group by ... having count(*) <= 1` |
| subquery trong `from` | phải đặt alias trong PostgreSQL: `(select ...) as t` |
| `with name(cols) as (...)` | bảng tạm chỉ dùng trong một câu truy vấn |
| scalar subquery | subquery trả về **đúng 1 giá trị**, dùng ở select/where |

**Correlated subquery**: subquery dùng biến (correlation name) của truy vấn ngoài, ví dụ `where S.ID = T.ID`.

"Sinh viên học **tất cả** môn khoa Biology" ⇒ `not exists (X except Y)` vì X − Y = ∅ ⇔ X ⊆ Y.

### 8. Modification
- `delete from r where P` — điều kiện được tính **trước** rồi mới xoá (avg không bị tính lại giữa chừng).
- `insert into r [ (cols) ] values (...)` hoặc `insert into r select ...` (select được tính xong trước khi chèn).
- `update r set A = ... where P`; thứ tự các update quan trọng → dùng `case when ... then ... else ... end`.
- Update dùng scalar subquery: `update student S set tot_cred = (select ... where S.ID = takes.ID)`.

## 2. Trắc nghiệm (14 câu)

**Câu 1.** `select dept_name from instructor` trả về bao nhiêu dòng trên dữ liệu mẫu (12 instructor)?

- A. 7
- B. 12
- C. 1
- D. Lỗi cú pháp

<details><summary>Đáp án</summary>

**B** — SQL giữ dòng trùng theo mặc định (multiset). Cần distinct mới còn 7.

</details>

**Câu 2.** Pattern nào khớp với MỌI chuỗi có ÍT NHẤT 3 ký tự?

- A. '___'
- B. '___%'
- C. '_%'
- D. '%_%'

<details><summary>Đáp án</summary>

**B** — '___' khớp ĐÚNG 3 ký tự; '___%' là 3 ký tự bất kỳ rồi thêm chuỗi tuỳ ý (có thể rỗng) → ít nhất 3.

</details>

**Câu 3.** Giá trị của `(5 < null) or (1 = 1)`?

- A. true
- B. false
- C. unknown
- D. null

<details><summary>Đáp án</summary>

**A** — unknown or true = true.

</details>

**Câu 4.** Giá trị của `(null = null)`?

- A. true
- B. false
- C. unknown
- D. Lỗi

<details><summary>Đáp án</summary>

**C** — Mọi so sánh với null (trừ is null / is not null) đều là unknown.

</details>

**Câu 5.** Câu nào sai cú pháp/ngữ nghĩa?

- A. select dept_name, avg(salary) from instructor group by dept_name
- B. select dept_name, ID, avg(salary) from instructor group by dept_name
- C. select count(*) from course
- D. select avg(salary) from instructor where dept_name = 'Physics'

<details><summary>Đáp án</summary>

**B** — ID không nằm trong aggregate và không có trong group by.

</details>

**Câu 6.** Điểm khác nhau giữa where và having?

- A. Không khác nhau
- B. where lọc tuple trước khi nhóm, having lọc nhóm sau khi nhóm
- C. having lọc trước, where lọc sau
- D. having chỉ dùng được với order by

<details><summary>Đáp án</summary>

**B** — Predicate trong having được áp dụng sau khi hình thành nhóm.

</details>

**Câu 7.** `(5 < some {0, 5, 6})` = ?

- A. true
- B. false
- C. unknown
- D. Lỗi

<details><summary>Đáp án</summary>

**A** — 5 < 6 nên tồn tại một phần tử thoả.

</details>

**Câu 8.** `(5 < all {6, 10})` và `(5 = all {4, 5})` lần lượt là?

- A. true, true
- B. true, false
- C. false, true
- D. false, false

<details><summary>Đáp án</summary>

**B** — 5 < 6 và 5 < 10 → true; 5 ≠ 4 → false.

</details>

**Câu 9.** Cặp nào TƯƠNG ĐƯƠNG?

- A. = some ≡ in
- B. ≠ some ≡ not in
- C. = all ≡ in
- D. not exists ≡ in

<details><summary>Đáp án</summary>

**A** — = some ≡ in và ≠ all ≡ not in; còn ≠ some ≢ not in và = all ≢ in.

</details>

**Câu 10.** Nếu bảng instructor rỗng, `select count(*), sum(salary) from instructor` trả về?

- A. 0 dòng
- B. 1 dòng: (0, 0)
- C. 1 dòng: (0, null)
- D. 1 dòng: (null, null)

<details><summary>Đáp án</summary>

**C** — count trên tập rỗng = 0; các aggregate khác trên tập rỗng = null.

</details>

**Câu 11.** `delete from instructor where salary < (select avg(salary) from instructor)` — SQL xử lý thế nào?

- A. Tính lại avg sau mỗi dòng bị xoá
- B. Tính avg một lần, tìm tất cả dòng cần xoá, rồi mới xoá
- C. Báo lỗi vì subquery cùng bảng
- D. Chỉ xoá dòng đầu tiên

<details><summary>Đáp án</summary>

**B** — Để kết quả không phụ thuộc thứ tự xử lý.

</details>

**Câu 12.** Hai câu update tăng 3% cho lương > 100000 và 5% cho phần còn lại. Thứ tự nào đúng?

- A. Câu 5% (salary <= 100000) chạy trước
- B. Câu 3% (salary > 100000) chạy trước
- C. Thứ tự không quan trọng
- D. Phải chạy song song

<details><summary>Đáp án</summary>

**B** — Nếu tăng 5% trước, người 99 000 lên 103 950 rồi lại bị tăng thêm 3%. Tốt nhất dùng case.

</details>

**Câu 13.** `union` khác `union all` thế nào?

- A. union all loại trùng
- B. union loại trùng, union all giữ trùng
- C. Không khác
- D. union all chỉ dùng cho 2 bảng giống hệt nhau

<details><summary>Đáp án</summary>

**B** — Các phép set mặc định loại trùng.

</details>

**Câu 14.** Scalar subquery trả về 2 dòng thì sao?

- A. Lấy dòng đầu tiên
- B. Trả về null
- C. Runtime error
- D. Tự động dùng in

<details><summary>Đáp án</summary>

**C** — Scalar subquery phải trả về đúng một giá trị.

</details>

## 3. Câu hỏi tự luận (4 câu)

**Câu 1.** Giải thích vì sao truy vấn "sinh viên đã học TẤT CẢ các môn của khoa Biology" không viết được bằng `= all` mà phải dùng `not exists (... except ...)`.

<details><summary>Gợi ý đáp án</summary>

Ta cần kiểm tra **quan hệ bao hàm tập hợp**: tập môn Biology ⊆ tập môn sinh viên đã học.
`= all` so sánh **một giá trị** với mọi phần tử của tập — không so sánh được tập với tập.
X ⊆ Y ⇔ X − Y = ∅ ⇔ `not exists (X except Y)`.

</details>

**Câu 2.** Hãy dự đoán kết quả của `select name from instructor where salary > 70000 or salary <= 70000` nếu có một instructor có salary = null. Người đó có xuất hiện không? Vì sao?

<details><summary>Gợi ý đáp án</summary>

Không. Với null: (null > 70000) = unknown, (null <= 70000) = unknown, unknown or unknown = unknown → where coi là false.

</details>

**Câu 3.** PostgreSQL không hỗ trợ `unique (subquery)`. Viết lại truy vấn "các môn được mở nhiều nhất một lần trong năm 2017" theo 2 cách khác.

<details><summary>Gợi ý đáp án</summary>

```sql
-- Cách 1: not exists hai section khác nhau
select T.course_id from course T
where not exists (select 1 from section R1, section R2
                  where R1.course_id = T.course_id and R2.course_id = T.course_id
                    and R1.year = 2017 and R2.year = 2017
                    and (R1.sec_id, R1.semester) <> (R2.sec_id, R2.semester));
-- Cách 2: đếm
select T.course_id from course T
where (select count(*) from section R
       where R.course_id = T.course_id and R.year = 2017) <= 1;
```

</details>

**Câu 4.** Phân biệt `delete from student` và `drop table student`.

<details><summary>Gợi ý đáp án</summary>

`delete from student` xoá **mọi tuple** nhưng giữ lại bảng (schema). `drop table student` xoá cả dữ liệu lẫn schema — bảng không còn tồn tại.

</details>

## 4. Bài tập SQL (50 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| 3.01 | select | ★☆☆ | Tìm tên của tất cả instructor. |
| 3.02 | distinct | ★☆☆ | Tìm tên các khoa (dept_name) có giảng viên, không lặp lại. |
| 3.03 | arithmetic | ★☆☆ | Liệt kê ID, name và lương tháng (salary / 12) của mỗi instructor, đặt tên cột là `monthly_salary`. |
| 3.04 | where | ★☆☆ | Tên các instructor khoa `Comp. Sci.` có lương lớn hơn 70000. |
| 3.05 | between | ★☆☆ | Tên các instructor có lương từ 90000 đến 100000 (bao gồm cả hai đầu). |
| 3.06 | order by | ★☆☆ | Liệt kê dept_name, name, salary của instructor, sắp xếp theo dept_name tăng dần, trong cùng khoa thì salary giảm dần. |
| 3.07 | like | ★☆☆ | Tìm title của các course có chứa chuỗi `Intro` ở đầu tên. |
| 3.08 | like | ★★☆ | Tìm tên instructor có đúng 5 ký tự và chứa chữ `i`. |
| 3.09 | string functions | ★★☆ | Với mỗi course, trả về một cột duy nhất dạng `CS-101: Intro. to Computer Science` (course_id, dấu hai chấm, khoảng trắng, title), đặt tên `label`. |
| 3.10 | from (join) | ★☆☆ | Tên instructor và course_id của các môn họ đã dạy. |
| 3.11 | from (join) | ★★☆ | Tên instructor khoa `Comp. Sci.` và title các môn họ đã dạy (không lặp lại). |
| 3.12 | rename | ★★☆ | Tên (không lặp) các instructor có lương cao hơn ít nhất một instructor khoa `Comp. Sci.` — dùng rename `T`, `S` (không dùng some). |
| 3.13 | self join | ★★☆ | Bảng `emp_super(person, supervisor)`: tìm supervisor của supervisor của `Bob`. |
| 3.14 | tuple comparison | ★★☆ | Dùng tuple comparison `(a, b) = (x, y)`: tìm name, course_id của instructor khoa `Comp. Sci.` cùng các môn họ dạy. |
| 3.15 | union | ★☆☆ | Các course_id mở ở Fall 2017 hoặc Spring 2018. |
| 3.16 | union all | ★★☆ | Như câu trên nhưng giữ lại dòng trùng (một môn mở ở cả hai kỳ xuất hiện 2 lần; môn có 2 section trong một kỳ cũng xuất hiện 2 lần). |
| 3.17 | except | ★★☆ | ID của các sinh viên chưa từng học môn nào (dùng except). |
| 3.18 | null | ★☆☆ | Tìm ID, course_id của các bản ghi takes chưa có điểm (grade là null). |
| 3.19 | null | ★★☆ | Đếm số bản ghi takes có điểm và khác F. Lưu ý null: `grade <> 'F'` với grade null cho kết quả gì? |
| 3.20 | aggregate | ★☆☆ | Lương trung bình của instructor khoa `Comp. Sci.` |
| 3.21 | count distinct | ★☆☆ | Số instructor (khác nhau) dạy ít nhất một môn trong học kỳ Spring 2018. |
| 3.22 | group by | ★☆☆ | Với mỗi khoa: dept_name và lương trung bình (`avg_salary`). |
| 3.23 | having | ★★☆ | dept_name và lương trung bình của các khoa có lương trung bình > 42000. |
| 3.24 | group by | ★★☆ | Với mỗi section (course_id, sec_id, semester, year) có sinh viên học: số sinh viên đăng ký. |
| 3.25 | group by + join | ★★☆ | Với mỗi sinh viên có học môn: ID, name và tổng số tín chỉ của các môn đã học (tính cả môn trượt), sắp theo ID. |
| 3.26 | having | ★★★ | Với mỗi khoa có ít nhất 2 instructor: dept_name, số instructor, lương lớn nhất. Chỉ tính instructor có lương > 50000. |
| 3.27 | in | ★★☆ | Dùng in: các course_id (không lặp) mở ở Fall 2017 và Spring 2018. |
| 3.28 | not in | ★★☆ | Dùng not in: các course_id mở ở Fall 2017 nhưng không mở ở Spring 2018. |
| 3.29 | in (tuple) | ★★☆ | Đếm số sinh viên (khác nhau) đã học các section do instructor `10101` dạy — dùng `(course_id, sec_id, semester, year) in (...)`. |
| 3.30 | some | ★★☆ | Dùng > some: tên instructor có lương lớn hơn lương của ít nhất một instructor khoa `Biology`. |
| 3.31 | all | ★★☆ | Dùng > all: tên instructor có lương lớn hơn lương của tất cả instructor khoa `Finance`. |
| 3.32 | all | ★★★ | Tìm (các) khoa có lương trung bình cao nhất — dùng `>= all`. |
| 3.33 | exists | ★★☆ | Dùng exists (correlated subquery): các course_id mở ở Fall 2017 và Spring 2018. |
| 3.34 | not exists | ★★★ | ID và name của các sinh viên đã học tất cả các môn của khoa `Biology` *đã từng mở lớp* (course_id xuất hiện trong section). Dùng `not exists (... except ...)`. |
| 3.35 | not exists | ★★★ | ID và name các sinh viên đã học tất cả các môn khoa `Biology` (kể cả môn chưa mở — đúng như slide). Kết quả rỗng có hợp lý không? |
| 3.36 | "unique" | ★★★ | Các course_id được mở nhiều nhất một lần trong năm 2017 (gồm cả môn không mở lần nào). PostgreSQL không có `unique (subquery)` — hãy dùng scalar subquery đếm. |
| 3.37 | from subquery | ★★☆ | Không dùng having: dept_name và avg_salary của các khoa có lương trung bình > 42000 (subquery trong from). |
| 3.38 | with | ★★☆ | Dùng with: tìm dept_name của (các) khoa có budget lớn nhất. |
| 3.39 | with | ★★★ | Dùng with 2 bảng tạm: các khoa có tổng lương lớn hơn trung bình của tổng lương các khoa. |
| 3.40 | scalar subquery | ★★☆ | Liệt kê mọi khoa cùng số instructor của khoa đó (`num_instructors`) — dùng scalar subquery trong select. |
| 3.41 | insert | ★☆☆ | Thêm môn `CS-437`, title `Database Systems`, khoa `Comp. Sci.`, 4 tín chỉ. (Hệ thống sẽ kiểm tra bảng course sau khi chạy.) |
| 3.42 | insert null | ★☆☆ | Thêm sinh viên `3003`, tên `Green`, khoa `Finance`, tot_cred null — chỉ liệt kê các cột cần thiết. |
| 3.43 | insert ... select | ★★☆ | Biến mọi sinh viên khoa `Comp. Sci.` có tot_cred > 100 thành instructor cùng khoa với lương 30000 (insert … select). |
| 3.44 | delete | ★★☆ | Xoá mọi instructor thuộc các khoa đặt ở toà nhà `Watson`. |
| 3.45 | delete | ★★☆ | Xoá mọi instructor có lương thấp hơn lương trung bình của tất cả instructor. |
| 3.46 | update | ★☆☆ | Tăng 5% lương cho các instructor có lương dưới 70000. |
| 3.47 | update case | ★★☆ | Dùng một câu update với `case`: lương > 90000 tăng 3%, còn lại tăng 5%. |
| 3.48 | update scalar subquery | ★★★ | Tính lại `tot_cred` cho mọi sinh viên = tổng credits các môn đã qua (grade khác F và khác null). Sinh viên chưa qua môn nào thì tot_cred = 0 (không phải null). |
| 3.49 | alter table | ★★☆ | Thêm cột `email varchar(50)` vào bảng student. Sau đó gán email `zhang@uni.edu` cho sinh viên `00128`. |
| 3.50 | create table | ★★☆ | Tạo bảng `club(club_id char(4), name varchar(30) not null, dept_name varchar(20))` với primary key club_id và foreign key dept_name tham chiếu department. Thêm câu lạc bộ `C001`, `Robotics Club`, `Comp. Sci.`. |
