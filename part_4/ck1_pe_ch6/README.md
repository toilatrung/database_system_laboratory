# Ôn CK · Phần 1 — Practice Exercises Chương 6 (E-R)

*Practice Exercises — Chapter 6 · Database System Concepts, 7th Ed. — Practice Exercises 6.1–6.13*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ck1`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### Cách ôn phần này
Đề cuối kỳ phần E-R chủ yếu lấy từ **Practice Exercises 6.1–6.13**. Mỗi PE xuất hiện ở *Câu hỏi tự luận* (đánh số đúng như sách, có lời giải đầy đủ) và — nếu chạy được — ở *Bài tập SQL* (hiện thực thiết kế trên PostgreSQL). Làm tự luận ra giấy trước: **vẽ diagram → ghi cardinality/participation → viết lược đồ quan hệ**.

| PE | Nội dung | Tự luận | Bài SQL |
|---|---|---|---|
| 6.1 | E-R công ty bảo hiểm xe (payment là weak entity) | Câu 1 | CK1.01 |
| 6.2 | Điểm thi: (a) exam là entity + ternary, (b) chỉ binary student–section | Câu 2 | CK1.02, CK1.03 |
| 6.3 | Thống kê đội bóng, derived attribute season_score | Câu 3 | CK1.04, CK1.05 |
| 6.4 | Entity set lặp lại nhiều lần trong diagram | Câu 4 | — |
| 6.5 | Diagram như đồ thị: không liên thông, có chu trình | Câu 5 | — |
| 6.6 | Ternary → ba binary + E: instance sai, thêm ràng buộc | Câu 6 | (xem Part 2, bài 6.19) |
| 6.7 | Biến weak entity thành strong → redundancy | Câu 7 | — |
| 6.8 | PK/FK của sec_course có ép many-to-one không? | Câu 8 | CK1.06, CK1.10 |
| 6.9 | advisor one-to-one cần thêm ràng buộc gì | Câu 9 | CK1.07 |
| 6.10 | Total participation bằng not null | Câu 10 | CK1.08 |
| 6.11 | Total participation phía "one"/many-to-many: vì sao PK/FK không đủ, dùng check/assertion | Câu 11 | CK1.09, CK1.10 |
| 6.12 | Lattice generalization: thừa kế từ X và Y, trùng tên thuộc tính | Câu 12 | CK1.11 |
| 6.13 | Dữ liệu theo thời gian (valid time) | Câu 13 | CK1.12–CK1.15 |

### Cheat sheet Chương 6
- **Ký hiệu**: chữ nhật = entity set; thoi = relationship set; chữ nhật/thoi **đôi** = weak entity / identifying relationship; gạch chân liền = PK, gạch nét đứt = discriminator; `{a}` multivalued; `a()` derived; thuộc tính thụt lề = composite; **mũi tên** = phía "one"; **đường đôi** = total participation; `l..h` = min..max lần tham gia.
- **PK của relationship set**: M:N → PK(A) ∪ PK(B); many-to-one A→B → PK(A); one-to-one → PK(A) hoặc PK(B) (cái còn lại `unique`).
- **Weak entity**: PK = PK(owner) + discriminator; FK → owner `on delete cascade`; identifying relationship không sinh bảng.
- **Reduction**: composite → làm phẳng; multivalued → bảng riêng (PK gồm mọi cột); derived → view; many-to-one total phía many → gộp FK vào phía many + `not null`; M:N → bảng riêng.
- **Ép ràng buộc trong SQL**:

| Ràng buộc E-R | Ép bằng |
|---|---|
| many-to-one A→B | PK(A) là khoá của bảng chứa quan hệ |
| one-to-one | thêm `unique` cho FK còn lại |
| total participation phía **many** (đã gộp) | `not null` cho FK |
| total participation phía **one** hoặc của M:N | **không** ép được bằng PK/FK/not null → assertion (chuẩn SQL, không DBMS nào hỗ trợ) hoặc **trigger** (PostgreSQL: constraint trigger `deferrable initially deferred`) |

- **Specialization**: overlapping / disjoint; total / partial; method 1 (bảng cha + bảng con chứa PK) vs method 2 (mỗi bảng con chứa đủ thuộc tính). Đa thừa kế (lattice): con thừa kế cả X và Y; trùng tên thì gọi `X.name`, `Y.name`.
- **Aggregation**: relationship được xem như entity để tham gia relationship khác; bảng gồm PK của relationship được aggregate.
- **Design**: tránh entity set vẽ lặp có thuộc tính (PE 6.4); đồ thị không liên thông = các phần độc lập, chu trình = hai entity liên quan theo ≥ 2 cách (PE 6.5).

## 2. Trắc nghiệm (17 câu)

**Câu 1.** (PE 6.1) Trong E-R công ty bảo hiểm, vì sao premium_payment được mô hình là weak entity?

- A. Vì payment không có thuộc tính
- B. Vì mỗi payment gắn với một policy cụ thể và payment_no chỉ phân biệt trong phạm vi policy đó
- C. Vì payment là multivalued
- D. Vì payment có quan hệ many-to-many với car

<details><summary>Đáp án</summary>

**B** — PK(payment) = policy_id + payment_no (discriminator); payment phụ thuộc tồn tại vào policy.

</details>

**Câu 2.** (PE 6.1) Vì sao participation của accident trong participated **không** total?

- A. Vì một xe có thể không gặp tai nạn
- B. Vì có thể có biên bản tai nạn mà chưa biết xe nào liên quan
- C. Vì accident là weak entity
- D. Vì participated là one-to-one

<details><summary>Đáp án</summary>

**B** — Theo lời giải của sách: có thể có accident report mà xe tham gia chưa xác định.

</details>

**Câu 3.** (PE 6.2b) Khi chỉ dùng binary relationship student–section và vẫn lưu điểm nhiều bài thi, điểm được biểu diễn bằng gì?

- A. Thuộc tính đơn marks
- B. Thuộc tính multivalued composite {exam_marks(exam_id, marks)} trên relationship
- C. Một entity exam bắt buộc
- D. Một ternary relationship

<details><summary>Đáp án</summary>

**B** — Một cặp (student, section) có nhiều (exam_id, marks).

</details>

**Câu 4.** (PE 6.2b) Nhược điểm của việc đặt tên, địa điểm, giờ thi của exam làm thuộc tính trên relationship?

- A. Không có nhược điểm
- B. Lặp thông tin cho mỗi sinh viên và không lưu được exam khi chưa có sinh viên
- C. Không biểu diễn được điểm
- D. Vi phạm khoá chính

<details><summary>Đáp án</summary>

**B** — Muốn lưu thông tin exam phải giữ entity exam riêng.

</details>

**Câu 5.** (PE 6.3) season_score của player nên được mô hình thế nào?

- A. Thuộc tính lưu sẵn
- B. Derived attribute, tính bằng tổng score qua relationship played
- C. Multivalued attribute
- D. Weak entity

<details><summary>Đáp án</summary>

**B** — Tóm tắt thống kê nên là derived; trong SQL hiện thực bằng view.

</details>

**Câu 6.** (PE 6.4) Nếu một entity set phải vẽ nhiều lần (diagram nhiều trang) thì nên làm gì?

- A. Lặp lại đầy đủ thuộc tính ở mọi chỗ
- B. Chỉ ghi thuộc tính ở một chỗ; các lần xuất hiện khác không ghi thuộc tính
- C. Đổi tên mỗi lần xuất hiện
- D. Không được vẽ lại

<details><summary>Đáp án</summary>

**B** — Lặp thuộc tính dễ dẫn tới các bản không nhất quán.

</details>

**Câu 7.** (PE 6.5) E-R diagram (xem như đồ thị) **không liên thông** nghĩa là gì?

- A. Thiết kế sai
- B. Có các phần của doanh nghiệp hoàn toàn độc lập — thực chất là các CSDL riêng
- C. Có weak entity
- D. Có chu trình

<details><summary>Đáp án</summary>

**B** — Không có đường đi giữa hai entity set nghĩa là chúng không liên quan, kể cả gián tiếp.

</details>

**Câu 8.** (PE 6.5) Diagram có **chu trình** cho biết điều gì?

- A. Mọi cặp entity trên chu trình liên quan với nhau theo ít nhất hai cách khác nhau
- B. Có recursive relationship
- C. Có lỗi thiết kế bắt buộc phải sửa
- D. Có ternary relationship

<details><summary>Đáp án</summary>

**A** — Diagram không chu trình thì giữa hai entity set có đúng một đường (một quan hệ duy nhất).

</details>

**Câu 9.** (PE 6.6) Khi thay ternary R(A, B, C) bằng E và R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub>, ràng buộc nào cần thêm để mọi instance ứng với một R hợp lệ?

- A. E total participation vào cả R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub>
- B. A, B, C total vào R
- C. R<sub>A</sub> là many-to-many
- D. Bỏ E

<details><summary>Đáp án</summary>

**A** — Nếu e chỉ nối với a mà không nối b, c thì không ứng với bộ (a, b, c) nào.

</details>

**Câu 10.** (PE 6.7) Thêm PK của owner vào weak entity để biến nó thành strong entity gây ra điều gì?

- A. Mất thông tin
- B. Redundancy: PK owner nằm ở cả entity và relationship, và phải luôn bằng nhau
- C. Không thể tạo PK
- D. Vi phạm 1NF

<details><summary>Đáp án</summary>

**B** — Thông tin đó đã suy ra được từ identifying relationship.

</details>

**Câu 11.** (PE 6.8) PK (course_id, sec_id, semester, year) và FK course_id → course của sec_course đảm bảo điều gì?

- A. Many-to-one: mỗi section thuộc đúng một course
- B. Mỗi course có ít nhất một section
- C. Cả hai
- D. Không đảm bảo gì

<details><summary>Đáp án</summary>

**A** — Total participation (course phải có section) thì không ép được bằng PK/FK.

</details>

**Câu 12.** (PE 6.9) Nếu advisor là one-to-one, bảng advisor(s_ID, i_ID) với PK s_ID cần thêm gì?

- A. not null cho s_ID
- B. unique cho i_ID
- C. PK (s_ID, i_ID)
- D. check (s_ID <> i_ID)

<details><summary>Đáp án</summary>

**B** — i_ID trở thành superkey: mỗi instructor hướng dẫn tối đa một student.

</details>

**Câu 13.** (PE 6.10) R many-to-one từ A tới B được gộp vào bảng A. Total participation của A trong R được ép bằng gì?

- A. unique cho FK tới B
- B. not null cho FK tới B
- C. PK của B
- D. Không ép được

<details><summary>Đáp án</summary>

**B** — a không liên kết b nào sẽ có FK null — bị cấm.

</details>

**Câu 14.** (PE 6.11) Vì sao total participation của B ở phía "one" (mỗi b phải được ít nhất một a tham chiếu) không ép được bằng FK?

- A. Vì FK chỉ tham chiếu tới cột primary key/unique, trong khi cột FK ở bảng A không unique
- B. Vì FK không cho null
- C. Vì B không có primary key
- D. Vì SQL không có FK

<details><summary>Đáp án</summary>

**A** — Muốn "b phải xuất hiện trong A" thì cần FK từ B tới cột của A — nhưng cột đó không unique.

</details>

**Câu 15.** (PE 6.11) Trong lời giải bằng check/assertion, vì sao ràng buộc phải đặt là **deferred**?

- A. Để chạy nhanh hơn
- B. Vì phải chèn cả b và a liên quan trong cùng transaction; kiểm tra ngay sẽ lỗi ở câu chèn đầu tiên
- C. Vì check không hỗ trợ subquery
- D. Vì FK luôn deferred

<details><summary>Đáp án</summary>

**B** — Chèn b trước → vi phạm total; chèn a trước → vi phạm foreign key. Kiểm tra cuối transaction giải quyết vòng lặp này.

</details>

**Câu 16.** (PE 6.12) B là specialization của cả X và Y. X và Y cùng có thuộc tính name. B tham chiếu thế nào?

- A. Không thể
- B. Dùng tên đầy đủ X.name và Y.name
- C. Chỉ giữ X.name
- D. Đổi tên Y

<details><summary>Đáp án</summary>

**B** — B thừa kế thuộc tính của cả hai; trùng tên thì phân biệt bằng tên định danh đầy đủ.

</details>

**Câu 17.** (PE 6.13) Khi chuyển E-R có valid time sang bảng, mỗi thuộc tính thay đổi theo thời gian (ví dụ salary) trở thành gì?

- A. Một cột salary
- B. Một relation instructor_salary(instructor_id, value, start_time, end_time)
- C. Một view
- D. Một weak entity không có thuộc tính

<details><summary>Đáp án</summary>

**B** — Multivalued composite {salary(value, start_time, end_time)} → bảng riêng.

</details>

## 3. Câu hỏi tự luận (13 câu)

**Câu 1.** 

> **Exercise 6.1.** Construct an E-R diagram for a car-insurance company. Each customer owns one or more cars. Each car has zero or more recorded accidents. Each insurance policy covers one or more cars and has one or more premium payments. Each payment covers a particular period of time and has a due date and the date on which the payment was received.

**PE 6.1.** Vẽ E-R diagram cho công ty bảo hiểm xe: mỗi customer sở hữu một hoặc nhiều car; mỗi car có 0..nhiều accident được ghi nhận; mỗi policy bảo hiểm một hoặc nhiều car và có một hoặc nhiều premium payment; mỗi payment cho một kỳ, có due date và ngày nhận tiền. Sau đó viết lược đồ quan hệ.

<details><summary>Gợi ý đáp án</summary>

```
[customer] ==== <owns> ---- [car] ---- <participated> ---- [accident]
 customer_id                 license_no                     report_id
 name, address               model                          date, place
                               |
                             1..1 (mỗi car thuộc đúng 1 policy)
                            <covers>
                             1..*  (mỗi policy phủ ≥ 1 car)
                               |
                           [policy] ==<<payment>>== [[premium_payment]]
                            policy_id                 payment_no (discriminator)
                                                      due_date, amount, received_on
