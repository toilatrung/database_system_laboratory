-- =====================================================================
-- CS4420 · Chương 7 — Chuẩn hoá (Relational Database Design) (Normalization)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch7
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex 7.01  [redundancy]  ★☆☆
-- Bảng `nf_in_dep(ID, name, salary, dept_name, building, budget)` là instructor ⋈ department (slide 7.3). Liệt kê các bộ (dept_name, building, budget) bị lặp lại, kèm số lần lặp `copies` (chỉ những bộ xuất hiện từ 2 lần).




-- @ex 7.02  [update anomaly]  ★☆☆
-- Mô phỏng update anomaly: đổi budget của khoa Physics thành 95000 nhưng chỉ ở dòng của giảng viên ID `22222` trong `nf_in_dep`. (Hệ thống sẽ kiểm tra các khoa giờ có nhiều hơn một budget.)




-- @ex 7.03  [test FD]  ★☆☆
-- Bảng `nf_enroll_raw(student_id, student_name, course_id, course_title, grade)` có dữ liệu "bẩn". Trả về các `student_id` vi phạm FD student_id → student_name.
-- Gợi ý: group by student_id having count(distinct student_name) > 1




-- @ex 7.04  [FD violation tuples]  ★★☆
-- Liệt kê mọi dòng (mọi cột) của `nf_enroll_raw` tham gia vi phạm FD course_id → course_title.




-- @ex 7.05  [test FD]  ★★☆
-- Bảng `nf_class` là course ⋈ section ⋈ classroom (slide 7.58). Trả về một dòng, hai cột boolean: `room_capacity` — FD building, room_number → capacity có đúng trên instance không; `course_title` — FD course_id → title có đúng không.
-- Gợi ý: not exists (select ... group by ... having count(distinct ...) > 1)




-- @ex 7.06  [superkey on instance]  ★★☆
-- Trên `nf_class`, kiểm tra hai tập thuộc tính có xác định duy nhất mỗi dòng không. Trả về một dòng hai cột boolean: `k1` cho {course_id, sec_id, semester, year}, `k2` cho {course_id, semester, year}.
-- Gợi ý: count(*) = count(distinct (a, b, ...))




-- @ex 7.07  [not a key]  ★☆☆
-- Vì sao không được dùng name làm khoá khi phân rã `nf_employee(ID, name, street, city, salary)`? Trả về các name bị trùng và số nhân viên mang tên đó (`n`).




-- @ex 7.08  [lossy decomposition]  ★★☆
-- Phân rã `nf_employee` thành R₁(ID, name) và R₂(name, street, city, salary) (slide 7.5). Trả về các tuple giả: có trong Π[R1] ⋈ Π[R2] nhưng không có trong bảng gốc, theo thứ tự cột ID, name, street, city, salary.
-- Gợi ý: (select ID, name, street, city, salary from (...) r1 natural join (...) r2) except (select * from nf_employee)




-- @ex 7.09  [lossy decomposition]  ★☆☆
-- Cùng phân rã như 7.08: trả về một dòng hai cột `original_rows` (số dòng của nf_employee) và `joined_rows` (số dòng của R₁ ⋈ R₂).




-- @ex 7.10  [lossless decomposition]  ★★☆
-- Phân rã `nf_in_dep` thành (ID, name, salary, dept_name) và (dept_name, building, budget). Chứng minh trên dữ liệu là lossless: trả về một dòng ba cột `joined_rows`, `extra` (số tuple có trong join mà không có trong bảng gốc), `missing` (số tuple có trong bảng gốc mà không có trong join).




-- @ex 7.11  [BCNF decomposition]  ★★☆
-- Đưa `nf_in_dep` về BCNF theo FD dept_name → building, budget. Tạo:
-- - `nf_department_part(dept_name primary key, building, budget)`
-- - `nf_instructor_part(ID primary key, name, salary, dept_name)` với dept_name là foreign key tham chiếu nf_department_part
--
-- rồi chép dữ liệu từ nf_in_dep sang (không lặp).
-- Gợi ý: insert into ... select distinct ...; tạo bảng department trước bảng instructor.




