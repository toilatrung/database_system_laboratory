-- =====================================================================
-- CS4420 · Ôn CK · Phần 1 — Practice Exercises Chương 6 (E-R) (Practice Exercises — Chapter 6)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ck1
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CK1.01  [PE 6.1 DDL]  ★★★
-- PE 6.1 — hiện thực bằng SQL. Tạo các bảng (mọi khoá/chuỗi varchar(10), tiền numeric(10,2), ngày date):
-- - `ins_customer(customer_id, name, address)`
-- - `ins_policy(policy_id)`
-- - `ins_car(license_no, model, policy_id)` — covers gộp vào car, mỗi xe thuộc đúng một policy
-- - `ins_owns(customer_id, license_no)` — many-to-many
-- - `ins_accident(report_id, acc_date, place)`
-- - `ins_participated(report_id, license_no)`
-- - `ins_premium_payment(policy_id, payment_no, due_date, amount, received_on)` — weak entity của policy (xoá theo policy)
-- Gợi ý: premium_payment: PK (policy_id, payment_no), FK on delete cascade; ins_car.policy_id not null.




-- @ex CK1.02  [PE 6.2a ternary]  ★★★
-- PE 6.2(a) — exam là entity, dùng ternary relationship. Tạo:
-- - `exam(exam_id varchar(5) primary key, name varchar(20), place varchar(20), exam_time timestamp)`
-- - `exam_marks(ID, course_id, sec_id, semester, year, exam_id, marks)` (kiểu cột giống bảng takes; marks numeric(5,2)) với primary key là ternary (student, section, exam), FK ID → student, (course_id, sec_id, semester, year) → section, exam_id → exam.




-- @ex CK1.03  [PE 6.2b binary]  ★★☆
-- PE 6.2(b) — chỉ một binary relationship student–section với thuộc tính multivalued composite {exam_marks(exam_id, marks)}. Tạo bảng `sec_exam_marks(ID, course_id, sec_id, semester, year, exam_id varchar(5), marks numeric(5,2))` (FK tới student và section; không có bảng exam) sao cho một sinh viên trong một section có nhiều bài thi nhưng mỗi bài thi một điểm.




-- @ex CK1.04  [PE 6.3 derived (view)]  ★★☆
-- PE 6.3 — dữ liệu có sẵn: `er_player(player_id, name, age)`, `er_match(...)`, `er_played(match_id, player_id, score)`. Hiện thực derived attribute season_score: tạo view `season_score(player_id, name, season_score)` cho mọi cầu thủ (cầu thủ chưa đá trận nào có 0).
-- Gợi ý: left join + coalesce(sum(score), 0).




-- @ex CK1.05  [PE 6.3 derived (query)]  ★★☆
-- PE 6.3 — thêm derived attribute `result()` của match: `W` nếu own_score > opp_score, `D` nếu bằng, `L` nếu thua. Trả về match_id, opponent, result, và số cầu thủ đã ra sân (`num_players`), sắp theo match_date.
-- (Thứ tự dòng được chấm.)




-- @ex CK1.06  [PE 6.8 many-to-one]  ★★☆
-- PE 6.8 — giả sử section có định danh riêng `section_id`. Tạo bảng `sec_course(section_id varchar(10), course_id varchar(8))` biểu diễn relationship many-to-one từ section tới course, ép được cardinality bằng primary key + foreign key (mỗi section thuộc đúng một course). Hệ thống cũng kiểm tra rằng course không có section nào vẫn hợp lệ — tức total participation không được ép.




-- @ex CK1.07  [PE 6.9 one-to-one]  ★☆☆
-- PE 6.9 — tạo `advisor_1to1(s_ID varchar(5), i_ID varchar(5))` là phiên bản one-to-one của advisor: s_ID là primary key, và thêm ràng buộc để mỗi instructor hướng dẫn tối đa một sinh viên. FK tới student/instructor.