```
- owns: customer – car, customer **total** (mỗi customer có ≥ 1 car); many-to-many (hoặc many-to-one nếu mỗi xe một chủ).
- participated: car – accident, many-to-many, **cả hai partial** (xe có thể chưa tai nạn; biên bản có thể chưa xác định xe).
- covers: car → policy (`1..1` phía car), policy `1..*`.
- premium_payment là **weak entity** của policy qua identifying relationship payment (đôi, total phía payment).

Lược đồ:
- customer(<u>customer_id</u>, name, address)
- car(<u>license_no</u>, model, policy_id **not null** → policy) — covers gộp vào car
- policy(<u>policy_id</u>)
- owns(<u>customer_id, license_no</u>)
- accident(<u>report_id</u>, date, place)
- participated(<u>report_id, license_no</u>)
- premium_payment(<u>policy_id, payment_no</u>, due_date, amount, received_on), FK policy_id → policy on delete cascade.

Ràng buộc "mỗi customer có ≥ 1 car" và "mỗi policy phủ ≥ 1 car" không ép được bằng PK/FK (xem PE 6.11).

</details>

**Câu 2.** 

> **Exercise 6.2.** A database contains the entity sets *student*, *course*, and *section* of the university schema, and in addition records the marks students obtain in the different exams of the different sections.
> 
> a. Construct an E-R diagram that models exams as entities and uses a ternary relationship in the design.
> 
> b. Construct an alternative E-R diagram that uses only a binary relationship between *student* and *section*. There must be only one relationship between a given *student* and *section* pair, yet it must still be possible to represent the marks a student gets in different exams.

**PE 6.2.** CSDL gồm student, course, section của University và điểm mà sinh viên đạt trong các bài thi của từng section. (a) Vẽ E-R coi exam là entity và dùng một ternary relationship. (b) Vẽ E-R chỉ dùng binary relationship giữa student và section, mỗi cặp (student, section) chỉ có một relationship nhưng vẫn lưu được điểm nhiều bài thi.

<details><summary>Gợi ý đáp án</summary>

**(a)**
```
[student] ---- <exam_marks> ---- [section] ==<<sec_course>>== [course]
 student_id       marks           sec_id, semester, year        course_id, title, credits
                    |
                 [exam]
                  exam_id, name, place, time
