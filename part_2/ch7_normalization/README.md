# Chương 7 — Chuẩn hoá (Relational Database Design)

*Normalization · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch7`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### Phạm vi theo lịch học (số slide in ở chân trang)
| Tuần | Slide | Nội dung |
|---|---|---|
| 11 | 7.1 – 7.21 | Thiết kế tốt/xấu (in_dep), decomposition, lossy vs lossless, normalization theory, functional dependency, legal instance, key qua FD, FD tầm thường, kiểm tra lossless bằng FD, dependency preservation |
| 12 | 7.21 – 7.35 | BCNF, phân rã BCNF, BCNF vs bảo toàn phụ thuộc, 3NF, dư thừa trong 3NF, so sánh BCNF/3NF, mục tiêu chuẩn hoá, "BCNF đã đủ tốt chưa?" → multivalued dependency (inst_info) |
| Mở rộng | 7.37 trở đi | F⁺, Armstrong, bao đóng thuộc tính, canonical cover, thuật toán BCNF/3NF, 4NF, 1NF — **không nằm trong slide 35 nhưng Practice Exercises cần tới**, nên phải học |

Tự kiểm tra mọi bài tính tay bằng **Công cụ › Phụ thuộc hàm (FD)** (có sẵn các ví dụ của slide và Practice Exercises).

### 1. Thiết kế xấu: dư thừa (slide 7.3)
Gộp instructor và department thành `in_dep(ID, name, salary, dept_name, building, budget)`:
- **Lặp thông tin**: building, budget của một khoa lặp lại ở mọi giảng viên của khoa.
- **Update anomaly**: đổi budget ở một dòng mà quên dòng khác → dữ liệu mâu thuẫn.
- **Insertion anomaly**: không thể ghi một khoa mới chưa có giảng viên (trừ khi dùng null).
- **Deletion anomaly**: xoá giảng viên cuối cùng của khoa thì mất luôn thông tin khoa.

### 2. Decomposition, lossy và lossless (slide 7.4–7.7)
- Phân rã R thành R₁, R₂ với R = R₁ ∪ R₂.
- **Lossless (lossless-join)**: với mọi instance hợp lệ r, Π<sub>R1</sub>(r) ⋈ Π<sub>R2</sub>(r) = r.
- **Lossy**: phép join cho ra **nhiều tuple hơn** (tuple giả — spurious tuples), nên ta *mất thông tin* tuple nào là thật. Ví dụ: employee(ID, name, street, city, salary) tách thành (ID, name) và (name, street, city, salary): hai nhân viên cùng tên Kim sinh ra 4 tổ hợp.
- Luôn có r ⊆ Π<sub>R1</sub>(r) ⋈ Π<sub>R2</sub>(r) (PE 7.12): phân rã không bao giờ làm *mất* tuple, chỉ có thể *thêm* tuple.

### 3. Functional dependency (slide 7.9–7.15)
- α → β đúng trên R nếu với mọi instance hợp lệ: t₁[α] = t₂[α] ⇒ t₁[β] = t₂[β].
- FD là ràng buộc trên **mọi instance hợp lệ (legal instance)**; một instance cụ thể có thể *thoả* một FD một cách tình cờ (ví dụ name → ID đúng trên dữ liệu mẫu nhưng không phải FD).
- **K là superkey ⇔ K → R**. **K là candidate key ⇔ K → R và không tập con thực sự nào của K → R**.
- FD dùng để: kiểm tra một instance có hợp lệ không; *đặc tả* ràng buộc trên lược đồ.
- **FD tầm thường (trivial)**: α → β với β ⊆ α (ví dụ ID, name → ID).
- **F⁺** (bao đóng của F): mọi FD được suy ra từ F.

Kiểm tra một FD trên dữ liệu bằng SQL (PE 7.9):
```sql
select B from r group by B having count(distinct C) > 1;  -- rỗng ⇔ B → C đúng trên r
```

### 4. Kiểm tra lossless bằng FD (slide 7.16–7.17)
Phân rã R thành R₁, R₂ là lossless nếu **ít nhất một** trong hai FD sau thuộc F⁺:
- R₁ ∩ R₂ → R₁, hoặc
- R₁ ∩ R₂ → R₂

(tức là phần chung là superkey của R₁ hoặc của R₂). Ví dụ R = (A, B, C), F = {A → B, B → C}: (A, B), (B, C) lossless vì B → BC; (A, B), (A, C) cũng lossless vì A → AB.

### 5. Dependency preservation (slide 7.18–7.21)
- F<sub>i</sub> = các FD trong F⁺ chỉ chứa thuộc tính của R<sub>i</sub>. Phân rã **bảo toàn phụ thuộc** nếu (F₁ ∪ … ∪ F<sub>n</sub>)⁺ = F⁺.
- Ý nghĩa: kiểm tra mọi FD chỉ cần nhìn **từng bảng riêng lẻ**, không phải join.
- Ví dụ `dept_advisor(s_ID, i_ID, dept_name)` với i_ID → dept_name và s_ID, dept_name → i_ID: tách (s_ID, i_ID), (i_ID, dept_name) làm mất s_ID, dept_name → i_ID.

### 6. BCNF (slide 7.23–7.27)
R ở **BCNF** nếu với mọi α → β trong F⁺ (α, β ⊆ R), ít nhất một điều sau đúng:
- α → β tầm thường (β ⊆ α), hoặc
- α là **superkey** của R.

in_dep không ở BCNF vì dept_name → building, budget mà dept_name không phải superkey.

**Phân rã khi vi phạm** bởi α → β: thay R bằng **(α ∪ β)** và **(R − (β − α))**. Ví dụ in_dep → (dept_name, building, budget) và (ID, name, salary, dept_name). Phần chung dept_name là key của bảng thứ nhất → lossless.

**BCNF và bảo toàn phụ thuộc**: không phải lúc nào cũng đạt cả hai (dept_advisor: không có phân rã BCNF nào bảo toàn s_ID, dept_name → i_ID).

### 7. 3NF (slide 7.28–7.31)
R ở **3NF** nếu với mọi α → β trong F⁺, ít nhất một điều đúng:
- α → β tầm thường, hoặc
- α là superkey, hoặc
- mỗi thuộc tính A ∈ β − α nằm trong **một candidate key** nào đó (A là *prime*; có thể mỗi A thuộc một key khác nhau).

BCNF ⇒ 3NF (3NF nới lỏng thêm điều kiện thứ ba). dept_advisor ở 3NF vì dept_name là prime (thuộc key {s_ID, dept_name}).

**Dư thừa trong 3NF** (slide 7.30): vẫn lặp (i_ID, dept_name) và có thể phải dùng null.

| | BCNF | 3NF |
|---|---|---|
| Dư thừa do FD | không | có thể còn |
| Luôn có phân rã lossless | có | có |
| Luôn bảo toàn phụ thuộc | **không** | **có** |

**Mục tiêu thiết kế** (slide 7.32): BCNF + lossless + bảo toàn phụ thuộc; nếu không được thì chấp nhận *hoặc* mất bảo toàn phụ thuộc *hoặc* dư thừa của 3NF. (SQL chỉ kiểm tra hiệu quả superkey qua primary key/unique; FD khác cần assertion — đắt và không được hỗ trợ — hoặc trigger.)

### 8. BCNF đã đủ tốt chưa? (slide 7.33–7.35)
`inst_info(ID, child_name, phone)`: một giảng viên có nhiều con, nhiều số điện thoại, hai thông tin độc lập. Không có FD không tầm thường → **đã ở BCNF**, nhưng phải lưu **mọi tổ hợp** con × số điện thoại (thêm một số điện thoại phải chèn nhiều dòng). Tách thành inst_child(ID, child_name) và inst_phone(ID, phone) tốt hơn → cần dạng chuẩn cao hơn: **4NF** dựa trên **multivalued dependency**.

### Mở rộng — cần cho Practice Exercises

#### 9. F⁺ và Armstrong's axioms (slide 7.37–7.41)
- **Reflexivity**: β ⊆ α ⇒ α → β
- **Augmentation**: α → β ⇒ γα → γβ
- **Transitivity**: α → β, β → γ ⇒ α → γ

Ba tiên đề **sound** (chỉ sinh FD đúng) và **complete** (sinh ra toàn bộ F⁺). Luật suy ra:
- **Union**: α → β, α → γ ⇒ α → βγ (PE 7.4)
- **Decomposition**: α → βγ ⇒ α → β và α → γ
- **Pseudotransitivity**: α → β, γβ → δ ⇒ αγ → δ (PE 7.5)

Ví dụ R = (A, B, C, G, H, I), F = {A → B, A → C, CG → H, CG → I, B → H}: A → H (bắc cầu A → B → H); AG → I (augment A → C thành AG → CG, rồi bắc cầu với CG → I); CG → HI (union).

#### 10. Bao đóng thuộc tính α⁺ (slide 7.42–7.44)
```text
result := α
while (result thay đổi) do
  for each β → γ in F do
    if β ⊆ result then result := result ∪ γ
