export default {
  key: 'ck1',
  slug: 'ck1_pe_ch6',
  label: 'Ôn CK · Phần 1',
  navLabel: 'CK1',
  kind: 'Ôn tập',
  short: 'CK1',
  title: 'Practice Exercises — Chapter 6',
  titleVi: 'Practice Exercises Chương 6 (E-R)',
  source: 'Database System Concepts, 7th Ed. — Practice Exercises 6.1–6.13',

  summary: `
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
- **Ký hiệu**: chữ nhật = entity set; thoi = relationship set; chữ nhật/thoi **đôi** = weak entity / identifying relationship; gạch chân liền = PK, gạch nét đứt = discriminator; \`{a}\` multivalued; \`a()\` derived; thuộc tính thụt lề = composite; **mũi tên** = phía "one"; **đường đôi** = total participation; \`l..h\` = min..max lần tham gia.
- **PK của relationship set**: M:N → PK(A) ∪ PK(B); many-to-one A→B → PK(A); one-to-one → PK(A) hoặc PK(B) (cái còn lại \`unique\`).
- **Weak entity**: PK = PK(owner) + discriminator; FK → owner \`on delete cascade\`; identifying relationship không sinh bảng.
- **Reduction**: composite → làm phẳng; multivalued → bảng riêng (PK gồm mọi cột); derived → view; many-to-one total phía many → gộp FK vào phía many + \`not null\`; M:N → bảng riêng.
- **Ép ràng buộc trong SQL**:

| Ràng buộc E-R | Ép bằng |
|---|---|
| many-to-one A→B | PK(A) là khoá của bảng chứa quan hệ |
| one-to-one | thêm \`unique\` cho FK còn lại |
| total participation phía **many** (đã gộp) | \`not null\` cho FK |
| total participation phía **one** hoặc của M:N | **không** ép được bằng PK/FK/not null → assertion (chuẩn SQL, không DBMS nào hỗ trợ) hoặc **trigger** (PostgreSQL: constraint trigger \`deferrable initially deferred\`) |

- **Specialization**: overlapping / disjoint; total / partial; method 1 (bảng cha + bảng con chứa PK) vs method 2 (mỗi bảng con chứa đủ thuộc tính). Đa thừa kế (lattice): con thừa kế cả X và Y; trùng tên thì gọi \`X.name\`, \`Y.name\`.
- **Aggregation**: relationship được xem như entity để tham gia relationship khác; bảng gồm PK của relationship được aggregate.
- **Design**: tránh entity set vẽ lặp có thuộc tính (PE 6.4); đồ thị không liên thông = các phần độc lập, chu trình = hai entity liên quan theo ≥ 2 cách (PE 6.5).
`,

  quiz: [
    {
      q: '(PE 6.1) Trong E-R công ty bảo hiểm, vì sao premium_payment được mô hình là weak entity?',
      options: ['Vì payment không có thuộc tính', 'Vì mỗi payment gắn với một policy cụ thể và payment_no chỉ phân biệt trong phạm vi policy đó', 'Vì payment là multivalued', 'Vì payment có quan hệ many-to-many với car'],
      answer: 1,
      explain: 'PK(payment) = policy_id + payment_no (discriminator); payment phụ thuộc tồn tại vào policy.',
    },
    {
      q: '(PE 6.1) Vì sao participation của accident trong participated **không** total?',
      options: ['Vì một xe có thể không gặp tai nạn', 'Vì có thể có biên bản tai nạn mà chưa biết xe nào liên quan', 'Vì accident là weak entity', 'Vì participated là one-to-one'],
      answer: 1,
      explain: 'Theo lời giải của sách: có thể có accident report mà xe tham gia chưa xác định.',
    },
    {
      q: '(PE 6.2b) Khi chỉ dùng binary relationship student–section và vẫn lưu điểm nhiều bài thi, điểm được biểu diễn bằng gì?',
      options: ['Thuộc tính đơn marks', 'Thuộc tính multivalued composite {exam_marks(exam_id, marks)} trên relationship', 'Một entity exam bắt buộc', 'Một ternary relationship'],
      answer: 1,
      explain: 'Một cặp (student, section) có nhiều (exam_id, marks).',
    },
    {
      q: '(PE 6.2b) Nhược điểm của việc đặt tên, địa điểm, giờ thi của exam làm thuộc tính trên relationship?',
      options: ['Không có nhược điểm', 'Lặp thông tin cho mỗi sinh viên và không lưu được exam khi chưa có sinh viên', 'Không biểu diễn được điểm', 'Vi phạm khoá chính'],
      answer: 1,
      explain: 'Muốn lưu thông tin exam phải giữ entity exam riêng.',
    },
    {
      q: '(PE 6.3) season_score của player nên được mô hình thế nào?',
      options: ['Thuộc tính lưu sẵn', 'Derived attribute, tính bằng tổng score qua relationship played', 'Multivalued attribute', 'Weak entity'],
      answer: 1,
      explain: 'Tóm tắt thống kê nên là derived; trong SQL hiện thực bằng view.',
    },
    {
      q: '(PE 6.4) Nếu một entity set phải vẽ nhiều lần (diagram nhiều trang) thì nên làm gì?',
      options: ['Lặp lại đầy đủ thuộc tính ở mọi chỗ', 'Chỉ ghi thuộc tính ở một chỗ; các lần xuất hiện khác không ghi thuộc tính', 'Đổi tên mỗi lần xuất hiện', 'Không được vẽ lại'],
      answer: 1,
      explain: 'Lặp thuộc tính dễ dẫn tới các bản không nhất quán.',
    },
    {
      q: '(PE 6.5) E-R diagram (xem như đồ thị) **không liên thông** nghĩa là gì?',
      options: ['Thiết kế sai', 'Có các phần của doanh nghiệp hoàn toàn độc lập — thực chất là các CSDL riêng', 'Có weak entity', 'Có chu trình'],
      answer: 1,
      explain: 'Không có đường đi giữa hai entity set nghĩa là chúng không liên quan, kể cả gián tiếp.',
    },
    {
      q: '(PE 6.5) Diagram có **chu trình** cho biết điều gì?',
      options: ['Mọi cặp entity trên chu trình liên quan với nhau theo ít nhất hai cách khác nhau', 'Có recursive relationship', 'Có lỗi thiết kế bắt buộc phải sửa', 'Có ternary relationship'],
      answer: 0,
      explain: 'Diagram không chu trình thì giữa hai entity set có đúng một đường (một quan hệ duy nhất).',
    },
    {
      q: '(PE 6.6) Khi thay ternary R(A, B, C) bằng E và R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub>, ràng buộc nào cần thêm để mọi instance ứng với một R hợp lệ?',
      options: ['E total participation vào cả R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub>', 'A, B, C total vào R', 'R<sub>A</sub> là many-to-many', 'Bỏ E'],
      answer: 0,
      explain: 'Nếu e chỉ nối với a mà không nối b, c thì không ứng với bộ (a, b, c) nào.',
    },
    {
      q: '(PE 6.7) Thêm PK của owner vào weak entity để biến nó thành strong entity gây ra điều gì?',
      options: ['Mất thông tin', 'Redundancy: PK owner nằm ở cả entity và relationship, và phải luôn bằng nhau', 'Không thể tạo PK', 'Vi phạm 1NF'],
      answer: 1,
      explain: 'Thông tin đó đã suy ra được từ identifying relationship.',
    },
    {
      q: '(PE 6.8) PK (course_id, sec_id, semester, year) và FK course_id → course của sec_course đảm bảo điều gì?',
      options: ['Many-to-one: mỗi section thuộc đúng một course', 'Mỗi course có ít nhất một section', 'Cả hai', 'Không đảm bảo gì'],
      answer: 0,
      explain: 'Total participation (course phải có section) thì không ép được bằng PK/FK.',
    },
    {
      q: '(PE 6.9) Nếu advisor là one-to-one, bảng advisor(s_ID, i_ID) với PK s_ID cần thêm gì?',
      options: ['not null cho s_ID', 'unique cho i_ID', 'PK (s_ID, i_ID)', 'check (s_ID <> i_ID)'],
      answer: 1,
      explain: 'i_ID trở thành superkey: mỗi instructor hướng dẫn tối đa một student.',
    },
    {
      q: '(PE 6.10) R many-to-one từ A tới B được gộp vào bảng A. Total participation của A trong R được ép bằng gì?',
      options: ['unique cho FK tới B', 'not null cho FK tới B', 'PK của B', 'Không ép được'],
      answer: 1,
      explain: 'a không liên kết b nào sẽ có FK null — bị cấm.',
    },
    {
      q: '(PE 6.11) Vì sao total participation của B ở phía "one" (mỗi b phải được ít nhất một a tham chiếu) không ép được bằng FK?',
      options: ['Vì FK chỉ tham chiếu tới cột primary key/unique, trong khi cột FK ở bảng A không unique', 'Vì FK không cho null', 'Vì B không có primary key', 'Vì SQL không có FK'],
      answer: 0,
      explain: 'Muốn "b phải xuất hiện trong A" thì cần FK từ B tới cột của A — nhưng cột đó không unique.',
    },
    {
      q: '(PE 6.11) Trong lời giải bằng check/assertion, vì sao ràng buộc phải đặt là **deferred**?',
      options: ['Để chạy nhanh hơn', 'Vì phải chèn cả b và a liên quan trong cùng transaction; kiểm tra ngay sẽ lỗi ở câu chèn đầu tiên', 'Vì check không hỗ trợ subquery', 'Vì FK luôn deferred'],
      answer: 1,
      explain: 'Chèn b trước → vi phạm total; chèn a trước → vi phạm foreign key. Kiểm tra cuối transaction giải quyết vòng lặp này.',
    },
    {
      q: '(PE 6.12) B là specialization của cả X và Y. X và Y cùng có thuộc tính name. B tham chiếu thế nào?',
      options: ['Không thể', 'Dùng tên đầy đủ X.name và Y.name', 'Chỉ giữ X.name', 'Đổi tên Y'],
      answer: 1,
      explain: 'B thừa kế thuộc tính của cả hai; trùng tên thì phân biệt bằng tên định danh đầy đủ.',
    },
    {
      q: '(PE 6.13) Khi chuyển E-R có valid time sang bảng, mỗi thuộc tính thay đổi theo thời gian (ví dụ salary) trở thành gì?',
      options: ['Một cột salary', 'Một relation instructor_salary(instructor_id, value, start_time, end_time)', 'Một view', 'Một weak entity không có thuộc tính'],
      answer: 1,
      explain: 'Multivalued composite {salary(value, start_time, end_time)} → bảng riêng.',
    },
  ],

  questions: [
    {
      pe: '6.1',
      q: '**PE 6.1.** Vẽ E-R diagram cho công ty bảo hiểm xe: mỗi customer sở hữu một hoặc nhiều car; mỗi car có 0..nhiều accident được ghi nhận; mỗi policy bảo hiểm một hoặc nhiều car và có một hoặc nhiều premium payment; mỗi payment cho một kỳ, có due date và ngày nhận tiền. Sau đó viết lược đồ quan hệ.',
      answer: `\`\`\`
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
\`\`\`
- owns: customer – car, customer **total** (mỗi customer có ≥ 1 car); many-to-many (hoặc many-to-one nếu mỗi xe một chủ).
- participated: car – accident, many-to-many, **cả hai partial** (xe có thể chưa tai nạn; biên bản có thể chưa xác định xe).
- covers: car → policy (\`1..1\` phía car), policy \`1..*\`.
- premium_payment là **weak entity** của policy qua identifying relationship payment (đôi, total phía payment).

Lược đồ:
- customer(<u>customer_id</u>, name, address)
- car(<u>license_no</u>, model, policy_id **not null** → policy) — covers gộp vào car
- policy(<u>policy_id</u>)
- owns(<u>customer_id, license_no</u>)
- accident(<u>report_id</u>, date, place)
- participated(<u>report_id, license_no</u>)
- premium_payment(<u>policy_id, payment_no</u>, due_date, amount, received_on), FK policy_id → policy on delete cascade.

Ràng buộc "mỗi customer có ≥ 1 car" và "mỗi policy phủ ≥ 1 car" không ép được bằng PK/FK (xem PE 6.11).`,
    },
    {
      pe: '6.2',
      q: '**PE 6.2.** CSDL gồm student, course, section của University và điểm mà sinh viên đạt trong các bài thi của từng section. (a) Vẽ E-R coi exam là entity và dùng một ternary relationship. (b) Vẽ E-R chỉ dùng binary relationship giữa student và section, mỗi cặp (student, section) chỉ có một relationship nhưng vẫn lưu được điểm nhiều bài thi.',
      answer: `**(a)**
\`\`\`
[student] ---- <exam_marks> ---- [section] ==<<sec_course>>== [course]
 student_id       marks           sec_id, semester, year        course_id, title, credits
                    |
                 [exam]
                  exam_id, name, place, time
\`\`\`
Ternary exam_marks(student, section, exam) có thuộc tính marks. Lược đồ: exam(<u>exam_id</u>, name, place, time); exam_marks(<u>student_id, course_id, sec_id, semester, year, exam_id</u>, marks).
Phương án khác: exam là **weak entity** của section; khi đó marks là binary relationship student – exam.

**(b)**
\`\`\`
[student] ---- <exam_marks> ---- [section]
                {exam_marks
                   exam_id
                   marks }
\`\`\`
Relationship binary có thuộc tính **multivalued composite** {exam_marks(exam_id, marks)}. Lược đồ: sec_exam_marks(<u>student_id, course_id, sec_id, semester, year, exam_id</u>, marks).
Không đặt name/place/time của exam vào relationship: sẽ **lặp** cho từng sinh viên và không lưu được exam khi chưa có sinh viên — muốn lưu thì phải giữ entity exam riêng.`,
    },
    {
      pe: '6.3',
      q: '**PE 6.3.** Thiết kế E-R lưu thống kê ghi điểm của đội bóng yêu thích: các trận, tỉ số mỗi trận, cầu thủ tham gia mỗi trận, thống kê ghi điểm của từng cầu thủ mỗi trận. Thống kê tổng hợp mô hình bằng derived attribute và giải thích cách tính.',
      answer: `\`\`\`
[player] ---------- <played> ---------- [match]
 player_id            score              match_id
 name                                    date, stadium, opponent
 age                                     own_score, opp_score
 season_score()
\`\`\`
- played: many-to-many player – match, thuộc tính score (điểm cầu thủ ghi trong trận).
- **season_score()** là derived: tổng score của player qua mọi bộ played của player đó (trong mùa giải).
- Lược đồ: player(<u>player_id</u>, name, age), match(<u>match_id</u>, date, stadium, opponent, own_score, opp_score), played(<u>match_id, player_id</u>, score); season_score hiện thực bằng view \`sum(score) group by player_id\`.`,
    },
    {
      pe: '6.4',
      q: '**PE 6.4.** Một E-R diagram có cùng một entity set xuất hiện nhiều lần, thuộc tính được lặp lại ở nhiều chỗ. Vì sao cho phép redundancy này là thói quen xấu?',
      answer: `Entity set được vẽ nhiều lần thường vì diagram trải trên nhiều trang. Nếu ghi thuộc tính ở mỗi lần xuất hiện, các bản có thể **khác nhau** (thêm/bớt thuộc tính ở một chỗ) → diagram không nhất quán. Nên chỉ ghi thuộc tính **một lần**; các lần xuất hiện khác không ghi thuộc tính nào — vì entity set không thể không có thuộc tính, người đọc hiểu rằng thuộc tính được định nghĩa ở chỗ khác.`,
    },
    {
      pe: '6.5',
      q: '**PE 6.5.** Xem E-R diagram như một đồ thị. Các điều sau có ý nghĩa gì với cấu trúc lược đồ doanh nghiệp? (a) Đồ thị không liên thông. (b) Đồ thị có chu trình.',
      answer: `**(a)** Hai entity set nối nhau bằng một đường đi thì có liên quan (có thể gián tiếp). Không liên thông nghĩa là có các cặp entity set hoàn toàn không liên quan: các phần đó của doanh nghiệp **độc lập**, thực chất mỗi thành phần liên thông là một CSDL riêng.

**(b)** Có chu trình thì mọi cặp entity set trên chu trình liên quan với nhau theo **ít nhất hai cách** khác nhau. Nếu diagram không có chu trình, giữa hai entity set có đúng một đường đi, tức một quan hệ duy nhất.`,
    },
    {
      pe: '6.6',
      q: '**PE 6.6.** Ternary relationship R(A, B, C) được biểu diễn bằng entity set E và ba binary relationship R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub> (Figure 6.29b). (a) Cho một instance của E, A, B, C, R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub> không tương ứng với instance nào của A, B, C, R. (b) Sửa diagram thêm ràng buộc để mọi instance thoả ràng buộc đều tương ứng với một instance của R. (c) Sửa cách dịch để xử lý total participation trên ternary relationship.',
      answer: `**(a)** E = {e1, e2}, A = {a1, a2}, B = {b1}, C = {c1}, R<sub>A</sub> = {(e1, a1), (e2, a2)}, R<sub>B</sub> = {(e1, b1)}, R<sub>C</sub> = {(e1, c1)}. e2 chỉ nối với a2 mà không nối b, c nào → không có bộ (a, b, c) nào ứng với e2.

**(b)** Cho E **total participation** vào R<sub>A</sub>, R<sub>B</sub> và R<sub>C</sub> (đường đôi), đồng thời mỗi R<sub>X</sub> là many-to-one từ E (mũi tên về A, B, C): mỗi e nối đúng một a, một b, một c.
\`\`\`
[A] <---- <R_A> ==== [E] ==== <R_B> ----> [B]
                      ||
                    <R_C> ----> [C]
\`\`\`
(Nên thêm ràng buộc không có hai e cùng bộ (a, b, c) — trong SQL là \`unique\`.)

**(c)** Nếu A total trong R thì thêm total participation của A vào R<sub>A</sub>; tương tự cho B (R<sub>B</sub>) và C (R<sub>C</sub>).`,
    },
    {
      pe: '6.7',
      q: '**PE 6.7.** Weak entity set luôn có thể biến thành strong entity set bằng cách thêm các thuộc tính primary key của identifying entity set. Hãy nêu loại redundancy phát sinh.',
      answer: `PK của weak entity suy ra được từ relationship với strong entity. Nếu thêm PK của owner vào weak entity, giá trị đó xuất hiện **cả** trong entity set và trong relationship set (identifying relationship), và hai chỗ **phải luôn bằng nhau** → redundancy (và nguy cơ không nhất quán). Ví dụ section có course_id trong khi sec_course đã nối section với course.`,
    },
    {
      pe: '6.8',
      q: '**PE 6.8.** Xét relation sec_course sinh từ relationship set many-to-one sec_course. Các ràng buộc primary key và foreign key tạo trên relation này có ép được cardinality many-to-one không? Giải thích.',
      answer: `**Có.** PK của section là (course_id, sec_id, semester, year), cũng là PK của sec_course; course_id là FK từ sec_course tới course. Do đó mỗi section chỉ ứng với **một** course → many-to-one được ép.

Nhưng các ràng buộc này **không** ép được total participation: một course (hoặc một section) có thể không xuất hiện trong sec_course.`,
    },
    {
      pe: '6.9',
      q: '**PE 6.9.** Giả sử relationship set advisor là one-to-one. Cần thêm ràng buộc gì trên relation advisor để ép cardinality one-to-one?',
      answer: `Ngoài khai báo **s_ID là primary key** của advisor, khai báo **i_ID là superkey** — trong SQL dùng \`unique (i_ID)\`. Như vậy mỗi student có tối đa một instructor và mỗi instructor hướng dẫn tối đa một student.`,
    },
    {
      pe: '6.10',
      q: '**PE 6.10.** R là relationship many-to-one giữa A và B; relation của R được gộp vào relation của A. Trong SQL, thuộc tính tham gia foreign key có thể null. Giải thích cách ép total participation của A trong R bằng not null.',
      answer: `Khai báo thuộc tính FK (trong bảng A, ứng với PK của B) là **not null**. Một a không liên kết b nào sẽ phải có FK null khi gộp R vào A — bị cấm. Ví dụ instructor(ID, name, dept_name **not null** references department) ép mỗi instructor thuộc một khoa.`,
    },
    {
      pe: '6.11',
      q: '**PE 6.11.** Foreign key trong SQL chỉ tham chiếu được primary key hoặc thuộc tính unique. Vì thế total participation trên relationship many-to-many (hoặc trên phía "one" của one-to-many) không ép được bằng primary key, foreign key và not null. (a) Giải thích vì sao. (b) Giải thích cách ép bằng check phức tạp hoặc assertion.',
      answer: `**(a)** Với many-to-many, R phải là bảng riêng. Không có cách nào trong SQL bảo đảm mỗi giá trị PK của E1 xuất hiện trong R, vì cột tương ứng của R **không unique**, mà FK chỉ được trỏ tới PK/unique. Tương tự với one-to-many: không thể bảo đảm giá trị ở phía "one" xuất hiện trong bảng phía "many".

**(b)** R many-to-one từ A tới B (A chứa FK b). Đặt trên bảng B:
\`\`\`sql
constraint total_part check (b in (select b from A));
set constraints total_part deferred;
\`\`\`
hoặc assertion \`create assertion ... check (not exists (select * from B where b not in (select b from A)))\`. Phải **deferred** (kiểm tra cuối transaction): chèn b vào B trước thì vi phạm total; chèn A trước thì vi phạm foreign key. PostgreSQL không có assertion/check có subquery → dùng **constraint trigger deferrable initially deferred** (bài CK1.09).`,
    },
    {
      pe: '6.12',
      q: '**PE 6.12.** Cấu trúc lattice: X và Y là entity cấp cao; A là specialization của X, C của Y, B của cả X và Y. Giải thích cách A, B, C thừa kế thuộc tính. Xử lý thế nào khi X và Y có thuộc tính trùng tên?',
      answer: `\`\`\`
   [X]       [Y]
   / \\       / \\
 [A]   [B]-----  [C]
\`\`\`
- A thừa kế mọi thuộc tính của X, cộng thuộc tính riêng.
- C thừa kế mọi thuộc tính của Y, cộng thuộc tính riêng.
- B thừa kế thuộc tính của **cả X và Y** (multiple inheritance).
- Nếu X và Y cùng có thuộc tính \`name\`, trong B dùng tên đầy đủ **X.name** và **Y.name** để phân biệt.

Bảng (method 1): x(<u>id</u>, ...), y(<u>id</u>, ...), b(<u>id</u>, ...) với id vừa là FK → x vừa là FK → y.`,
    },
    {
      pe: '6.13',
      q: '**PE 6.13.** E-R thường mô hình trạng thái doanh nghiệp tại một thời điểm. Muốn theo dõi thay đổi theo thời gian: định nghĩa kiểu valid time (khoảng hoặc tập khoảng thời gian), gắn valid time cho mỗi entity và relationship; thuộc tính thay đổi theo thời gian là tập giá trị, mỗi giá trị có valid time riêng (end time có thể là vô cực). (a) Vẽ E-R có student, instructor, advisor với các mở rộng này. (b) Chuyển sang tập relation.',
      answer: `**(a)**
\`\`\`
[student]                         [instructor]
 student_id                        instructor_id
 {valid_times(start_time, end_time)}  {valid_times(start_time, end_time)}
 {name(value, start_time, end_time)}  {name(value, start_time, end_time)}
 {dept_name(value, start_time, end_time)} {dept_name(value, start_time, end_time)}
 {tot_cred(value, start_time, end_time)}  {salary(value, start_time, end_time)}
        \\                              /
         ------- <advisor> ------------
                  {valid_time(start_time, end_time)}
\`\`\`
student_id, instructor_id không đổi theo thời gian; mọi thuộc tính khác là multivalued composite.

**(b)**
- student(<u>student_id</u>), student_valid_times(<u>student_id, start_time, end_time</u>)
- student_name(<u>student_id, value, start_time, end_time</u>), student_dept_name(...), student_tot_cred(...)
- instructor(<u>instructor_id</u>), instructor_valid_times(...), instructor_name(...), instructor_dept_name(...), instructor_salary(...)
- advisor(<u>student_id, instructor_id, start_time, end_time</u>)

Nếu thêm ràng buộc các khoảng không chồng nhau (hoặc một start_time không có hai end_time) thì có thể bỏ end_time khỏi primary key. Tập relation này phức tạp, truy vấn SQL khó viết; thực tế người ta thường bỏ qua thời gian khi thiết kế E-R rồi thêm start/end time vào các relation sinh ra.`,
    },
  ],

  exercises: [
    {
      id: 'CK1.01', topic: 'PE 6.1 DDL', level: 3,
      pe: '6.1',
      prompt: `**PE 6.1 — hiện thực bằng SQL.** Tạo các bảng (mọi khoá/chuỗi varchar(10), tiền numeric(10,2), ngày date):
- \`ins_customer(customer_id, name, address)\`
- \`ins_policy(policy_id)\`
- \`ins_car(license_no, model, policy_id)\` — covers gộp vào car, mỗi xe thuộc **đúng một** policy
- \`ins_owns(customer_id, license_no)\` — many-to-many
- \`ins_accident(report_id, acc_date, place)\`
- \`ins_participated(report_id, license_no)\`
- \`ins_premium_payment(policy_id, payment_no, due_date, amount, received_on)\` — **weak entity** của policy (xoá theo policy)`,
      hint: 'premium_payment: PK (policy_id, payment_no), FK on delete cascade; ins_car.policy_id not null.',
      solution: `create table ins_customer (customer_id varchar(10) primary key, name varchar(10), address varchar(10));
create table ins_policy (policy_id varchar(10) primary key);
create table ins_car (
  license_no varchar(10) primary key,
  model      varchar(10),
  policy_id  varchar(10) not null references ins_policy
);
create table ins_owns (
  customer_id varchar(10) references ins_customer,
  license_no  varchar(10) references ins_car,
  primary key (customer_id, license_no)
);
create table ins_accident (report_id varchar(10) primary key, acc_date date, place varchar(10));
create table ins_participated (
  report_id  varchar(10) references ins_accident,
  license_no varchar(10) references ins_car,
  primary key (report_id, license_no)
);
create table ins_premium_payment (
  policy_id   varchar(10) references ins_policy on delete cascade,
  payment_no  varchar(10),
  due_date    date,
  amount      numeric(10,2),
  received_on date,
  primary key (policy_id, payment_no)
);`,
      check: `select try_sql($$insert into ins_policy values ('P1'), ('P2')$$)                                   as policies,
       try_sql($$insert into ins_car values ('C1', 'Vios', 'P1'), ('C2', 'City', 'P1')$$)            as two_cars_one_policy,
       try_sql($$insert into ins_car values ('C3', 'Orphan', null)$$)                                as car_without_policy,
       try_sql($$insert into ins_customer values ('U1', 'An', 'Hue')$$)                               as customer,
       try_sql($$insert into ins_owns values ('U1', 'C1'), ('U1', 'C2')$$)                            as owns_two,
       try_sql($$insert into ins_accident values ('R1', '2025-01-01', 'Hue')$$)                       as accident,
       try_sql($$insert into ins_participated values ('R1', 'C1'), ('R1', 'C2')$$)                    as two_cars_one_accident,
       try_sql($$insert into ins_premium_payment values ('P1', '1', '2025-01-31', 100, null)$$)       as pay_1,
       try_sql($$insert into ins_premium_payment values ('P2', '1', '2025-01-31', 100, null)$$)       as same_no_other_policy,
       try_sql($$insert into ins_premium_payment values ('P1', '1', '2025-02-28', 100, null)$$)       as duplicate_payment,
       try_sql($$insert into ins_premium_payment values ('P9', '1', '2025-02-28', 100, null)$$)       as no_policy,
       try_sql($$delete from ins_policy where policy_id = 'P2'$$)                                    as delete_policy,
       sql_value($$select count(*) from ins_premium_payment$$)                                      as payments_left;`,
    },
    {
      id: 'CK1.02', topic: 'PE 6.2a ternary', level: 3,
      pe: '6.2a',
      prompt: `**PE 6.2(a)** — exam là entity, dùng ternary relationship. Tạo:
- \`exam(exam_id varchar(5) primary key, name varchar(20), place varchar(20), exam_time timestamp)\`
- \`exam_marks(ID, course_id, sec_id, semester, year, exam_id, marks)\` (kiểu cột giống bảng takes; marks numeric(5,2)) với primary key là ternary (student, section, exam), FK ID → student, (course_id, sec_id, semester, year) → section, exam_id → exam.`,
      solution: `create table exam (
  exam_id    varchar(5) primary key,
  name       varchar(20),
  place      varchar(20),
  exam_time  timestamp
);
create table exam_marks (
  ID         varchar(5) references student,
  course_id  varchar(8),
  sec_id     varchar(8),
  semester   varchar(6),
  year       numeric(4,0),
  exam_id    varchar(5) references exam,
  marks      numeric(5,2),
  primary key (ID, course_id, sec_id, semester, year, exam_id),
  foreign key (course_id, sec_id, semester, year) references section
);`,
      check: `select try_sql($$insert into exam values ('MT', 'Midterm', 'Watson 100', '2017-10-15 09:00'), ('FN', 'Final', 'Packard 101', '2017-12-15 09:00')$$) as exams,
       try_sql($$insert into exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'MT', 8.5)$$)  as mark_mt,
       try_sql($$insert into exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'FN', 9)$$)    as mark_fn,
       try_sql($$insert into exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'MT', 7)$$)    as duplicate,
       try_sql($$insert into exam_marks values ('00128', 'CS-101', '9', 'Fall', 2017, 'MT', 7)$$)    as bad_section,
       try_sql($$insert into exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'XX', 7)$$)    as bad_exam;`,
    },
    {
      id: 'CK1.03', topic: 'PE 6.2b binary', level: 2,
      pe: '6.2b',
      prompt: '**PE 6.2(b)** — chỉ một binary relationship student–section với thuộc tính multivalued composite {exam_marks(exam_id, marks)}. Tạo bảng `sec_exam_marks(ID, course_id, sec_id, semester, year, exam_id varchar(5), marks numeric(5,2))` (FK tới student và section; **không** có bảng exam) sao cho một sinh viên trong một section có nhiều bài thi nhưng mỗi bài thi một điểm.',
      solution: `create table sec_exam_marks (
  ID         varchar(5) references student,
  course_id  varchar(8),
  sec_id     varchar(8),
  semester   varchar(6),
  year       numeric(4,0),
  exam_id    varchar(5),
  marks      numeric(5,2),
  primary key (ID, course_id, sec_id, semester, year, exam_id),
  foreign key (course_id, sec_id, semester, year) references section
);`,
      check: `select try_sql($$insert into sec_exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'MT', 8.5)$$) as mt,
       try_sql($$insert into sec_exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'FN', 9)$$)   as fn,
       try_sql($$insert into sec_exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'MT', 6)$$)   as duplicate_exam,
       try_sql($$insert into sec_exam_marks values ('99999', 'CS-101', '1', 'Fall', 2017, 'MT', 6)$$)   as bad_student,
       (select count(*) from information_schema.tables where table_name = 'exam') as exam_table;`,
    },
    {
      id: 'CK1.04', topic: 'PE 6.3 derived (view)', level: 2,
      pe: '6.3',
      prompt: '**PE 6.3** — dữ liệu có sẵn: `er_player(player_id, name, age)`, `er_match(...)`, `er_played(match_id, player_id, score)`. Hiện thực derived attribute season_score: tạo view `season_score(player_id, name, season_score)` cho **mọi** cầu thủ (cầu thủ chưa đá trận nào có 0).',
      hint: 'left join + coalesce(sum(score), 0).',
      solution: `create view season_score (player_id, name, season_score) as
  select p.player_id, p.name, coalesce(sum(pl.score), 0)
  from er_player p left join er_played pl on pl.player_id = p.player_id
  group by p.player_id, p.name;`,
      check: `select * from season_score;`,
    },
    {
      id: 'CK1.05', topic: 'PE 6.3 derived (query)', level: 2,
      pe: '6.3',
      prompt: '**PE 6.3** — thêm derived attribute `result()` của match: `W` nếu own_score > opp_score, `D` nếu bằng, `L` nếu thua. Trả về match_id, opponent, result, và số cầu thủ đã ra sân (`num_players`), sắp theo match_date.',
      solution: `select m.match_id, m.opponent,
       case when m.own_score > m.opp_score then 'W'
            when m.own_score = m.opp_score then 'D'
            else 'L' end as result,
       count(pl.player_id) as num_players
from er_match m left join er_played pl on pl.match_id = m.match_id
group by m.match_id, m.opponent, m.own_score, m.opp_score, m.match_date
order by m.match_date;`,
      ordered: true,
    },
    {
      id: 'CK1.06', topic: 'PE 6.8 many-to-one', level: 2,
      pe: '6.8',
      prompt: '**PE 6.8** — giả sử section có định danh riêng `section_id`. Tạo bảng `sec_course(section_id varchar(10), course_id varchar(8))` biểu diễn relationship **many-to-one** từ section tới course, ép được cardinality bằng primary key + foreign key (mỗi section thuộc đúng một course). Hệ thống cũng kiểm tra rằng course không có section nào vẫn hợp lệ — tức total participation **không** được ép.',
      solution: `create table sec_course (
  section_id  varchar(10) primary key,
  course_id   varchar(8) not null references course
);`,
      check: `select try_sql($$insert into sec_course values ('S1', 'CS-101')$$) as s1,
       try_sql($$insert into sec_course values ('S2', 'CS-101')$$) as same_course,
       try_sql($$insert into sec_course values ('S1', 'CS-347')$$) as section_second_course,
       try_sql($$insert into sec_course values ('S3', 'XX-000')$$) as bad_course,
       sql_value($$select count(*) from course where course_id not in (select course_id from sec_course)$$) as courses_without_section;`,
    },
    {
      id: 'CK1.07', topic: 'PE 6.9 one-to-one', level: 1,
      pe: '6.9',
      prompt: '**PE 6.9** — tạo `advisor_1to1(s_ID varchar(5), i_ID varchar(5))` là phiên bản **one-to-one** của advisor: s_ID là primary key, và thêm ràng buộc để mỗi instructor hướng dẫn tối đa một sinh viên. FK tới student/instructor.',
      solution: `create table advisor_1to1 (
  s_ID  varchar(5) primary key references student (ID),
  i_ID  varchar(5) unique references instructor (ID)
);`,
      check: `select try_sql($$insert into advisor_1to1 values ('00128', '45565')$$) as a1,
       try_sql($$insert into advisor_1to1 values ('12345', '45565')$$) as instructor_twice,
       try_sql($$insert into advisor_1to1 values ('00128', '10101')$$) as student_twice,
       try_sql($$insert into advisor_1to1 values ('12345', '10101')$$) as a2;`,
    },
    {
      id: 'CK1.08', topic: 'PE 6.10 not null', level: 1,
      pe: '6.10',
      prompt: '**PE 6.10** — relationship many-to-one `member_of` từ student tới `club`, **total** phía student, được gộp vào bảng phía many. Tạo `club(club_name varchar(20) primary key)` và `club_member(student_id varchar(5) primary key references student, club_name varchar(20))` sao cho mỗi club_member thuộc đúng một club đã tồn tại.',
      solution: `create table club (club_name varchar(20) primary key);
create table club_member (
  student_id  varchar(5) primary key references student (ID),
  club_name   varchar(20) not null references club
);`,
      check: `select try_sql($$insert into club values ('Chess'), ('Music')$$)            as clubs,
       try_sql($$insert into club_member values ('00128', 'Chess')$$)         as m1,
       try_sql($$insert into club_member values ('12345', null)$$)            as no_club,
       try_sql($$insert into club_member values ('12345', 'Dance')$$)         as bad_club,
       try_sql($$insert into club_member values ('00128', 'Music')$$)         as second_club;`,
    },
    {
      id: 'CK1.09', topic: 'PE 6.11 deferred trigger', level: 3,
      pe: '6.11',
      prompt: `**PE 6.11** — ép total participation ở phía "one". Tạo
- \`dept_t(dept_name varchar(20) primary key)\`
- \`emp_t(emp_id varchar(5) primary key, dept_name varchar(20) not null references dept_t)\` (many-to-one emp → dept)

và ràng buộc **mỗi dept_t phải có ít nhất một emp_t**. PostgreSQL không có assertion, nên dùng một trigger function \`returns trigger\` gắn bằng **constraint trigger** \`deferrable initially deferred\` (after insert/update trên dept_t và after delete/update trên emp_t). Khi vi phạm, hãy \`raise exception ... using errcode = 'check_violation'\`.

Hệ thống sẽ thử trong các khối riêng (kết thúc bằng \`set constraints all immediate\`): thêm khoa không có nhân viên (phải lỗi 23514), thêm khoa cùng nhân viên (ok), xoá nhân viên cuối cùng (phải lỗi).`,
      hint: 'create constraint trigger t after insert or update on dept_t deferrable initially deferred for each row execute function f();',
      solution: `create table dept_t (dept_name varchar(20) primary key);
create table emp_t (
  emp_id     varchar(5) primary key,
  dept_name  varchar(20) not null references dept_t
);
create function dept_has_emp() returns trigger language plpgsql as $$
begin
  if exists (select 1 from dept_t d
             where not exists (select 1 from emp_t e where e.dept_name = d.dept_name)) then
    raise exception 'department without employee' using errcode = 'check_violation';
  end if;
  return null;
end $$;
create constraint trigger dept_total after insert or update on dept_t
  deferrable initially deferred for each row execute function dept_has_emp();
create constraint trigger emp_total after delete or update on emp_t
  deferrable initially deferred for each row execute function dept_has_emp();`,
      check: `select try_sql($q$do $x$ begin insert into dept_t values ('D1'); set constraints all immediate; end $x$$q$) as dept_alone,
       try_sql($q$do $x$ begin insert into dept_t values ('D2'); insert into emp_t values ('E1', 'D2'); set constraints all immediate; end $x$$q$) as dept_with_emp,
       try_sql($q$do $x$ begin insert into emp_t values ('E2', 'D2'); set constraints all immediate; end $x$$q$) as second_emp,
       try_sql($q$do $x$ begin delete from emp_t; set constraints all immediate; end $x$$q$) as delete_all_emps,
       sql_value($$select count(*) from dept_t$$) as depts,
       sql_value($$select count(*) from emp_t$$)  as emps;`,
    },
    {
      id: 'CK1.10', topic: 'PE 6.8/6.11 vi phạm total', level: 1,
      pe: ['6.8', '6.11'],
      prompt: '**PE 6.8 / 6.11** — nếu yêu cầu mỗi course phải có ít nhất một section (total participation của course trong sec_course), những course nào trong University database đang vi phạm? Trả về course_id, title.',
      solution: `select course_id, title from course
where course_id not in (select course_id from section);`,
    },
    {
      id: 'CK1.11', topic: 'PE 6.12 multiple inheritance', level: 2,
      pe: '6.12',
      prompt: '**PE 6.12** — lattice: B là specialization của cả X và Y (method 1). Tạo `lat_x(id varchar(5) primary key, name varchar(20), x_attr integer)`, `lat_y(id varchar(5) primary key, name varchar(20), y_attr integer)` và `lat_b(id varchar(5) primary key, b_attr integer)` trong đó id của lat_b phải tồn tại ở **cả** lat_x và lat_y. Sau đó tạo view `lat_b_full(id, x_name, y_name, x_attr, y_attr, b_attr)` gom đủ thuộc tính thừa kế (hai thuộc tính name trùng tên được đổi thành x_name, y_name).',
      solution: `create table lat_x (id varchar(5) primary key, name varchar(20), x_attr integer);
create table lat_y (id varchar(5) primary key, name varchar(20), y_attr integer);
create table lat_b (
  id      varchar(5) primary key references lat_x references lat_y,
  b_attr  integer
);
create view lat_b_full (id, x_name, y_name, x_attr, y_attr, b_attr) as
  select b.id, x.name, y.name, x.x_attr, y.y_attr, b.b_attr
  from lat_b b join lat_x x on x.id = b.id join lat_y y on y.id = b.id;`,
      check: `select try_sql($$insert into lat_x values ('K1', 'Xname', 1), ('K2', 'X2', 2)$$) as xs,
       try_sql($$insert into lat_y values ('K1', 'Yname', 10)$$)                 as ys,
       try_sql($$insert into lat_b values ('K1', 100)$$)                         as b_in_both,
       try_sql($$insert into lat_b values ('K2', 200)$$)                         as b_only_in_x,
       sql_value($$select x_name || '/' || y_name || '/' || (x_attr + y_attr + b_attr) from lat_b_full$$) as b_full;`,
    },
    {
      id: 'CK1.12', topic: 'PE 6.13 temporal DDL', level: 2,
      pe: '6.13',
      prompt: '**PE 6.13(b)** — tạo ba relation (date cho thời gian, varchar(5) cho ID, varchar(20) cho value): `t_student(student_id)`, `t_student_name(student_id, value, start_time, end_time)` và `t_advisor(student_id, instructor_id, start_time, end_time)` với primary key như lời giải của sách (end_time nằm trong khoá). t_student_name.student_id và t_advisor.student_id tham chiếu t_student.',
      solution: `create table t_student (student_id varchar(5) primary key);
create table t_student_name (
  student_id  varchar(5) references t_student,
  value       varchar(20),
  start_time  date,
  end_time    date,
  primary key (student_id, start_time, end_time)
);
create table t_advisor (
  student_id     varchar(5) references t_student,
  instructor_id  varchar(5),
  start_time     date,
  end_time       date,
  primary key (student_id, instructor_id, start_time, end_time)
);`,
      check: `select try_sql($$insert into t_student values ('S1')$$)                                         as student,
       try_sql($$insert into t_student_name values ('S1', 'Shankar', '2018-09-01', 'infinity')$$)    as name_open_ended,
       try_sql($$insert into t_student_name values ('S1', 'Shankar', '2018-09-01', 'infinity')$$)    as duplicate_name_period,
       try_sql($$insert into t_advisor values ('S1', 'I1', '2018-05-01', '2018-12-31')$$)            as advisor_1,
       try_sql($$insert into t_advisor values ('S1', 'I1', '2019-06-01', '2020-01-31')$$)            as same_advisor_again,
       try_sql($$insert into t_advisor values ('S9', 'I1', '2019-06-01', '2020-01-31')$$)            as unknown_student;`,
    },
    {
      id: 'CK1.13', topic: 'PE 6.13 query tại thời điểm', level: 2,
      pe: '6.13',
      prompt: '**PE 6.13** — dữ liệu có sẵn: `er_t_advisor(student_id, instructor_id, start_time, end_time)`, `er_t_instructor_name(instructor_id, value, start_time, end_time)`. Ai (instructor_id và tên **có hiệu lực tại thời điểm đó**) là advisor của student `12345` vào ngày `2019-03-15`?',
      hint: "date '2019-03-15' between start_time and end_time — áp dụng cho cả advisor và tên.",
      solution: `select a.instructor_id, n.value as name
from er_t_advisor a
     join er_t_instructor_name n on n.instructor_id = a.instructor_id
where a.student_id = '12345'
  and date '2019-03-15' between a.start_time and a.end_time
  and date '2019-03-15' between n.start_time and n.end_time;`,
    },
    {
      id: 'CK1.14', topic: 'PE 6.13 lịch sử', level: 2,
      pe: '6.13',
      prompt: '**PE 6.13** — liệt kê toàn bộ lịch sử advisor của sinh viên có tên (hiện tại) `Shankar`: instructor_id, start_time, end_time, sắp theo start_time. (Tên sinh viên ở `er_t_student_name`.)',
      solution: `select a.instructor_id, a.start_time, a.end_time
from er_t_advisor a
     join er_t_student_name s on s.student_id = a.student_id
where s.value = 'Shankar' and s.end_time = 'infinity'
order by a.start_time;`,
      ordered: true,
    },
    {
      id: 'CK1.15', topic: 'PE 6.13 snapshot', level: 3,
      pe: '6.13',
      prompt: '**PE 6.13** — "chụp" trạng thái tại ngày `2021-06-01`: tạo view `advisor_snapshot_2021(student_name, instructor_name)` gồm các cặp advisor có hiệu lực ngày đó, với tên sinh viên và tên giảng viên có hiệu lực ngày đó.',
      solution: `create view advisor_snapshot_2021 (student_name, instructor_name) as
  select s.value, i.value
  from er_t_advisor a
       join er_t_student_name s on s.student_id = a.student_id
       join er_t_instructor_name i on i.instructor_id = a.instructor_id
  where date '2021-06-01' between a.start_time and a.end_time
    and date '2021-06-01' between s.start_time and s.end_time
    and date '2021-06-01' between i.start_time and i.end_time;`,
      check: `select * from advisor_snapshot_2021;`,
    },
  ],
};
