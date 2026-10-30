-- =====================================================================
-- CS4420 · Ôn CK · Phần 1 — Practice Exercises Chương 6 (E-R) (Practice Exercises — Chapter 6)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CK1.01  [PE 6.1 DDL]  ★★★
-- Đề gốc: Exercise 6.1. Construct an E-R diagram for a car-insurance company. Each customer owns one or more cars. Each car has zero or more recorded accidents. Each insurance policy covers one or more cars and has one or more premium payments. Each payment covers a particular period of time and has a due date and the date on which the payment was received.
--
-- PE 6.1 — hiện thực bằng SQL. Tạo các bảng (mọi khoá/chuỗi varchar(10), tiền numeric(10,2), ngày date):
-- - `ins_customer(customer_id, name, address)`
-- - `ins_policy(policy_id)`
-- - `ins_car(license_no, model, policy_id)` — covers gộp vào car, mỗi xe thuộc đúng một policy
-- - `ins_owns(customer_id, license_no)` — many-to-many
-- - `ins_accident(report_id, acc_date, place)`
-- - `ins_participated(report_id, license_no)`
-- - `ins_premium_payment(policy_id, payment_no, due_date, amount, received_on)` — weak entity của policy (xoá theo policy)
-- Gợi ý: premium_payment: PK (policy_id, payment_no), FK on delete cascade; ins_car.policy_id not null.
create table ins_customer (customer_id varchar(10) primary key, name varchar(10), address varchar(10));
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
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into ins_policy values ('P1'), ('P2')$$)                                   as policies,
--          try_sql($$insert into ins_car values ('C1', 'Vios', 'P1'), ('C2', 'City', 'P1')$$)            as two_cars_one_policy,
--          try_sql($$insert into ins_car values ('C3', 'Orphan', null)$$)                                as car_without_policy,
--          try_sql($$insert into ins_customer values ('U1', 'An', 'Hue')$$)                               as customer,
--          try_sql($$insert into ins_owns values ('U1', 'C1'), ('U1', 'C2')$$)                            as owns_two,
--          try_sql($$insert into ins_accident values ('R1', '2025-01-01', 'Hue')$$)                       as accident,
--          try_sql($$insert into ins_participated values ('R1', 'C1'), ('R1', 'C2')$$)                    as two_cars_one_accident,
--          try_sql($$insert into ins_premium_payment values ('P1', '1', '2025-01-31', 100, null)$$)       as pay_1,
--          try_sql($$insert into ins_premium_payment values ('P2', '1', '2025-01-31', 100, null)$$)       as same_no_other_policy,
--          try_sql($$insert into ins_premium_payment values ('P1', '1', '2025-02-28', 100, null)$$)       as duplicate_payment,
--          try_sql($$insert into ins_premium_payment values ('P9', '1', '2025-02-28', 100, null)$$)       as no_policy,
--          try_sql($$delete from ins_policy where policy_id = 'P2'$$)                                    as delete_policy,
--          sql_value($$select count(*) from ins_premium_payment$$)                                      as payments_left;

-- @ex CK1.02  [PE 6.2a ternary]  ★★★
-- Đề gốc: Exercise 6.2 (a). A database contains the entity sets *student*, *course*, and *section* of the university schema, and in addition records the marks students obtain in the different exams of the different sections.
--
-- a. Construct an E-R diagram that models exams as entities and uses a ternary relationship in the design.
--
-- PE 6.2(a) — exam là entity, dùng ternary relationship. Tạo:
-- - `exam(exam_id varchar(5) primary key, name varchar(20), place varchar(20), exam_time timestamp)`
-- - `exam_marks(ID, course_id, sec_id, semester, year, exam_id, marks)` (kiểu cột giống bảng takes; marks numeric(5,2)) với primary key là ternary (student, section, exam), FK ID → student, (course_id, sec_id, semester, year) → section, exam_id → exam.
create table exam (
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
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into exam values ('MT', 'Midterm', 'Watson 100', '2017-10-15 09:00'), ('FN', 'Final', 'Packard 101', '2017-12-15 09:00')$$) as exams,
--          try_sql($$insert into exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'MT', 8.5)$$)  as mark_mt,
--          try_sql($$insert into exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'FN', 9)$$)    as mark_fn,
--          try_sql($$insert into exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'MT', 7)$$)    as duplicate,
--          try_sql($$insert into exam_marks values ('00128', 'CS-101', '9', 'Fall', 2017, 'MT', 7)$$)    as bad_section,
--          try_sql($$insert into exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'XX', 7)$$)    as bad_exam;