```
Ternary exam_marks(student, section, exam) có thuộc tính marks. Lược đồ: exam(<u>exam_id</u>, name, place, time); exam_marks(<u>student_id, course_id, sec_id, semester, year, exam_id</u>, marks).
Phương án khác: exam là **weak entity** của section; khi đó marks là binary relationship student – exam.

**(b)**
```
[student] ---- <exam_marks> ---- [section]
                {exam_marks
                   exam_id
                   marks }
```
Relationship binary có thuộc tính **multivalued composite** {exam_marks(exam_id, marks)}. Lược đồ: sec_exam_marks(<u>student_id, course_id, sec_id, semester, year, exam_id</u>, marks).
Không đặt name/place/time của exam vào relationship: sẽ **lặp** cho từng sinh viên và không lưu được exam khi chưa có sinh viên — muốn lưu thì phải giữ entity exam riêng.

</details>

**Câu 3.** 

> **Exercise 6.3.** Design an E-R diagram that keeps track of the scoring statistics of your favorite sports team. Store the matches played, the scores of each match, the players in each match, and each player’s individual scoring statistics for each match. Model summary statistics as derived attributes, explaining how each one is computed.

**PE 6.3.** Thiết kế E-R lưu thống kê ghi điểm của đội bóng yêu thích: các trận, tỉ số mỗi trận, cầu thủ tham gia mỗi trận, thống kê ghi điểm của từng cầu thủ mỗi trận. Thống kê tổng hợp mô hình bằng derived attribute và giải thích cách tính.

<details><summary>Gợi ý đáp án</summary>

```
[player] ---------- <played> ---------- [match]
 player_id            score              match_id
 name                                    date, stadium, opponent
 age                                     own_score, opp_score
 season_score()