-- @ex 7.12  [BCNF decomposition]  ★★★
-- Phân rã `nf_class` về BCNF như slide 7.58–7.59, dùng `create table ... as select distinct`: `nf_c_course(course_id, title, dept_name, credits)`, `nf_c_room(building, room_number, capacity)`, `nf_c_section(course_id, sec_id, semester, year, building, room_number, time_slot_id)`. (Hệ thống đếm số dòng mỗi bảng và số dòng của natural join ba bảng.)




-- @ex 7.13  [test FD (3NF)]  ★☆☆
-- Bảng `nf_dept_advisor(s_ID, i_ID, dept_name)`. Trả về một dòng hai cột boolean: `fd1` — i_ID → dept_name có đúng; `fd2` — s_ID, dept_name → i_ID có đúng.




-- @ex 7.14  [lost dependency]  ★★★
-- Phân rã BCNF của dept_advisor: tạo `nf_da_instr(i_ID primary key, dept_name)` và `nf_da_student(s_ID, i_ID, primary key (s_ID, i_ID))` từ nf_dept_advisor. Sau đó chèn `('00128', '45565')` vào nf_da_student — không có ràng buộc nào của từng bảng bị vi phạm.
-- (Hệ thống join hai bảng để tìm vi phạm s_ID, dept_name → i_ID: đó chính là FD bị mất.)




-- @ex 7.15  [enforce FD by trigger]  ★★★
-- Tạo lại hai bảng `nf_da_instr`, `nf_da_student` như 7.14 (có dữ liệu), rồi viết trigger trên nf_da_student để từ chối insert/update làm một sinh viên có hai advisor cùng khoa (tức ép FD s_ID, dept_name → i_ID qua join).
-- Hệ thống thử chèn ('00128', '45565') — phải bị từ chối — và ('19991', '22222') — phải thành công.
-- Gợi ý: Trigger function plpgsql: if exists (select ... from nf_da_student s join nf_da_instr a ... join nf_da_instr b on b.i_ID = new.i_ID where s.s_ID = new.s_ID and a.dept_name = b.dept_name and s.i_ID <> new.i_ID) then raise exception ...




-- @ex 7.16  [3NF + unique]  ★★☆
-- Giữ `nf_dept_advisor` ở 3NF thì FD s_ID, dept_name → i_ID kiểm tra được bằng một ràng buộc của chính bảng. Thêm ràng buộc đó. (Hệ thống thử chèn ('00128', '45565', 'Comp. Sci.') — phải lỗi — và ('19991', '22222', 'Physics') — phải được.)




-- @ex 7.17  [3NF synthesis]  ★★★
-- Bảng `nf_cust_banker(customer_id, employee_id, branch_name, type)` (slide 7.65). Tạo phân rã 3NF cuối cùng của slide bằng `create table ... as select distinct`: `nf_cb_type(customer_id, employee_id, type)` và `nf_cb_branch(customer_id, branch_name, employee_id)`. (Hệ thống đếm dòng mỗi bảng và kiểm tra join hai bảng tái tạo đúng bảng gốc.)




-- @ex 7.18  [test MVD]  ★★★
-- Bảng `nf_inst_info(ID, child_name, phone)`. MVD ID →→ child_name đúng với một ID khi các dòng của ID đó là đủ mọi tổ hợp con × số điện thoại. Trả về các ID vi phạm.
-- Gợi ý: count(*) <> count(distinct child_name) * count(distinct phone)




-- @ex 7.19  [4NF decomposition]  ★★☆
-- Phân rã 4NF: tạo `nf_inst_child(ID, child_name)` và `nf_inst_phone(ID, phone)` từ nf_inst_info bằng `create table ... as select distinct`. (Hệ thống đếm dòng hai bảng và dòng của join — so với 7 dòng gốc, dòng thừa chính là tổ hợp mà MVD đòi hỏi nhưng instance 88888 còn thiếu.)


