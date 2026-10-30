# Chương 2 — Mô hình quan hệ & Đại số quan hệ

*Intro to Relational Model · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch2`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Cấu trúc
- **Relation** = bảng; **tuple** = dòng; **attribute** = cột.
- **Domain**: tập giá trị hợp lệ của một attribute. Giá trị phải **atomic** (không chia nhỏ được).
- **null**: thuộc mọi domain, nghĩa là "unknown"/"không tồn tại" → gây phức tạp cho nhiều phép toán.
- Relation là **tập hợp** → thứ tự các tuple **không quan trọng**.
- **Database schema** = cấu trúc logic, ví dụ `instructor(ID, name, dept_name, salary)`; **database instance** = snapshot dữ liệu tại một thời điểm.

### 2. Keys (K ⊆ R)
| Khái niệm | Định nghĩa | Ví dụ với instructor |
|---|---|---|
| **Superkey** | Giá trị của K đủ xác định duy nhất một tuple | {ID}, {ID, name} |
| **Candidate key** | Superkey **tối thiểu** (bỏ bớt thuộc tính nào cũng không còn là superkey) | {ID} |
| **Primary key** | Candidate key được chọn làm khoá chính | ID |
| **Foreign key** | Giá trị ở relation này phải xuất hiện ở relation kia | instructor.dept_name → department |

Foreign key: **referencing relation** (instructor) tham chiếu tới **referenced relation** (department).

### 3. Relational query languages
"Pure" languages có sức mạnh tương đương: **relational algebra**, **tuple relational calculus**, **domain relational calculus**.

### 4. Relational algebra — 6 phép cơ bản
| Phép | Ký hiệu | Ý nghĩa | SQL tương ứng |
|---|---|---|---|
| select | σ<sub>p</sub>(r) | lọc tuple thoả predicate p (∧, ∨, ¬, =, ≠, <, ≤, >, ≥) | `where` |
| project | Π<sub>A1,…,Ak</sub>(r) | giữ lại một số cột, **loại trùng** | `select distinct` |
| union | r ∪ s | hợp (cần cùng arity & domain tương thích) | `union` |
| set difference | r − s | có trong r mà không có trong s | `except` |
| Cartesian product | r × s | ghép mọi cặp tuple | `from r, s` |
| rename | ρ<sub>x</sub>(E), ρ<sub>x(A1..An)</sub>(E) | đặt tên cho kết quả | `as` |

Phép mở rộng:
- **Set intersection**: r ∩ s (`intersect`) = r − (r − s).
- **Join**: r ⋈<sub>θ</sub> s = σ<sub>θ</sub>(r × s).
- **Assignment**: temp ← E, giúp viết truy vấn như một chương trình tuần tự.
- **Aggregation**: <sub>G</sub>𝒢<sub>F(A)</sub>(r), F ∈ {avg, min, max, sum, count}; G là thuộc tính group by.

### 5. Equivalent queries
Hai biểu thức **equivalent** nếu cho cùng kết quả trên **mọi** database, ví dụ:
- σ<sub>p1 ∧ p2</sub>(r) ≡ σ<sub>p1</sub>(σ<sub>p2</sub>(r))
- σ<sub>dept='Physics'</sub>(instructor ⋈ teaches) ≡ σ<sub>dept='Physics'</sub>(instructor) ⋈ teaches (đẩy selection xuống trước join → nhanh hơn).

## 2. Trắc nghiệm (10 câu)

**Câu 1.** Relation r có schema R(A, B, C). {A} là candidate key. Khẳng định nào ĐÚNG?

- A. {A, B} là candidate key
- B. {A, B} là superkey
- C. {B} chắc chắn là superkey
- D. {A, B, C} không phải superkey

<details><summary>Đáp án</summary>

**B** — Mọi tập chứa một superkey đều là superkey, nhưng {A,B} không tối thiểu nên không phải candidate key.

</details>

**Câu 2.** Trong instructor(ID, name, dept_name, salary), dept_name là foreign key tham chiếu department. Relation nào là referencing relation?

- A. department
- B. instructor
- C. Cả hai
- D. Không có

<details><summary>Đáp án</summary>

**B** — instructor chứa foreign key nên là referencing; department là referenced.

</details>

**Câu 3.** Phép nào KHÔNG thuộc 6 phép cơ bản của relational algebra?

- A. Select σ
- B. Rename ρ
- C. Set intersection ∩
- D. Cartesian product ×

<details><summary>Đáp án</summary>

**C** — ∩ có thể biểu diễn bằng phép trừ: r ∩ s = r − (r − s).

</details>

**Câu 4.** Kết quả của Π<sub>dept_name</sub>(instructor) có bao nhiêu tuple với dữ liệu mẫu (12 instructor, 7 khoa, mỗi khoa đều có giảng viên)?

- A. 12
- B. 7
- C. 1
- D. Không xác định

<details><summary>Đáp án</summary>

**B** — Project loại bỏ dòng trùng vì relation là tập hợp.

</details>

**Câu 5.** Điều kiện để r ∪ s hợp lệ là gì?

- A. r và s có cùng tên thuộc tính
- B. r và s có cùng arity và domain các cột tương thích
- C. r và s có cùng số tuple
- D. r và s có chung primary key

<details><summary>Đáp án</summary>

**B** — Cần cùng số cột và cột thứ i của hai bên cùng loại giá trị.

</details>

**Câu 6.** |r| = 12 tuple, |s| = 15 tuple. |r × s| = ?

- A. 27
- B. 180
- C. 12
- D. 15

<details><summary>Đáp án</summary>

**B** — Cartesian product ghép mọi cặp: 12 × 15 = 180.

</details>

**Câu 7.** r ⋈<sub>θ</sub> s được định nghĩa bằng?

- A. σ<sub>θ</sub>(r × s)
- B. Π<sub>θ</sub>(r × s)
- C. r × σ<sub>θ</sub>(s)
- D. σ<sub>θ</sub>(r) ∪ σ<sub>θ</sub>(s)

<details><summary>Đáp án</summary>

**A** — Join = Cartesian product rồi select theo điều kiện θ.

</details>

**Câu 8.** Vì sao primary key không nên là thuộc tính có thể null hoặc hay thay đổi?

- A. Vì DBMS không cho phép index trên cột đó
- B. Vì key dùng để xác định tuple duy nhất và được foreign key khác tham chiếu
- C. Vì null chiếm nhiều bộ nhớ
- D. Không có lý do gì

<details><summary>Đáp án</summary>

**B** — Khoá thay đổi thì mọi foreign key tham chiếu tới nó phải sửa theo; null thì không xác định được tuple.

</details>

**Câu 9.** σ<sub>dept_name="Physics" ∧ salary>90000</sub>(instructor) và σ<sub>dept_name="Physics"</sub>(σ<sub>salary>90000</sub>(instructor)) là hai biểu thức…

- A. Identical
- B. Equivalent
- C. Khác nhau về kết quả
- D. Một trong hai không hợp lệ

<details><summary>Đáp án</summary>

**B** — Không giống hệt nhau về cách viết nhưng luôn cho cùng kết quả → equivalent.

</details>

**Câu 10.** Kết quả của <sub>dept_name</sub>𝒢<sub>avg(salary)</sub>(instructor) có bao nhiêu tuple trên dữ liệu mẫu?

- A. 1
- B. 7
- C. 12
- D. 84

<details><summary>Đáp án</summary>

**B** — Một tuple cho mỗi nhóm dept_name — có 7 khoa đều có giảng viên.

</details>

## 3. Câu hỏi tự luận (7 câu)

**Câu 1.** Cho student(ID, name, dept_name, tot_cred) và takes(ID, course_id, sec_id, semester, year, grade). Liệt kê các superkey và candidate key của takes. Primary key nên là gì?

<details><summary>Gợi ý đáp án</summary>

Một sinh viên có thể học lại cùng một môn ở học kỳ khác, nên cần cả 5 thuộc tính:
- Candidate key: **{ID, course_id, sec_id, semester, year}** → chọn làm primary key.
- Superkey: candidate key đó và mọi tập chứa nó, ví dụ {ID, course_id, sec_id, semester, year, grade}.
- {ID, course_id} **không** là superkey vì Levy (45678) học CS-101 hai lần.

</details>

**Câu 2.** Viết biểu thức relational algebra: tên các instructor khoa Physics có lương > 90 000.

<details><summary>Gợi ý đáp án</summary>

Π<sub>name</sub>(σ<sub>dept_name="Physics" ∧ salary>90000</sub>(instructor))  → kết quả: Einstein.

</details>

**Câu 3.** Viết biểu thức relational algebra: các course_id được dạy ở Fall 2017 nhưng KHÔNG được dạy ở Spring 2018.

<details><summary>Gợi ý đáp án</summary>

Π<sub>course_id</sub>(σ<sub>semester="Fall" ∧ year=2017</sub>(section)) − Π<sub>course_id</sub>(σ<sub>semester="Spring" ∧ year=2018</sub>(section))
→ CS-347, PHY-101.

</details>

**Câu 4.** Viết biểu thức relational algebra (dùng join): tên instructor và course_id các môn họ dạy, chỉ với instructor khoa Comp. Sci. Viết 2 cách tương đương, cách nào hiệu quả hơn?

<details><summary>Gợi ý đáp án</summary>

Cách 1: Π<sub>name, course_id</sub>(σ<sub>dept_name="Comp. Sci."</sub>(instructor ⋈<sub>instructor.ID=teaches.ID</sub> teaches))
Cách 2: Π<sub>name, course_id</sub>(σ<sub>dept_name="Comp. Sci."</sub>(instructor) ⋈<sub>instructor.ID=teaches.ID</sub> teaches)
Cách 2 thường hiệu quả hơn vì lọc bớt instructor **trước** khi join (selection pushdown).

</details>

**Câu 5.** Dùng rename và Cartesian product: tìm lương lớn nhất của instructor **mà không dùng hàm max**.

<details><summary>Gợi ý đáp án</summary>

Lấy các mức lương **không** phải lớn nhất (có ai đó lương cao hơn) rồi trừ đi:
Π<sub>salary</sub>(instructor) − Π<sub>instructor.salary</sub>(σ<sub>instructor.salary < d.salary</sub>(instructor × ρ<sub>d</sub>(instructor)))
→ 95000.

</details>

**Câu 6.** Dùng assignment: tìm ID những instructor khoa Physics HOẶC Music.

<details><summary>Gợi ý đáp án</summary>

Physics ← σ<sub>dept_name="Physics"</sub>(instructor)
Music ← σ<sub>dept_name="Music"</sub>(instructor)
Π<sub>ID</sub>(Physics ∪ Music)

</details>

**Câu 7.** Viết biểu thức aggregation: số section mở trong năm 2018; và lương trung bình theo từng khoa.

<details><summary>Gợi ý đáp án</summary>

𝒢<sub>count(course_id)</sub>(σ<sub>year=2018</sub>(section))
<sub>dept_name</sub>𝒢<sub>avg(salary)</sub>(instructor)

</details>

## 4. Bài tập SQL (14 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| 2.01 | σ select | ★☆☆ | Viết SQL tương đương với σ[dept_name="Physics"](instructor). |
| 2.02 | σ select | ★☆☆ | σ[dept_name="Physics" ∧ salary>90000](instructor) |
| 2.03 | σ select | ★☆☆ | σ[dept_name=building](department) — khoa có tên trùng với tên toà nhà (so sánh 2 thuộc tính). |
| 2.04 | Π project | ★☆☆ | Π[ID, name, salary](instructor). Nhớ rằng project trong relational algebra loại bỏ dòng trùng. |
| 2.05 | composition | ★☆☆ | Π[name](σ[dept_name="Physics"](instructor)) |
| 2.06 | × product | ★★☆ | Đếm số tuple của instructor × teaches (trả về 1 cột, 1 dòng). |
| 2.07 | ⋈ join | ★★☆ | σ[instructor.ID = teaches.ID](instructor × teaches) — trả về tất cả cột của cả hai bảng. |
| 2.08 | ∪ union | ★★☆ | Π[course_id](σ[semester="Fall" ∧ year=2017](section)) ∪ Π[course_id](σ[semester="Spring" ∧ year=2018](section)) |
| 2.09 | ∩ intersection | ★★☆ | Các course_id được dạy ở cả Fall 2017 và Spring 2018. |
| 2.10 | − difference | ★★☆ | Các course_id dạy ở Fall 2017 nhưng không dạy ở Spring 2018. |
| 2.11 | ρ rename | ★★★ | Không dùng max: tìm lương cao nhất bằng cách lấy tất cả mức lương trừ đi các mức lương nhỏ hơn một mức lương khác (xem câu hỏi tự luận cùng chương). |
| 2.12 | 𝒢 aggregation | ★★☆ | [dept_name]𝒢[avg(salary)](instructor) — trả về dept_name và lương trung bình. |
| 2.13 | 𝒢 aggregation | ★★☆ | 𝒢[count(course_id)](σ[year=2018](section)) — số section trong năm 2018. |
| 2.14 | keys | ★★★ | Kiểm tra bằng dữ liệu: {ID, course_id} có phải superkey của takes không? Liệt kê các cặp (ID, course_id) xuất hiện nhiều hơn 1 lần trong takes, kèm số lần. |