```
- played: many-to-many player – match, thuộc tính score (điểm cầu thủ ghi trong trận).
- **season_score()** là derived: tổng score của player qua mọi bộ played của player đó (trong mùa giải).
- Lược đồ: player(<u>player_id</u>, name, age), match(<u>match_id</u>, date, stadium, opponent, own_score, opp_score), played(<u>match_id, player_id</u>, score); season_score hiện thực bằng view `sum(score) group by player_id`.

</details>

**Câu 4.** 

> **Exercise 6.4.** In an E-R diagram the same entity set may appear several times, with its attributes repeated in more than one occurrence. Why is allowing this redundancy a bad practice that should be avoided?

**PE 6.4.** Một E-R diagram có cùng một entity set xuất hiện nhiều lần, thuộc tính được lặp lại ở nhiều chỗ. Vì sao cho phép redundancy này là thói quen xấu?

<details><summary>Gợi ý đáp án</summary>

Entity set được vẽ nhiều lần thường vì diagram trải trên nhiều trang. Nếu ghi thuộc tính ở mỗi lần xuất hiện, các bản có thể **khác nhau** (thêm/bớt thuộc tính ở một chỗ) → diagram không nhất quán. Nên chỉ ghi thuộc tính **một lần**; các lần xuất hiện khác không ghi thuộc tính nào — vì entity set không thể không có thuộc tính, người đọc hiểu rằng thuộc tính được định nghĩa ở chỗ khác.

</details>

**Câu 5.** 

> **Exercise 6.5.** An E-R diagram can be seen as a graph. What does each of the following mean for the structure of an enterprise schema?
> 
> a. The graph is disconnected.
> 
> b. The graph has a cycle.

**PE 6.5.** Xem E-R diagram như một đồ thị. Các điều sau có ý nghĩa gì với cấu trúc lược đồ doanh nghiệp? (a) Đồ thị không liên thông. (b) Đồ thị có chu trình.

<details><summary>Gợi ý đáp án</summary>

**(a)** Hai entity set nối nhau bằng một đường đi thì có liên quan (có thể gián tiếp). Không liên thông nghĩa là có các cặp entity set hoàn toàn không liên quan: các phần đó của doanh nghiệp **độc lập**, thực chất mỗi thành phần liên thông là một CSDL riêng.

**(b)** Có chu trình thì mọi cặp entity set trên chu trình liên quan với nhau theo **ít nhất hai cách** khác nhau. Nếu diagram không có chu trình, giữa hai entity set có đúng một đường đi, tức một quan hệ duy nhất.

</details>

**Câu 6.** 

> **Exercise 6.6.** Consider representing the ternary relationship R of Figure 6.29a (among A, B, C) by an entity set E with binary relationships R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub>, as in Figure 6.29b (attributes not shown).
> 
> a. Give a simple instance of E, A, B, C, R<sub>A</sub>, R<sub>B</sub>, and R<sub>C</sub> that cannot correspond to any instance of A, B, C, and R.
> 
> b. Modify the E-R diagram of Figure 6.29b by adding constraints that guarantee every instance of E, A, B, C, R<sub>A</sub>, R<sub>B</sub>, and R<sub>C</sub> satisfying them corresponds to an instance of A, B, C, and R.
> 
> c. Modify the translation above so that it also handles total participation constraints on the ternary relationship.

**PE 6.6.** Ternary relationship R(A, B, C) được biểu diễn bằng entity set E và ba binary relationship R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub> (Figure 6.29b). (a) Cho một instance của E, A, B, C, R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub> không tương ứng với instance nào của A, B, C, R. (b) Sửa diagram thêm ràng buộc để mọi instance thoả ràng buộc đều tương ứng với một instance của R. (c) Sửa cách dịch để xử lý total participation trên ternary relationship.

<details><summary>Gợi ý đáp án</summary>

**(a)** E = {e1, e2}, A = {a1, a2}, B = {b1}, C = {c1}, R<sub>A</sub> = {(e1, a1), (e2, a2)}, R<sub>B</sub> = {(e1, b1)}, R<sub>C</sub> = {(e1, c1)}. e2 chỉ nối với a2 mà không nối b, c nào → không có bộ (a, b, c) nào ứng với e2.

**(b)** Cho E **total participation** vào R<sub>A</sub>, R<sub>B</sub> và R<sub>C</sub> (đường đôi), đồng thời mỗi R<sub>X</sub> là many-to-one từ E (mũi tên về A, B, C): mỗi e nối đúng một a, một b, một c.
```
[A] <---- <R_A> ==== [E] ==== <R_B> ----> [B]
                      ||
                    <R_C> ----> [C]