-- @ex CK1.08  [PE 6.10 not null]  ★☆☆
-- PE 6.10 — relationship many-to-one `member_of` từ student tới `club`, total phía student, được gộp vào bảng phía many. Tạo `club(club_name varchar(20) primary key)` và `club_member(student_id varchar(5) primary key references student, club_name varchar(20))` sao cho mỗi club_member thuộc đúng một club đã tồn tại.




-- @ex CK1.09  [PE 6.11 deferred trigger]  ★★★
-- PE 6.11 — ép total participation ở phía "one". Tạo
-- - `dept_t(dept_name varchar(20) primary key)`
-- - `emp_t(emp_id varchar(5) primary key, dept_name varchar(20) not null references dept_t)` (many-to-one emp → dept)
--
-- và ràng buộc mỗi dept_t phải có ít nhất một emp_t. PostgreSQL không có assertion, nên dùng một trigger function `returns trigger` gắn bằng constraint trigger `deferrable initially deferred` (after insert/update trên dept_t và after delete/update trên emp_t). Khi vi phạm, hãy `raise exception ... using errcode = 'check_violation'`.
--
-- Hệ thống sẽ thử trong các khối riêng (kết thúc bằng `set constraints all immediate`): thêm khoa không có nhân viên (phải lỗi 23514), thêm khoa cùng nhân viên (ok), xoá nhân viên cuối cùng (phải lỗi).
-- Gợi ý: create constraint trigger t after insert or update on dept_t deferrable initially deferred for each row execute function f();




-- @ex CK1.10  [PE 6.8/6.11 vi phạm total]  ★☆☆
-- PE 6.8 / 6.11 — nếu yêu cầu mỗi course phải có ít nhất một section (total participation của course trong sec_course), những course nào trong University database đang vi phạm? Trả về course_id, title.




-- @ex CK1.11  [PE 6.12 multiple inheritance]  ★★☆
-- PE 6.12 — lattice: B là specialization của cả X và Y (method 1). Tạo `lat_x(id varchar(5) primary key, name varchar(20), x_attr integer)`, `lat_y(id varchar(5) primary key, name varchar(20), y_attr integer)` và `lat_b(id varchar(5) primary key, b_attr integer)` trong đó id của lat_b phải tồn tại ở cả lat_x và lat_y. Sau đó tạo view `lat_b_full(id, x_name, y_name, x_attr, y_attr, b_attr)` gom đủ thuộc tính thừa kế (hai thuộc tính name trùng tên được đổi thành x_name, y_name).




-- @ex CK1.12  [PE 6.13 temporal DDL]  ★★☆
-- PE 6.13(b) — tạo ba relation (date cho thời gian, varchar(5) cho ID, varchar(20) cho value): `t_student(student_id)`, `t_student_name(student_id, value, start_time, end_time)` và `t_advisor(student_id, instructor_id, start_time, end_time)` với primary key như lời giải của sách (end_time nằm trong khoá). t_student_name.student_id và t_advisor.student_id tham chiếu t_student.




-- @ex CK1.13  [PE 6.13 query tại thời điểm]  ★★☆
-- PE 6.13 — dữ liệu có sẵn: `er_t_advisor(student_id, instructor_id, start_time, end_time)`, `er_t_instructor_name(instructor_id, value, start_time, end_time)`. Ai (instructor_id và tên có hiệu lực tại thời điểm đó) là advisor của student `12345` vào ngày `2019-03-15`?
-- Gợi ý: date '2019-03-15' between start_time and end_time — áp dụng cho cả advisor và tên.




-- @ex CK1.14  [PE 6.13 lịch sử]  ★★☆
-- PE 6.13 — liệt kê toàn bộ lịch sử advisor của sinh viên có tên (hiện tại) `Shankar`: instructor_id, start_time, end_time, sắp theo start_time. (Tên sinh viên ở `er_t_student_name`.)
-- (Thứ tự dòng được chấm.)




-- @ex CK1.15  [PE 6.13 snapshot]  ★★★
-- PE 6.13 — "chụp" trạng thái tại ngày `2021-06-01`: tạo view `advisor_snapshot_2021(student_name, instructor_name)` gồm các cặp advisor có hiệu lực ngày đó, với tên sinh viên và tên giảng viên có hiệu lực ngày đó.


