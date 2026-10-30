# Chương 6 — Thiết kế CSDL bằng mô hình E-R

*Database Design Using the E-R Model · Database System Concepts, 7th Ed.*

> **Cách học:** đọc *Tóm tắt kiến thức* → làm *Trắc nghiệm* → trả lời *Câu hỏi tự luận* → làm *Bài tập SQL* trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch6`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Phạm vi theo lịch học
| Tuần | Slide (số ở chân trang) | Nội dung |
|---|---|---|
| 9 | 6.1 – 6.43 | Design phases, entity set, relationship set, attribute (simple/composite, single/multivalued, derived), mapping cardinality, participation, primary key, weak entity set, redundant attribute, E-R diagram của University |
| 10 | 6.44 – 6.73 | **Reduction to relation schemas**, extended E-R (specialization, generalization, completeness constraint, aggregation), design issues (lỗi thường gặp, entity vs attribute, entity vs relationship, binary vs n-ary), E-R design decisions |
| (đọc thêm) | 6.74 – 6.84 | Bảng ký hiệu, ký hiệu Chen / crow's foot, UML class diagram |

### 1. Các pha thiết kế
1. **Requirements**: mô tả đầy đủ nhu cầu dữ liệu của người dùng.
2. **Conceptual design**: chọn data model (ở đây là E-R) và dịch yêu cầu thành *conceptual schema*; mô tả cả các thao tác (functional requirements).
3. **Logical design**: chuyển sang lược đồ quan hệ (bài toán "chia thuộc tính vào các relation" — Khoa học máy tính) và quyết định lưu thuộc tính nào (bài toán nghiệp vụ).
4. **Physical design**: tổ chức lưu trữ vật lý.

Hai cạm bẫy cần tránh: **redundancy** (lặp thông tin → không nhất quán) và **incompleteness** (không mô hình hoá được một khía cạnh của doanh nghiệp).

### 2. Entity set, relationship set, attribute
- **Entity** = đối tượng phân biệt được; **entity set** = tập các entity cùng loại (hình chữ nhật). Thuộc tính khoá gạch chân.
- **Relationship set** (hình thoi) = quan hệ toán học trên ≥ 2 entity set: {(e<sub>1</sub>, …, e<sub>n</sub>) | e<sub>i</sub> ∈ E<sub>i</sub>}. Relationship set có thể có **thuộc tính riêng** (ví dụ `date` của advisor) — vẽ trong hình chữ nhật nối nét đứt.
- **Role**: khi một entity set xuất hiện nhiều lần trong cùng relationship set (prereq: course_id và prereq_id).
- **Degree**: binary (phổ biến), ternary (ví dụ proj_guide(instructor, student, project)).
- Thuộc tính: **simple / composite** (name → first_name, middle_initial, last_name), **single-valued / multivalued** `{phone_number}`, **derived** `age()` (tính từ date_of_birth). **Domain** = tập giá trị cho phép.

### 3. Ràng buộc
| Ràng buộc | Ký hiệu | Ý nghĩa |
|---|---|---|
| one-to-one | mũi tên ở cả hai phía | mỗi A ↔ tối đa một B và ngược lại |
| one-to-many (instructor → student) | mũi tên về phía "one" (instructor) | một instructor nhiều student, mỗi student ≤ 1 instructor |
| many-to-many | không mũi tên | không giới hạn |
| **total participation** | **đường đôi** | mọi entity phải tham gia ít nhất một relationship |
| partial participation | đường đơn | có thể không tham gia |
| `l..h` | ghi trên đường nối | min..max số relationship mà mỗi entity tham gia; `1..1` = total + tối đa 1; `0..*` = không ràng buộc |

Với quan hệ **ternary**, chỉ cho phép **tối đa một mũi tên** (nhiều mũi tên có thể hiểu theo hai cách khác nhau).

### 4. Primary key
- Entity set: một superkey tối thiểu được chọn.
- Relationship set R giữa E<sub>1</sub>…E<sub>n</sub>: hợp các primary key của E<sub>i</sub> là superkey. Chọn primary key theo cardinality:

| Cardinality của R(A, B) | Primary key của R |
|---|---|
| many-to-many | PK(A) ∪ PK(B) |
| one-to-many (A "one", B "many") | PK(B) |
| many-to-one (A "many") | PK(A) |
| one-to-one | PK(A) hoặc PK(B) |

### 5. Weak entity set
- Không có đủ thuộc tính để tạo primary key; tồn tại **phụ thuộc** vào một **identifying (owner) entity set** qua **identifying relationship** (many-to-one, **total** từ phía weak).
- Ký hiệu: hình chữ nhật **đôi**, hình thoi đôi; **discriminator** (partial key) gạch chân **nét đứt**.
- PK(weak) = PK(owner) ∪ discriminator. Ví dụ section(<u>sec_id, semester, year</u>) phụ thuộc course → PK = (course_id, sec_id, semester, year).
- **Redundant attribute**: nếu student có thuộc tính dept_name và cũng có relationship stud_dept tới department thì dept_name là thừa → bỏ khỏi entity (nó sẽ quay lại khi chuyển sang bảng).

### 6. Reduction to relation schemas (slide 6.44–6.52)
| Thành phần E-R | Lược đồ quan hệ |
|---|---|
| Strong entity set | cùng tên, cùng thuộc tính đơn: student(<u>ID</u>, name, tot_cred) |
| Composite attribute | **làm phẳng**: name.first_name → `first_name` (bỏ thuộc tính cha) |
| Multivalued attribute M của E | bảng riêng EM(PK(E), M), PK = tất cả; FK → E. Ví dụ inst_phone(<u>ID, phone_number</u>) |
| Derived attribute | không lưu; tính bằng view/hàm |
| Weak entity set | bảng gồm PK(owner) + discriminator + thuộc tính; FK → owner (**on delete cascade**) |
| Relationship many-to-many | bảng gồm PK các bên + thuộc tính của relationship |
| many-to-one / one-to-many, **total** phía many | **không** tạo bảng riêng: thêm PK phía "one" vào bảng phía "many" (inst_dept → cột dept_name trong instructor) |
| many-to-one, partial phía many | vẫn có thể gộp, giá trị null cho entity không tham gia |
| one-to-one | gộp vào bên nào cũng được; thêm `unique` để giữ đúng one-to-one |
| Identifying relationship của weak entity | thừa — đã nằm trong bảng weak entity |

**Ràng buộc trong SQL**: many-to-one được ép bởi PK; one-to-one cần thêm `unique`; total participation của phía many (sau khi gộp) ép bằng `not null`; total participation phía "one" hoặc của many-to-many **không** ép được bằng PK/FK/not null (cần assertion/trigger).

### 7. Extended E-R features
- **Specialization** (top-down, ISA, tam giác): entity con thừa kế thuộc tính + relationship của cha. **Overlapping** (employee & student; mũi tên riêng) vs **disjoint** (instructor | secretary; mũi tên chung). **Generalization** = bottom-up, cùng ký hiệu.
- **Completeness constraint**: **total** (mọi entity cha phải thuộc ít nhất một entity con) vs **partial** (mặc định).
- Chuyển specialization thành bảng:

| Cách | Bảng | Ưu / nhược |
|---|---|---|
| Method 1 | person(<u>ID</u>, name, street, city), employee(<u>ID</u>, salary), student(<u>ID</u>, tot_cred); ID con là FK → cha | Không lặp dữ liệu; lấy đủ thông tin employee phải **join** |
| Method 2 | employee(<u>ID</u>, name, street, city, salary), student(<u>ID</u>, name, street, city, tot_cred) | Không cần join; nếu **overlapping** thì name/street/city bị **lặp**; nếu specialization partial thì cần bảng person cho entity không thuộc con nào; FK tới "person" khó |

- **Aggregation**: coi một relationship (proj_guide) như một entity trừu tượng để nó tham gia relationship khác (eval_for với evaluation). Bảng eval_for(<u>PK(proj_guide), evaluation_id</u>), FK → proj_guide. Tránh được việc tạo ternary eval_for(instructor, student, project, evaluation) lặp thông tin với proj_guide.

### 8. Design issues
- **Lỗi thường gặp**: dùng PK của entity khác làm thuộc tính (dept_name trong student khi đã có stud_dept); dùng thuộc tính relationship sai chỗ (gán `assignment_marks` single-valued vào takes thay vì multivalued/entity riêng).
- **Entity hay attribute?** phone là attribute nếu chỉ lưu số; là entity nếu cần thêm thông tin (location, loại) hoặc dùng chung.
- **Entity hay relationship?** Một hành động giữa các entity thường là relationship; tách thành entity (registration) khi nó có thuộc tính/quan hệ riêng.
- **Binary hay n-ary?** n-ary thể hiện rõ việc nhiều entity cùng tham gia (proj_guide). Có thể thay R(A, B, C) bằng entity E + ba relationship R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub> (E có thuộc tính định danh riêng), nhưng phải dịch cả ràng buộc và có thể sinh ra instance không ứng với R nào.
- **Design decisions**: attribute hay entity; relationship hay entity; binary hay n-ary; có dùng weak entity/specialization/aggregation không.

### 9. Ký hiệu (đọc đề)
| Ý nghĩa | Sách (Chen cải tiến) | Crow's foot | UML |
|---|---|---|---|
| Many | không mũi tên | chân chim | `*` |
| One | mũi tên | gạch đứng | `1` / `0..1` |
| Total | đường đôi | gạch đứng ở phía đối diện ("ít nhất một") | `1..*` |
| Weak entity | chữ nhật đôi | — | — |

Lưu ý: UML ghi cardinality ở **phía ngược** so với `l..h` của sách.

## 2. Trắc nghiệm (19 câu)

**Câu 1.** Trong E-R diagram của sách, **đường đôi** nối entity set với relationship set biểu diễn điều gì?

- A. Many-to-many
- B. Total participation
- C. Weak entity set
- D. Derived attribute

<details><summary>Đáp án</summary>

**B** — Đường đôi = mọi entity của entity set phải tham gia ít nhất một relationship.

</details>

**Câu 2.** advisor là one-to-many từ instructor tới student (một instructor nhiều student). Mũi tên được vẽ ở đâu?

- A. Từ advisor tới student
- B. Từ advisor tới instructor
- C. Cả hai phía
- D. Không có mũi tên

<details><summary>Đáp án</summary>

**B** — Mũi tên chỉ về phía "one": mỗi student có tối đa một instructor.

</details>

**Câu 3.** Nhãn `1..1` trên đường nối student — advisor nghĩa là gì?

- A. Mỗi student có đúng một advisor
- B. Mỗi student có tối đa một advisor
- C. Mỗi instructor có đúng một student
- D. Advisor là quan hệ one-to-one

<details><summary>Đáp án</summary>

**A** — min = 1 (total participation) và max = 1.

</details>

**Câu 4.** Primary key của relationship set many-to-many R giữa A và B là gì?

- A. PK(A)
- B. PK(B)
- C. PK(A) ∪ PK(B)
- D. Một thuộc tính mới

<details><summary>Đáp án</summary>

**C** — Một cặp (a, b) chỉ xuất hiện một lần; mỗi a có thể đi với nhiều b và ngược lại.

</details>

**Câu 5.** R là many-to-one từ A tới B. Primary key của R là?

- A. PK(A)
- B. PK(B)
- C. PK(A) ∪ PK(B)
- D. Không xác định được

<details><summary>Đáp án</summary>

**A** — Mỗi a liên kết tối đa một b nên PK(A) đã xác định duy nhất relationship.

</details>

**Câu 6.** Discriminator của weak entity set được vẽ thế nào?

- A. Gạch chân nét liền
- B. Gạch chân nét đứt
- C. Trong ngoặc nhọn {}
- D. Kèm dấu ()

<details><summary>Đáp án</summary>

**B** — Gạch chân nét đứt = partial key; {} là multivalued; () là derived.

</details>

**Câu 7.** Primary key của bảng sinh ra từ weak entity set section (discriminator sec_id, semester, year; owner course) là?

- A. (sec_id, semester, year)
- B. (course_id)
- C. (course_id, sec_id, semester, year)
- D. (sec_id)

<details><summary>Đáp án</summary>

**C** — PK(weak) = PK(owner) ∪ discriminator.

</details>

**Câu 8.** Identifying relationship của một weak entity set có đặc điểm nào?

- A. Many-to-many, partial
- B. Many-to-one từ weak tới owner, total phía weak
- C. One-to-one, partial
- D. Luôn có thuộc tính riêng

<details><summary>Đáp án</summary>

**B** — Mỗi entity yếu thuộc đúng một owner và phải có owner.

</details>

**Câu 9.** Thuộc tính multivalued `{phone_number}` của instructor được chuyển thành gì?

- A. Cột phone_number trong instructor
- B. Bảng inst_phone(ID, phone_number) với PK (ID, phone_number)
- C. Bảng inst_phone(phone_number) với PK phone_number
- D. Không lưu

<details><summary>Đáp án</summary>

**B** — Mỗi giá trị là một dòng; PK gồm cả hai cột; ID là FK → instructor.

</details>

**Câu 10.** Composite attribute `address(street, city, zip)` được chuyển thành bảng thế nào?

- A. Một cột address kiểu text
- B. Bảng riêng address
- C. Các cột street, city, zip (làm phẳng)
- D. Một cột JSON

<details><summary>Đáp án</summary>

**C** — Làm phẳng: mỗi thành phần đơn thành một cột, bỏ thuộc tính cha.

</details>

**Câu 11.** inst_dept là many-to-one từ instructor tới department, total phía instructor. Cách chuyển hợp lý nhất?

- A. Tạo bảng inst_dept(ID, dept_name)
- B. Thêm dept_name vào instructor (not null), không tạo bảng riêng
- C. Thêm ID vào department
- D. Gộp instructor và department

<details><summary>Đáp án</summary>

**B** — Bảng inst_dept sẽ có PK = ID trùng với instructor → gộp vào instructor; total → not null.

</details>

**Câu 12.** Với relationship one-to-one giữa A và B được gộp vào bảng của A (thêm cột b_id), cần thêm ràng buộc gì để giữ đúng one-to-one?

- A. primary key (b_id)
- B. unique (b_id)
- C. not null (b_id)
- D. check (b_id > 0)

<details><summary>Đáp án</summary>

**B** — Không có unique thì nhiều a có thể trỏ tới cùng một b → many-to-one.

</details>

**Câu 13.** Specialization person → {employee, student} là **overlapping** nghĩa là?

- A. Một person có thể vừa là employee vừa là student
- B. Mỗi person phải thuộc ít nhất một entity con
- C. Một person chỉ thuộc tối đa một entity con
- D. employee và student có cùng thuộc tính

<details><summary>Đáp án</summary>

**A** — Overlapping vẽ hai mũi tên riêng; disjoint vẽ một mũi tên chung.

</details>

**Câu 14.** Total generalization (completeness constraint) nghĩa là?

- A. Mỗi entity cha phải thuộc ít nhất một entity con
- B. Entity con có mọi thuộc tính của cha
- C. Các entity con rời nhau
- D. Có tối đa hai entity con

<details><summary>Đáp án</summary>

**A** — Partial là mặc định; total vẽ bằng nét đôi / ghi "total".

</details>

**Câu 15.** Nhược điểm của **method 2** (mỗi entity con một bảng chứa cả thuộc tính của cha) khi specialization là overlapping?

- A. Phải join để lấy thông tin
- B. Thuộc tính của cha bị lặp ở nhiều bảng
- C. Không biểu diễn được entity con
- D. Không có primary key

<details><summary>Đáp án</summary>

**B** — Một người vừa là employee vừa là student có name/street/city ở cả hai bảng.

</details>

**Câu 16.** Aggregation được dùng khi nào?

- A. Khi cần tính tổng (sum)
- B. Khi một relationship cần tham gia vào một relationship khác
- C. Khi entity có thuộc tính multivalued
- D. Khi có specialization

<details><summary>Đáp án</summary>

**B** — Ví dụ eval_for nối proj_guide (relationship) với evaluation.

</details>

**Câu 17.** Trong quan hệ ternary, vì sao sách chỉ cho phép tối đa một mũi tên?

- A. Vì SQL không hỗ trợ
- B. Vì nhiều mũi tên có thể hiểu theo hai nghĩa khác nhau
- C. Vì ternary luôn là many-to-many
- D. Vì mũi tên chỉ dùng cho weak entity

<details><summary>Đáp án</summary>

**B** — A→, B→ có thể là "mỗi (A,C) có một B và mỗi (B,C) có một A" hoặc "mỗi C có một (A,B)"...

</details>

**Câu 18.** student có thuộc tính dept_name và đồng thời có relationship stud_dept tới department. Đây là lỗi gì?

- A. Weak entity
- B. Redundant attribute
- C. Composite attribute
- D. Role

<details><summary>Đáp án</summary>

**B** — dept_name lặp thông tin của stud_dept → bỏ khỏi entity student.

</details>

**Câu 19.** Phone nên được mô hình là **entity** thay vì attribute khi nào?

- A. Khi mỗi người chỉ có một số
- B. Khi cần lưu thêm thông tin về số điện thoại (loại, vị trí) hoặc nhiều người dùng chung
- C. Khi số điện thoại là số nguyên
- D. Không bao giờ

<details><summary>Đáp án</summary>

**B** — Entity cho phép có thuộc tính và relationship riêng.

</details>

## 3. Câu hỏi tự luận (10 câu)

**Câu 1.** Phân biệt redundancy và incompleteness trong thiết kế. Cho ví dụ mỗi loại với University database.

<details><summary>Gợi ý đáp án</summary>

- **Redundancy**: một thông tin được lưu nhiều lần, ví dụ gộp instructor và department thành in_dep → building, budget của khoa lặp ở mỗi giảng viên; sửa một bản sẽ không nhất quán.
- **Incompleteness**: thiết kế không biểu diễn được một khía cạnh, ví dụ chỉ có bảng section chứa cả thông tin course → không lưu được một course chưa mở section nào.

</details>

**Câu 2.** Đọc diagram: `[instructor] <---- <advisor> ==== [student]` — instructor(ID, name), student(ID, name), relationship advisor có thuộc tính `date`; mũi tên chỉ về instructor, đường đôi ở phía student. Cho biết cardinality, participation, rồi viết các lược đồ quan hệ.

<details><summary>Gợi ý đáp án</summary>

- Mũi tên về instructor → mỗi student có **tối đa một** advisor: **many-to-one** từ student tới instructor (one-to-many từ instructor).
- Đường đôi phía student → **total**: mỗi student phải có advisor. Phía instructor partial.
- Lược đồ: instructor(<u>ID</u>, name), student(<u>ID</u>, name), và do total + many-to-one có thể gộp: student(<u>ID</u>, name, advisor_id **not null** → instructor, advisor_date). Nếu để bảng riêng: advisor(<u>s_ID</u>, i_ID, date).

</details>

**Câu 3.** Vì sao section được mô hình là weak entity set? Nêu một cách khác tránh weak entity và nhược điểm của nó.

<details><summary>Gợi ý đáp án</summary>

section không có course_id thì không định danh được (sec_id 1 của Fall 2017 có ở nhiều course). Thay vì lưu course_id trong section (trùng với relationship sec_course), ta coi section là weak, phụ thuộc course qua sec_course.

Cách khác: cho section một thuộc tính định danh riêng `section_id` (strong entity). Nhược điểm: mất ràng buộc tự nhiên (course_id, sec_id, semester, year) phải unique — phải khai báo thêm; khoá nhân tạo khó đọc.

</details>

**Câu 4.** Cho entity set instructor(ID, name(first_name, last_name), address(street(street_number, street_name), city), {phone_number}, date_of_birth, age()). Viết các lược đồ quan hệ.

<details><summary>Gợi ý đáp án</summary>

- instructor(<u>ID</u>, first_name, last_name, street_number, street_name, city, date_of_birth) — composite làm phẳng; age() là derived nên không lưu.
- instructor_phone(<u>ID, phone_number</u>), ID → instructor.
- age tính bằng view, ví dụ `extract(year from age(date_of_birth))`.

</details>

**Câu 5.** Một relationship many-to-one R từ A tới B. Khi nào nên gộp R vào bảng A, khi nào giữ bảng riêng?

<details><summary>Gợi ý đáp án</summary>

Gộp (thêm PK(B) vào A) khi A tham gia **total** hoặc hầu hết a đều có b — tránh join, PK vẫn là PK(A). Nếu participation của A rất partial, cột FK sẽ nhiều null; khi đó có thể giữ bảng R(<u>PK(A)</u>, PK(B), thuộc tính của R). Cả hai đều đúng về mặt logic.

</details>

**Câu 6.** Specialization person → employee, student (overlapping, partial). So sánh method 1 và method 2 khi chuyển sang bảng; với dữ liệu nào thì method 2 không đủ?

<details><summary>Gợi ý đáp án</summary>

- **Method 1**: person(ID, name, street, city), employee(ID, salary), student(ID, tot_cred); không lặp; lấy thông tin đầy đủ employee cần join với person.
- **Method 2**: employee(ID, name, street, city, salary), student(ID, name, street, city, tot_cred); không join, nhưng người vừa là employee vừa là student bị lặp name/street/city.
- Vì là **partial**, một person không phải employee hay student (ví dụ khách) **không có chỗ** lưu trong method 2 → phải thêm bảng person (hoặc dùng method 1). Method 2 chỉ thật sự phù hợp khi specialization **disjoint và total**.

</details>

**Câu 7.** Vẽ (dạng chữ) và giải thích aggregation cho bài toán: instructor hướng dẫn student làm project (proj_guide), và mỗi lần hướng dẫn có các evaluation. Vì sao không dùng ternary eval_for(instructor, student, project, evaluation)?

<details><summary>Gợi ý đáp án</summary>

```
+------------------------------------------+
| [instructor] -- <proj_guide> -- [student]|
|                      |                   |
|                  [project]               |
+------------------------------------------+
                  |
              <eval_for> ---- [evaluation]