```
(Nên thêm ràng buộc không có hai e cùng bộ (a, b, c) — trong SQL là `unique`.)

**(c)** Nếu A total trong R thì thêm total participation của A vào R<sub>A</sub>; tương tự cho B (R<sub>B</sub>) và C (R<sub>C</sub>).

</details>

**Câu 7.** 

> **Exercise 6.7.** A weak entity set can always be turned into a strong entity set by adding to its attributes the primary-key attributes of its identifying entity set. Describe the kind of redundancy this produces.

**PE 6.7.** Weak entity set luôn có thể biến thành strong entity set bằng cách thêm các thuộc tính primary key của identifying entity set. Hãy nêu loại redundancy phát sinh.

<details><summary>Gợi ý đáp án</summary>

PK của weak entity suy ra được từ relationship với strong entity. Nếu thêm PK của owner vào weak entity, giá trị đó xuất hiện **cả** trong entity set và trong relationship set (identifying relationship), và hai chỗ **phải luôn bằng nhau** → redundancy (và nguy cơ không nhất quán). Ví dụ section có course_id trong khi sec_course đã nối section với course.

</details>

**Câu 8.** 

> **Exercise 6.8.** Take a relation such as *sec_course*, created from the many-to-one relationship set *sec_course*. Do the primary-key and foreign-key constraints created on that relation enforce the many-to-one cardinality constraint? Explain why.

**PE 6.8.** Xét relation sec_course sinh từ relationship set many-to-one sec_course. Các ràng buộc primary key và foreign key tạo trên relation này có ép được cardinality many-to-one không? Giải thích.

<details><summary>Gợi ý đáp án</summary>

**Có.** PK của section là (course_id, sec_id, semester, year), cũng là PK của sec_course; course_id là FK từ sec_course tới course. Do đó mỗi section chỉ ứng với **một** course → many-to-one được ép.

Nhưng các ràng buộc này **không** ép được total participation: một course (hoặc một section) có thể không xuất hiện trong sec_course.

</details>

**Câu 9.** 

> **Exercise 6.9.** Suppose the *advisor* relationship set were one-to-one. Which additional constraints are needed on the relation *advisor* so that the one-to-one cardinality constraint is enforced?

**PE 6.9.** Giả sử relationship set advisor là one-to-one. Cần thêm ràng buộc gì trên relation advisor để ép cardinality one-to-one?

<details><summary>Gợi ý đáp án</summary>

Ngoài khai báo **s_ID là primary key** của advisor, khai báo **i_ID là superkey** — trong SQL dùng `unique (i_ID)`. Như vậy mỗi student có tối đa một instructor và mỗi instructor hướng dẫn tối đa một student.

</details>

**Câu 10.** 

> **Exercise 6.10.** Let R be a many-to-one relationship between entity sets A and B, and suppose the relation created from R is merged into the relation created from A. In SQL, attributes that take part in a foreign-key constraint may be null. Explain how total participation of A in R can be enforced with **not null** constraints in SQL.

**PE 6.10.** R là relationship many-to-one giữa A và B; relation của R được gộp vào relation của A. Trong SQL, thuộc tính tham gia foreign key có thể null. Giải thích cách ép total participation của A trong R bằng not null.

<details><summary>Gợi ý đáp án</summary>

Khai báo thuộc tính FK (trong bảng A, ứng với PK của B) là **not null**. Một a không liên kết b nào sẽ phải có FK null khi gộp R vào A — bị cấm. Ví dụ instructor(ID, name, dept_name **not null** references department) ép mỗi instructor thuộc một khoa.

</details>

**Câu 11.** 

> **Exercise 6.11.** In SQL a foreign key may reference only the primary-key attributes of the referenced relation, or other attributes declared as a superkey with **unique**. Consequently, total participation constraints on a many-to-many relationship set (or on the “one” side of a one-to-many relationship set) cannot be enforced on the relations created from that relationship set using only primary-key, foreign-key, and not-null constraints.
> 
> a. Explain why.
> 
> b. Explain how total participation constraints can be enforced using complex check constraints or assertions (see Section 4.4.8). (These features are, unfortunately, not supported by any widely used database at present.)

**PE 6.11.** Foreign key trong SQL chỉ tham chiếu được primary key hoặc thuộc tính unique. Vì thế total participation trên relationship many-to-many (hoặc trên phía "one" của one-to-many) không ép được bằng primary key, foreign key và not null. (a) Giải thích vì sao. (b) Giải thích cách ép bằng check phức tạp hoặc assertion.

<details><summary>Gợi ý đáp án</summary>

**(a)** Với many-to-many, R phải là bảng riêng. Không có cách nào trong SQL bảo đảm mỗi giá trị PK của E1 xuất hiện trong R, vì cột tương ứng của R **không unique**, mà FK chỉ được trỏ tới PK/unique. Tương tự với one-to-many: không thể bảo đảm giá trị ở phía "one" xuất hiện trong bảng phía "many".

**(b)** R many-to-one từ A tới B (A chứa FK b). Đặt trên bảng B:
```sql
constraint total_part check (b in (select b from A));
set constraints total_part deferred;
```
hoặc assertion `create assertion ... check (not exists (select * from B where b not in (select b from A)))`. Phải **deferred** (kiểm tra cuối transaction): chèn b vào B trước thì vi phạm total; chèn A trước thì vi phạm foreign key. PostgreSQL không có assertion/check có subquery → dùng **constraint trigger deferrable initially deferred** (bài CK1.09).

</details>

**Câu 12.** 

> **Exercise 6.12.** Consider a lattice of generalization and specialization (attributes not shown) with higher-level entity sets X and Y and lower-level entity sets A, B, C: A specializes X, B specializes both X and Y, and C specializes Y.
> 
> For entity sets A, B, and C, explain how attributes are inherited from the higher-level entity sets X and Y. Discuss how to deal with the case where an attribute of X has the same name as an attribute of Y.

**PE 6.12.** Cấu trúc lattice: X và Y là entity cấp cao; A là specialization của X, C của Y, B của cả X và Y. Giải thích cách A, B, C thừa kế thuộc tính. Xử lý thế nào khi X và Y có thuộc tính trùng tên?

<details><summary>Gợi ý đáp án</summary>

```
   [X]       [Y]
   / \       / \
 [A]   [B]-----  [C]