```
Ví dụ trên: (AG)⁺: AG → ABG (A → B) → ABCG (A → C) → ABCGH (CG → H) → ABCGHI (CG → I). Vậy AG là superkey; A⁺ = ABCH, G⁺ = G nên AG là **candidate key**.

Công dụng: kiểm tra **superkey** (α⁺ ⊇ R); kiểm tra α → β ∈ F⁺ (β ⊆ α⁺); tính F⁺ (với mọi γ ⊆ R, γ → S cho mọi S ⊆ γ⁺).

**Tìm candidate key nhanh**: thuộc tính không xuất hiện ở vế phải nào phải có trong **mọi** key; thuộc tính chỉ xuất hiện ở vế phải thì **không** thuộc key nào.

#### 11. Canonical cover F<sub>c</sub> (slide 7.45–7.53)
- A **thừa ở vế trái** của α → β nếu F ⇒ (α − A) → β: kiểm tra (α − A)⁺ dưới **F** có chứa β.
- A **thừa ở vế phải** nếu F' = (F − {α → β}) ∪ {α → (β − A)} ⇒ F: kiểm tra α⁺ dưới **F'** có chứa A.
- F<sub>c</sub>: tương đương F, không thuộc tính thừa, vế trái không trùng nhau.

Thuật toán: lặp { gộp các FD cùng vế trái (union); tìm **một** thuộc tính thừa rồi xoá } cho tới khi không đổi.

Ví dụ F = {A → BC, B → C, A → B, AB → C}: gộp A → BC, A → B thành A → BC; A thừa trong AB → C (B⁺ = BC chứa C) → B → C; C thừa trong A → BC (A⁺ dưới {A → B, B → C} chứa C) → **F<sub>c</sub> = {A → B, B → C}**. Canonical cover có thể không duy nhất (PE 7.14).

#### 12. Kiểm tra BCNF / 3NF (slide 7.55–7.62)
- Trên **lược đồ ban đầu R**: chỉ cần xét các FD trong F (không cần F⁺): mỗi α → β không tầm thường phải có α⁺ ⊇ R.
- Trên một **bảng con R<sub>i</sub>** sau phân rã, xét F thôi là **sai** (ví dụ R = (A, B, C, D, E), F = {A → B, BC → D}, R₁ = (A, C, D, E): F không có FD nào nằm trong R₁ nhưng AC → D ∈ F⁺ vi phạm). Phải kiểm tra: với mọi α ⊆ R<sub>i</sub>, α⁺ ∩ (R<sub>i</sub> − α) rỗng hoặc chứa hết R<sub>i</sub>.
- 3NF: mỗi α → β ∈ F, α superkey hoặc mọi thuộc tính trong β − α là prime (cần biết các candidate key).

#### 13. Thuật toán phân rã BCNF (slide 7.57–7.59)
```text
result := {R}
while (có R_i trong result không ở BCNF) do
  chọn α → β vi phạm trên R_i (α → R_i ∉ F⁺, α ∩ β = ∅)
  result := (result − R_i) ∪ {R_i − β} ∪ {(α, β)}