-- @ex CK1.03  [PE 6.2b binary]  ★★☆
-- Đề gốc: Exercise 6.2 (b). A database contains the entity sets *student*, *course*, and *section* of the university schema, and in addition records the marks students obtain in the different exams of the different sections.
--
-- b. Construct an alternative E-R diagram that uses only a binary relationship between *student* and *section*. There must be only one relationship between a given *student* and *section* pair, yet it must still be possible to represent the marks a student gets in different exams.
--
-- PE 6.2(b) — chỉ một binary relationship student–section với thuộc tính multivalued composite {exam_marks(exam_id, marks)}. Tạo bảng `sec_exam_marks(ID, course_id, sec_id, semester, year, exam_id varchar(5), marks numeric(5,2))` (FK tới student và section; không có bảng exam) sao cho một sinh viên trong một section có nhiều bài thi nhưng mỗi bài thi một điểm.
create table sec_exam_marks (
  ID         varchar(5) references student,
  course_id  varchar(8),
  sec_id     varchar(8),
  semester   varchar(6),
  year       numeric(4,0),
  exam_id    varchar(5),
  marks      numeric(5,2),
  primary key (ID, course_id, sec_id, semester, year, exam_id),
  foreign key (course_id, sec_id, semester, year) references section
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into sec_exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'MT', 8.5)$$) as mt,
--          try_sql($$insert into sec_exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'FN', 9)$$)   as fn,
--          try_sql($$insert into sec_exam_marks values ('00128', 'CS-101', '1', 'Fall', 2017, 'MT', 6)$$)   as duplicate_exam,
--          try_sql($$insert into sec_exam_marks values ('99999', 'CS-101', '1', 'Fall', 2017, 'MT', 6)$$)   as bad_student,
--          (select count(*) from information_schema.tables where table_name = 'exam') as exam_table;

-- @ex CK1.04  [PE 6.3 derived (view)]  ★★☆
-- Đề gốc: Exercise 6.3. Design an E-R diagram that keeps track of the scoring statistics of your favorite sports team. Store the matches played, the scores of each match, the players in each match, and each player’s individual scoring statistics for each match. Model summary statistics as derived attributes, explaining how each one is computed.
--
-- PE 6.3 — dữ liệu có sẵn: `er_player(player_id, name, age)`, `er_match(...)`, `er_played(match_id, player_id, score)`. Hiện thực derived attribute season_score: tạo view `season_score(player_id, name, season_score)` cho mọi cầu thủ (cầu thủ chưa đá trận nào có 0).
-- Gợi ý: left join + coalesce(sum(score), 0).
create view season_score (player_id, name, season_score) as
  select p.player_id, p.name, coalesce(sum(pl.score), 0)
  from er_player p left join er_played pl on pl.player_id = p.player_id
  group by p.player_id, p.name;

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from season_score;

-- @ex CK1.05  [PE 6.3 derived (query)]  ★★☆
-- Đề gốc: Exercise 6.3. Design an E-R diagram that keeps track of the scoring statistics of your favorite sports team. Store the matches played, the scores of each match, the players in each match, and each player’s individual scoring statistics for each match. Model summary statistics as derived attributes, explaining how each one is computed.
--
-- PE 6.3 — thêm derived attribute `result()` của match: `W` nếu own_score > opp_score, `D` nếu bằng, `L` nếu thua. Trả về match_id, opponent, result, và số cầu thủ đã ra sân (`num_players`), sắp theo match_date.
-- (Thứ tự dòng được chấm.)
select m.match_id, m.opponent,
       case when m.own_score > m.opp_score then 'W'
            when m.own_score = m.opp_score then 'D'
            else 'L' end as result,
       count(pl.player_id) as num_players
from er_match m left join er_played pl on pl.match_id = m.match_id
group by m.match_id, m.opponent, m.own_score, m.opp_score, m.match_date
order by m.match_date;

