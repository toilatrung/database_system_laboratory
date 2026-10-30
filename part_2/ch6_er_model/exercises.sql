-- =====================================================================
-- CS4420 · Chương 6 — Thiết kế CSDL bằng mô hình E-R (Database Design Using the E-R Model)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch6
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex 6.01  [strong entity]  ★☆☆
-- Entity set `lecturer` có thuộc tính ID (khoá), `name` (bắt buộc), `salary`. Tạo bảng `lecturer(ID varchar(5), name varchar(20), salary numeric(8,2))` với primary key và not null phù hợp.




-- @ex 6.02  [composite attribute]  ★☆☆
-- Entity set `applicant`:
-- ```
-- applicant
--   ID
--   name (first_name, middle_initial, last_name)
--   address (street (street_number, street_name, apt_number), city, state, zip)
-- ```
-- Tạo bảng `applicant` bằng cách làm phẳng các composite attribute (mọi cột kiểu varchar(20), ID là primary key).
-- Gợi ý: Chỉ giữ các thuộc tính đơn ở mức lá; không có cột name, address, street.




-- @ex 6.03  [multivalued attribute]  ★★☆
-- instructor có thuộc tính multivalued `{phone_number}`. Tạo bảng `instructor_phone(ID varchar(5), phone_number varchar(15))`: một giảng viên có nhiều số, không lặp cùng một số, ID tham chiếu instructor và tự xoá khi giảng viên bị xoá.




-- @ex 6.04  [derived attribute]  ★★☆
-- Thuộc tính derived `num_advisees()` của instructor = số sinh viên mà giảng viên đó hướng dẫn (bảng advisor). Không lưu cột này; hãy tạo view `instructor_advisees(ID, name, num_advisees)` cho mọi instructor (kể cả người có 0 advisee).
-- Gợi ý: left outer join advisor on advisor.i_ID = instructor.ID; count(advisor.s_ID).




-- @ex 6.05  [weak entity]  ★★☆
-- Weak entity set `course_assignment` phụ thuộc course qua identifying relationship; discriminator là `assign_no`, thêm thuộc tính `title`. Tạo bảng `course_assignment(course_id varchar(8), assign_no integer, title varchar(30))` với primary key đúng của weak entity, foreign key tới owner, và xoá theo owner.
-- Gợi ý: PK = PK(owner) ∪ discriminator; on delete cascade.




-- @ex 6.06  [M:N + attribute]  ★★☆
-- Relationship set many-to-many `mentors` giữa instructor và student, có thuộc tính `start_date date`. Tạo bảng `mentors(i_ID, s_ID, start_date)` (kiểu varchar(5) cho ID) với primary key và các foreign key đúng.




-- @ex 6.07  [many-to-one gộp]  ★★☆
-- Entity `laptop(serial_no, model)` và relationship many-to-one `assigned_to` từ laptop tới student (mỗi laptop giao cho tối đa một sinh viên, một sinh viên có thể giữ nhiều laptop; laptop có thể chưa giao). Không tạo bảng riêng cho relationship: tạo bảng `laptop(serial_no varchar(10), model varchar(20), owner_id varchar(5))`.
-- Gợi ý: owner_id là FK → student, cho phép null (partial).




-- @ex 6.08  [one-to-one]  ★★☆
-- Relationship one-to-one giữa `parking_permit` và instructor: mỗi permit cấp cho đúng một instructor, mỗi instructor có tối đa một permit. Tạo bảng `parking_permit(permit_no varchar(6), i_ID varchar(5), zone varchar(2))`.
-- Gợi ý: i_ID: not null (total phía permit) + unique (one-to-one) + FK.




-- @ex 6.09  [total participation]  ★★☆
-- Entity `textbook(isbn, title)` và relationship many-to-one `used_in` tới course, với total participation của textbook (mỗi sách phải dùng cho đúng một course). Tạo bảng `textbook(isbn varchar(13), title varchar(40), course_id varchar(8))` ép được cả cardinality lẫn total participation.




-- @ex 6.10  [role / recursive]  ★★☆
-- Relationship `coreq` trên cùng entity set course với hai role `course_id` và `coreq_id` (môn phải học song song). Tạo bảng `coreq(course_id varchar(8), coreq_id varchar(8))`: cả hai là course hợp lệ, không lặp cặp, và một môn không thể là coreq của chính nó.




-- @ex 6.11  [cardinality từ dữ liệu]  ★★☆
-- Trong bảng `advisor`, primary key là s_ID nên advisor là many-to-one từ student tới instructor. Kiểm tra trên dữ liệu: liệt kê `i_ID` và số advisee của các instructor hướng dẫn nhiều hơn một sinh viên (chứng tỏ phía instructor là "many").