```
Hộp ngoài là aggregation (proj_guide xem như entity). Bảng: eval_for(<u>i_ID, s_ID, project_id, evaluation_id</u>), FK (i_ID, s_ID, project_id) → proj_guide.

Nếu dùng quan hệ 4 ngôi: mỗi tuple eval_for chứa lại (i, s, p) đã có trong proj_guide → **lặp thông tin**, và không biểu diễn được ràng buộc "chỉ đánh giá những bộ (i, s, p) có tồn tại trong proj_guide".

</details>

**Câu 8.** Giải thích cách thay ternary R(A, B, C) bằng entity set E và ba binary relationship. Những vấn đề nào phát sinh?

<details><summary>Gợi ý đáp án</summary>

Tạo E với thuộc tính định danh mới; với mỗi (a, b, c) ∈ R tạo e mới và thêm (e, a) vào R<sub>A</sub>, (e, b) vào R<sub>B</sub>, (e, c) vào R<sub>C</sub>. Vấn đề:
- Phải tạo thuộc tính định danh cho E.
- Phải dịch cả ràng buộc của R (ví dụ "mỗi (b, c) có tối đa một a") — không phải lúc nào cũng dịch được bằng cardinality của binary.
- Có những instance của E, R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub> không tương ứng với R nào (e chỉ nối với a) → cần total participation của E vào cả ba.

</details>

**Câu 9.** Hãy chỉ ra lỗi trong thiết kế: entity takes có thuộc tính đơn `assignment_marks`; student có thuộc tính `dept_name` trong khi đã có relationship stud_dept. Sửa thế nào?

<details><summary>Gợi ý đáp án</summary>

- `assignment_marks` single-valued chỉ lưu được một điểm cho mọi bài tập → dùng thuộc tính multivalued {assignment_marks(assignment_no, marks)} hoặc entity assignment + relationship marks(student, assignment) có thuộc tính marks.
- `dept_name` trong student là thuộc tính thừa (đã có stud_dept) → bỏ; khi chuyển sang bảng, dept_name sẽ xuất hiện lại trong student vì stud_dept là many-to-one và được gộp.

</details>

**Câu 10.** Đọc ký hiệu crow's foot: `[department] ||----o< [instructor]`. Cardinality và participation là gì? Viết lại bằng `l..h` của sách.

<details><summary>Gợi ý đáp án</summary>

Phía department "||" = đúng một: mỗi instructor thuộc **đúng một** department (total phía instructor). Phía instructor "o<" = không hoặc nhiều: một department có 0..nhiều instructor.

Ký hiệu sách: đường instructor — inst_dept ghi `1..1`, đường department — inst_dept ghi `0..*`. Bảng: instructor(..., dept_name **not null** → department).

</details>

## 4. Bài tập SQL (20 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| 6.01 | strong entity | ★☆☆ | Entity set `lecturer` có thuộc tính ID (khoá), `name` (bắt buộc), `salary`. Tạo bảng `lecturer(ID varchar(5), name varchar(20), salary numeric(8,2))` với primary key và not null phù hợp. |
| 6.02 | composite attribute | ★☆☆ | Entity set `applicant`: ``` applicant   ID   name (first_name, middle_initial, last_name)   address (street (street_number, street_name, apt_number), city, state, zip) ``` Tạo bảng `applicant` bằng cách làm phẳng các composite attribute (mọi cột kiểu varchar(20), ID là primary key). |
| 6.03 | multivalued attribute | ★★☆ | instructor có thuộc tính multivalued `{phone_number}`. Tạo bảng `instructor_phone(ID varchar(5), phone_number varchar(15))`: một giảng viên có nhiều số, không lặp cùng một số, ID tham chiếu instructor và tự xoá khi giảng viên bị xoá. |
| 6.04 | derived attribute | ★★☆ | Thuộc tính derived `num_advisees()` của instructor = số sinh viên mà giảng viên đó hướng dẫn (bảng advisor). Không lưu cột này; hãy tạo view `instructor_advisees(ID, name, num_advisees)` cho mọi instructor (kể cả người có 0 advisee). |
| 6.05 | weak entity | ★★☆ | Weak entity set `course_assignment` phụ thuộc course qua identifying relationship; discriminator là `assign_no`, thêm thuộc tính `title`. Tạo bảng `course_assignment(course_id varchar(8), assign_no integer, title varchar(30))` với primary key đúng của weak entity, foreign key tới owner, và xoá theo owner. |
| 6.06 | M:N + attribute | ★★☆ | Relationship set many-to-many `mentors` giữa instructor và student, có thuộc tính `start_date date`. Tạo bảng `mentors(i_ID, s_ID, start_date)` (kiểu varchar(5) cho ID) với primary key và các foreign key đúng. |
| 6.07 | many-to-one gộp | ★★☆ | Entity `laptop(serial_no, model)` và relationship many-to-one `assigned_to` từ laptop tới student (mỗi laptop giao cho tối đa một sinh viên, một sinh viên có thể giữ nhiều laptop; laptop có thể chưa giao). Không tạo bảng riêng cho relationship: tạo bảng `laptop(serial_no varchar(10), model varchar(20), owner_id varchar(5))`. |
| 6.08 | one-to-one | ★★☆ | Relationship one-to-one giữa `parking_permit` và instructor: mỗi permit cấp cho đúng một instructor, mỗi instructor có tối đa một permit. Tạo bảng `parking_permit(permit_no varchar(6), i_ID varchar(5), zone varchar(2))`. |
| 6.09 | total participation | ★★☆ | Entity `textbook(isbn, title)` và relationship many-to-one `used_in` tới course, với total participation của textbook (mỗi sách phải dùng cho đúng một course). Tạo bảng `textbook(isbn varchar(13), title varchar(40), course_id varchar(8))` ép được cả cardinality lẫn total participation. |
| 6.10 | role / recursive | ★★☆ | Relationship `coreq` trên cùng entity set course với hai role `course_id` và `coreq_id` (môn phải học song song). Tạo bảng `coreq(course_id varchar(8), coreq_id varchar(8))`: cả hai là course hợp lệ, không lặp cặp, và một môn không thể là coreq của chính nó. |
| 6.11 | cardinality từ dữ liệu | ★★☆ | Trong bảng `advisor`, primary key là s_ID nên advisor là many-to-one từ student tới instructor. Kiểm tra trên dữ liệu: liệt kê `i_ID` và số advisee của các instructor hướng dẫn nhiều hơn một sinh viên (chứng tỏ phía instructor là "many"). |
| 6.12 | specialization M1 (DDL) | ★★☆ | Chuyển specialization person → {employee, student} theo method 1: tạo - `p_person(ID varchar(5) primary key, name varchar(20), street varchar(30), city varchar(20))` - `p_employee(ID, salary numeric(8,2))` và `p_student(ID, tot_cred numeric(3,0))`, trong đó ID của bảng con vừa là primary key vừa là foreign key tới p_person, xoá theo cha. |
| 6.13 | specialization M1 (query) | ★☆☆ | Với các bảng method 1 có sẵn `er_person`, `er_employee`, `er_student`: liệt kê ID, name, city, salary của mọi employee. (Nhược điểm method 1: phải join để có đủ thuộc tính.) |
| 6.14 | overlapping / partial | ★★☆ | Trên `er_person`, `er_employee`, `er_student`: trả về hai cột `ID, kind`, với kind là `both` cho người vừa là employee vừa là student, `none` cho người không thuộc entity con nào (partial specialization). |
| 6.15 | specialization M2 | ★★★ | Chuyển dữ liệu của `er_person/er_employee/er_student` sang method 2: 1. Tạo bảng `m2_employee(ID, name, street, city, salary)` và `m2_student(ID, name, street, city, tot_credits)` (cùng kiểu với bảng gốc, ID là primary key) và nạp dữ liệu từ các bảng er_. 2. Tạo view `m2_person(ID, name, street, city)` = hợp của hai bảng. Hệ thống sẽ đếm số dòng mỗi bảng, số người bị lặp name/street/city ở cả hai bảng, và số người trong view. |
| 6.16 | aggregation (DDL) | ★★★ | Bảng `er_proj_guide(i_ID, s_ID, project_id)` (primary key cả ba cột) và `er_evaluation(evaluation_id, ...)` đã có. Tạo bảng `eval_for(i_ID varchar(5), s_ID varchar(5), project_id varchar(5), evaluation_id varchar(5))` biểu diễn relationship giữa aggregation proj_guide và evaluation. |
| 6.17 | aggregation (query) | ★★☆ | Với `er_proj_guide`, `er_project`, `er_eval_for`, `er_evaluation`: liệt kê mọi bộ hướng dẫn (i_ID, s_ID, project title) kèm grade của evaluation; bộ chưa được đánh giá vẫn xuất hiện với grade null. |
| 6.18 | ternary + arrow | ★★★ | Ternary relationship `proj_guide_t(instructor, student, project)` có một mũi tên tới instructor: mỗi cặp (student, project) có tối đa một instructor hướng dẫn. Tạo bảng `proj_guide_t(i_ID varchar(5), s_ID varchar(5), project_id varchar(5))` với primary key phản ánh đúng ràng buộc đó (FK: i_ID → instructor, s_ID → student, project_id → er_project). |
| 6.19 | ternary → binary | ★★★ | Thay ternary proj_guide bằng entity set `guide_e` (thuộc tính định danh `e_id`) và ba relationship R[A], R[B], R[C] many-to-one, total từ phía E (gộp vào bảng E). Tạo bảng `guide_e(e_id integer, i_ID varchar(5), s_ID varchar(5), project_id varchar(5))` sao cho: mỗi e nối đúng một instructor, một student, một project, và không có hai e cho cùng bộ (i_ID, s_ID, project_id). |
| 6.20 | reduction tổng hợp | ★★★ | Chuyển đoạn E-R sau thành bảng (kiểu: varchar(10) cho mọi khoá/chuỗi, numeric(10,2) cho tiền, date cho ngày): ``` [hotel] hotel_id, name, {phone} [room]  (weak, owner = hotel) room_no (discriminator), rate [guest] guest_id, name   many-to-many giữa guest và room, thuộc tính check_in ``` Tạo các bảng `hotel(hotel_id, name)`, `hotel_phone(hotel_id, phone)`, `room(hotel_id, room_no, rate)`, `guest(guest_id, name)`, `stay(guest_id, hotel_id, room_no, check_in)` với đủ primary key, foreign key (room và hotel_phone xoá theo hotel). Một khách có thể ở cùng phòng nhiều lần ở các ngày check_in khác nhau. |