-- @ex CK1.06  [PE 6.8 many-to-one]  ★★☆
-- Đề gốc: Exercise 6.8. Take a relation such as *sec_course*, created from the many-to-one relationship set *sec_course*. Do the primary-key and foreign-key constraints created on that relation enforce the many-to-one cardinality constraint? Explain why.
--
-- PE 6.8 — giả sử section có định danh riêng `section_id`. Tạo bảng `sec_course(section_id varchar(10), course_id varchar(8))` biểu diễn relationship many-to-one từ section tới course, ép được cardinality bằng primary key + foreign key (mỗi section thuộc đúng một course). Hệ thống cũng kiểm tra rằng course không có section nào vẫn hợp lệ — tức total participation không được ép.
create table sec_course (
  section_id  varchar(10) primary key,
  course_id   varchar(8) not null references course
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into sec_course values ('S1', 'CS-101')$$) as s1,
--          try_sql($$insert into sec_course values ('S2', 'CS-101')$$) as same_course,
--          try_sql($$insert into sec_course values ('S1', 'CS-347')$$) as section_second_course,
--          try_sql($$insert into sec_course values ('S3', 'XX-000')$$) as bad_course,
--          sql_value($$select count(*) from course where course_id not in (select course_id from sec_course)$$) as courses_without_section;

-- @ex CK1.07  [PE 6.9 one-to-one]  ★☆☆
-- Đề gốc: Exercise 6.9. Suppose the *advisor* relationship set were one-to-one. Which additional constraints are needed on the relation *advisor* so that the one-to-one cardinality constraint is enforced?
--
-- PE 6.9 — tạo `advisor_1to1(s_ID varchar(5), i_ID varchar(5))` là phiên bản one-to-one của advisor: s_ID là primary key, và thêm ràng buộc để mỗi instructor hướng dẫn tối đa một sinh viên. FK tới student/instructor.
create table advisor_1to1 (
  s_ID  varchar(5) primary key references student (ID),
  i_ID  varchar(5) unique references instructor (ID)
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into advisor_1to1 values ('00128', '45565')$$) as a1,
--          try_sql($$insert into advisor_1to1 values ('12345', '45565')$$) as instructor_twice,
--          try_sql($$insert into advisor_1to1 values ('00128', '10101')$$) as student_twice,
--          try_sql($$insert into advisor_1to1 values ('12345', '10101')$$) as a2;

-- @ex CK1.08  [PE 6.10 not null]  ★☆☆
-- Đề gốc: Exercise 6.10. Let R be a many-to-one relationship between entity sets A and B, and suppose the relation created from R is merged into the relation created from A. In SQL, attributes that take part in a foreign-key constraint may be null. Explain how total participation of A in R can be enforced with not null constraints in SQL.
--
-- PE 6.10 — relationship many-to-one `member_of` từ student tới `club`, total phía student, được gộp vào bảng phía many. Tạo `club(club_name varchar(20) primary key)` và `club_member(student_id varchar(5) primary key references student, club_name varchar(20))` sao cho mỗi club_member thuộc đúng một club đã tồn tại.
create table club (club_name varchar(20) primary key);
create table club_member (
  student_id  varchar(5) primary key references student (ID),
  club_name   varchar(20) not null references club
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into club values ('Chess'), ('Music')$$)            as clubs,
--          try_sql($$insert into club_member values ('00128', 'Chess')$$)         as m1,
--          try_sql($$insert into club_member values ('12345', null)$$)            as no_club,
--          try_sql($$insert into club_member values ('12345', 'Dance')$$)         as bad_club,
--          try_sql($$insert into club_member values ('00128', 'Music')$$)         as second_club;

-- @ex CK1.09  [PE 6.11 deferred trigger]  ★★★
-- Đề gốc: Exercise 6.11. In SQL a foreign key may reference only the primary-key attributes of the referenced relation, or other attributes declared as a superkey with unique. Consequently, total participation constraints on a many-to-many relationship set (or on the “one” side of a one-to-many relationship set) cannot be enforced on the relations created from that relationship set using only primary-key, foreign-key, and not-null constraints.
--
-- a. Explain why.
--
-- b. Explain how total participation constraints can be enforced using complex check constraints or assertions (see Section 4.4.8). (These features are, unfortunately, not supported by any widely used database at present.)
--
-- PE 6.11 — ép total participation ở phía "one". Tạo
-- - `dept_t(dept_name varchar(20) primary key)`
-- - `emp_t(emp_id varchar(5) primary key, dept_name varchar(20) not null references dept_t)` (many-to-one emp → dept)
--
-- và ràng buộc mỗi dept_t phải có ít nhất một emp_t. PostgreSQL không có assertion, nên dùng một trigger function `returns trigger` gắn bằng constraint trigger `deferrable initially deferred` (after insert/update trên dept_t và after delete/update trên emp_t). Khi vi phạm, hãy `raise exception ... using errcode = 'check_violation'`.
--
-- Hệ thống sẽ thử trong các khối riêng (kết thúc bằng `set constraints all immediate`): thêm khoa không có nhân viên (phải lỗi 23514), thêm khoa cùng nhân viên (ok), xoá nhân viên cuối cùng (phải lỗi).
-- Gợi ý: create constraint trigger t after insert or update on dept_t deferrable initially deferred for each row execute function f();
create table dept_t (dept_name varchar(20) primary key);
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
  deferrable initially deferred for each row execute function dept_has_emp();

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($q$do $x$ begin insert into dept_t values ('D1'); set constraints all immediate; end $x$$q$) as dept_alone,
--          try_sql($q$do $x$ begin insert into dept_t values ('D2'); insert into emp_t values ('E1', 'D2'); set constraints all immediate; end $x$$q$) as dept_with_emp,
--          try_sql($q$do $x$ begin insert into emp_t values ('E2', 'D2'); set constraints all immediate; end $x$$q$) as second_emp,
--          try_sql($q$do $x$ begin delete from emp_t; set constraints all immediate; end $x$$q$) as delete_all_emps,
--          sql_value($$select count(*) from dept_t$$) as depts,
--          sql_value($$select count(*) from emp_t$$)  as emps;

