export default {
  key: 'gk4',
  slug: 'gk4_mock_midterm',
  label: 'Đề thi thử GK',
  navLabel: 'Đề GK',
  kind: 'Đề thi thử',
  short: 'Đề GK',
  title: 'Mock Midterm (Chapters 1–4)',
  titleVi: 'Đề thi thử giữa kỳ — Chương 1–4',
  source: 'Biến thể của Practice Exercises chương 1–4, Database System Concepts 7th Ed.',

  summary: `
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
- σ, Π (loại trùng), ∪, −, ×, ρ là 6 phép cơ bản; ∩, ⋈, ÷, ← suy ra được. Division "**với mọi**" ↔ SQL \`not exists (A except B)\`.
- \`from r1, r2\` là tích Descartes: nếu một bảng rỗng thì kết quả rỗng (PE 3.7).
- Aggregate bỏ qua null, trừ \`count(*)\`; \`count\` trên tập rỗng = 0, \`sum/avg/max\` = null.
- "Tìm X có giá trị lớn nhất (có thể hoà)": \`with t as (...) select ... where v = (select max(v) from t)\` hoặc \`having ... >= all (...)\`.
- Cột trong \`select\` không nằm trong aggregate phải có trong \`group by\`; điều kiện trên nhóm đặt ở \`having\`.
- Đếm cả nhóm 0 phần tử: **left outer join** + \`count(cột của bảng bên phải)\` hoặc **scalar subquery**.
- Bẫy natural join: \`instructor natural join teaches natural join course\` ghép thêm theo dept_name.
- \`update\` theo nhiều mức: dùng \`case\` trong một câu (thứ tự 2 câu update có thể làm sai kết quả).
- View đơn giản mới update được; \`with check option\` chặn dòng không thoả where. Quyền select trên view không cần quyền trên bảng gốc.
- \`on delete cascade\` trên FK tự tham chiếu xoá **toàn bộ cây** cấp dưới (PE 4.9).
`,

  quiz: [
    {
      q: 'Relation account(account_number, branch_name, balance) có primary key account_number. Tập nào là superkey nhưng KHÔNG phải candidate key?',
      options: ['{account_number}', '{account_number, balance}', '{branch_name}', '{branch_name, balance}'],
      answer: 1,
      explain: 'Chứa candidate key {account_number} nên là superkey, nhưng không tối thiểu.',
    },
    {
      q: 'Bank database: loan.branch_name là foreign key tham chiếu branch. Thao tác nào CÓ THỂ vi phạm ràng buộc này?',
      options: ['Insert một branch mới', 'Delete một loan', 'Delete một branch đang có loan', 'Update amount của một loan'],
      answer: 2,
      explain: 'Xoá tuple ở referenced relation (branch) mà vẫn còn tuple referencing (loan) trỏ tới.',
    },
    {
      q: 'Bảng takes có primary key (ID, course_id, sec_id, semester, year). Vì sao grade KHÔNG nằm trong khoá?',
      options: ['Vì grade có thể null', 'Vì một sinh viên học một section chỉ có một điểm — grade được xác định bởi khoá', 'Vì grade là chuỗi', 'Vì SQL cấm'],
      answer: 1,
      explain: 'Giống lý luận end_time trong time_slot (PE 2.3): thuộc tính được xác định duy nhất bởi các thuộc tính khoá thì không cần đưa vào khoá.',
    },
    {
      q: 'Kết quả của σ<sub>borrower.loan_number = loan.loan_number</sub>(borrower × loan) chứa những customer nào?',
      options: ['Mọi customer', 'Chỉ customer có ít nhất một loan; customer có 2 loan xuất hiện 2 lần', 'Chỉ customer có đúng một loan', 'Customer không có loan với cột loan = null'],
      answer: 1,
      explain: 'Giống PE 2.5: tích + chọn = join; tuple không khớp bị loại, mỗi cặp khớp sinh một dòng.',
    },
    {
      q: 'Biểu thức nào tìm ID khách hàng có account nhưng KHÔNG có loan?',
      options: ['Π<sub>ID</sub>(depositor) ∩ Π<sub>ID</sub>(borrower)', 'Π<sub>ID</sub>(depositor) − Π<sub>ID</sub>(borrower)', 'Π<sub>ID</sub>(borrower) − Π<sub>ID</sub>(depositor)', 'Π<sub>ID</sub>(depositor × borrower)'],
      answer: 1,
      explain: 'Set difference: có trong depositor mà không có trong borrower.',
    },
    {
      q: 'r(A,B) ÷ s(B) trả về gì?',
      options: ['Các A xuất hiện với ít nhất một B của s', 'Các A xuất hiện với MỌI B của s', 'Các B không có trong r', 'r × s'],
      answer: 1,
      explain: 'Division là phép "với mọi" (PE 2.9).',
    },
    {
      q: 'Muốn tìm nhân viên lương cao nhất bằng đại số quan hệ chỉ dùng 6 phép cơ bản, ta cần phép nào để so sánh hai bản sao của works?',
      options: ['Union', 'Rename ρ', 'Projection', 'Không cần phép nào'],
      answer: 1,
      explain: 'PE 2.8b: ρ<sub>A</sub>(works) và ρ<sub>B</sub>(works), tìm người có A.salary < B.salary rồi lấy phần bù.',
    },
    {
      q: 'Câu `select p.a from p, r1, r2 where p.a = r1.a or p.a = r2.a` trả về rỗng khi nào dù p và r1 đều có giá trị khớp?',
      options: ['Khi r2 rỗng', 'Khi p có null', 'Khi r1 có trùng lặp', 'Không bao giờ'],
      answer: 0,
      explain: 'PE 3.7: from p, r1, r2 là tích Descartes; một bảng rỗng → tích rỗng.',
    },
    {
      q: '`select count(grade) from takes where ID = \'98988\'` trả về gì nếu sinh viên này có 2 dòng takes, một dòng grade = null?',
      options: ['0', '1', '2', 'null'],
      answer: 1,
      explain: 'count(cột) bỏ qua null; count(*) mới đếm 2.',
    },
    {
      q: 'Cho branch có 9 dòng và loan chỉ tham chiếu 7 branch. `select branch_name, count(*) from branch natural left outer join loan group by branch_name` sai ở đâu?',
      options: ['Thiếu branch', 'Branch không có loan được đếm là 1 thay vì 0', 'Lỗi cú pháp', 'Đếm trùng loan'],
      answer: 1,
      explain: 'Dòng bù null vẫn là một dòng: phải dùng count(loan_number) (PE 4.2a).',
    },
    {
      q: 'Điều kiện nào đúng cho "ID nhân viên lương cao hơn MỌI nhân viên của Small Bank Corporation"?',
      options: ['salary > some (select salary ... )', 'salary > all (select salary ... )', 'salary in (select salary ...)', 'exists (select salary ...)'],
      answer: 1,
      explain: '> all = lớn hơn giá trị lớn nhất (PE 3.9d).',
    },
    {
      q: 'Nếu subquery của `salary > all (subquery)` trả về tập rỗng thì điều kiện có giá trị gì?',
      options: ['false', 'unknown', 'true', 'Lỗi'],
      answer: 2,
      explain: '"Lớn hơn mọi phần tử của tập rỗng" luôn đúng (vacuous truth).',
    },
    {
      q: 'Truy vấn "công ty đặt ở MỌI thành phố mà Small Bank Corporation đặt" thường viết bằng cấu trúc nào?',
      options: ['group by ... having count(*) > 1', 'not exists ((thành phố của Small Bank) except (thành phố của công ty S))', 'in (select city ...)', 'left outer join'],
      answer: 1,
      explain: 'PE 3.9e: A ⊆ B ⇔ A − B = ∅.',
    },
    {
      q: '`where name like \'%sci%\'` không khớp "Comp. Sci." vì sao, và sửa thế nào?',
      options: ['like không hỗ trợ dấu chấm; dùng =', 'like phân biệt hoa thường; dùng lower(name) like \'%sci%\'', 'Phải dùng _ thay vì %', 'Thiếu escape'],
      answer: 1,
      explain: 'PE 3.6.',
    },
    {
      q: 'Lệnh nào tăng 10% cho lương ≤ 50000 và 4% cho phần còn lại mà KHÔNG phụ thuộc thứ tự thực hiện?',
      options: ['Hai câu update, câu 10% trước', 'Hai câu update, câu 4% trước', 'Một câu update với set salary = salary * case when salary <= 50000 then 1.10 else 1.04 end', 'Không thể làm được'],
      answer: 2,
      explain: 'PE 3.10b: hai câu update riêng có thể "tăng hai lần" cho dòng vượt ngưỡng sau câu đầu.',
    },
    {
      q: '`instructor natural join teaches natural join section natural join course` (PE 4.1) bị sai vì?',
      options: ['section và course không có cột chung', 'Ghép thêm theo dept_name nên mất các môn dạy ngoài khoa của giảng viên', 'Natural join không kết hợp được', 'Thiếu group by'],
      answer: 1,
      explain: 'instructor và course đều có dept_name.',
    },
    {
      q: 'r(A,B), s(B,C), t(B,D), mọi thuộc tính not null. Trong r ⟕ (s ⟕ t), cột nào có thể null?',
      options: ['Chỉ C', 'Chỉ D; nếu C null thì D cũng null', 'Cả hai, độc lập nhau', 'Không cột nào'],
      answer: 1,
      explain: 'PE 4.4b: s ⟕ t tính trước nên C luôn có giá trị khi tuple s tồn tại.',
    },
    {
      q: 'Viết a ⟗ b (natural) bằng `full outer join ... on` mà không có hai bản cột name: cần hàm nào?',
      options: ['nullif', 'coalesce(a.name, b.name)', 'cast', 'decode(a.name)'],
      answer: 1,
      explain: 'PE 4.10.',
    },
    {
      q: 'View `v` định nghĩa `select * from branch where branch_city = \'Brooklyn\'` (không check option). Insert qua v tuple có branch_city = \'Rye\' thì sao?',
      options: ['Bị từ chối', 'Được chèn vào branch nhưng không thấy khi select * from v', 'Chèn với branch_city = null', 'Chèn vào cả hai'],
      answer: 1,
      explain: 'PE 4.13 ý 3; with check option mới chặn.',
    },
    {
      q: 'User được grant select trên view v (định nghĩa trên r). User có cần quyền select trên r?',
      options: ['Có', 'Không — đó chính là lợi ích của view', 'Chỉ khi v là materialized', 'Chỉ với update'],
      answer: 1,
      explain: 'PE 4.13 ý 1.',
    },
    {
      q: 'Bảng manager(employee_ID PK, manager_ID FK → manager on delete cascade). Xoá một giám đốc cấp cao nhất thì?',
      options: ['Chỉ xoá giám đốc', 'Xoá giám đốc và nhân viên trực tiếp', 'Xoá toàn bộ nhân viên cấp dưới ở mọi cấp', 'Báo lỗi'],
      answer: 2,
      explain: 'PE 4.9: cascade lan dần theo từng cấp.',
    },
    {
      q: '`grant select on works to amit granted by current_role` khác gì so với không có mệnh đề granted by?',
      options: ['Không khác', 'Quyền gắn với role, còn hiệu lực khi người cấp bị xoá tài khoản', 'Amit được cấp lại quyền cho người khác', 'Chỉ áp dụng trong transaction hiện tại'],
      answer: 1,
      explain: 'PE 4.12.',
    },
    {
      q: 'Ràng buộc "instructor không dạy hai phòng khác nhau trong cùng time slot và học kỳ" — PostgreSQL hiện thực thế nào thay cho create assertion?',
      options: ['check với subquery', 'Trigger (hoặc truy vấn kiểm tra định kỳ)', 'unique', 'not null'],
      answer: 1,
      explain: 'PE 4.8: assertion và check có subquery không được hỗ trợ.',
    },
    {
      q: 'Vì sao test database cần có tuple ở referenced relation KHÔNG được tham chiếu (ví dụ department không có instructor)?',
      options: ['Để tăng tốc', 'Để phát hiện truy vấn quên outer join (department có 0 giảng viên bị mất)', 'Bắt buộc bởi SQL', 'Để kiểm tra primary key'],
      answer: 1,
      explain: 'PE 4.5b.',
    },
    {
      q: 'So với một ngôn ngữ lập trình, DDL của DBMS KHÔNG có đặc điểm nào sau đây?',
      options: ['Khai báo ràng buộc toàn vẹn (FK, check)', 'Tạo đối tượng tồn tại lâu dài trong database', 'Hệ kiểu phong phú hơn kiểu của Java/C++', 'Hỗ trợ phân quyền'],
      answer: 2,
      explain: 'PE 1.2: hệ kiểu của ngôn ngữ lập trình thường phong phú hơn SQL.',
    },
  ],

  questions: [
    {
      q: '(0,5đ) Cho bank database. (a) Chỉ ra primary key và mọi foreign key của borrower và depositor. (b) Cho một ví dụ insert và một ví dụ delete vi phạm FK depositor.account_number → account.',
      answer: `**(a)** borrower(**ID, loan_number**): FK ID → customer, loan_number → loan. depositor(**ID, account_number**): FK ID → customer, account_number → account. Khoá gồm cả hai cột vì quan hệ nhiều–nhiều (một khách nhiều tài khoản, tài khoản đứng tên chung).

**(b)** Insert \`('12345', 'A-999')\` vào depositor khi account không có A-999. Delete \`A-101\` khỏi account khi depositor còn \`('67890', 'A-101')\` (nếu FK không có on delete cascade).`,
    },
    {
      q: '(0,5đ) Viết đại số quan hệ trên bank database: (a) tên các branch ở thành phố Horseneck có assets > 1.000.000; (b) ID khách có loan ở **mọi** branch của thành phố Brooklyn.',
      answer: `**(a)** Π<sub>branch_name</sub>(σ<sub>branch_city = "Horseneck" ∧ assets > 1000000</sub>(branch))

**(b)** Dùng division: r ← Π<sub>ID, branch_name</sub>(borrower ⋈ loan), s ← Π<sub>branch_name</sub>(σ<sub>branch_city = "Brooklyn"</sub>(branch)); kết quả **r ÷ s**.

Không dùng ÷: Π<sub>ID</sub>(r) − Π<sub>ID</sub>((Π<sub>ID</sub>(r) × s) − r).`,
    },
    {
      q: '(0,5đ) Giải thích vì sao truy vấn sau cho kết quả sai khi một section chưa có sinh viên, và sửa lại: `select course_id, sec_id, count(*) from section natural join takes where semester = \'Fall\' and year = 2017 group by course_id, sec_id`.',
      answer: `**Lỗi:** inner join loại các section không có dòng takes → section 0 sinh viên **biến mất** (PE 3.1e). (Ngoài ra nếu đổi sang outer join thì phải dùng \`count(takes.ID)\`, không dùng \`count(*)\`.)

**Sửa 1 — scalar subquery:**
\`\`\`sql
select course_id, sec_id,
       (select count(ID) from takes t
        where t.course_id = s.course_id and t.sec_id = s.sec_id
          and t.semester = s.semester and t.year = s.year) as enrollment
from section s where semester = 'Fall' and year = 2017;
\`\`\`
**Sửa 2 — outer join:** \`section left outer join takes using (course_id, sec_id, semester, year)\` + \`count(takes.ID)\`.`,
    },
    {
      q: '(0,5đ) Viết DDL cho insurance database (person, car, accident, owns, participated) với đầy đủ primary key, foreign key. Khi xoá một car, ta muốn các dòng owns của xe đó bị xoá theo — khai báo thế nào?',
      answer: `\`\`\`sql
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
\`\`\`
**Ý chấm:** khoá kép của owns và participated; FK đủ chiều; \`on delete cascade\` đặt ở **owns.license_plate** (bảng referencing). Nếu participated không cascade, xoá xe đã gặp tai nạn sẽ bị từ chối — phải quyết định có giữ lịch sử tai nạn hay không.`,
    },
    {
      q: '(0,5đ) Định nghĩa view `customer_balance(ID, total_balance)` cho tổng số dư mỗi khách, **kể cả khách không có tài khoản (tổng = 0)**. View này có update được không? User chỉ có quyền select trên view thì có đọc được bảng account không?',
      answer: `\`\`\`sql
create view customer_balance (ID, total_balance) as
select c.ID, coalesce(sum(a.balance), 0)
from customer c left outer join depositor d on c.ID = d.ID
                left outer join account a on a.account_number = d.account_number
group by c.ID;
\`\`\`
**Ý chấm:** cần **left outer join** + \`coalesce\` (sum trên tập rỗng = null). View có join và aggregate nên **không** updatable. Quyền select trên view **không** cho đọc account (PE 4.13) — chỉ thấy dữ liệu đã tổng hợp.`,
    },
  ],

  exercises: [
    {
      id: 'GK4.01', topic: 'outer join + count', level: 2,
      prompt: 'Bank database. Với **mọi** branch: branch_name và số loan của branch đó (`num_loans`, bằng 0 nếu không có). Không dùng subquery.',
      hint: 'Biến thể PE 4.2d: left outer join + count(cột của loan).',
      solution: `select branch_name, count(loan_number) as num_loans
from branch natural left outer join loan
group by branch_name;`,
    },
    {
      id: 'GK4.02', topic: 'intersect', level: 1,
      prompt: 'ID các khách hàng **vừa** có account **vừa** có loan.',
      solution: `(select ID from depositor)
intersect
(select ID from borrower);`,
    },
    {
      id: 'GK4.03', topic: 'division (for all)', level: 3,
      prompt: 'ID và customer_name của khách có account ở **mọi** branch đặt tại thành phố `Brooklyn`.',
      hint: 'not exists ((branch ở Brooklyn) except (branch mà khách C có account)).',
      solution: `select C.ID, C.customer_name
from customer as C
where not exists (
  (select branch_name from branch where branch_city = 'Brooklyn')
  except
  (select a.branch_name
   from depositor d join account a on a.account_number = d.account_number
   where d.ID = C.ID));`,
    },
    {
      id: 'GK4.04', topic: 'with + max (ties)', level: 2,
      prompt: 'Branch có **tổng số tiền cho vay** (sum amount của loan) lớn nhất — nếu hoà thì trả về tất cả. Trả về branch_name và total_amount.',
      hint: 'Biến thể PE 3.1g.',
      solution: `with branch_total as (
  select branch_name, sum(amount) as total_amount
  from loan group by branch_name)
select branch_name, total_amount
from branch_total
where total_amount = (select max(total_amount) from branch_total);`,
    },
    {
      id: 'GK4.05', topic: 'having + subquery', level: 2,
      prompt: 'Các branch có **số dư trung bình** (avg balance của account) lớn hơn số dư trung bình của **toàn bộ** account. Trả về branch_name.',
      hint: 'Biến thể PE 3.9g.',
      solution: `select branch_name
from account
group by branch_name
having avg(balance) > (select avg(balance) from account);`,
    },
    {
      id: 'GK4.06', topic: 'correlated subquery', level: 2,
      prompt: 'Employee database. ID, person_name và salary của nhân viên có lương **cao hơn lương trung bình của chính công ty mình**.',
      solution: `select e.ID, e.person_name, w.salary
from employee e join works w on w.ID = e.ID
where w.salary > (select avg(w2.salary) from works w2
                  where w2.company_name = w.company_name);`,
    },
    {
      id: 'GK4.07', topic: 'update + case', level: 2,
      prompt: 'Nhân viên của `Mega Corp`: lương **dưới 50000** tăng 8%, còn lại tăng 4%. Viết **một** câu update (an toàn với thứ tự).',
      hint: 'Biến thể PE 3.10b.',
      solution: `update works
set salary = salary * (case when salary < 50000 then 1.08 else 1.04 end)
where company_name = 'Mega Corp';`,
      check: `select ID, salary from works where company_name = 'Mega Corp';`,
    },
    {
      id: 'GK4.08', topic: 'insert ... select', level: 3,
      prompt: `Mỗi khách có **loan ở branch \`Downtown\`** được mở một account mới tại Downtown: account_number là \`'A-9' || ID\`, balance 100; đồng thời thêm dòng depositor tương ứng.`,
      hint: 'Hai câu insert ... select: account trước (vì FK), depositor sau.',
      solution: `insert into account
select distinct 'A-9' || b.ID, 'Downtown', 100
from borrower b join loan l on l.loan_number = b.loan_number
where l.branch_name = 'Downtown';
insert into depositor
select distinct b.ID, 'A-9' || b.ID
from borrower b join loan l on l.loan_number = b.loan_number
where l.branch_name = 'Downtown';`,
      check: `select ID, account_number, balance
from depositor natural join account
where branch_name = 'Downtown';`,
    },
    {
      id: 'GK4.09', topic: 'view with check option', level: 2,
      prompt: 'Tạo view `brooklyn_branches` gồm mọi cột của branch ở thành phố `Brooklyn`, **with check option**.',
      solution: `create view brooklyn_branches as
  select * from branch where branch_city = 'Brooklyn'
  with check option;`,
      check: `select try_sql($$insert into brooklyn_branches values ('Bay Ridge', 'Brooklyn', 100000)$$) as insert_brooklyn,
       try_sql($$insert into brooklyn_branches values ('Harlem', 'New York', 100000)$$) as insert_other_city,
       sql_value('select count(*) from brooklyn_branches') as rows_in_view;`,
    },
    {
      id: 'GK4.10', topic: 'FK self cascade', level: 3,
      prompt: `Tạo bảng \`emp_tree(employee_id varchar(5) primary key, manager_id varchar(5))\` với manager_id là **foreign key tham chiếu chính emp_tree, on delete cascade**. Nạp mọi nhân viên của employee (manager_id lấy từ manages, null nếu không có quản lý), rồi **xoá nhân viên \`'10004'\`**.`,
      hint: 'Insert tất cả với manager_id null trước, rồi update từ manages — để FK không bị vi phạm khi chèn. Biến thể PE 4.9.',
      solution: `create table emp_tree (
  employee_id varchar(5) primary key,
  manager_id  varchar(5) references emp_tree (employee_id) on delete cascade);
insert into emp_tree select ID, null from employee;
update emp_tree t set manager_id = m.manager_id
from manages m where m.ID = t.employee_id;
delete from emp_tree where employee_id = '10004';`,
      check: `select employee_id, manager_id from emp_tree;`,
    },
    {
      id: 'GK4.11', topic: 'grant on view', level: 2,
      prompt: 'Tạo view `small_bank_staff(ID, person_name, city)` — nhân viên của `Small Bank Corporation`. Tạo role `hr_clerk`, cấp quyền **select trên view** (không cấp gì trên employee/works).',
      solution: `create view small_bank_staff (ID, person_name, city) as
  select e.ID, e.person_name, e.city
  from employee e join works w on w.ID = e.ID
  where w.company_name = 'Small Bank Corporation';
create role hr_clerk;
grant select on small_bank_staff to hr_clerk;`,
      check: `select has_table_privilege('hr_clerk', 'small_bank_staff', 'select') as view_select,
       has_table_privilege('hr_clerk', 'works', 'select') as works_select,
       (select count(*) from small_bank_staff) as staff;`,
    },
    {
      id: 'GK4.12', topic: 'RA → SQL', level: 1,
      prompt: 'Viết SQL cho Π<sub>ID</sub>(σ<sub>city = "Miami"</sub>(employee)) − Π<sub>ID</sub>(σ<sub>company_name = "First Bank Corporation"</sub>(works)).',
      solution: `(select ID from employee where city = 'Miami')
except
(select ID from works where company_name = 'First Bank Corporation');`,
    },
  ],
};
