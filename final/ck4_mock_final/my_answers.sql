-- =====================================================================
-- CS4420 · Đề thi thử CK — Đề thi thử cuối kỳ — Chương 6–7 (Mock Final (Chapters 6–7))
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ck4
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CK4.01  [weak entity → DDL]  ★★☆
-- Tạo bảng cho strong entity `hotel(hotel_id varchar(5), name, city)` và weak entity `hotel_room` của hotel với discriminator `room_no varchar(5)` và thuộc tính `floor integer`. Khoá và foreign key đúng quy tắc chuyển weak entity; xoá một hotel thì các phòng của nó bị xoá theo.




-- @ex CK4.02  [M:N → DDL]  ★★★
-- Tiếp CK4.01 (tạo lại hotel, hotel_room trong cùng câu trả lời). Thêm entity `guest(guest_id varchar(5), name)` và relationship many-to-many `stay` giữa guest và hotel_room với thuộc tính `nights integer`. Bảng `stay` có khoá theo quy tắc chuyển M:N và foreign key tới cả hai bên.
-- Gợi ý: Khoá của hotel_room là kép, nên FK từ stay tới hotel_room cũng là kép: foreign key (hotel_id, room_no) references hotel_room.




-- @ex CK4.03  [1:1 + total]  ★★☆
-- Mỗi department có đúng một trưởng khoa là một instructor, và một instructor làm trưởng tối đa một khoa. Tạo bảng `dept_head(dept_name, head_id)` (dept_name là khoá, FK tới department; head_id FK tới instructor) với các ràng buộc ép đúng cardinality one-to-one và total phía department-trong-bảng (head_id không được để trống).
-- Gợi ý: PE 6.9 và 6.10: unique + not null.




-- @ex CK4.04  [multivalued → DDL]  ★☆☆
-- instructor có thuộc tính multivalued `{phone}`. Tạo bảng `inst_phone` tương ứng (cột ID, phone varchar(15)); xoá instructor thì số điện thoại của họ bị xoá theo.




-- @ex CK4.05  [specialization → DDL]  ★★☆
-- vehicle(vin, make) được specialize thành truck(capacity integer) và bus(seats integer). Dùng cách 1: tạo `vehicle(vin varchar(10) primary key, make varchar(20))`, `truck`, `bus` — mỗi bảng con có khoá là vin, tham chiếu vehicle, xoá theo khi xoá vehicle.




-- @ex CK4.06  [FD test (vi phạm)]  ★★☆
-- Trên `fr_enrollment`, FD instructor → course_id có đúng không? Trả về các instructor làm FD này sai (dạy hơn một course) cùng số course khác nhau họ dạy.
-- Gợi ý: PE 7.9: group by vế trái, having count(distinct vế phải) > 1.




-- @ex CK4.07  [FD test (update anomaly)]  ★★☆
-- Bảng `fr_supply` lẽ ra phải thoả supplier_id → supplier_city nhưng dữ liệu bị cập nhật lệch. Tìm các supplier_id vi phạm và số thành phố khác nhau được ghi cho mỗi supplier.




-- @ex CK4.08  [kiểm tra nhiều FD]  ★★★
-- Viết một truy vấn trả về hai cột `fd` (text) và `holds` (boolean) cho 5 FD trên `fr_enrollment`: `'student_id -> student_name'`, `'course_id -> instructor'`, `'instructor -> office'`, `'instructor -> course_id'`, `'office -> instructor'`. (Lưu ý: dữ liệu chỉ chứng minh được một FD sai, không chứng minh được FD đúng với mọi instance.)
-- Gợi ý: not exists (select ... group by X having count(distinct Y) > 1), nối các dòng bằng union all.




-- @ex CK4.09  [phân rã BCNF + lossless]  ★★★
-- Với FD student_id → student_name; course_id → course_title, instructor; instructor → office; (student_id, course_id) → grade, phân rã BCNF của fr_enrollment là:
-- `fr_student(student_id, student_name)`, `fr_course(course_id, course_title, instructor)`, `fr_instructor(instructor, office)`, `fr_grade(student_id, course_id, grade)`.
-- Tạo 4 bảng này bằng `create table ... as select distinct ...` từ fr_enrollment.




-- @ex CK4.10  [phân rã lossy]  ★★★
-- Phân rã sai: chiếu fr_enrollment thành r1(student_id, instructor) và r2(instructor, course_id) (distinct), rồi natural join lại. Trả về hai số: `original_rows` = số bộ (student_id, instructor, course_id) khác nhau trong fr_enrollment, và `joined_rows` = số dòng của r1 ⋈ r2. Vì sao joined_rows lớn hơn?
-- Gợi ý: Phần chung là instructor, mà instructor không phải superkey của r1 hay r2 → lossy (sinh tuple giả).


