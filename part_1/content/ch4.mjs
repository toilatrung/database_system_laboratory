export default {
  number: 4,
  slug: 'ch4_intermediate_sql',
  title: 'Intermediate SQL',
  titleVi: 'SQL trung cấp',

  summary: `
### 1. Join expressions
| Cú pháp | Ý nghĩa |
|---|---|
| \`r natural join s\` | ghép theo **mọi** thuộc tính trùng tên, giữ 1 bản của cột chung |
| \`r join s using (A)\` | ghép theo các cột được liệt kê |
| \`r [inner] join s on P\` | ghép theo điều kiện P (giữ cả 2 cột chung) |
| \`r left outer join s ...\` | như inner + các tuple của **r** không khớp (cột của s = null) |
| \`r right outer join s ...\` | như inner + các tuple của **s** không khớp |
| \`r full outer join s ...\` | như inner + tuple không khớp của **cả hai** |

**Nguy hiểm của natural join**: \`student natural join takes natural join course\` ghép thêm theo **dept_name** (vì student và course đều có dept_name) → mất các cặp mà sinh viên học môn của khoa khác. Cách đúng: \`student natural join takes join course using (course_id)\`.

*Join condition* quyết định tuple nào khớp; *join type* quyết định xử lý tuple **không** khớp.

### 2. Views
\`\`\`sql
create view faculty as select ID, name, dept_name from instructor;
create view departments_total_salary (dept_name, total_salary) as
  select dept_name, sum(salary) from instructor group by dept_name;
\`\`\`
- View là **virtual relation**: chỉ lưu biểu thức, khi dùng thì được **view expansion** (thay tên view bằng định nghĩa, lặp lại tới khi hết view; dừng được nếu không recursive).
- View có thể định nghĩa từ view khác (depend directly / depend on / recursive).
- **Materialized view**: lưu kết quả vật lý → nhanh nhưng phải **maintain** khi bảng gốc đổi (PostgreSQL: \`refresh materialized view\`).
- **Update qua view** chỉ được với *simple view*: from 1 bảng, select chỉ là tên cột (không biểu thức/aggregate/distinct), không group by/having; cột không có trong view sẽ là null.
- \`with check option\`: cấm insert/update tạo ra dòng không thoả where của view.

### 3. Transactions
- Một dãy câu lệnh là một **đơn vị công việc**; bắt đầu ngầm định, kết thúc bằng **commit work** (lưu vĩnh viễn) hoặc **rollback work** (huỷ tất cả).
- **Atomic** (thực hiện hết hoặc như chưa từng xảy ra) và **isolated** khỏi các transaction đồng thời.
- PostgreSQL: \`begin; ... commit;\` / \`rollback;\` / \`savepoint s; rollback to s;\`.

### 4. Integrity constraints
- Trên 1 relation: \`not null\`, \`primary key\`, \`unique (A1..Am)\` (candidate key, **được phép null**), \`check (P)\`.
- **Referential integrity**: \`foreign key (A) references r [(cols)]\`, mặc định tham chiếu primary key.
- Hành động khi vi phạm: mặc định **reject**; hoặc \`on delete/on update\` **cascade | set null | set default**.
- Vòng tham chiếu (person.mother → person): chèn cha mẹ trước, hoặc để null rồi update, hoặc **defer constraint checking** (\`deferrable initially deferred\` — kiểm tra lúc commit).
- \`check\` có subquery và \`create assertion\` là chuẩn SQL nhưng hầu như **không DBMS nào hỗ trợ** (PostgreSQL cũng không) → dùng trigger.

### 5. Kiểu dữ liệu & schema
- \`date '2005-7-27'\`, \`time '09:00:30'\`, \`timestamp '2005-7-27 09:00:30.75'\`, \`interval '1' day\`. Trừ hai date/time → interval; cộng interval vào date/time.
- **Large objects**: \`blob\` (binary), \`clob\` (character) — truy vấn trả về con trỏ (PostgreSQL: \`bytea\`, \`text\`).
- \`create type Dollars as numeric(12,2) final\` (chuẩn SQL) ~ PostgreSQL dùng \`create domain\`.
- \`create domain degree_level varchar(10) constraint degree_level_test check (value in ('Bachelors', 'Masters', 'Doctorate'))\` — domain có thể có ràng buộc.

### 6. Index
\`create index <name> on <relation> (attribute)\` — tìm tuple theo giá trị mà không phải quét cả bảng.

### 7. Authorization
- Privilege trên dữ liệu: **select (read), insert, update, delete**, \`all privileges\`. Trên schema: index, resources, alteration, drop.
- \`grant <privileges> on <relation|view> to <user|public|role>\`; \`revoke <privileges> on ... from ...\` (\`cascade\` mặc định / \`restrict\`).
- Grant trên view **không** kéo theo quyền trên bảng gốc. Người grant phải có quyền đó (hoặc là DBA).
- **Role**: \`create role instructor; grant instructor to Amit; grant select on takes to instructor;\` Role có thể grant cho role khác → chuỗi kế thừa (teaching_assistant → instructor → dean).
- \`grant references (dept_name) on department to Mariano\` — quyền tạo foreign key (vì FK hạn chế việc xoá/sửa bảng được tham chiếu).
- \`with grant option\` — cho phép người nhận grant tiếp.
`,

  quiz: [
    {
      q: 'Khác biệt giữa `course inner join prereq on course.course_id = prereq.course_id` và `course natural join prereq`?',
      options: [
        'Không khác gì cả',
        'Inner join on giữ 2 cột course_id; natural join chỉ giữ 1',
        'Natural join giữ lại tuple không khớp',
        'Inner join on không được dùng điều kiện bằng',
      ],
      answer: 1,
      explain: 'Kết quả tương ứng cùng các cặp tuple, nhưng natural join gộp cột chung thành một cột.',
    },
    {
      q: '`student natural join takes natural join course` sai ở đâu?',
      options: [
        'Không sai',
        'Ghép thêm theo dept_name nên mất các môn học ngoài khoa của sinh viên',
        'Sinh ra Cartesian product',
        'Lỗi cú pháp',
      ],
      answer: 1,
      explain: 'student và course đều có cột dept_name nên natural join so sánh luôn cột này.',
    },
    {
      q: '`course left outer join prereq` trả về course không có prereq như thế nào?',
      options: ['Bị loại bỏ', 'Có mặt, các cột của prereq là null', 'Có mặt, cột prereq_id = course_id', 'Báo lỗi'],
      answer: 1,
      explain: 'Outer join tránh mất thông tin bằng cách điền null.',
    },
    {
      q: 'View nào sau đây có thể update được trong hầu hết DBMS?',
      options: [
        'select dept_name, avg(salary) from instructor group by dept_name',
        'select ID, name, dept_name from instructor',
        'select distinct dept_name from instructor',
        'select ID, name, building from instructor, department where ...',
      ],
      answer: 1,
      explain: 'Simple view: một bảng, chỉ tên cột, không aggregate/distinct/group by.',
    },
    {
      q: 'Materialized view khác view thường ở điểm nào?',
      options: [
        'Không thể truy vấn',
        'Kết quả được lưu vật lý và cần được maintain khi bảng gốc thay đổi',
        'Không thể định nghĩa bằng select',
        'Tự động cho phép update',
      ],
      answer: 1,
      explain: 'View thường chỉ lưu biểu thức và được expand khi dùng.',
    },
    {
      q: 'Khác biệt giữa unique và primary key?',
      options: [
        'Unique không xác định candidate key',
        'Thuộc tính unique được phép null, primary key thì không',
        'Một bảng chỉ có 1 unique constraint',
        'Không có khác biệt',
      ],
      answer: 1,
      explain: 'Candidate key khai báo bằng unique được phép null.',
    },
    {
      q: 'Bảng course có `foreign key (dept_name) references department on delete cascade`. Xoá khoa Biology thì?',
      options: ['Bị từ chối', 'Các course của Biology bị xoá theo', 'dept_name của các course đó thành null', 'Không ảnh hưởng gì'],
      answer: 1,
      explain: 'cascade lan truyền việc xoá sang bảng tham chiếu. (set null mới đặt null.)',
    },
    {
      q: 'Làm sao chèn người mà cha mẹ chưa có trong bảng person khi father/mother là foreign key NOT NULL?',
      options: ['Không thể', 'Defer constraint checking tới cuối transaction', 'Dùng on delete cascade', 'Dùng unique'],
      answer: 1,
      explain: 'Với not null thì không thể chèn null trước; phải defer (deferrable initially deferred).',
    },
    {
      q: 'Kết quả của `timestamp \'2018-03-02 10:00\' - timestamp \'2018-03-01 08:00\'` có kiểu gì?',
      options: ['date', 'integer', 'interval', 'timestamp'],
      answer: 2,
      explain: 'Hiệu hai giá trị thời gian là interval (ở đây 1 day 02:00:00).',
    },
    {
      q: 'Domain khác type (trong chuẩn SQL) ở điểm nào?',
      options: ['Domain có thể có ràng buộc như not null, check', 'Type có thể có check', 'Domain chỉ dùng cho số', 'Không khác'],
      answer: 0,
      explain: 'Domain có thể khai báo constraint; type (strongly typed) thì không.',
    },
    {
      q: 'User U có quyền select trên view geo_instructor nhưng không có quyền trên instructor. U chạy `select * from geo_instructor`?',
      options: ['Bị từ chối', 'Thành công (nếu người tạo view có quyền trên instructor)', 'Chỉ thấy cột ID', 'View bị xoá'],
      answer: 1,
      explain: 'Grant trên view không cần quyền trên bảng gốc; nhưng người tạo view phải có quyền đó.',
    },
    {
      q: '`revoke select on department from Amit cascade` khi Amit đã grant tiếp cho Satoshi (with grant option)?',
      options: ['Satoshi vẫn giữ quyền', 'Satoshi cũng mất quyền (nếu không được ai khác cấp)', 'Lỗi', 'Amit vẫn giữ quyền'],
      answer: 1,
      explain: 'Mọi privilege phụ thuộc privilege bị revoke cũng bị revoke. restrict thì báo lỗi thay vì cascade.',
    },
    {
      q: 'Vì sao cần privilege references để tạo foreign key?',
      options: [
        'Vì FK làm chậm truy vấn',
        'Vì FK có thể hạn chế việc xoá/cập nhật trên bảng được tham chiếu của người khác',
        'Vì FK tạo index',
        'Không cần',
      ],
      answer: 1,
      explain: 'Ai đó tạo FK tới bảng department sẽ ngăn chủ bảng xoá khoa đang được tham chiếu.',
    },
  ],

  questions: [
    {
      q: 'View `instructor_info(ID, name, building)` = instructor ⋈ department. Vì sao `insert into instructor_info values (\'69987\', \'White\', \'Taylor\')` không dịch được một cách duy nhất?',
      answer: `Phải chèn vào instructor một dept_name — nhưng toà Taylor có **nhiều khoa** (Comp. Sci., Elec. Eng.) → không biết chọn khoa nào; nếu **không** khoa nào ở Taylor thì không thể chèn sao cho tuple xuất hiện trong view.`,
    },
    {
      q: 'Chèn `(\'25566\', \'Brown\', \'Biology\', 100000)` vào view `history_instructors` (where dept_name = \'History\') thì sao? Làm cách nào để chặn?',
      answer: `Mặc định tuple được chèn vào instructor nhưng **không xuất hiện** trong view (vì không thoả where). Thêm \`with check option\` vào định nghĩa view để DBMS từ chối.`,
    },
    {
      q: 'Viết lại (view expansion) `physics_fall_2017_watson` thành một câu không còn dùng view nào.',
      answer: `\`\`\`sql
select course_id, room_number
from (select course.course_id, building, room_number
      from course, section
      where course.course_id = section.course_id
        and course.dept_name = 'Physics'
        and section.semester = 'Fall'
        and section.year = 2017) as t
where building = 'Watson';
\`\`\``,
    },
    {
      q: 'Một transaction gồm 2 câu update chuyển 10 000 budget từ Finance sang History. Câu thứ 2 vi phạm check constraint. Điều gì xảy ra với câu thứ nhất?',
      answer: `Transaction là atomic: khi một câu lỗi, transaction phải **rollback** toàn bộ, nên câu thứ nhất cũng bị huỷ — database như chưa từng có transaction. (Trong PostgreSQL, sau lỗi transaction ở trạng thái aborted, \`commit\` cũng chỉ thực hiện rollback.)`,
    },
    {
      q: 'Viết assertion (chuẩn SQL): tot_cred của mỗi sinh viên bằng tổng credits các môn đã qua. Vì sao thực tế ít DBMS hỗ trợ?',
      answer: `\`\`\`sql
create assertion credits_earned_constraint check (
  not exists (select ID from student
              where tot_cred <> (select coalesce(sum(credits), 0)
                                 from takes natural join course
                                 where student.ID = takes.ID
                                   and grade is not null and grade <> 'F')));
\`\`\`
Kiểm tra assertion sau **mọi** thay đổi trên student, takes, course rất tốn kém → hầu hết DBMS không hỗ trợ; thay bằng trigger.`,
    },
    {
      q: 'Phân biệt 4 loại privilege thay đổi schema (index, resources, alteration, drop).',
      answer: `**index**: tạo/xoá index · **resources**: tạo relation mới · **alteration**: thêm/xoá thuộc tính · **drop**: xoá relation.`,
    },
  ],

  exercises: [
    // ---------------- Joins ----------------
    {
      id: '4.01', topic: 'natural join', level: 1,
      prompt: 'Dùng **natural join**: name của sinh viên và course_id các môn họ đã học.',
      solution: `select name, course_id from student natural join takes;`,
    },
    {
      id: '4.02', topic: 'natural join (đúng)', level: 2,
      prompt: 'name của sinh viên và **title** các môn họ đã học — cách **đúng**, tránh bẫy natural join với dept_name.',
      hint: 'student natural join takes, rồi join course using (course_id) (hoặc where takes.course_id = course.course_id)',
      solution: `select name, title
from student natural join takes join course using (course_id);`,
    },
    {
      id: '4.03', topic: 'natural join (bẫy)', level: 2,
      prompt: 'Đếm số dòng của cách **sai** `student natural join takes natural join course`. So sánh với số dòng của 4.02 để thấy bao nhiêu cặp bị mất.',
      solution: `select count(*) from student natural join takes natural join course;`,
    },
    {
      id: '4.04', topic: 'join using', level: 1,
      prompt: 'Dùng `join ... using`: ID instructor, course_id và **building** nơi section đó học (instructor dạy section).',
      solution: `select ID, course_id, building
from teaches join section using (course_id, sec_id, semester, year);`,
    },
    {
      id: '4.05', topic: 'inner join on', level: 1,
      prompt: 'Dùng `inner join ... on`: tất cả cột của course và prereq ghép theo course_id.',
      solution: `select * from course inner join prereq on course.course_id = prereq.course_id;`,
    },
    {
      id: '4.06', topic: 'left outer join', level: 2,
      prompt: 'Mọi course cùng prereq_id của nó (course không có prereq vẫn xuất hiện với prereq_id = null). Trả về course_id, title, prereq_id.',
      solution: `select course_id, title, prereq_id
from course natural left outer join prereq;`,
    },
    {
      id: '4.07', topic: 'left outer join', level: 2,
      prompt: 'Dùng **left outer join** (không dùng except/not in): ID và name của sinh viên **chưa học** môn nào.',
      solution: `select student.ID, name
from student left outer join takes on student.ID = takes.ID
where takes.ID is null;`,
    },
    {
      id: '4.08', topic: 'right outer join', level: 2,
      prompt: 'Dùng **right outer join** giữa section và course: liệt kê course_id, title, semester, year của mọi course, kể cả course chưa từng mở section.',
      solution: `select course.course_id, title, semester, year
from section right outer join course on section.course_id = course.course_id;`,
    },
    {
      id: '4.09', topic: 'full outer join', level: 3,
      prompt: 'Dùng **full outer join** hai tập course_id (không trùng): mở ở Fall 2017 và mở ở Spring 2018. Trả về 2 cột `fall_2017`, `spring_2018`; môn chỉ mở một kỳ thì cột kia là null.',
      solution: `select f.course_id as fall_2017, s.course_id as spring_2018
from (select distinct course_id from section where semester = 'Fall' and year = 2017) as f
     full outer join
     (select distinct course_id from section where semester = 'Spring' and year = 2018) as s
     on f.course_id = s.course_id;`,
    },
    {
      id: '4.10', topic: 'outer join + count', level: 2,
      prompt: 'Với **mọi** instructor: ID, name và số section đã dạy (`num_sections`, bằng **0** nếu chưa dạy).',
      hint: 'count(teaches.course_id) — count bỏ qua null, còn count(*) thì không!',
      solution: `select instructor.ID, name, count(teaches.course_id) as num_sections
from instructor left outer join teaches on instructor.ID = teaches.ID
group by instructor.ID, name;`,
    },
    // ---------------- Views ----------------
    {
      id: '4.11', topic: 'create view', level: 1,
      prompt: 'Tạo view `faculty` gồm ID, name, dept_name của instructor (ẩn salary). Sau đó dùng view tìm tên giảng viên khoa `Biology`.',
      solution: `create view faculty as
  select ID, name, dept_name from instructor;
select name from faculty where dept_name = 'Biology';`,
      check: `select * from faculty;`,
    },
    {
      id: '4.12', topic: 'create view', level: 1,
      prompt: 'Tạo view `departments_total_salary(dept_name, total_salary)` chứa tổng lương mỗi khoa.',
      solution: `create view departments_total_salary (dept_name, total_salary) as
  select dept_name, sum(salary) from instructor group by dept_name;`,
      check: `select * from departments_total_salary;`,
    },
    {
      id: '4.13', topic: 'view of view', level: 2,
      prompt: 'Tạo view `physics_fall_2017(course_id, sec_id, building, room_number)` — các section của khoa Physics mở ở Fall 2017; rồi view `physics_fall_2017_watson(course_id, room_number)` dựa trên view thứ nhất, chỉ lấy building `Watson`.',
      solution: `create view physics_fall_2017 as
  select course.course_id, sec_id, building, room_number
  from course, section
  where course.course_id = section.course_id
    and course.dept_name = 'Physics'
    and section.semester = 'Fall'
    and section.year = 2017;
create view physics_fall_2017_watson as
  select course_id, room_number
  from physics_fall_2017
  where building = 'Watson';`,
      check: `select * from physics_fall_2017_watson;`,
    },
    {
      id: '4.14', topic: 'update view', level: 2,
      prompt: 'Tạo view `faculty` (như 4.11) rồi **insert qua view** giảng viên `(\'30765\', \'Green\', \'Music\')`. Salary trong bảng instructor sẽ là gì?',
      solution: `create view faculty as
  select ID, name, dept_name from instructor;
insert into faculty values ('30765', 'Green', 'Music');`,
      check: `select * from instructor where ID = '30765';`,
    },
    {
      id: '4.15', topic: 'with check option', level: 2,
      prompt: 'Tạo view `history_instructors` (mọi cột của instructor khoa History) **with check option**, để chèn giảng viên khoa khác qua view sẽ bị từ chối.',
      solution: `create view history_instructors as
  select * from instructor where dept_name = 'History'
  with check option;`,
      check: `select (select count(*) from history_instructors) as num_rows,
       try_sql($$insert into history_instructors values ('25566', 'Brown', 'Biology', 100000)$$) as insert_biology,
       try_sql($$insert into history_instructors values ('25567', 'Ng', 'History', 70000)$$) as insert_history;`,
    },
    {
      id: '4.16', topic: 'materialized view', level: 3,
      prompt: 'Tạo **materialized view** `dept_stats(dept_name, num_instructors)`. Sau đó chèn instructor `(\'99999\', \'Lee\', \'Music\', 50000)` và **refresh** view để số liệu được cập nhật.',
      hint: 'create materialized view ... ; insert ...; refresh materialized view dept_stats;',
      solution: `create materialized view dept_stats (dept_name, num_instructors) as
  select dept_name, count(*) from instructor group by dept_name;
insert into instructor values ('99999', 'Lee', 'Music', 50000);
refresh materialized view dept_stats;`,
      check: `select * from dept_stats;`,
    },
    // ---------------- Transactions (fresh DB) ----------------
    {
      id: '4.17', topic: 'commit', level: 2, fresh: true,
      prompt: 'Viết **một transaction** chuyển 10000 budget từ khoa `Finance` sang khoa `History` rồi commit. *(Bài này chạy trên CSDL mới, được phép dùng begin/commit.)*',
      solution: `begin;
update department set budget = budget - 10000 where dept_name = 'Finance';
update department set budget = budget + 10000 where dept_name = 'History';
commit;`,
      check: `select dept_name, budget from department order by dept_name;`,
    },
    {
      id: '4.18', topic: 'rollback', level: 1, fresh: true,
      prompt: 'Mở transaction, **xoá toàn bộ** takes, đếm số dòng của takes (trong transaction), rồi **rollback**. Câu lệnh **cuối cùng** của bạn: đếm lại số dòng của takes sau khi rollback.',
      solution: `begin;
delete from takes;
select count(*) from takes;   -- 0 dòng, nhưng chưa commit
rollback;
select count(*) from takes;   -- dữ liệu đã trở lại`,
    },
    {
      id: '4.19', topic: 'savepoint', level: 3, fresh: true,
      prompt: 'Trong một transaction: tăng 10% lương khoa `Comp. Sci.`; tạo `savepoint s1`; xoá instructor khoa `Music`; quay lại `s1` (huỷ việc xoá); commit.',
      solution: `begin;
update instructor set salary = salary * 1.10 where dept_name = 'Comp. Sci.';
savepoint s1;
delete from instructor where dept_name = 'Music';
rollback to savepoint s1;
commit;`,
      check: `select ID, salary from instructor order by ID;`,
    },
    // ---------------- Integrity constraints ----------------
    {
      id: '4.20', topic: 'check / pk / fk', level: 2,
      prompt: `Tạo bảng \`scholarship\`:
- \`student_id varchar(5)\` tham chiếu student (xoá sinh viên thì xoá học bổng — **on delete cascade**)
- \`semester varchar(6)\` chỉ nhận Fall, Winter, Spring, Summer
- \`year numeric(4,0)\`
- \`amount numeric(8,2)\` **not null**, phải **> 0**
- primary key (student_id, semester, year)`,
      solution: `create table scholarship (
  student_id varchar(5),
  semester   varchar(6) check (semester in ('Fall', 'Winter', 'Spring', 'Summer')),
  year       numeric(4,0),
  amount     numeric(8,2) not null check (amount > 0),
  primary key (student_id, semester, year),
  foreign key (student_id) references student (ID) on delete cascade
);`,
      check: `select try_sql($$insert into scholarship values ('12345', 'Fall', 2018, 500)$$)    as valid,
       try_sql($$insert into scholarship values ('12345', 'Fall', 2018, 700)$$)    as dup_pk,
       try_sql($$insert into scholarship values ('12345', 'Autumn', 2018, 500)$$)  as bad_semester,
       try_sql($$insert into scholarship values ('12345', 'Spring', 2019, -1)$$)   as bad_amount,
       try_sql($$insert into scholarship values ('12345', 'Spring', 2019, null)$$) as null_amount,
       try_sql($$insert into scholarship values ('99999', 'Spring', 2019, 100)$$)  as bad_student,
       sql_value($$select count(*) from scholarship$$)                             as rows_before,
       try_sql($$delete from student where ID = '12345'$$)                        as delete_student,
       sql_value($$select count(*) from scholarship$$)                             as rows_after;`,
    },
    {
      id: '4.21', topic: 'unique', level: 2,
      prompt: 'Thêm cột `email varchar(50)` vào instructor với ràng buộc **unique**. (Hệ thống sẽ thử: gán cùng một email cho 2 người phải lỗi, nhưng nhiều người cùng email null thì được.)',
      solution: `alter table instructor add column email varchar(50) unique;`,
      check: `select try_sql($$update instructor set email = 'a@uni.edu' where ID = '10101'$$) as first_email,
       try_sql($$update instructor set email = 'a@uni.edu' where ID = '12121'$$) as duplicate_email,
       sql_value($$select count(*) from instructor where email is null$$)       as null_emails;`,
    },
    {
      id: '4.22', topic: 'on delete set null', level: 2,
      prompt: 'Tạo bảng `lab(lab_id varchar(5) primary key, dept_name varchar(20))` với foreign key dept_name → department **on delete set null**. Chèn `(\'L1\', \'Physics\')`, `(\'L2\', \'Music\')`, rồi xoá khoa `Music`.',
      solution: `create table lab (
  lab_id    varchar(5) primary key,
  dept_name varchar(20) references department on delete set null
);
insert into lab values ('L1', 'Physics'), ('L2', 'Music');
delete from department where dept_name = 'Music';`,
      check: `select lab_id, dept_name,
       (select delete_rule from information_schema.referential_constraints rc
        join information_schema.table_constraints tc on tc.constraint_name = rc.constraint_name
        where tc.table_name = 'lab') as delete_rule
from lab order by lab_id;`,
    },
    {
      id: '4.23', topic: 'deferred constraint', level: 3, fresh: true,
      prompt: `Tạo bảng \`person(ID char(10) primary key, name char(40), mother char(10), father char(10))\`, mother và father là foreign key tham chiếu chính person và là **deferrable initially deferred**.
Trong **một transaction**, chèn con \`('P3', 'Child', 'P1', 'P2')\` **trước**, rồi mới chèn \`('P1', 'Mom', null, null)\`, \`('P2', 'Dad', null, null)\`, rồi commit.`,
      solution: `create table person (
  ID     char(10) primary key,
  name   char(40),
  mother char(10) references person deferrable initially deferred,
  father char(10) references person deferrable initially deferred
);
begin;
insert into person values ('P3', 'Child', 'P1', 'P2');
insert into person values ('P1', 'Mom', null, null);
insert into person values ('P2', 'Dad', null, null);
commit;`,
      check: `select trim(ID), trim(name), trim(mother), trim(father) from person order by ID;`,
    },
    // ---------------- Types, domains, index ----------------
    {
      id: '4.24', topic: 'timestamp / interval', level: 2,
      prompt: 'Bảng `account_txn(account_number, date_time, value)`: với mỗi tài khoản, trả về account_number và **khoảng thời gian** giữa giao dịch đầu tiên và cuối cùng (`span`, kiểu interval).',
      solution: `select account_number, max(date_time) - min(date_time) as span
from account_txn
group by account_number;`,
    },
    {
      id: '4.25', topic: 'date + interval', level: 2,
      prompt: 'Từ `daily_sales`: trả về sale_date và ngày **sau đó 1 tuần** (`one_week_later`), chỉ cho các ngày có value > 100, sắp theo sale_date.',
      hint: "sale_date + interval '7 day'",
      solution: `select sale_date, sale_date + interval '7 day' as one_week_later
from daily_sales
where value > 100
order by sale_date;`,
      ordered: true,
    },
    {
      id: '4.26', topic: 'domain', level: 2,
      prompt: "Tạo domain `degree_level varchar(10)` chỉ nhận `Bachelors`, `Masters`, `Doctorate` (đặt tên constraint `degree_level_test`). Thêm cột `degree degree_level` vào student.",
      solution: `create domain degree_level varchar(10)
  constraint degree_level_test
  check (value in ('Bachelors', 'Masters', 'Doctorate'));
alter table student add column degree degree_level;`,
      check: `select try_sql($$update student set degree = 'Masters' where ID = '00128'$$) as masters,
       try_sql($$update student set degree = 'PhD' where ID = '00128'$$)     as phd,
       sql_value($$select degree from student where ID = '00128'$$)         as zhang_degree;`,
    },
    {
      id: '4.27', topic: 'domain as type', level: 2,
      prompt: 'Chuẩn SQL viết `create type Dollars as numeric(12,2) final`. Trong PostgreSQL hãy tạo **domain** `dollars` là numeric(12,2) và **không âm**, rồi tạo bảng `donation(donor varchar(30), amount dollars)` và chèn `(\'Alice\', 1500.5)`.',
      solution: `create domain dollars as numeric(12,2) check (value >= 0);
create table donation (donor varchar(30), amount dollars);
insert into donation values ('Alice', 1500.5);`,
      check: `select (select amount from donation where donor = 'Alice') as alice,
       try_sql($$insert into donation values ('Bob', -10)$$) as negative;`,
    },
    {
      id: '4.28', topic: 'index', level: 1,
      prompt: 'Tạo index tên `instructor_dept_idx` trên cột dept_name của instructor.',
      solution: `create index instructor_dept_idx on instructor (dept_name);`,
      check: `select indexname from pg_indexes where tablename = 'instructor' and indexname = 'instructor_dept_idx';`,
    },
    // ---------------- Authorization ----------------
    {
      id: '4.29', topic: 'grant', level: 2,
      prompt: 'Tạo role `grader`. Cấp cho grader quyền **select** trên takes và quyền **update chỉ trên cột grade** của takes.',
      hint: 'grant update (grade) on takes to grader',
      solution: `create role grader;
grant select on takes to grader;
grant update (grade) on takes to grader;`,
      check: `select has_table_privilege('grader', 'takes', 'select')            as can_select,
       has_table_privilege('grader', 'takes', 'insert')            as can_insert,
       has_column_privilege('grader', 'takes', 'grade', 'update') as can_update_grade,
       has_column_privilege('grader', 'takes', 'id', 'update')    as can_update_id;`,
    },
    {
      id: '4.30', topic: 'revoke', level: 2,
      prompt: 'Tạo role `clerk`, cấp **select, insert, update** trên department; sau đó **thu hồi** insert và update.',
      solution: `create role clerk;
grant select, insert, update on department to clerk;
revoke insert, update on department from clerk;`,
      check: `select has_table_privilege('clerk', 'department', 'select') as s,
       has_table_privilege('clerk', 'department', 'insert') as i,
       has_table_privilege('clerk', 'department', 'update') as u;`,
    },
    {
      id: '4.31', topic: 'roles chain', level: 3,
      prompt: 'Tạo chuỗi role như slide: `teaching_assistant`, `instructor_role`, `dean`. Grant select trên takes cho teaching_assistant; grant teaching_assistant cho instructor_role; grant instructor_role cho dean. (dean phải **kế thừa** quyền select trên takes.)',
      solution: `create role teaching_assistant;
create role instructor_role;
create role dean;
grant select on takes to teaching_assistant;
grant teaching_assistant to instructor_role;
grant instructor_role to dean;`,
      check: `select has_table_privilege('dean', 'takes', 'select')               as dean_can_read_takes,
       pg_has_role('dean', 'teaching_assistant', 'member')              as dean_is_ta,
       has_table_privilege('teaching_assistant', 'instructor', 'select') as ta_can_read_instructor;`,
    },
    {
      id: '4.32', topic: 'authorization on views', level: 3,
      prompt: 'Tạo view `physics_instructor` (mọi cột instructor khoa Physics) và role `phys_staff`; chỉ grant select trên **view** cho phys_staff. (Hệ thống sẽ `set role phys_staff` rồi đọc view: phải đọc được view nhưng không đọc được bảng instructor.)',
      solution: `create view physics_instructor as
  select * from instructor where dept_name = 'Physics';
create role phys_staff;
grant select on physics_instructor to phys_staff;`,
      check: `set role phys_staff;
select ID, name,
       try_sql($$select * from instructor$$) as read_base_table
from physics_instructor;`,
    },
    {
      id: '4.33', topic: 'with grant option', level: 3,
      prompt: 'Tạo role `amit`, `satoshi`. Grant select trên department cho amit **with grant option**. Sau đó đóng vai amit (`set role amit`) grant select tiếp cho satoshi, rồi `reset role`.',
      solution: `create role amit;
create role satoshi;
grant select on department to amit with grant option;
set role amit;
grant select on department to satoshi;
reset role;`,
      check: `select grantor, grantee, privilege_type, is_grantable
from information_schema.table_privileges
where table_name = 'department' and grantee in ('amit', 'satoshi');`,
    },
    {
      id: '4.34', topic: 'revoke cascade', level: 3,
      prompt: 'Làm lại toàn bộ 4.33, sau đó **revoke** quyền select của amit với **cascade**. Quyền mà amit đã cấp cho satoshi cũng phải biến mất. (Thử đổi cascade thành restrict xem lỗi gì!)',
      solution: `create role amit;
create role satoshi;
grant select on department to amit with grant option;
set role amit;
grant select on department to satoshi;
reset role;
revoke select on department from amit cascade;`,
      check: `select (select count(*) from pg_roles where rolname in ('amit', 'satoshi')) as num_roles,
       has_table_privilege('amit', 'department', 'select')                  as amit_select,
       has_table_privilege('satoshi', 'department', 'select')               as satoshi_select;`,
    },
  ],
};