-- @ex CK1.10  [PE 6.8/6.11 vi phạm total]  ★☆☆
-- Đề gốc: Exercise 6.8. Take a relation such as *sec_course*, created from the many-to-one relationship set *sec_course*. Do the primary-key and foreign-key constraints created on that relation enforce the many-to-one cardinality constraint? Explain why.
--
-- Exercise 6.11. In SQL a foreign key may reference only the primary-key attributes of the referenced relation, or other attributes declared as a superkey with unique. Consequently, total participation constraints on a many-to-many relationship set (or on the “one” side of a one-to-many relationship set) cannot be enforced on the relations created from that relationship set using only primary-key, foreign-key, and not-null constraints.
--
-- a. Explain why.
--
-- b. Explain how total participation constraints can be enforced using complex check constraints or assertions (see Section 4.4.8). (These features are, unfortunately, not supported by any widely used database at present.)
--
-- PE 6.8 / 6.11 — nếu yêu cầu mỗi course phải có ít nhất một section (total participation của course trong sec_course), những course nào trong University database đang vi phạm? Trả về course_id, title.
select course_id, title from course
where course_id not in (select course_id from section);

-- @ex CK1.11  [PE 6.12 multiple inheritance]  ★★☆
-- Đề gốc: Exercise 6.12. Consider a lattice of generalization and specialization (attributes not shown) with higher-level entity sets X and Y and lower-level entity sets A, B, C: A specializes X, B specializes both X and Y, and C specializes Y.
--
-- For entity sets A, B, and C, explain how attributes are inherited from the higher-level entity sets X and Y. Discuss how to deal with the case where an attribute of X has the same name as an attribute of Y.
--
-- PE 6.12 — lattice: B là specialization của cả X và Y (method 1). Tạo `lat_x(id varchar(5) primary key, name varchar(20), x_attr integer)`, `lat_y(id varchar(5) primary key, name varchar(20), y_attr integer)` và `lat_b(id varchar(5) primary key, b_attr integer)` trong đó id của lat_b phải tồn tại ở cả lat_x và lat_y. Sau đó tạo view `lat_b_full(id, x_name, y_name, x_attr, y_attr, b_attr)` gom đủ thuộc tính thừa kế (hai thuộc tính name trùng tên được đổi thành x_name, y_name).
create table lat_x (id varchar(5) primary key, name varchar(20), x_attr integer);
create table lat_y (id varchar(5) primary key, name varchar(20), y_attr integer);
create table lat_b (
  id      varchar(5) primary key references lat_x references lat_y,
  b_attr  integer
);
create view lat_b_full (id, x_name, y_name, x_attr, y_attr, b_attr) as
  select b.id, x.name, y.name, x.x_attr, y.y_attr, b.b_attr
  from lat_b b join lat_x x on x.id = b.id join lat_y y on y.id = b.id;

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into lat_x values ('K1', 'Xname', 1), ('K2', 'X2', 2)$$) as xs,
--          try_sql($$insert into lat_y values ('K1', 'Yname', 10)$$)                 as ys,
--          try_sql($$insert into lat_b values ('K1', 100)$$)                         as b_in_both,
--          try_sql($$insert into lat_b values ('K2', 200)$$)                         as b_only_in_x,
--          sql_value($$select x_name || '/' || y_name || '/' || (x_attr + y_attr + b_attr) from lat_b_full$$) as b_full;