-- @ex 6.12  [specialization M1 (DDL)]  ★★☆
-- Chuyển specialization person → {employee, student} theo method 1: tạo
-- - `p_person(ID varchar(5) primary key, name varchar(20), street varchar(30), city varchar(20))`
-- - `p_employee(ID, salary numeric(8,2))` và `p_student(ID, tot_cred numeric(3,0))`, trong đó ID của bảng con vừa là primary key vừa là foreign key tới p_person, xoá theo cha.




-- @ex 6.13  [specialization M1 (query)]  ★☆☆
-- Với các bảng method 1 có sẵn `er_person`, `er_employee`, `er_student`: liệt kê ID, name, city, salary của mọi employee. (Nhược điểm method 1: phải join để có đủ thuộc tính.)




-- @ex 6.14  [overlapping / partial]  ★★☆
-- Trên `er_person`, `er_employee`, `er_student`: trả về hai cột `ID, kind`, với kind là `both` cho người vừa là employee vừa là student, `none` cho người không thuộc entity con nào (partial specialization).
-- Gợi ý: Dùng exists / not exists hoặc left join + case.




-- @ex 6.15  [specialization M2]  ★★★
-- Chuyển dữ liệu của `er_person/er_employee/er_student` sang method 2:
-- 1. Tạo bảng `m2_employee(ID, name, street, city, salary)` và `m2_student(ID, name, street, city, tot_credits)` (cùng kiểu với bảng gốc, ID là primary key) và nạp dữ liệu từ các bảng er_.
-- 2. Tạo view `m2_person(ID, name, street, city)` = hợp của hai bảng.
-- Hệ thống sẽ đếm số dòng mỗi bảng, số người bị lặp name/street/city ở cả hai bảng, và số người trong view.
-- Gợi ý: insert into m2_employee select p.ID, name, street, city, salary from er_person p join er_employee ...; view dùng union (loại trùng).




-- @ex 6.16  [aggregation (DDL)]  ★★★
-- Bảng `er_proj_guide(i_ID, s_ID, project_id)` (primary key cả ba cột) và `er_evaluation(evaluation_id, ...)` đã có. Tạo bảng `eval_for(i_ID varchar(5), s_ID varchar(5), project_id varchar(5), evaluation_id varchar(5))` biểu diễn relationship giữa aggregation proj_guide và evaluation.
-- Gợi ý: FK nhiều cột (i_ID, s_ID, project_id) → er_proj_guide; FK evaluation_id → er_evaluation.




-- @ex 6.17  [aggregation (query)]  ★★☆
-- Với `er_proj_guide`, `er_project`, `er_eval_for`, `er_evaluation`: liệt kê mọi bộ hướng dẫn (i_ID, s_ID, project title) kèm grade của evaluation; bộ chưa được đánh giá vẫn xuất hiện với grade null.




-- @ex 6.18  [ternary + arrow]  ★★★
-- Ternary relationship `proj_guide_t(instructor, student, project)` có một mũi tên tới instructor: mỗi cặp (student, project) có tối đa một instructor hướng dẫn. Tạo bảng `proj_guide_t(i_ID varchar(5), s_ID varchar(5), project_id varchar(5))` với primary key phản ánh đúng ràng buộc đó (FK: i_ID → instructor, s_ID → student, project_id → er_project).
-- Gợi ý: Phía có mũi tên không nằm trong primary key.




-- @ex 6.19  [ternary → binary]  ★★★
-- Thay ternary proj_guide bằng entity set `guide_e` (thuộc tính định danh `e_id`) và ba relationship R[A], R[B], R[C] many-to-one, total từ phía E (gộp vào bảng E). Tạo bảng `guide_e(e_id integer, i_ID varchar(5), s_ID varchar(5), project_id varchar(5))` sao cho: mỗi e nối đúng một instructor, một student, một project, và không có hai e cho cùng bộ (i_ID, s_ID, project_id).
-- Gợi ý: not null cho cả ba FK (total participation của E), unique (i_ID, s_ID, project_id).




-- @ex 6.20  [reduction tổng hợp]  ★★★
-- Chuyển đoạn E-R sau thành bảng (kiểu: varchar(10) cho mọi khoá/chuỗi, numeric(10,2) cho tiền, date cho ngày):
-- ```
-- [hotel] hotel_id, name, {phone}
-- [room]  (weak, owner = hotel) room_no (discriminator), rate
-- [guest] guest_id, name
--   many-to-many giữa guest và room, thuộc tính check_in
-- ```
-- Tạo các bảng `hotel(hotel_id, name)`, `hotel_phone(hotel_id, phone)`, `room(hotel_id, room_no, rate)`, `guest(guest_id, name)`, `stay(guest_id, hotel_id, room_no, check_in)` với đủ primary key, foreign key (room và hotel_phone xoá theo hotel). Một khách có thể ở cùng phòng nhiều lần ở các ngày check_in khác nhau.
-- Gợi ý: stay: PK (guest_id, hotel_id, room_no, check_in); FK (hotel_id, room_no) → room.


