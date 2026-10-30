export default {
  key: 'gk2',
  slug: 'gk2_pe_ch3',
  label: 'Ôn GK · Phần 2',
  navLabel: 'GK2',
  kind: 'Ôn tập',
  short: 'GK2',
  title: 'Practice Exercises — Chapter 3',
  titleVi: 'Practice Exercises Chương 3 (Introduction to SQL)',
  source: 'Practice Exercises 3.1–3.10 · Database System Concepts, 7th Ed.',

  summary: `
### Cách dùng phần này
Toàn bộ Practice Exercises Chương 3 (3.1–3.10, mọi câu a, b, c…) đều có bài SQL **tự chấm** trên dữ liệu mẫu: University, Employee database (Figure 3.19), Bank database (Figure 3.18), Insurance database (Figure 3.17), \`grade_points\`, \`marks\`. Xem cột/khoá ở *Công cụ › Lược đồ cơ sở dữ liệu*. Mỗi bài ghi rõ số PE của sách.

| PE | Nội dung | Bài SQL | Tự luận |
|---|---|---|---|
| 3.1 a–g | University: credits, Einstein, max salary, enrollment | GK2.01–GK2.08 | Câu 1 |
| 3.2 a–d | grade_points, tổng điểm, GPA, null grade | GK2.09–GK2.13 | Câu 2 |
| 3.3 a–c | update / delete / insert … select | GK2.14–GK2.16 | — |
| 3.4 a–b | Insurance database | GK2.17–GK2.18 | — |
| 3.5 a–b | \`case\` chấm điểm theo marks | GK2.19–GK2.20 | — |
| 3.6 | \`lower(...) like\` | GK2.21–GK2.22 | — |
| 3.7 | \`from p, r1, r2 where ... or ...\` khi r1/r2 rỗng | GK2.23 | Câu 3 |
| 3.8 a–c | Bank database | GK2.24–GK2.26 | — |
| 3.9 a–g | Employee database: all, not exists/except, having | GK2.27–GK2.33 | — |
| 3.10 a–b | update, \`case\` trong update | GK2.34–GK2.36 | — |

### Mẫu câu hay thi
| Yêu cầu trong đề | Mẫu SQL |
|---|---|
| "Find all ... earning the highest" | \`where salary = (select max(salary) from ...)\` |
| "... of each section, show 0 if none" | **scalar subquery** \`(select count(*) ... where ... = section....)\` hoặc outer join (Ch.4) |
| "maximum of an aggregate" | \`select max(x) from (select ... count(...) as x ... group by ...) t\` hoặc \`with\` |
| "the ... that had the maximum ..." | \`with t as (...) select ... from t where x = (select max(x) from t)\` |
| "more than every ..." | \`> all (subquery)\` |
| "located in every city where ..." | \`not exists ((A) except (B))\` |
| "the company with the most employees (ties)" | \`having count(...) >= all (select count(...) ... group by ...)\` |
| "average higher than ..." | \`group by ... having avg(...) > (select avg(...) ...)\` |
| "has X but not Y" | \`(select ...) except (select ...)\` |
| "case-insensitive" | \`lower(col) like '%sci%'\` |
| "raise 10% unless ..., then 3%" | **một** \`update ... set x = x * case when ... then 1.03 else 1.1 end\` |

### Bẫy thường gặp
- **count(*) vs count(col)**: với outer join, \`count(*)\` đếm cả dòng null → section không có ai vẫn ra 1.
- **Join + group by làm mất nhóm rỗng** (PE 3.1e): section không có sinh viên không có dòng nào để group.
- **Aggregate trên tập rỗng**: \`count\` → 0, nhưng \`sum/max/avg\` → **null**; max của kết quả rỗng là *rỗng*, không phải 0 (PE 3.1f).
- **Chia cho 0** khi tính GPA của sinh viên chưa học môn nào (PE 3.2b) → GPA nên là null.
- **null grade** tự bị loại bởi điều kiện \`takes.grade = grade_points.grade\` (PE 3.2d) — cả credits lẫn points của môn đó đều không được tính.
- **Cartesian product với bảng rỗng là rỗng** (PE 3.7): \`from p, r1, r2\` trả về rỗng nếu r1 *hoặc* r2 rỗng, dù điều kiện là \`or\`.
- **Đếm người, không đếm sự kiện** (PE 3.4a): \`count(distinct ...)\`; và đề hỏi **chủ xe** (owns), không phải **người lái** (participated.driver_id).
- **Thứ tự hai lệnh update** (PE 3.10b): làm 10% trước rồi 3% sẽ tăng lương hai lần cho một số người.
- Schema mẫu có \`check (salary > 29000)\` trên instructor → lệnh của PE 3.3c (salary 10000) bị **từ chối** (SQLSTATE 23514).
- Lời giải sách PE 3.8b viết \`S.customer_id\` — cột đúng là \`S.ID\`.
`,

  quiz: [],

  questions: [
    {
      pe: '3.1e',
      q: '**PE 3.1e** — Câu trả lời của sách dùng scalar subquery. Vì sao cách viết `section, takes ... group by` "trông có vẻ đúng" lại sai? Sửa thế nào?',
      answer: `Cách join rồi group by:

\`\`\`sql
select takes.course_id, takes.sec_id, count(ID)
from section, takes
where takes.course_id = section.course_id and takes.sec_id = section.sec_id
  and takes.semester = section.semester and takes.year = section.year
  and takes.semester = 'Fall' and takes.year = 2017
group by takes.course_id, takes.sec_id
\`\`\`

Section **không có sinh viên** sẽ không có dòng nào trong join nên **không xuất hiện** (lẽ ra phải có enrollment 0). Sửa: dùng scalar subquery (count trên tập rỗng = 0) như lời giải, hoặc \`section left outer join takes\` với \`count(takes.ID)\` (Chương 4). Bài GK2.06 kiểm tra đúng tình huống này.`,
    },
    {
      pe: '3.2d',
      q: '**PE 3.2d** — Nếu một số grade là null, các lời giải ở 3.2 còn đúng không?',
      answer: `**Vẫn đúng.** Mọi truy vấn đều có điều kiện \`takes.grade = grade_points.grade\`; với grade null, so sánh cho *unknown* nên dòng takes đó bị loại **trước khi** aggregate — cả points lẫn **credits** của môn đó đều không được cộng. Vì vậy GPA chỉ tính trên các môn đã có điểm. (Nếu dùng outer join với grade_points thì phải tự loại credits của môn có grade null — xem PE 4.6.)`,
    },
    {
      pe: '3.7',
      q: '**PE 3.7** — Với `select p.a1 from p, r1, r2 where p.a1 = r1.a1 or p.a1 = r2.a1`, khi nào câu truy vấn chọn đúng các giá trị p.a1 nằm trong r1 hoặc r2? Xét kỹ trường hợp r1 hoặc r2 rỗng.',
      answer: `Câu truy vấn chọn đúng các p.a1 bằng một giá trị nào đó của r1.a1 hoặc r2.a1 **khi và chỉ khi cả r1 và r2 đều khác rỗng**. Nếu r1 hoặc r2 (hoặc p) rỗng thì tích Descartes p × r1 × r2 rỗng → kết quả rỗng, dù điều kiện dùng \`or\`.

Cách viết đúng: \`select a1 from p where a1 in (select a1 from r1) or a1 in (select a1 from r2)\` hoặc \`select a1 from p where a1 in (select a1 from r1 union select a1 from r2)\` (bài GK2.23). Ngoài ra bản gốc còn trả về **trùng lặp** (mỗi cặp khớp một dòng).`,
    },
  ],

  exercises: [
    {
      id: 'GK2.01', topic: 'PE 3.1a where', level: 1,
      pe: '3.1a',
      prompt: '**PE 3.1a** — Title các course của khoa Comp. Sci. có 3 credits.',
      solution: `select title from course where dept_name = 'Comp. Sci.' and credits = 3;`,
    },
    {
      id: 'GK2.02', topic: 'PE 3.1b join, distinct', level: 1,
      pe: '3.1b',
      prompt: '**PE 3.1b** — ID của mọi sinh viên được dạy bởi một instructor tên Einstein, **không trùng lặp**.',
      hint: 'takes khớp teaches trên (course_id, sec_id, semester, year); teaches.ID = instructor.ID.',
      solution: `select distinct takes.ID
from takes, instructor, teaches
where takes.course_id = teaches.course_id
  and takes.sec_id = teaches.sec_id
  and takes.semester = teaches.semester
  and takes.year = teaches.year
  and teaches.ID = instructor.ID
  and instructor.name = 'Einstein';`,
    },
    {
      id: 'GK2.03', topic: 'PE 3.1c max', level: 1,
      pe: '3.1c',
      prompt: '**PE 3.1c** — Lương cao nhất của một instructor.',
      solution: `select max(salary) from instructor;`,
    },
    {
      id: 'GK2.04', topic: 'PE 3.1d subquery', level: 1,
      pe: '3.1d',
      prompt: '**PE 3.1d** — ID, name của mọi instructor có lương cao nhất (có thể nhiều người).',
      solution: `select ID, name from instructor where salary = (select max(salary) from instructor);`,
    },
    {
      id: 'GK2.05', topic: 'PE 3.1e scalar subquery', level: 2,
      pe: '3.1e',
      prompt: '**PE 3.1e** — Enrollment (số sinh viên) của mỗi section mở ở Fall 2017: course_id, sec_id, enrollment. Section không có sinh viên phải có enrollment 0.',
      hint: 'Scalar subquery trong select.',
      solution: `select course_id, sec_id,
       (select count(ID) from takes
        where takes.year = section.year and takes.semester = section.semester
          and takes.course_id = section.course_id and takes.sec_id = section.sec_id) as enrollment
from section
where semester = 'Fall' and year = 2017;`,
    },
    {
      id: 'GK2.06', topic: 'PE 3.1e empty section', level: 2,
      pe: '3.1e',
      prompt: '**PE 3.1e (bẫy section rỗng)** — Tạo view `gk_fall2017_enrollment(course_id, sec_id, enrollment)` chứa enrollment của mỗi section Fall 2017. Khi chấm, hệ thống **thêm một section Fall 2017 không có sinh viên** rồi đọc view: section đó phải có enrollment 0.',
      hint: 'Cách join + group by sẽ làm mất section mới.',
      solution: `create view gk_fall2017_enrollment (course_id, sec_id, enrollment) as
select course_id, sec_id,
       (select count(ID) from takes
        where takes.year = section.year and takes.semester = section.semester
          and takes.course_id = section.course_id and takes.sec_id = section.sec_id)
from section
where semester = 'Fall' and year = 2017;`,
      check: `insert into section values ('CS-190', '3', 'Fall', 2017, 'Taylor', '3128', 'B');
select * from gk_fall2017_enrollment;`,
    },
    {
      id: 'GK2.07', topic: 'PE 3.1f max of aggregate', level: 2,
      pe: '3.1f',
      prompt: '**PE 3.1f** — Enrollment **lớn nhất** trên mọi section ở Fall 2017 (một giá trị).',
      solution: `select max(enrollment)
from (select count(ID) as enrollment
      from section, takes
      where takes.year = section.year and takes.semester = section.semester
        and takes.course_id = section.course_id and takes.sec_id = section.sec_id
        and takes.semester = 'Fall' and takes.year = 2017
      group by takes.course_id, takes.sec_id) as t;`,
    },
    {
      id: 'GK2.08', topic: 'PE 3.1g with', level: 2,
      pe: '3.1g',
      prompt: '**PE 3.1g** — Các section (course_id, sec_id) có enrollment lớn nhất ở Fall 2017. Dùng `with`.',
      solution: `with sec_enrollment as (
  select takes.course_id, takes.sec_id, count(ID) as enrollment
  from section, takes
  where takes.year = section.year and takes.semester = section.semester
    and takes.course_id = section.course_id and takes.sec_id = section.sec_id
    and takes.semester = 'Fall' and takes.year = 2017
  group by takes.course_id, takes.sec_id)
select course_id, sec_id
from sec_enrollment
where enrollment = (select max(enrollment) from sec_enrollment);`,
    },
    {
      id: 'GK2.09', topic: 'PE 3.2a grade points', level: 2,
      pe: '3.2a',
      prompt: '**PE 3.2a** — Tổng grade points (credits × points) mà sinh viên `12345` đạt được qua mọi course đã học. Bảng `grade_points(grade, points)` có sẵn.',
      solution: `select sum(credits * points)
from takes, course, grade_points
where takes.grade = grade_points.grade
  and takes.course_id = course.course_id
  and ID = '12345';`,
    },
    {
      id: 'GK2.10', topic: 'PE 3.2b GPA', level: 2,
      pe: '3.2b',
      prompt: '**PE 3.2b** — GPA của sinh viên `12345`: tổng grade points chia tổng credits của các course tương ứng. Đặt tên cột `GPA`.',
      solution: `select sum(credits * points) / sum(credits) as GPA
from takes, course, grade_points
where takes.grade = grade_points.grade
  and takes.course_id = course.course_id
  and ID = '12345';`,
    },
    {
      id: 'GK2.11', topic: 'PE 3.2c group by', level: 2,
      pe: '3.2c',
      prompt: '**PE 3.2c** — ID và GPA của mỗi sinh viên (chỉ những sinh viên có ít nhất một môn đã có điểm).',
      solution: `select ID, sum(credits * points) / sum(credits) as GPA
from takes, course, grade_points
where takes.grade = grade_points.grade
  and takes.course_id = course.course_id
group by ID;`,
    },
    {
      id: 'GK2.12', topic: 'PE 3.2c union null', level: 3,
      pe: '3.2c',
      prompt: '**PE 3.2c (đầy đủ)** — Như GK2.11 nhưng sinh viên **chưa học môn nào** cũng xuất hiện với GPA = null. Không dùng outer join (dùng `union` như lời giải sách).',
      solution: `select ID, sum(credits * points) / sum(credits) as GPA
from takes, course, grade_points
where takes.grade = grade_points.grade
  and takes.course_id = course.course_id
group by ID
union
select ID, null
from student
where not exists (select * from takes where takes.ID = student.ID);`,
    },
    {
      id: 'GK2.13', topic: 'PE 3.2d null grade', level: 3,
      pe: '3.2d',
      prompt: '**PE 3.2d** — Sinh viên `98988` (Tanaka) có một môn **chưa có điểm** (grade null). Trả về **hai cột**: `naive_gpa` = sum(credits × points) / sum(credits) tính trên `takes natural join course left join grade_points using (grade)` (không lọc gì), và `correct_gpa` = GPA chỉ tính các môn đã có điểm.',
      hint: 'Ở cách naive, credits của môn null vẫn bị cộng vào mẫu số (vì sum(credits) không bỏ qua dòng có points null). Dùng case when grade is null then 0 else credits end.',
      solution: `select sum(credits * points) / sum(credits) as naive_gpa,
       sum(credits * points) / sum(case when grade is null then 0 else credits end) as correct_gpa
from takes natural join course left join grade_points using (grade)
where ID = '98988';`,
    },
    {
      id: 'GK2.14', topic: 'PE 3.3a update', level: 1,
      pe: '3.3a',
      prompt: '**PE 3.3a** — Tăng 10% lương của mỗi instructor khoa Comp. Sci.',
      solution: `update instructor set salary = salary * 1.10 where dept_name = 'Comp. Sci.';`,
      check: `select ID, salary from instructor order by ID;`,
    },
    {
      id: 'GK2.15', topic: 'PE 3.3b delete', level: 1,
      pe: '3.3b',
      prompt: '**PE 3.3b** — Xoá mọi course chưa bao giờ được mở (không xuất hiện trong section).',
      solution: `delete from course where course_id not in (select course_id from section);`,
      check: `select course_id from course order by course_id;`,
    },
    {
      id: 'GK2.16', topic: 'PE 3.3c insert select', level: 2,
      pe: '3.3c',
      prompt: '**PE 3.3c** — Chèn mọi student có `tot_cred > 100` làm instructor cùng khoa. Sách dùng lương 10000, nhưng schema có `check (salary > 29000)` nên lệnh đó bị từ chối (23514) — hãy dùng lương **30000**.',
      solution: `insert into instructor
select ID, name, dept_name, 30000
from student
where tot_cred > 100;`,
      check: `select ID, name, dept_name, salary from instructor where salary = 30000 order by ID;`,
    },
    {
      id: 'GK2.17', topic: 'PE 3.4a count distinct', level: 2,
      pe: '3.4a',
      prompt: '**PE 3.4a** (Insurance database) — Tổng số người **sở hữu** xe có dính tai nạn năm 2017.',
      hint: 'accident → participated → owns (theo license_plate); count(distinct ...).',
      solution: `select count(distinct owns.driver_id)
from accident, participated, owns
where accident.report_number = participated.report_number
  and owns.license_plate = participated.license_plate
  and accident.year = 2017;`,
    },
    {
      id: 'GK2.18', topic: 'PE 3.4b delete in', level: 2,
      pe: '3.4b',
      prompt: '**PE 3.4b** — Xoá mọi xe đời 2010 thuộc về người có driver_id `12345`. (owns và participated khai báo `on delete cascade` tới car.)',
      solution: `delete from car
where year = 2010
  and license_plate in (select license_plate from owns where driver_id = '12345');`,
      check: `select license_plate, year,
       (select count(*) from owns o where o.license_plate = car.license_plate) as num_owners
from car order by license_plate;`,
    },
    {
      id: 'GK2.19', topic: 'PE 3.5a case', level: 1,
      pe: '3.5a',
      prompt: '**PE 3.5a** — Hiển thị ID và grade của mỗi sinh viên trong `marks(ID, score)`: F nếu score < 40, C nếu 40 ≤ score < 60, B nếu 60 ≤ score < 80, A nếu score ≥ 80.',
      solution: `select ID,
       case
         when score < 40 then 'F'
         when score < 60 then 'C'
         when score < 80 then 'B'
         else 'A'
       end as grade
from marks;`,
    },
    {
      id: 'GK2.20', topic: 'PE 3.5b group by case', level: 2,
      pe: '3.5b',
      prompt: '**PE 3.5b** — Số sinh viên đạt mỗi grade (grade, count).',
      solution: `with grades as (
  select ID,
         case
           when score < 40 then 'F'
           when score < 60 then 'C'
           when score < 80 then 'B'
           else 'A'
         end as grade
  from marks)
select grade, count(ID)
from grades
group by grade;`,
    },
    {
      id: 'GK2.21', topic: 'PE 3.6 lower like', level: 1,
      pe: '3.6',
      prompt: '**PE 3.6** — Tên các department có chứa chuỗi `sci` (không phân biệt hoa thường).',
      solution: `select dept_name from department where lower(dept_name) like '%sci%';`,
    },
    {
      id: 'GK2.22', topic: 'PE 3.6 lower like', level: 1,
      pe: '3.6',
      prompt: '**PE 3.6 (biến thể)** — Title các course chứa chuỗi `INTRO` không phân biệt hoa thường. (Thử `like \'%INTRO%\'` trước để thấy like phân biệt hoa thường.)',
      solution: `select title from course where lower(title) like '%intro%';`,
    },
    {
      id: 'GK2.23', topic: 'PE 3.7 empty relation', level: 3,
      pe: '3.7',
      prompt: '**PE 3.7** — Tạo bảng `gk_p(a1 int)` = {1, 2, 3}, `gk_r1(a1 int)` = {1, 2} và `gk_r2(a1 int)` **rỗng**. Câu của sách `select gk_p.a1 from gk_p, gk_r1, gk_r2 where gk_p.a1 = gk_r1.a1 or gk_p.a1 = gk_r2.a1` trả về rỗng. Viết câu **đúng** trả về các giá trị của gk_p có trong gk_r1 hoặc gk_r2.',
      hint: 'in (select ... union select ...).',
      solution: `create table gk_p (a1 int);
create table gk_r1 (a1 int);
create table gk_r2 (a1 int);
insert into gk_p values (1), (2), (3);
insert into gk_r1 values (1), (2);
select a1 from gk_p
where a1 in (select a1 from gk_r1 union select a1 from gk_r2);`,
    },
    {
      id: 'GK2.24', topic: 'PE 3.8a except', level: 1,
      pe: '3.8a',
      prompt: '**PE 3.8a** (Bank database) — ID của mỗi khách hàng có account nhưng **không** có loan.',
      solution: `(select ID from depositor)
except
(select ID from borrower);`,
    },
    {
      id: 'GK2.25', topic: 'PE 3.8b self join', level: 2,
      pe: '3.8b',
      prompt: '**PE 3.8b** — ID của mỗi khách hàng sống **cùng street và cùng city** với khách hàng `12345` (kể cả chính 12345). Lưu ý: lời giải sách viết `S.customer_id` — cột đúng là `ID`.',
      solution: `select F.ID
from customer as F, customer as S
where F.customer_street = S.customer_street
  and F.customer_city = S.customer_city
  and S.ID = '12345';`,
    },
    {
      id: 'GK2.26', topic: 'PE 3.8c join', level: 2,
      pe: '3.8c',
      prompt: '**PE 3.8c** — Tên mỗi branch có ít nhất một khách hàng có account ở đó và sống ở Harrison.',
      solution: `select distinct branch_name
from account, depositor, customer
where customer.ID = depositor.ID
  and depositor.account_number = account.account_number
  and customer_city = 'Harrison';`,
    },
    {
      id: 'GK2.27', topic: 'PE 3.9a join', level: 1,
      pe: '3.9a',
      prompt: '**PE 3.9a** (Employee database) — ID, tên và thành phố cư trú của mỗi nhân viên làm cho First Bank Corporation.',
      solution: `select e.ID, e.person_name, e.city
from employee as e, works as w
where w.company_name = 'First Bank Corporation' and w.ID = e.ID;`,
    },
    {
      id: 'GK2.28', topic: 'PE 3.9b in', level: 1,
      pe: '3.9b',
      prompt: '**PE 3.9b** — ID, tên, thành phố của mỗi nhân viên làm cho First Bank Corporation **và** có lương > 10000.',
      solution: `select ID, person_name, city
from employee
where ID in (select ID from works
             where company_name = 'First Bank Corporation' and salary > 10000);`,
    },
    {
      id: 'GK2.29', topic: 'PE 3.9c not in', level: 2,
      pe: '3.9c',
      prompt: '**PE 3.9c** — ID của mỗi nhân viên **không** làm cho First Bank Corporation, kể cả người không có trong works.',
      hint: 'company_name <> ... trên works sẽ bỏ sót người không có trong works.',
      solution: `select ID from employee
where ID not in (select ID from works where company_name = 'First Bank Corporation');`,
    },
    {
      id: 'GK2.30', topic: 'PE 3.9d > all', level: 2,
      pe: '3.9d',
      prompt: '**PE 3.9d** — ID của mỗi nhân viên có lương cao hơn **mọi** nhân viên của Small Bank Corporation.',
      solution: `select ID from works
where salary > all (select salary from works where company_name = 'Small Bank Corporation');`,
    },
    {
      id: 'GK2.31', topic: 'PE 3.9e not exists except', level: 3,
      pe: '3.9e',
      prompt: '**PE 3.9e** — Một công ty có thể đặt ở nhiều thành phố (`company(company_name, city)`). Tên mỗi công ty đặt ở **mọi** thành phố mà Small Bank Corporation có mặt.',
      solution: `select distinct S.company_name
from company as S
where not exists ((select city from company where company_name = 'Small Bank Corporation')
                  except
                  (select city from company as T where S.company_name = T.company_name));`,
    },
    {
      id: 'GK2.32', topic: 'PE 3.9f having >= all', level: 3,
      pe: '3.9f',
      prompt: '**PE 3.9f** — Tên công ty có **nhiều nhân viên nhất** (trả về tất cả nếu hoà).',
      solution: `select company_name
from works
group by company_name
having count(distinct ID) >= all (select count(distinct ID) from works group by company_name);`,
    },
    {
      id: 'GK2.33', topic: 'PE 3.9g having avg', level: 2,
      pe: '3.9g',
      prompt: '**PE 3.9g** — Tên mỗi công ty có lương trung bình của nhân viên **cao hơn** lương trung bình ở First Bank Corporation.',
      solution: `select company_name
from works
group by company_name
having avg(salary) > (select avg(salary) from works where company_name = 'First Bank Corporation');`,
    },
    {
      id: 'GK2.34', topic: 'PE 3.10a update', level: 1,
      pe: '3.10a',
      prompt: '**PE 3.10a** — Nhân viên có ID `12345` nay sống ở Newtown.',
      solution: `update employee set city = 'Newtown' where ID = '12345';`,
      check: `select ID, city from employee order by ID;`,
    },
    {
      id: 'GK2.35', topic: 'PE 3.10b update case', level: 3,
      pe: '3.10b',
      prompt: '**PE 3.10b** — Tăng 10% lương cho mỗi **manager** (xuất hiện trong `manages.manager_id`) làm cho First Bank Corporation, trừ khi lương sau khi tăng vượt 100000 — khi đó chỉ tăng 3%. Viết **một** lệnh update dùng `case`.',
      solution: `update works as T
set salary = T.salary * (case when T.salary * 1.1 > 100000 then 1.03 else 1.1 end)
where T.ID in (select manager_id from manages)
  and T.company_name = 'First Bank Corporation';`,
      check: `select ID, salary from works order by ID;`,
    },
    {
      id: 'GK2.36', topic: 'PE 3.10b two updates', level: 3,
      pe: '3.10b',
      prompt: '**PE 3.10b (hai lệnh)** — Viết lại GK2.35 bằng **hai** lệnh update không dùng case, theo **đúng thứ tự** để không ai bị tăng hai lần. Kết quả phải giống GK2.35.',
      hint: 'Lệnh 3% (salary * 1.1 > 100000) chạy trước.',
      solution: `update works as T
set salary = T.salary * 1.03
where T.ID in (select manager_id from manages)
  and T.salary * 1.1 > 100000
  and T.company_name = 'First Bank Corporation';
update works as T
set salary = T.salary * 1.1
where T.ID in (select manager_id from manages)
  and T.salary * 1.1 <= 100000
  and T.company_name = 'First Bank Corporation';`,
      check: `select ID, salary from works order by ID;`,
    },
  ],
};