```
Ví dụ class(course_id, title, dept_name, credits, sec_id, semester, year, building, room_number, capacity, time_slot_id) với course_id → title, dept_name, credits; building, room_number → capacity; course_id, sec_id, semester, year → building, room_number, time_slot_id. Key: {course_id, sec_id, semester, year}. Tách theo course_id → course(course_id, title, dept_name, credits); phần còn lại tách theo building, room_number → classroom(building, room_number, capacity) và section(course_id, sec_id, semester, year, building, room_number, time_slot_id). Kết quả lossless và ở BCNF.

#### 14. Thuật toán tổng hợp 3NF (slide 7.63–7.66)
```text
F_c := canonical cover của F; i := 0
for each α → β in F_c: nếu chưa R_j nào chứa αβ thì i++, R_i := αβ
nếu chưa R_j nào chứa một candidate key của R thì i++, R_i := một candidate key
(tuỳ chọn) bỏ R_j nằm trọn trong R_k khác
```
Kết quả luôn: mỗi R<sub>i</sub> ở 3NF, **lossless** và **bảo toàn phụ thuộc**. Ví dụ cust_banker_branch(customer_id, employee_id, branch_name, type), F<sub>c</sub> = {customer_id, employee_id → type; employee_id → branch_name; customer_id, branch_name → employee_id} → (customer_id, employee_id, type), (employee_id, branch_name), (customer_id, branch_name, employee_id); bỏ (employee_id, branch_name) vì nằm trong lược đồ thứ ba. Key {customer_id, employee_id} đã có trong lược đồ đầu nên không cần thêm.

#### 15. Multivalued dependency và 4NF (slide 7.69–7.79)
- α →→ β: với mọi t₁, t₂ cùng α, tồn tại t₃, t₄ sao cho t₃ = (α, β của t₁, phần còn lại của t₂), t₄ = (α, β của t₂, phần còn lại của t₁). Nghĩa: với mỗi giá trị α, tập β **độc lập** với phần còn lại → lưu đủ mọi tổ hợp.
- Mọi FD là MVD: α → β ⇒ α →→ β. Nếu α →→ β thì α →→ R − α − β.
- **4NF**: mọi α →→ β không tầm thường (β ⊄ α và α ∪ β ≠ R) có α là superkey. 4NF ⇒ BCNF.
- inst_info: ID →→ child_name, ID →→ phone; ID không phải superkey → tách inst_child, inst_phone.

#### 16. 1NF và 2NF
- **1NF**: mọi domain **atomic** (không có thuộc tính đa trị/composite, không mã hoá nhiều thông tin trong một chuỗi như "CS0012").
- **2NF** (PE 7.19): không thuộc tính không khoá nào **phụ thuộc bộ phận** vào một candidate key (phụ thuộc vào tập con thực sự của key). Ví dụ (student_id, course_id, student_name, grade) với student_id → student_name: không 2NF. Mọi lược đồ 3NF đều ở 2NF.

| Dạng chuẩn | Điều kiện cho α → A không tầm thường |
|---|---|
| 2NF | A prime, hoặc A không phụ thuộc vào tập con thực sự của một candidate key |
| 3NF | α superkey, hoặc A prime |
| BCNF | α superkey |
| 4NF | (cho cả MVD) α superkey |

## 2. Trắc nghiệm (18 câu)

**Câu 1.** Lược đồ in_dep(ID, name, salary, dept_name, building, budget) có vấn đề gì?

- A. Không có primary key
- B. building, budget của một khoa bị lặp ở mọi giảng viên của khoa
- C. Không thể join
- D. Vi phạm 1NF

<details><summary>Đáp án</summary>

**B** — dept_name → building, budget nhưng dept_name không phải key → lặp thông tin, gây update/insert/delete anomaly.

</details>

**Câu 2.** Phân rã lossy nghĩa là gì?

- A. Join các bảng con mất một số tuple gốc
- B. Join các bảng con cho ra thêm tuple không có trong bảng gốc
- C. Bảng con không có primary key
- D. Một FD không được bảo toàn

<details><summary>Đáp án</summary>

**B** — r luôn ⊆ join các projection; lossy là join có tuple giả → không biết tuple nào là thật.

</details>

**Câu 3.** R = (A, B, C), F = {A → B}. Phân rã nào lossless?

- A. (A, B), (B, C)
- B. (A, B), (A, C)
- C. (A, C), (B, C)
- D. Không phân rã nào

<details><summary>Đáp án</summary>

**B** — R₁ ∩ R₂ = A và A → AB = R₁. Với (A, B), (B, C): phần chung B không xác định A hay C.

</details>

**Câu 4.** Trên một instance, mọi giảng viên có tên khác nhau. Có thể kết luận name → ID là FD của lược đồ instructor?

- A. Có
- B. Không — FD phải đúng trên mọi instance hợp lệ
- C. Có, nếu bảng có trên 10 dòng
- D. Chỉ khi name là unique

<details><summary>Đáp án</summary>

**B** — Một instance chỉ có thể chứng minh FD *không* đúng, không thể chứng minh FD đúng.

</details>

**Câu 5.** FD nào là tầm thường (trivial)?

- A. ID → name
- B. ID, name → name
- C. name → ID
- D. dept_name → building

<details><summary>Đáp án</summary>

**B** — β ⊆ α: {name} ⊆ {ID, name}.

</details>

**Câu 6.** K là superkey của R khi và chỉ khi:

- A. K → R
- B. R → K
- C. K có một thuộc tính
- D. K là primary key

<details><summary>Đáp án</summary>

**A** — K xác định mọi thuộc tính của R. Candidate key: thêm điều kiện tối thiểu.

</details>

**Câu 7.** R ở BCNF nếu mọi α → β không tầm thường trong F⁺ có:

- A. α là candidate key
- B. α là superkey
- C. β là prime
- D. α là superkey hoặc β prime

<details><summary>Đáp án</summary>

**B** — Superkey (không nhất thiết tối thiểu). "β − α prime" là điều kiện nới lỏng của 3NF.

</details>

**Câu 8.** Phân rã R theo FD vi phạm BCNF α → β cho ra:

- A. (α ∪ β) và (R − (β − α))
- B. (α) và (β)
- C. (α ∪ β) và (R − α)
- D. (R − α) và (R − β)

<details><summary>Đáp án</summary>

**A** — Phần chung là α, là superkey của (α ∪ β) → lossless.

</details>

**Câu 9.** dept_advisor(s_ID, i_ID, dept_name), F = {i_ID → dept_name; s_ID, dept_name → i_ID}. Khẳng định nào đúng?

- A. Ở BCNF
- B. Ở 3NF nhưng không ở BCNF
- C. Không ở 3NF
- D. Không có candidate key

<details><summary>Đáp án</summary>

**B** — i_ID không phải superkey (vi phạm BCNF), nhưng dept_name thuộc key {s_ID, dept_name} nên vẫn 3NF.

</details>

**Câu 10.** Ưu điểm của 3NF so với BCNF là:

- A. Không bao giờ dư thừa
- B. Luôn tìm được phân rã 3NF lossless và bảo toàn phụ thuộc
- C. Ít bảng hơn
- D. Không cần FD

<details><summary>Đáp án</summary>

**B** — BCNF không phải lúc nào cũng bảo toàn phụ thuộc được (ví dụ dept_advisor).

</details>

**Câu 11.** Phân rã bảo toàn phụ thuộc có lợi gì?

- A. Join nhanh hơn
- B. Kiểm tra mọi FD chỉ cần xét từng bảng riêng, không cần join
- C. Luôn lossless
- D. Không cần primary key

<details><summary>Đáp án</summary>

**B** — Nếu một FD bị mất, mỗi lần update phải join các bảng để kiểm tra.

</details>

**Câu 12.** inst_info(ID, child_name, phone) không có FD không tầm thường. Khẳng định nào đúng?

- A. Không ở BCNF
- B. Ở BCNF nhưng vẫn dư thừa → cần 4NF
- C. Ở 4NF
- D. Vi phạm 1NF

<details><summary>Đáp án</summary>

**B** — ID →→ child_name là MVD không tầm thường, ID không phải superkey → không 4NF.

</details>

**Câu 13.** Luật nào KHÔNG phải tiên đề Armstrong?

- A. Reflexivity
- B. Augmentation
- C. Transitivity
- D. Union

<details><summary>Đáp án</summary>

**D** — Union được suy ra từ augmentation + transitivity (PE 7.4).

</details>

**Câu 14.** R = (A, B, C, G, H, I), F = {A → B, A → C, CG → H, CG → I, B → H}. (AG)⁺ = ?

- A. ABCG
- B. ABCGH
- C. ABCGHI
- D. AG

<details><summary>Đáp án</summary>

**C** — AG → +B, +C (A), +H, +I (CG) → ABCGHI, nên AG là superkey.

</details>

**Câu 15.** Kiểm tra A có thừa ở VẾ TRÁI của α → β, ta tính:

- A. (α − A)⁺ dưới F, xem có chứa β
- B. α⁺ dưới F, xem có chứa A
- C. (α − A)⁺ dưới F − {α → β}
- D. β⁺ dưới F

<details><summary>Đáp án</summary>

**A** — Vế phải thì ngược lại: tính α⁺ dưới F' (đã bỏ A khỏi β) xem còn chứa A không.

</details>

**Câu 16.** F = {A → BC, B → C, A → B, AB → C}. Canonical cover là:

- A. {A → BC, B → C}
- B. {A → B, B → C}
- C. {A → B, AB → C}
- D. {A → C, B → C}

<details><summary>Đáp án</summary>

**B** — Gộp A → BC; A thừa trong AB → C; C thừa trong A → BC.

</details>

**Câu 17.** Bước cuối của thuật toán 3NF: nếu không lược đồ nào chứa candidate key thì thêm một lược đồ là candidate key. Mục đích?

- A. Bảo toàn phụ thuộc
- B. Đảm bảo lossless
- C. Đảm bảo BCNF
- D. Giảm số bảng

<details><summary>Đáp án</summary>

**B** — Bảo toàn phụ thuộc đã có nhờ mỗi FD trong F_c thành một bảng; key đảm bảo lossless (PE 7.16).

</details>

**Câu 18.** Lược đồ (student_id, course_id, student_name, grade), F = {student_id → student_name; student_id, course_id → grade}. Dạng chuẩn cao nhất?

- A. 1NF (không 2NF)
- B. 2NF
- C. 3NF
- D. BCNF

<details><summary>Đáp án</summary>

**A** — student_name (không khoá) phụ thuộc bộ phận vào key {student_id, course_id}.

</details>

## 3. Câu hỏi tự luận (12 câu)

**Câu 1.** Cho R = (A, B, C, D, E), F = {AB → C, C → D, D → E}. Tính (AB)⁺, C⁺, tìm mọi candidate key.

<details><summary>Gợi ý đáp án</summary>

- (AB)⁺: AB → ABC (AB → C) → ABCD (C → D) → ABCDE (D → E). AB là superkey.
- C⁺ = CDE, A⁺ = A, B⁺ = B → AB tối thiểu.
- A và B không xuất hiện ở vế phải nào → phải có trong mọi key; AB đã là superkey → **candidate key duy nhất: AB**.

</details>

**Câu 2.** Tiếp tục bài trên: R có ở BCNF/3NF không? Phân rã R về BCNF; phân rã có bảo toàn phụ thuộc không?

<details><summary>Gợi ý đáp án</summary>

- C → D: C không phải superkey, D không prime → vi phạm cả BCNF và 3NF (tương tự D → E).
- Tách theo C → D: dùng C⁺ = CDE, ta có (C, D, E) và (A, B, C).
- (C, D, E): D → E, D không phải superkey của CDE → tách (D, E) và (C, D).
- Kết quả: **(A, B, C), (C, D), (D, E)**. Mọi FD AB → C, C → D, D → E đều nằm trọn trong một bảng → **bảo toàn phụ thuộc**. Mỗi bước tách có phần chung là key của một bên → lossless.

</details>

**Câu 3.** R = (A, B, C, D), F = {AB → C, C → D, D → A}. Tìm candidate key; R có ở 3NF? BCNF?

<details><summary>Gợi ý đáp án</summary>

- B không ở vế phải nào → B thuộc mọi key. B⁺ = B.
- (AB)⁺ = ABCD; (BC)⁺: C → D → A → ABCD; (BD)⁺: D → A, AB → C → ABCD. **Key: AB, BC, BD** (đều tối thiểu).
- Mọi thuộc tính A, B, C, D đều prime → mọi FD thoả điều kiện thứ ba → **3NF**.
- C → D, D → A có vế trái không phải superkey → **không BCNF**.
- Phân rã BCNF (một cách): theo C → D → (C, D) và (A, B, C); trong (A, B, C) có C → A (suy ra qua C → D → A) vi phạm → (A, C), (B, C). Kết quả (C, D), (A, C), (B, C) — **mất AB → C** và D → A. Đây là lý do có lúc ta chọn dừng ở 3NF.

</details>

**Câu 4.** Tính canonical cover của F = {A → BD, B → C, AB → C, D → C, A → C} trên R = (A, B, C, D).

<details><summary>Gợi ý đáp án</summary>

1. Gộp A → BD và A → C: **A → BCD**.
2. Vế phải của A → BCD: bỏ C, F' = {A → BD, B → C, AB → C, D → C}; A⁺ dưới F' = ABCD chứa C → **C thừa** → A → BD.
3. Vế trái của AB → C: B⁺ = BC chứa C → **A thừa** → B → C (trùng FD đã có, gộp lại).
4. Kiểm tra tiếp: B và D trong A → BD không thừa (bỏ B: A⁺ = ACD thiếu B; bỏ D: A⁺ = ABC thiếu D).
**F<sub>c</sub> = {A → BD, B → C, D → C}**.

</details>

**Câu 5.** R = (A, B, C, D), F = {A → B, C → D}. Phân rã nào lossless: (a) (A, B), (C, D); (b) (A, B, C), (C, D); (c) (A, B), (A, C, D)?

<details><summary>Gợi ý đáp án</summary>

- (a) R₁ ∩ R₂ = ∅ → không xác định gì → **lossy** (join là Cartesian product).
- (b) Phần chung C, C⁺ = CD = R₂ → **lossless**.
- (c) Phần chung A, A⁺ = AB = R₁ → **lossless**.
Chú ý (b), (c) vẫn chưa ở BCNF: (A, B, C) có A → B với key AC; phân rã BCNF hoàn chỉnh là (A, B), (C, D), (A, C).

</details>

**Câu 6.** R = (A, B, C), F = {A → B, B → C}. So sánh hai phân rã (A, B), (A, C) và (A, B), (B, C).

<details><summary>Gợi ý đáp án</summary>

- Cả hai đều **lossless** (phần chung A → AB; phần chung B → BC).
- (A, B), (A, C): F₁ = {A → B}, F₂ = {A → C}; B → C **không** suy ra được từ F₁ ∪ F₂ → **không bảo toàn phụ thuộc**: muốn kiểm tra B → C phải join.
- (A, B), (B, C): A → B nằm trong R₁, B → C nằm trong R₂ → **bảo toàn phụ thuộc**, và cả hai bảng ở BCNF → phân rã tốt hơn.

</details>

**Câu 7.** Dùng Armstrong's axioms chứng minh: từ F = {A → B, B → C, CD → E} suy ra AD → E.

<details><summary>Gợi ý đáp án</summary>

1. A → B (cho), B → C (cho) ⇒ **A → C** (transitivity).
2. Augmentation với D: **AD → CD**.
3. AD → CD, CD → E ⇒ **AD → E** (transitivity).
(Hoặc dùng pseudotransitivity: A → C và CD → E ⇒ AD → E.) Kiểm tra bằng bao đóng: (AD)⁺ = ABCDE chứa E.

</details>

**Câu 8.** R = (A, B, C, D, E, F), F = {A → B, B → C, CD → E, E → F}. Tìm key và phân rã 3NF bằng thuật toán tổng hợp.

<details><summary>Gợi ý đáp án</summary>

- A, D không ở vế phải nào → thuộc mọi key; (AD)⁺: A → B → C, CD → E → F → **ABCDEF**. Key duy nhất: **AD**.
- F đã là canonical cover (vế trái khác nhau, không thuộc tính thừa).
- Mỗi FD một lược đồ: (A, B), (B, C), (C, D, E), (E, F).
- Chưa lược đồ nào chứa key AD → thêm **(A, D)**.
- Kết quả: (A, B), (B, C), (C, D, E), (E, F), (A, D) — 3NF, lossless, bảo toàn phụ thuộc.

</details>

**Câu 9.** Phân rã class(course_id, title, dept_name, credits, sec_id, semester, year, building, room_number, capacity, time_slot_id) về BCNF (FD như slide 7.58). Giải thích vì sao kết quả lossless.

<details><summary>Gợi ý đáp án</summary>

- Key: {course_id, sec_id, semester, year}.
- course_id → title, dept_name, credits vi phạm → **course(course_id, title, dept_name, credits)** và class-1(course_id, sec_id, semester, year, building, room_number, capacity, time_slot_id). Phần chung course_id là key của course → lossless.
- Trong class-1: building, room_number → capacity vi phạm → **classroom(building, room_number, capacity)** và **section(course_id, sec_id, semester, year, building, room_number, time_slot_id)**. Phần chung (building, room_number) là key của classroom → lossless.
- Ba bảng đều ở BCNF (vế trái mỗi FD còn lại là key của bảng chứa nó) và mọi FD đều nằm trong một bảng → bảo toàn phụ thuộc.

</details>

**Câu 10.** Vì sao dept_advisor(s_ID, i_ID, dept_name) không thể vừa BCNF vừa bảo toàn phụ thuộc? Nếu giữ ở 3NF thì phải chịu dư thừa gì?

<details><summary>Gợi ý đáp án</summary>

- Vi phạm BCNF là i_ID → dept_name → tách (i_ID, dept_name), (s_ID, i_ID). FD s_ID, dept_name → i_ID cần cả ba thuộc tính, không nằm trong bảng nào → mất. Mọi phân rã thực sự khác cũng tách rời ba thuộc tính này.
- Giữ nguyên 3NF: (i_ID, dept_name) bị lặp cho mỗi sinh viên mà giảng viên đó hướng dẫn; muốn ghi một giảng viên thuộc khoa nào mà chưa có sinh viên thì phải để s_ID null. Đổi lại, s_ID, dept_name → i_ID kiểm tra được bằng `unique (s_ID, dept_name)`.

</details>

**Câu 11.** Cho inst_info(ID, child_name, phone). Giải thích ID →→ child_name bằng định nghĩa t₁, t₂, t₃, t₄; vì sao không ở 4NF và phân rã thế nào?

<details><summary>Gợi ý đáp án</summary>

- Với t₁ = (99999, David, 512-555-1234) và t₂ = (99999, William, 512-555-4321), MVD đòi hỏi tồn tại t₃ = (99999, David, 512-555-4321) và t₄ = (99999, William, 512-555-1234): con và số điện thoại độc lập nên phải có đủ mọi tổ hợp.
- ID →→ child_name không tầm thường (child_name ⊄ ID và ID ∪ child_name ≠ R), ID không phải superkey → **không 4NF** (dù ở BCNF vì không có FD không tầm thường).
- Phân rã: **inst_child(ID, child_name)**, **inst_phone(ID, phone)**. Lossless vì phần chung ID →→ child_name. Thêm một số điện thoại giờ chỉ là một dòng.

</details>

**Câu 12.** Cho R(student_id, course_id, student_name, grade), F = {student_id → student_name; student_id, course_id → grade}. Xác định dạng chuẩn và đưa về BCNF.

<details><summary>Gợi ý đáp án</summary>

- Key: {student_id, course_id}. student_name không khoá, phụ thuộc vào student_id ⊂ key → **phụ thuộc bộ phận → không 2NF** (do đó không 3NF, không BCNF). Chỉ ở 1NF.
- Tách theo student_id → student_name: **(student_id, student_name)** và **(student_id, course_id, grade)**. Cả hai ở BCNF, lossless (phần chung student_id là key của bảng đầu), bảo toàn phụ thuộc.

</details>

## 4. Bài tập SQL (19 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| 7.01 | redundancy | ★☆☆ | Bảng `nf_in_dep(ID, name, salary, dept_name, building, budget)` là instructor ⋈ department (slide 7.3). Liệt kê các bộ (dept_name, building, budget) bị lặp lại, kèm số lần lặp `copies` (chỉ những bộ xuất hiện từ 2 lần). |
| 7.02 | update anomaly | ★☆☆ | Mô phỏng update anomaly: đổi budget của khoa Physics thành 95000 nhưng chỉ ở dòng của giảng viên ID `22222` trong `nf_in_dep`. (Hệ thống sẽ kiểm tra các khoa giờ có nhiều hơn một budget.) |
| 7.03 | test FD | ★☆☆ | Bảng `nf_enroll_raw(student_id, student_name, course_id, course_title, grade)` có dữ liệu "bẩn". Trả về các `student_id` vi phạm FD student_id → student_name. |
| 7.04 | FD violation tuples | ★★☆ | Liệt kê mọi dòng (mọi cột) của `nf_enroll_raw` tham gia vi phạm FD course_id → course_title. |
| 7.05 | test FD | ★★☆ | Bảng `nf_class` là course ⋈ section ⋈ classroom (slide 7.58). Trả về một dòng, hai cột boolean: `room_capacity` — FD building, room_number → capacity có đúng trên instance không; `course_title` — FD course_id → title có đúng không. |
| 7.06 | superkey on instance | ★★☆ | Trên `nf_class`, kiểm tra hai tập thuộc tính có xác định duy nhất mỗi dòng không. Trả về một dòng hai cột boolean: `k1` cho {course_id, sec_id, semester, year}, `k2` cho {course_id, semester, year}. |
| 7.07 | not a key | ★☆☆ | Vì sao không được dùng name làm khoá khi phân rã `nf_employee(ID, name, street, city, salary)`? Trả về các name bị trùng và số nhân viên mang tên đó (`n`). |
| 7.08 | lossy decomposition | ★★☆ | Phân rã `nf_employee` thành R₁(ID, name) và R₂(name, street, city, salary) (slide 7.5). Trả về các tuple giả: có trong Π[R1] ⋈ Π[R2] nhưng không có trong bảng gốc, theo thứ tự cột ID, name, street, city, salary. |
| 7.09 | lossy decomposition | ★☆☆ | Cùng phân rã như 7.08: trả về một dòng hai cột `original_rows` (số dòng của nf_employee) và `joined_rows` (số dòng của R₁ ⋈ R₂). |
| 7.10 | lossless decomposition | ★★☆ | Phân rã `nf_in_dep` thành (ID, name, salary, dept_name) và (dept_name, building, budget). Chứng minh trên dữ liệu là lossless: trả về một dòng ba cột `joined_rows`, `extra` (số tuple có trong join mà không có trong bảng gốc), `missing` (số tuple có trong bảng gốc mà không có trong join). |
| 7.11 | BCNF decomposition | ★★☆ | Đưa `nf_in_dep` về BCNF theo FD dept_name → building, budget. Tạo: - `nf_department_part(dept_name primary key, building, budget)` - `nf_instructor_part(ID primary key, name, salary, dept_name)` với dept_name là foreign key tham chiếu nf_department_part  rồi chép dữ liệu từ nf_in_dep sang (không lặp). |
| 7.12 | BCNF decomposition | ★★★ | Phân rã `nf_class` về BCNF như slide 7.58–7.59, dùng `create table ... as select distinct`: `nf_c_course(course_id, title, dept_name, credits)`, `nf_c_room(building, room_number, capacity)`, `nf_c_section(course_id, sec_id, semester, year, building, room_number, time_slot_id)`. (Hệ thống đếm số dòng mỗi bảng và số dòng của natural join ba bảng.) |
| 7.13 | test FD (3NF) | ★☆☆ | Bảng `nf_dept_advisor(s_ID, i_ID, dept_name)`. Trả về một dòng hai cột boolean: `fd1` — i_ID → dept_name có đúng; `fd2` — s_ID, dept_name → i_ID có đúng. |
| 7.14 | lost dependency | ★★★ | Phân rã BCNF của dept_advisor: tạo `nf_da_instr(i_ID primary key, dept_name)` và `nf_da_student(s_ID, i_ID, primary key (s_ID, i_ID))` từ nf_dept_advisor. Sau đó chèn `('00128', '45565')` vào nf_da_student — không có ràng buộc nào của từng bảng bị vi phạm. (Hệ thống join hai bảng để tìm vi phạm s_ID, dept_name → i_ID: đó chính là FD bị mất.) |
| 7.15 | enforce FD by trigger | ★★★ | Tạo lại hai bảng `nf_da_instr`, `nf_da_student` như 7.14 (có dữ liệu), rồi viết trigger trên nf_da_student để từ chối insert/update làm một sinh viên có hai advisor cùng khoa (tức ép FD s_ID, dept_name → i_ID qua join). Hệ thống thử chèn ('00128', '45565') — phải bị từ chối — và ('19991', '22222') — phải thành công. |
| 7.16 | 3NF + unique | ★★☆ | Giữ `nf_dept_advisor` ở 3NF thì FD s_ID, dept_name → i_ID kiểm tra được bằng một ràng buộc của chính bảng. Thêm ràng buộc đó. (Hệ thống thử chèn ('00128', '45565', 'Comp. Sci.') — phải lỗi — và ('19991', '22222', 'Physics') — phải được.) |
| 7.17 | 3NF synthesis | ★★★ | Bảng `nf_cust_banker(customer_id, employee_id, branch_name, type)` (slide 7.65). Tạo phân rã 3NF cuối cùng của slide bằng `create table ... as select distinct`: `nf_cb_type(customer_id, employee_id, type)` và `nf_cb_branch(customer_id, branch_name, employee_id)`. (Hệ thống đếm dòng mỗi bảng và kiểm tra join hai bảng tái tạo đúng bảng gốc.) |
| 7.18 | test MVD | ★★★ | Bảng `nf_inst_info(ID, child_name, phone)`. MVD ID →→ child_name đúng với một ID khi các dòng của ID đó là đủ mọi tổ hợp con × số điện thoại. Trả về các ID vi phạm. |
| 7.19 | 4NF decomposition | ★★☆ | Phân rã 4NF: tạo `nf_inst_child(ID, child_name)` và `nf_inst_phone(ID, phone)` từ nf_inst_info bằng `create table ... as select distinct`. (Hệ thống đếm dòng hai bảng và dòng của join — so với 7 dòng gốc, dòng thừa chính là tổ hợp mà MVD đòi hỏi nhưng instance 88888 còn thiếu.) |