```
- A thừa kế mọi thuộc tính của X, cộng thuộc tính riêng.
- C thừa kế mọi thuộc tính của Y, cộng thuộc tính riêng.
- B thừa kế thuộc tính của **cả X và Y** (multiple inheritance).
- Nếu X và Y cùng có thuộc tính `name`, trong B dùng tên đầy đủ **X.name** và **Y.name** để phân biệt.

Bảng (method 1): x(<u>id</u>, ...), y(<u>id</u>, ...), b(<u>id</u>, ...) với id vừa là FK → x vừa là FK → y.

</details>

**Câu 13.** 

> **Exercise 6.13.** An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.
> 
> One way to model this: define a new data type **valid time**, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.
> 
> a. Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.
> 
> b. Convert that E-R diagram into a set of relations.
> 
> The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.

**PE 6.13.** E-R thường mô hình trạng thái doanh nghiệp tại một thời điểm. Muốn theo dõi thay đổi theo thời gian: định nghĩa kiểu valid time (khoảng hoặc tập khoảng thời gian), gắn valid time cho mỗi entity và relationship; thuộc tính thay đổi theo thời gian là tập giá trị, mỗi giá trị có valid time riêng (end time có thể là vô cực). (a) Vẽ E-R có student, instructor, advisor với các mở rộng này. (b) Chuyển sang tập relation.

<details><summary>Gợi ý đáp án</summary>

**(a)**
```
[student]                         [instructor]
 student_id                        instructor_id
 {valid_times(start_time, end_time)}  {valid_times(start_time, end_time)}
 {name(value, start_time, end_time)}  {name(value, start_time, end_time)}
 {dept_name(value, start_time, end_time)} {dept_name(value, start_time, end_time)}
 {tot_cred(value, start_time, end_time)}  {salary(value, start_time, end_time)}
        \                              /
         ------- <advisor> ------------
                  {valid_time(start_time, end_time)}