-- @ex CK1.12  [PE 6.13 temporal DDL]  ★★☆
-- Đề gốc: Exercise 6.13. An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.
--
-- One way to model this: define a new data type valid time, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.
--
-- a. Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.
--
-- b. Convert that E-R diagram into a set of relations.
--
-- The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.
--
-- PE 6.13(b) — tạo ba relation (date cho thời gian, varchar(5) cho ID, varchar(20) cho value): `t_student(student_id)`, `t_student_name(student_id, value, start_time, end_time)` và `t_advisor(student_id, instructor_id, start_time, end_time)` với primary key như lời giải của sách (end_time nằm trong khoá). t_student_name.student_id và t_advisor.student_id tham chiếu t_student.
create table t_student (student_id varchar(5) primary key);
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
);

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into t_student values ('S1')$$)                                         as student,
--          try_sql($$insert into t_student_name values ('S1', 'Shankar', '2018-09-01', 'infinity')$$)    as name_open_ended,
--          try_sql($$insert into t_student_name values ('S1', 'Shankar', '2018-09-01', 'infinity')$$)    as duplicate_name_period,
--          try_sql($$insert into t_advisor values ('S1', 'I1', '2018-05-01', '2018-12-31')$$)            as advisor_1,
--          try_sql($$insert into t_advisor values ('S1', 'I1', '2019-06-01', '2020-01-31')$$)            as same_advisor_again,
--          try_sql($$insert into t_advisor values ('S9', 'I1', '2019-06-01', '2020-01-31')$$)            as unknown_student;

-- @ex CK1.13  [PE 6.13 query tại thời điểm]  ★★☆
-- Đề gốc: Exercise 6.13. An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.
--
-- One way to model this: define a new data type valid time, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.
--
-- a. Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.
--
-- b. Convert that E-R diagram into a set of relations.
--
-- The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.
--
-- PE 6.13 — dữ liệu có sẵn: `er_t_advisor(student_id, instructor_id, start_time, end_time)`, `er_t_instructor_name(instructor_id, value, start_time, end_time)`. Ai (instructor_id và tên có hiệu lực tại thời điểm đó) là advisor của student `12345` vào ngày `2019-03-15`?
-- Gợi ý: date '2019-03-15' between start_time and end_time — áp dụng cho cả advisor và tên.
select a.instructor_id, n.value as name
from er_t_advisor a
     join er_t_instructor_name n on n.instructor_id = a.instructor_id
where a.student_id = '12345'
  and date '2019-03-15' between a.start_time and a.end_time
  and date '2019-03-15' between n.start_time and n.end_time;

-- @ex CK1.14  [PE 6.13 lịch sử]  ★★☆
-- Đề gốc: Exercise 6.13. An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.
--
-- One way to model this: define a new data type valid time, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.
--
-- a. Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.
--
-- b. Convert that E-R diagram into a set of relations.
--
-- The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.
--
-- PE 6.13 — liệt kê toàn bộ lịch sử advisor của sinh viên có tên (hiện tại) `Shankar`: instructor_id, start_time, end_time, sắp theo start_time. (Tên sinh viên ở `er_t_student_name`.)
-- (Thứ tự dòng được chấm.)
select a.instructor_id, a.start_time, a.end_time
from er_t_advisor a
     join er_t_student_name s on s.student_id = a.student_id
where s.value = 'Shankar' and s.end_time = 'infinity'
order by a.start_time;

-- @ex CK1.15  [PE 6.13 snapshot]  ★★★
-- Đề gốc: Exercise 6.13. An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.
--
-- One way to model this: define a new data type valid time, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.
--
-- a. Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.
--
-- b. Convert that E-R diagram into a set of relations.
--
-- The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.
--
-- PE 6.13 — "chụp" trạng thái tại ngày `2021-06-01`: tạo view `advisor_snapshot_2021(student_name, instructor_name)` gồm các cặp advisor có hiệu lực ngày đó, với tên sinh viên và tên giảng viên có hiệu lực ngày đó.
create view advisor_snapshot_2021 (student_name, instructor_name) as
  select s.value, i.value
  from er_t_advisor a
       join er_t_student_name s on s.student_id = a.student_id
       join er_t_instructor_name i on i.instructor_id = a.instructor_id
  where date '2021-06-01' between a.start_time and a.end_time
    and date '2021-06-01' between s.start_time and s.end_time
    and date '2021-06-01' between i.start_time and i.end_time;

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from advisor_snapshot_2021;
