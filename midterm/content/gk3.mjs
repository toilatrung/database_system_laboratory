export default {
  key: 'gk3',
  slug: 'gk3_pe_ch4',
  label: 'Ôn GK · Phần 3',
  navLabel: 'GK3',
  kind: 'Ôn tập',
  short: 'GK3',
  title: 'Practice Exercises — Chapter 4',
  titleVi: 'Practice Exercises Chương 4 (Intermediate SQL)',
  source: 'Practice Exercises 4.1–4.13 · Database System Concepts, 7th Ed.',

  summary: `
### Cách dùng phần này
Toàn bộ Practice Exercises Chương 4 (4.1–4.13). Nhiều câu Chương 4 hỏi về **trường hợp biên** (section không có giảng viên, khoa không có giảng viên, giá trị null…) mà dữ liệu mẫu không có sẵn. Vì vậy một số bài yêu cầu bạn **tạo view** với tên cho trước; khi chấm, hệ thống **chèn thêm dữ liệu biên** rồi mới đọc view — câu sai (ví dụ dùng inner join, \`count(*)\`) sẽ lộ ra ngay.

| PE | Nội dung | Bài SQL | Tự luận |
|---|---|---|---|
| 4.1 | Lỗi natural join qua dept_name | GK3.01 | Câu 1 |
| 4.2 a–d | Outer join, scalar subquery, coalesce, đếm 0 | GK3.02–GK3.05 | — |
| 4.3 a–b | Viết outer join không dùng outer join | GK3.06–GK3.07 | — |
| 4.4 a–b | Thứ tự left outer join và null | GK3.08 | Câu 2 |
| 4.5 a–c | Thiết kế dữ liệu test cho truy vấn | GK3.09 | Câu 3 |
| 4.6 | View student_grades xử lý null | GK3.10 | — |
| 4.7 | DDL + referential integrity cho Employee database | GK3.11 | — |
| 4.8 a–b | Giảng viên dạy 2 phòng cùng time slot; assertion | GK3.12 | Câu 4 |
| 4.9 | Foreign key tự tham chiếu + on delete cascade | GK3.13 | Câu 5 |
| 4.10 | natural full outer join bằng \`on\` + coalesce | GK3.14 | — |
| 4.11 | Vì sao DB có nhiều loại quyền | — | Câu 6 |
| 4.12 | \`granted by current_role\` | — | Câu 7 |
| 4.13 | Quyền trên view; insert qua view mà không thấy | GK3.15–GK3.16 | Câu 8 |

### Outer join — cheat sheet
| Yêu cầu | Mẫu |
|---|---|
| Đếm, hiện 0 cho nhóm rỗng | \`r left outer join s ... group by ... count(s.col)\` — **không** \`count(*)\` |
| Đếm không dùng outer join | scalar subquery \`(select count(*) from s where s.k = r.k)\` |
| Thay null bằng ký hiệu | \`coalesce(name, '-')\` (Oracle: \`decode(name, null, '-', name)\`) |
| r ⟕ s không dùng outer join | \`r ⋈ s union (r không khớp, null cho các cột của s)\` với \`not exists\` |
| r ⟗ s | r ⋈ s ∪ (r không khớp) ∪ (s không khớp) |
| natural full outer join bằng \`on\` | \`coalesce(a.k, b.k) as k\` cho cột chung |

**Chọn cột để count:** cột của bảng bên phải mà **không** có ở bảng bên trái (ví dụ \`sec_id\` của teaches) — cột chung như \`ID\` không bao giờ null trong natural left outer join.

### Ràng buộc & quyền
- Foreign key tự tham chiếu + \`on delete cascade\` → xoá **dây chuyền** toàn bộ cây cấp dưới (PE 4.9).
- \`create assertion\` có trong chuẩn SQL nhưng **không DBMS phổ biến nào hỗ trợ** (PE 4.8b) → dùng trigger hoặc truy vấn kiểm tra.
- Quyền trên view **không** cần quyền select trên bảng gốc → che giấu một phần dữ liệu (PE 4.13).
- Insert qua view có thể tạo tuple **không nhìn thấy** qua view (không thoả where) — trừ khi \`with check option\`.
- \`granted by current_role\`: quyền gắn với **role**, vẫn còn khi tài khoản người cấp bị xoá (PE 4.12).

### Bẫy & lỗi trong lời giải sách
- PE 4.1: \`instructor natural join teaches natural join section natural join course\` ghép thêm theo **dept_name** (instructor và course đều có) → mất các môn giảng viên dạy ngoài khoa mình.
- PE 4.2a: dùng \`count(*)\` sẽ cho 1 thay vì 0.
- PE 4.6: sách dùng \`decode\` (Oracle) → PostgreSQL dùng \`case\`.
- PE 4.7: lời giải viết \`manager_iid\` — là lỗi gõ của \`manager_id\`.
- PE 4.8a: \`count(distinct building, room_number)\` không hợp lệ trong PostgreSQL → \`count(distinct (building, room_number))\`. Ngoài ra lời giải group by cả \`sec_id\` — mỗi section chỉ có một phòng nên **không bao giờ** phát hiện được vi phạm; phải bỏ sec_id khỏi group by.
`,

  quiz: [],

  questions: [
    {
      pe: '4.1',
      q: '**PE 4.1** — Truy vấn `select name, title from instructor natural join teaches natural join section natural join course where semester = \'Spring\' and year = 2017` muốn liệt kê title của mọi course dạy ở Spring 2017 cùng tên instructor. Sai ở đâu?',
      answer: `Cú pháp đúng nhưng **ý nghĩa sai**: \`dept_name\` là attribute của cả **course** và **instructor**, nên natural join ghép thêm điều kiện instructor.dept_name = course.dept_name. Kết quả chỉ còn các trường hợp giảng viên dạy môn **thuộc khoa của mình**. Sửa: \`instructor natural join teaches natural join section join course using (course_id)\` (bài GK3.01).`,
    },
    {
      pe: '4.4',
      q: '**PE 4.4** — r(A, B), s(B, C), t(B, D), mọi attribute not null. (a) Cho instance để trong (r natural left outer join s) natural left outer join t, C null nhưng D khác null. (b) Có instance nào để r natural left outer join (s natural left outer join t) có C null mà D khác null không?',
      answer: `a. r = {(a, b)}, s = {(b1, c1)}, t = {(b, d)}. r ⟕ s = (a, b, null) vì không có s với B = b; rồi ⟕ t khớp B = b → **(a, b, null, d)**.

b. **Không.** s ⟕ t được tính trước; s không có null nên mọi dòng của nó có C khác null (D có thể null). Khi ghép r ⟕ (…): dòng r khớp thì C lấy từ s (khác null); dòng r không khớp thì **cả C lẫn D** đều null. Vậy không thể có C null mà D khác null. (Bài GK3.08.)`,
    },
    {
      pe: '4.5',
      q: '**PE 4.5** — Kiểm thử truy vấn SQL: (a) cho dataset bắt được lỗi natural join instructor–teaches–course của Section 4.1.1; (b) vì sao dữ liệu test cần tuple ở referenced relation không có tuple tham chiếu tới nó; (c) vì sao cần tuple có foreign key **null** (nếu cột cho phép)?',
      answer: `a. Một giảng viên Physics dạy môn Elec. Eng.:
- instructor = {(12345, 'Gauss', 'Physics', 10000)}
- teaches = {(12345, 'EE321', 1, 'Spring', 2017)}
- course = {('EE321', 'Magnetism', 'Elec. Eng.', 6)}

Natural join ba bảng ra **rỗng** (dept_name khác nhau) trong khi kết quả đúng có một dòng. (Bài GK3.09.)

b. Ví dụ PE 4.2a: giảng viên **chưa dạy section nào** phải hiện số section 0. Nếu mọi instructor đều có trong teaches, câu sai dùng inner join (hoặc count(*)) vẫn cho kết quả đúng → không phát hiện được lỗi.

c. Ví dụ \`select * from teaches natural join instructor\`: nếu teaches.ID được phép null và có tuple như vậy thì join làm **mất** các section đó. Nếu chỉ vì teaches.ID là foreign key mà ta không tạo tuple null, lỗi này không bao giờ lộ ra khi test.`,
    },
    {
      pe: '4.8',
      q: '**PE 4.8** — Ràng buộc: một instructor không thể dạy các section ở **hai phòng khác nhau** trong cùng semester, cùng time slot. (a) Viết truy vấn trả về các (instructor, section) vi phạm. (b) Viết assertion ép ràng buộc này.',
      answer: `a. Lời giải sách:
\`\`\`sql
select ID, name, sec_id, semester, year, time_slot_id, count(distinct building, room_number)
from instructor natural join teaches natural join section
group by (ID, name, sec_id, semester, year, time_slot_id)
having count(building, room_number) > 1
\`\`\`
\`distinct\` cần thiết để hai section dạy **cùng phòng** cùng lúc (ghép lớp) không bị báo vi phạm. Tuy nhiên có hai vấn đề: PostgreSQL không cho \`count(distinct a, b)\` → viết \`count(distinct (building, room_number))\`; và group by **sec_id** khiến mỗi nhóm chỉ là một section (một phòng) nên không bao giờ > 1. Bản đúng:
\`\`\`sql
select ID, name, semester, year, time_slot_id, count(distinct (building, room_number)) as num_rooms
from instructor natural join teaches natural join section
group by ID, name, semester, year, time_slot_id
having count(distinct (building, room_number)) > 1;
\`\`\`
b. \`create assertion check not exists (<truy vấn trên>)\`. Assertion có trong chuẩn SQL nhưng **không** DBMS phổ biến nào hỗ trợ → trong thực tế dùng trigger trên teaches/section. (Bài GK3.12.)`,
    },
    {
      pe: '4.9',
      q: '**PE 4.9** — Cho bảng manager(employee_ID, manager_ID) với foreign key (manager_ID) references manager(employee_ID) on delete cascade. Giải thích chính xác điều gì xảy ra khi xoá một tuple.',
      answer: `**Toàn bộ nhân viên dưới quyền manager đó, ở mọi cấp, đều bị xoá.** Xoá tuple ban đầu kích hoạt xoá các tuple của nhân viên **trực tiếp** (manager_ID = người bị xoá); các lần xoá này lại kích hoạt xoá nhân viên cấp hai, và cứ thế cho tới khi hết nhân viên trực tiếp lẫn gián tiếp. (Bài GK3.13.)`,
    },
    {
      pe: '4.11',
      q: '**PE 4.11** — Hệ điều hành thường chỉ có quyền read và write trên file. Vì sao database có nhiều loại quyền?',
      answer: `Có nhiều lý do, ví dụ:
- Cho user chỉ **thêm** dữ liệu mới (insert) mà không sửa dữ liệu cũ.
- Cho user truy cập relation nhưng **không đổi schema** (alter, drop).
- Hạn chế những thao tác không hẳn là truy cập dữ liệu nhưng ảnh hưởng tài nguyên, như **tạo index**.
- Phân quyền chi tiết tới **cột** (update(grade)), quyền **references** (tạo foreign key), quyền trên **view**…`,
    },
    {
      pe: '4.12',
      q: '**PE 4.12** — Khi grant select cho user khác, vì sao nên (hoặc không nên) thêm `granted by current_role`?',
      answer: `Cả hai cách cho cùng quyền **tại thời điểm** grant, nhưng hiệu ứng lâu dài khác nhau. Nếu grant dựa trên **role**, quyền vẫn còn hiệu lực ngay cả khi user thực hiện grant rời tổ chức và tài khoản bị xoá (khi xoá user, các quyền do user đó cấp sẽ bị thu hồi dây chuyền). Tốt hay xấu tuỳ tình huống, nhưng thường grant qua role phù hợp hơn với một tổ chức vận hành tốt.`,
    },
    {
      pe: '4.13',
      q: '**PE 4.13** — View v chỉ tham chiếu relation r. (1) User được grant select trên v có cần select trên r? (2) User được grant update trên v có cần update trên r? (3) Cho ví dụ insert vào v một tuple t không thấy trong `select * from v`.',
      answer: `1. **Không.** Nhờ vậy có thể cho user truy cập **một phần** của r (bài GK3.15).
2. Theo sách: **có** — update hợp lệ qua v phải cập nhật r thì mới được lưu. *(Ghi chú PostgreSQL: view được thực thi với quyền của **chủ view**, nên user chỉ cần quyền update trên view; người tạo view phải có quyền trên r.)*
3. Bất kỳ tuple nào hợp schema của v nhưng **không thoả where** của v. Ví dụ view history_instructors = instructor của khoa History (không có \`with check option\`): insert ('25566', 'Brown', 'Biology', 100000) qua view thành công, tuple vào instructor nhưng không hiện trong view (bài GK3.16).`,
    },
  ],

  exercises: [
    {
      id: 'GK3.01', topic: 'PE 4.1 natural join trap', level: 2,
      pe: '4.1',
      prompt: '**PE 4.1** — Tạo view `gk_spring2017_titles(name, title)`: tên instructor và title của mỗi course họ dạy ở Spring 2017, **sửa lỗi** natural join của sách. Khi chấm, hệ thống cho Einstein (Physics) dạy thêm CS-190 section 1 Spring 2017 rồi đọc view.',
      hint: 'join course using (course_id) thay vì natural join course.',
      solution: `create view gk_spring2017_titles (name, title) as
select name, title
from instructor natural join teaches natural join section join course using (course_id)
where semester = 'Spring' and year = 2017;`,
      check: `insert into teaches values ('22222', 'CS-190', '1', 'Spring', 2017);
select * from gk_spring2017_titles;`,
    },
    {
      id: 'GK3.02', topic: 'PE 4.2a left outer join', level: 1,
      pe: '4.2a',
      prompt: '**PE 4.2a** — ID của mỗi instructor và số section đã dạy (0 nếu chưa dạy). Dùng outer join, không dùng subquery.',
      solution: `select ID, count(sec_id) as number_of_sections
from instructor natural left outer join teaches
group by ID;`,
    },
    {
      id: 'GK3.03', topic: 'PE 4.2b scalar subquery', level: 1,
      pe: '4.2ab',
      prompt: '**PE 4.2b** — Như PE 4.2a nhưng dùng **scalar subquery**, không dùng outer join.',
      solution: `select ID, (select count(*) from teaches T where T.ID = I.ID) as number_of_sections
from instructor I;`,
    },
    {
      id: 'GK3.04', topic: 'PE 4.2c coalesce', level: 2,
      pe: '4.2c',
      prompt: '**PE 4.2c** — Tạo view `gk_spring2018_sections(course_id, sec_id, ID, name)`: mọi section mở ở Spring 2018 cùng ID và tên instructor; section nhiều instructor xuất hiện nhiều lần; section **không có instructor** vẫn xuất hiện với name = `-`. Khi chấm, hệ thống thêm một section Spring 2018 chưa có ai dạy.',
      hint: '(section natural left outer join teaches) natural left outer join instructor; coalesce(name, \'-\').',
      solution: `create view gk_spring2018_sections (course_id, sec_id, ID, name) as
select course_id, sec_id, ID, coalesce(name, '-')
from (section natural left outer join teaches) natural left outer join instructor
where semester = 'Spring' and year = 2018;`,
      check: `insert into section values ('BIO-399', '1', 'Spring', 2018, 'Watson', '100', 'E');
select * from gk_spring2018_sections;`,
    },
    {
      id: 'GK3.05', topic: 'PE 4.2d count zero', level: 2,
      pe: '4.2d',
      prompt: '**PE 4.2d** — Tạo view `gk_dept_instructors(dept_name, num_instructors)`: mọi department với tổng số instructor, khoa không có ai phải hiện 0. Không dùng subquery. Khi chấm, hệ thống thêm khoa `Statistics` chưa có instructor.',
      solution: `create view gk_dept_instructors (dept_name, num_instructors) as
select dept_name, count(ID)
from department natural left outer join instructor
group by dept_name;`,
      check: `insert into department values ('Statistics', 'Taylor', 60000);
select * from gk_dept_instructors;`,
    },
    {
      id: 'GK3.06', topic: 'PE 4.3a left join rewrite', level: 2,
      pe: '4.3a',
      prompt: '**PE 4.3a** — Viết `select * from student natural left outer join takes` **không dùng outer join** (natural join + union + not exists).',
      solution: `select * from student natural join takes
union
select ID, name, dept_name, tot_cred, null, null, null, null, null
from student S1
where not exists (select ID from takes T1 where T1.ID = S1.ID);`,
    },
    {
      id: 'GK3.07', topic: 'PE 4.3b full join rewrite', level: 3,
      pe: '4.3b',
      prompt: '**PE 4.3b** — Viết `select * from student natural full outer join takes` **không dùng outer join**.',
      hint: 'Thêm nhánh thứ ba cho takes không khớp student (trên dữ liệu hợp lệ nhánh này rỗng vì foreign key).',
      solution: `(select * from student natural join takes)
union
(select ID, name, dept_name, tot_cred, null, null, null, null, null
 from student S1
 where not exists (select ID from takes T1 where T1.ID = S1.ID))
union
(select ID, null, null, null, course_id, sec_id, semester, year, grade
 from takes T1
 where not exists (select ID from student S1 where T1.ID = S1.ID));`,
    },
    {
      id: 'GK3.08', topic: 'PE 4.4 outer join order', level: 3,
      pe: '4.4',
      prompt: '**PE 4.4** — Tạo `gk_r(a, b)`, `gk_s(b, c)`, `gk_t(b, d)` (mọi cột `not null`) và chèn dữ liệu sao cho trong `(gk_r natural left outer join gk_s) natural left outer join gk_t` có dòng với **c null nhưng d khác null**. Hệ thống kiểm tra điều đó, và kiểm tra rằng với `gk_r natural left outer join (gk_s natural left outer join gk_t)` thì không có dòng như vậy (PE 4.4b).',
      hint: 'r = {(a, b)}, s = {(b1, c1)}, t = {(b, d)}.',
      solution: `create table gk_r (a varchar(5) not null, b varchar(5) not null);
create table gk_s (b varchar(5) not null, c varchar(5) not null);
create table gk_t (b varchar(5) not null, d varchar(5) not null);
insert into gk_r values ('a', 'b');
insert into gk_s values ('b1', 'c1');
insert into gk_t values ('b', 'd');`,
      check: `select
  (select count(*) > 0 from ((gk_r natural left outer join gk_s) natural left outer join gk_t) x
   where x.c is null and x.d is not null) as case_a_c_null_d_not_null,
  (select count(*) > 0 from (gk_r natural left outer join (gk_s natural left outer join gk_t)) y
   where y.c is null and y.d is not null) as case_b_c_null_d_not_null,
  (select count(*) from information_schema.columns
   where table_name in ('gk_r', 'gk_s', 'gk_t') and is_nullable = 'NO') as not_null_columns;`,
    },
    {
      id: 'GK3.09', topic: 'PE 4.5a test data', level: 2,
      pe: '4.5a',
      prompt: '**PE 4.5a** — Tạo bộ dữ liệu test **bắt được** lỗi natural join của Section 4.1.1: các bảng `gk_instructor(ID, name, dept_name, salary)`, `gk_teaches(ID, course_id, sec_id, semester, year)`, `gk_course(course_id, title, dept_name, credits)` sao cho `gk_instructor natural join gk_teaches natural join gk_course` có **ít dòng hơn** `gk_instructor natural join gk_teaches join gk_course using (course_id)`.',
      hint: 'Một giảng viên Physics dạy môn Elec. Eng.',
      solution: `create table gk_instructor (ID varchar(5), name varchar(20), dept_name varchar(20), salary numeric(8,2));
create table gk_teaches (ID varchar(5), course_id varchar(8), sec_id varchar(8), semester varchar(6), year numeric(4,0));
create table gk_course (course_id varchar(8), title varchar(50), dept_name varchar(20), credits numeric(2,0));
insert into gk_instructor values ('12345', 'Gauss', 'Physics', 10000);
insert into gk_teaches values ('12345', 'EE321', '1', 'Spring', 2017);
insert into gk_course values ('EE321', 'Magnetism', 'Elec. Eng.', 6);`,
      check: `select (select count(*) from gk_instructor natural join gk_teaches natural join gk_course)
     < (select count(*) from gk_instructor natural join gk_teaches join gk_course using (course_id)) as test_catches_bug;`,
    },
    {
      id: 'GK3.10', topic: 'PE 4.6 view with nulls', level: 3,
      pe: '4.6',
      prompt: '**PE 4.6** — Tạo view `gk_student_grades(ID, GPA)` cho **mọi** sinh viên: môn có grade null không tính vào cả tử số lẫn mẫu số; sinh viên chưa có môn nào có điểm (hoặc chưa học môn nào) có GPA = null. Dùng `case` thay cho `decode` của sách.',
      solution: `create view gk_student_grades (ID, GPA) as
select ID, credit_points / (case when credit_sum = 0 then null else credit_sum end)
from ((select ID,
              sum(case when grade is null then 0 else credits end) as credit_sum,
              sum(case when grade is null then 0 else credits * points end) as credit_points
       from (takes natural join course) natural left outer join grade_points
       group by ID)
      union
      select ID, null, null from student where ID not in (select ID from takes)) as t;`,
      check: `select ID, round(GPA, 4) from gk_student_grades;`,
    },
    {
      id: 'GK3.11', topic: 'PE 4.7 DDL foreign keys', level: 2,
      pe: '4.7',
      prompt: '**PE 4.7** — Viết DDL cho Employee database với tên `gk_employee(ID, person_name, street, city)`, `gk_company(company_name, city)`, `gk_works(ID, company_name, salary)`, `gk_manages(ID, manager_id)`: primary key như PE 2.1 (gk_manages: ID) và **đủ bốn foreign key**.',
      hint: 'works.ID, works.company_name, manages.ID, manages.manager_id. Tạo gk_company trước gk_works.',
      solution: `create table gk_employee (ID numeric(6,0), person_name char(20), street char(30), city char(30), primary key (ID));
create table gk_company (company_name char(15), city char(30), primary key (company_name));
create table gk_works (ID numeric(6,0), company_name char(15), salary integer,
  primary key (ID),
  foreign key (ID) references gk_employee,
  foreign key (company_name) references gk_company);
create table gk_manages (ID numeric(6,0), manager_id numeric(6,0),
  primary key (ID),
  foreign key (ID) references gk_employee,
  foreign key (manager_id) references gk_employee (ID));`,
      check: `select c.conrelid::regclass::text as table_name,
       case c.contype when 'p' then 'primary key' else 'foreign key' end as kind,
       a.attname as column_name,
       coalesce(c.confrelid::regclass::text, '') as referenced_table
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
where c.contype in ('p', 'f')
  and c.conrelid::regclass::text in ('gk_employee', 'gk_company', 'gk_works', 'gk_manages')
order by 1, 2, 3;`,
    },
    {
      id: 'GK3.12', topic: 'PE 4.8a constraint query', level: 3,
      pe: '4.8',
      prompt: '**PE 4.8a** — Tạo view `gk_room_conflicts(ID, name, semester, year, time_slot_id, num_rooms)`: các instructor dạy section ở **nhiều hơn một phòng** trong cùng semester, year và time slot. (Sửa hai lỗi của lời giải sách: bỏ sec_id khỏi group by; viết `count(distinct (building, room_number))`.) Khi chấm, hệ thống cho Katz dạy thêm một section ở phòng khác cùng time slot F, Spring 2018.',
      solution: `create view gk_room_conflicts (ID, name, semester, year, time_slot_id, num_rooms) as
select ID, name, semester, year, time_slot_id, count(distinct (building, room_number))
from instructor natural join teaches natural join section
group by ID, name, semester, year, time_slot_id
having count(distinct (building, room_number)) > 1;`,
      check: `insert into section values ('CS-315', '2', 'Spring', 2018, 'Watson', '120', 'F');
insert into teaches values ('45565', 'CS-315', '2', 'Spring', 2018);
select * from gk_room_conflicts;`,
    },
    {
      id: 'GK3.13', topic: 'PE 4.9 cascade chain', level: 2,
      pe: '4.9',
      prompt: '**PE 4.9** — Tạo `gk_manager(employee_id varchar(20) primary key, manager_id varchar(20))` với foreign key (manager_id) tham chiếu `gk_manager(employee_id)` **on delete cascade**. Chèn: (Alice, null), (Bob, Alice), (Carol, Alice), (Dave, Bob), (Eve, Dave), (Frank, null), (Grace, Frank). Sau đó xoá **Bob** và trả về các dòng còn lại.',
      solution: `create table gk_manager (
  employee_id varchar(20) primary key,
  manager_id  varchar(20),
  foreign key (manager_id) references gk_manager (employee_id) on delete cascade);
insert into gk_manager values ('Alice', null), ('Bob', 'Alice'), ('Carol', 'Alice'),
  ('Dave', 'Bob'), ('Eve', 'Dave'), ('Frank', null), ('Grace', 'Frank');
delete from gk_manager where employee_id = 'Bob';
select * from gk_manager;`,
    },
    {
      id: 'GK3.14', topic: 'PE 4.10 full outer join on', level: 3,
      pe: '4.10',
      prompt: '**PE 4.10** — Với `emp_title(name, address, title)` và `emp_salary(name, address, salary)` (có null ở name/address), viết tương đương `emp_title natural full outer join emp_salary` bằng **full outer join ... on** và **coalesce**: cột name, address, title, salary (mỗi cột chung chỉ một bản).',
      solution: `select coalesce(a.name, b.name) as name,
       coalesce(a.address, b.address) as address,
       a.title, b.salary
from emp_title as a full outer join emp_salary as b
  on a.name = b.name and a.address = b.address;`,
    },
    {
      id: 'GK3.15', topic: 'PE 4.13 view authorization', level: 3,
      pe: '4.13',
      prompt: '**PE 4.13 (1)** — Tạo view `gk_physics_staff(ID, name)` (instructor khoa Physics) và role `gk_viewer`; grant select **chỉ trên view** cho gk_viewer. Hệ thống sẽ `set role gk_viewer`: đọc được view nhưng không đọc được bảng instructor.',
      solution: `create view gk_physics_staff as
  select ID, name from instructor where dept_name = 'Physics';
create role gk_viewer;
grant select on gk_physics_staff to gk_viewer;`,
      check: `set role gk_viewer;
select ID, name, try_sql($$select * from instructor$$) as read_instructor
from gk_physics_staff;`,
    },
    {
      id: 'GK3.16', topic: 'PE 4.13 invisible insert', level: 2,
      pe: '4.13',
      prompt: '**PE 4.13 (3)** — Tạo view `gk_history_instructors` (mọi cột của instructor khoa History, **không** có with check option), rồi insert **qua view** giảng viên `(\'25566\', \'Brown\', \'Biology\', 100000)`. Hệ thống kiểm tra: tuple có trong instructor nhưng không thấy qua view.',
      solution: `create view gk_history_instructors as
  select * from instructor where dept_name = 'History';
insert into gk_history_instructors values ('25566', 'Brown', 'Biology', 100000);`,
      check: `select (select count(*) from instructor where ID = '25566') as in_instructor,
       (select count(*) from gk_history_instructors where ID = '25566') as visible_in_view,
       (select count(*) from gk_history_instructors) as view_rows;`,
    },
  ],
};