```
student_id, instructor_id không đổi theo thời gian; mọi thuộc tính khác là multivalued composite.

**(b)**
- student(<u>student_id</u>), student_valid_times(<u>student_id, start_time, end_time</u>)
- student_name(<u>student_id, value, start_time, end_time</u>), student_dept_name(...), student_tot_cred(...)
- instructor(<u>instructor_id</u>), instructor_valid_times(...), instructor_name(...), instructor_dept_name(...), instructor_salary(...)
- advisor(<u>student_id, instructor_id, start_time, end_time</u>)

Nếu thêm ràng buộc các khoảng không chồng nhau (hoặc một start_time không có hai end_time) thì có thể bỏ end_time khỏi primary key. Tập relation này phức tạp, truy vấn SQL khó viết; thực tế người ta thường bỏ qua thời gian khi thiết kế E-R rồi thêm start/end time vào các relation sinh ra.

</details>

## 4. Bài tập SQL (15 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CK1.01 | PE 6.1 DDL | ★★★ | Exercise 6.1. Construct an E-R diagram for a car-insurance company. Each customer owns one or more cars. Each car has zero or more recorded accidents. Each insurance policy covers one or more cars and has one or more premium payments. Each payment covers a particular period of time and has a due date and the date on which the payment was received.<br>PE 6.1 — hiện thực bằng SQL. Tạo các bảng (mọi khoá/chuỗi varchar(10), tiền numeric(10,2), ngày date): - `ins_customer(customer_id, name, address)` - `ins_policy(policy_id)` - `ins_car(license_no, model, policy_id)` — covers gộp vào car, mỗi xe thuộc đúng một policy - `ins_owns(customer_id, license_no)` — many-to-many - `ins_accident(report_id, acc_date, place)` - `ins_participated(report_id, license_no)` - `ins_premium_payment(policy_id, payment_no, due_date, amount, received_on)` — weak entity của policy (xoá theo policy) |
| CK1.02 | PE 6.2a ternary | ★★★ | Exercise 6.2 (a). A database contains the entity sets *student*, *course*, and *section* of the university schema, and in addition records the marks students obtain in the different exams of the different sections.  a. Construct an E-R diagram that models exams as entities and uses a ternary relationship in the design.<br>PE 6.2(a) — exam là entity, dùng ternary relationship. Tạo: - `exam(exam_id varchar(5) primary key, name varchar(20), place varchar(20), exam_time timestamp)` - `exam_marks(ID, course_id, sec_id, semester, year, exam_id, marks)` (kiểu cột giống bảng takes; marks numeric(5,2)) với primary key là ternary (student, section, exam), FK ID → student, (course_id, sec_id, semester, year) → section, exam_id → exam. |
| CK1.03 | PE 6.2b binary | ★★☆ | Exercise 6.2 (b). A database contains the entity sets *student*, *course*, and *section* of the university schema, and in addition records the marks students obtain in the different exams of the different sections.  b. Construct an alternative E-R diagram that uses only a binary relationship between *student* and *section*. There must be only one relationship between a given *student* and *section* pair, yet it must still be possible to represent the marks a student gets in different exams.<br>PE 6.2(b) — chỉ một binary relationship student–section với thuộc tính multivalued composite {exam_marks(exam_id, marks)}. Tạo bảng `sec_exam_marks(ID, course_id, sec_id, semester, year, exam_id varchar(5), marks numeric(5,2))` (FK tới student và section; không có bảng exam) sao cho một sinh viên trong một section có nhiều bài thi nhưng mỗi bài thi một điểm. |
| CK1.04 | PE 6.3 derived (view) | ★★☆ | Exercise 6.3. Design an E-R diagram that keeps track of the scoring statistics of your favorite sports team. Store the matches played, the scores of each match, the players in each match, and each player’s individual scoring statistics for each match. Model summary statistics as derived attributes, explaining how each one is computed.<br>PE 6.3 — dữ liệu có sẵn: `er_player(player_id, name, age)`, `er_match(...)`, `er_played(match_id, player_id, score)`. Hiện thực derived attribute season_score: tạo view `season_score(player_id, name, season_score)` cho mọi cầu thủ (cầu thủ chưa đá trận nào có 0). |
| CK1.05 | PE 6.3 derived (query) | ★★☆ | Exercise 6.3. Design an E-R diagram that keeps track of the scoring statistics of your favorite sports team. Store the matches played, the scores of each match, the players in each match, and each player’s individual scoring statistics for each match. Model summary statistics as derived attributes, explaining how each one is computed.<br>PE 6.3 — thêm derived attribute `result()` của match: `W` nếu own_score > opp_score, `D` nếu bằng, `L` nếu thua. Trả về match_id, opponent, result, và số cầu thủ đã ra sân (`num_players`), sắp theo match_date. |
| CK1.06 | PE 6.8 many-to-one | ★★☆ | Exercise 6.8. Take a relation such as *sec_course*, created from the many-to-one relationship set *sec_course*. Do the primary-key and foreign-key constraints created on that relation enforce the many-to-one cardinality constraint? Explain why.<br>PE 6.8 — giả sử section có định danh riêng `section_id`. Tạo bảng `sec_course(section_id varchar(10), course_id varchar(8))` biểu diễn relationship many-to-one từ section tới course, ép được cardinality bằng primary key + foreign key (mỗi section thuộc đúng một course). Hệ thống cũng kiểm tra rằng course không có section nào vẫn hợp lệ — tức total participation không được ép. |
| CK1.07 | PE 6.9 one-to-one | ★☆☆ | Exercise 6.9. Suppose the *advisor* relationship set were one-to-one. Which additional constraints are needed on the relation *advisor* so that the one-to-one cardinality constraint is enforced?<br>PE 6.9 — tạo `advisor_1to1(s_ID varchar(5), i_ID varchar(5))` là phiên bản one-to-one của advisor: s_ID là primary key, và thêm ràng buộc để mỗi instructor hướng dẫn tối đa một sinh viên. FK tới student/instructor. |
| CK1.08 | PE 6.10 not null | ★☆☆ | Exercise 6.10. Let R be a many-to-one relationship between entity sets A and B, and suppose the relation created from R is merged into the relation created from A. In SQL, attributes that take part in a foreign-key constraint may be null. Explain how total participation of A in R can be enforced with not null constraints in SQL.<br>PE 6.10 — relationship many-to-one `member_of` từ student tới `club`, total phía student, được gộp vào bảng phía many. Tạo `club(club_name varchar(20) primary key)` và `club_member(student_id varchar(5) primary key references student, club_name varchar(20))` sao cho mỗi club_member thuộc đúng một club đã tồn tại. |
| CK1.09 | PE 6.11 deferred trigger | ★★★ | Exercise 6.11. In SQL a foreign key may reference only the primary-key attributes of the referenced relation, or other attributes declared as a superkey with unique. Consequently, total participation constraints on a many-to-many relationship set (or on the “one” side of a one-to-many relationship set) cannot be enforced on the relations created from that relationship set using only primary-key, foreign-key, and not-null constraints.  a. Explain why.  b. Explain how total participation constraints can be enforced using complex check constraints or assertions (see Section 4.4.8). (These features are, unfortunately, not supported by any widely used database at present.)<br>PE 6.11 — ép total participation ở phía "one". Tạo - `dept_t(dept_name varchar(20) primary key)` - `emp_t(emp_id varchar(5) primary key, dept_name varchar(20) not null references dept_t)` (many-to-one emp → dept)  và ràng buộc mỗi dept_t phải có ít nhất một emp_t. PostgreSQL không có assertion, nên dùng một trigger function `returns trigger` gắn bằng constraint trigger `deferrable initially deferred` (after insert/update trên dept_t và after delete/update trên emp_t). Khi vi phạm, hãy `raise exception ... using errcode = 'check_violation'`.  Hệ thống sẽ thử trong các khối riêng (kết thúc bằng `set constraints all immediate`): thêm khoa không có nhân viên (phải lỗi 23514), thêm khoa cùng nhân viên (ok), xoá nhân viên cuối cùng (phải lỗi). |
| CK1.10 | PE 6.8/6.11 vi phạm total | ★☆☆ | Exercise 6.8. Take a relation such as *sec_course*, created from the many-to-one relationship set *sec_course*. Do the primary-key and foreign-key constraints created on that relation enforce the many-to-one cardinality constraint? Explain why.  Exercise 6.11. In SQL a foreign key may reference only the primary-key attributes of the referenced relation, or other attributes declared as a superkey with unique. Consequently, total participation constraints on a many-to-many relationship set (or on the “one” side of a one-to-many relationship set) cannot be enforced on the relations created from that relationship set using only primary-key, foreign-key, and not-null constraints.  a. Explain why.  b. Explain how total participation constraints can be enforced using complex check constraints or assertions (see Section 4.4.8). (These features are, unfortunately, not supported by any widely used database at present.)<br>PE 6.8 / 6.11 — nếu yêu cầu mỗi course phải có ít nhất một section (total participation của course trong sec_course), những course nào trong University database đang vi phạm? Trả về course_id, title. |
| CK1.11 | PE 6.12 multiple inheritance | ★★☆ | Exercise 6.12. Consider a lattice of generalization and specialization (attributes not shown) with higher-level entity sets X and Y and lower-level entity sets A, B, C: A specializes X, B specializes both X and Y, and C specializes Y.  For entity sets A, B, and C, explain how attributes are inherited from the higher-level entity sets X and Y. Discuss how to deal with the case where an attribute of X has the same name as an attribute of Y.<br>PE 6.12 — lattice: B là specialization của cả X và Y (method 1). Tạo `lat_x(id varchar(5) primary key, name varchar(20), x_attr integer)`, `lat_y(id varchar(5) primary key, name varchar(20), y_attr integer)` và `lat_b(id varchar(5) primary key, b_attr integer)` trong đó id của lat_b phải tồn tại ở cả lat_x và lat_y. Sau đó tạo view `lat_b_full(id, x_name, y_name, x_attr, y_attr, b_attr)` gom đủ thuộc tính thừa kế (hai thuộc tính name trùng tên được đổi thành x_name, y_name). |
| CK1.12 | PE 6.13 temporal DDL | ★★☆ | Exercise 6.13. An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.  One way to model this: define a new data type valid time, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.  a. Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.  b. Convert that E-R diagram into a set of relations.  The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.<br>PE 6.13(b) — tạo ba relation (date cho thời gian, varchar(5) cho ID, varchar(20) cho value): `t_student(student_id)`, `t_student_name(student_id, value, start_time, end_time)` và `t_advisor(student_id, instructor_id, start_time, end_time)` với primary key như lời giải của sách (end_time nằm trong khoá). t_student_name.student_id và t_advisor.student_id tham chiếu t_student. |
| CK1.13 | PE 6.13 query tại thời điểm | ★★☆ | Exercise 6.13. An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.  One way to model this: define a new data type valid time, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.  a. Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.  b. Convert that E-R diagram into a set of relations.  The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.<br>PE 6.13 — dữ liệu có sẵn: `er_t_advisor(student_id, instructor_id, start_time, end_time)`, `er_t_instructor_name(instructor_id, value, start_time, end_time)`. Ai (instructor_id và tên có hiệu lực tại thời điểm đó) là advisor của student `12345` vào ngày `2019-03-15`? |
| CK1.14 | PE 6.13 lịch sử | ★★☆ | Exercise 6.13. An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.  One way to model this: define a new data type valid time, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.  a. Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.  b. Convert that E-R diagram into a set of relations.  The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.<br>PE 6.13 — liệt kê toàn bộ lịch sử advisor của sinh viên có tên (hiện tại) `Shankar`: instructor_id, start_time, end_time, sắp theo start_time. (Tên sinh viên ở `er_t_student_name`.) |
| CK1.15 | PE 6.13 snapshot | ★★★ | Exercise 6.13. An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.  One way to model this: define a new data type valid time, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.  a. Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.  b. Convert that E-R diagram into a set of relations.  The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.<br>PE 6.13 — "chụp" trạng thái tại ngày `2021-06-01`: tạo view `advisor_snapshot_2021(student_name, instructor_name)` gồm các cặp advisor có hiệu lực ngày đó, với tên sinh viên và tên giảng viên có hiệu lực ngày đó. |
