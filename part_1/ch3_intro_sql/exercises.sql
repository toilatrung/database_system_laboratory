-- =====================================================================
-- CS4420 · Chương 3 — Nhập môn SQL (Introduction to SQL)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch3
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex 3.01  [select]  ★☆☆
-- Tìm tên của tất cả instructor.




-- @ex 3.02  [distinct]  ★☆☆
-- Tìm tên các khoa (dept_name) có giảng viên, không lặp lại.




-- @ex 3.03  [arithmetic]  ★☆☆
-- Liệt kê ID, name và lương tháng (salary / 12) của mỗi instructor, đặt tên cột là `monthly_salary`.




-- @ex 3.04  [where]  ★☆☆
-- Tên các instructor khoa `Comp. Sci.` có lương lớn hơn 70000.




-- @ex 3.05  [between]  ★☆☆
-- Tên các instructor có lương từ 90000 đến 100000 (bao gồm cả hai đầu).




-- @ex 3.06  [order by]  ★☆☆
-- Liệt kê dept_name, name, salary của instructor, sắp xếp theo dept_name tăng dần, trong cùng khoa thì salary giảm dần.
-- (Thứ tự dòng được chấm.)




-- @ex 3.07  [like]  ★☆☆
-- Tìm title của các course có chứa chuỗi `Intro` ở đầu tên.
-- Gợi ý: Pattern 'Intro%'




-- @ex 3.08  [like]  ★★☆
-- Tìm tên instructor có đúng 5 ký tự và chứa chữ `i`.
-- Gợi ý: Kết hợp '_____' và '%i%'.




-- @ex 3.09  [string functions]  ★★☆
-- Với mỗi course, trả về một cột duy nhất dạng `CS-101: Intro. to Computer Science` (course_id, dấu hai chấm, khoảng trắng, title), đặt tên `label`.
-- Gợi ý: Toán tử nối chuỗi ||




-- @ex 3.10  [from (join)]  ★☆☆
-- Tên instructor và course_id của các môn họ đã dạy.




-- @ex 3.11  [from (join)]  ★★☆
-- Tên instructor khoa `Comp. Sci.` và title các môn họ đã dạy (không lặp lại).
-- Gợi ý: Cần 3 bảng: instructor, teaches, course.




-- @ex 3.12  [rename]  ★★☆
-- Tên (không lặp) các instructor có lương cao hơn ít nhất một instructor khoa `Comp. Sci.` — dùng rename `T`, `S` (không dùng some).




-- @ex 3.13  [self join]  ★★☆
-- Bảng `emp_super(person, supervisor)`: tìm supervisor của supervisor của `Bob`.




-- @ex 3.14  [tuple comparison]  ★★☆
-- Dùng tuple comparison `(a, b) = (x, y)`: tìm name, course_id của instructor khoa `Comp. Sci.` cùng các môn họ dạy.




-- @ex 3.15  [union]  ★☆☆
-- Các course_id mở ở Fall 2017 hoặc Spring 2018.




-- @ex 3.16  [union all]  ★★☆
-- Như câu trên nhưng giữ lại dòng trùng (một môn mở ở cả hai kỳ xuất hiện 2 lần; môn có 2 section trong một kỳ cũng xuất hiện 2 lần).




-- @ex 3.17  [except]  ★★☆
-- ID của các sinh viên chưa từng học môn nào (dùng except).




-- @ex 3.18  [null]  ★☆☆
-- Tìm ID, course_id của các bản ghi takes chưa có điểm (grade là null).




-- @ex 3.19  [null]  ★★☆
-- Đếm số bản ghi takes có điểm và khác F. Lưu ý null: `grade <> 'F'` với grade null cho kết quả gì?
-- Gợi ý: grade <> 'F' với null → unknown → bị loại. Thử tự kiểm chứng!




-- @ex 3.20  [aggregate]  ★☆☆
-- Lương trung bình của instructor khoa `Comp. Sci.`




-- @ex 3.21  [count distinct]  ★☆☆
-- Số instructor (khác nhau) dạy ít nhất một môn trong học kỳ Spring 2018.




-- @ex 3.22  [group by]  ★☆☆
-- Với mỗi khoa: dept_name và lương trung bình (`avg_salary`).




-- @ex 3.23  [having]  ★★☆
-- dept_name và lương trung bình của các khoa có lương trung bình > 42000.




-- @ex 3.24  [group by]  ★★☆
-- Với mỗi section (course_id, sec_id, semester, year) có sinh viên học: số sinh viên đăng ký.




-- @ex 3.25  [group by + join]  ★★☆
-- Với mỗi sinh viên có học môn: ID, name và tổng số tín chỉ của các môn đã học (tính cả môn trượt), sắp theo ID.
-- (Thứ tự dòng được chấm.)




-- @ex 3.26  [having]  ★★★
-- Với mỗi khoa có ít nhất 2 instructor: dept_name, số instructor, lương lớn nhất. Chỉ tính instructor có lương > 50000.
-- Gợi ý: where lọc lương trước, having lọc nhóm sau.




-- @ex 3.27  [in]  ★★☆
-- Dùng in: các course_id (không lặp) mở ở Fall 2017 và Spring 2018.




-- @ex 3.28  [not in]  ★★☆
-- Dùng not in: các course_id mở ở Fall 2017 nhưng không mở ở Spring 2018.




-- @ex 3.29  [in (tuple)]  ★★☆
-- Đếm số sinh viên (khác nhau) đã học các section do instructor `10101` dạy — dùng `(course_id, sec_id, semester, year) in (...)`.




-- @ex 3.30  [some]  ★★☆
-- Dùng > some: tên instructor có lương lớn hơn lương của ít nhất một instructor khoa `Biology`.




-- @ex 3.31  [all]  ★★☆
-- Dùng > all: tên instructor có lương lớn hơn lương của tất cả instructor khoa `Finance`.




-- @ex 3.32  [all]  ★★★
-- Tìm (các) khoa có lương trung bình cao nhất — dùng `>= all`.




-- @ex 3.33  [exists]  ★★☆
-- Dùng exists (correlated subquery): các course_id mở ở Fall 2017 và Spring 2018.




-- @ex 3.34  [not exists]  ★★★
-- ID và name của các sinh viên đã học tất cả các môn của khoa `Biology` *đã từng mở lớp* (course_id xuất hiện trong section). Dùng `not exists (... except ...)`.
-- Gợi ý: X = các môn Biology có trong section; Y = các môn sinh viên S đã học. X ⊆ Y.




-- @ex 3.35  [not exists]  ★★★
-- ID và name các sinh viên đã học tất cả các môn khoa `Biology` (kể cả môn chưa mở — đúng như slide). Kết quả rỗng có hợp lý không?




-- @ex 3.36  ["unique"]  ★★★
-- Các course_id được mở nhiều nhất một lần trong năm 2017 (gồm cả môn không mở lần nào). PostgreSQL không có `unique (subquery)` — hãy dùng scalar subquery đếm.




-- @ex 3.37  [from subquery]  ★★☆
-- Không dùng having: dept_name và avg_salary của các khoa có lương trung bình > 42000 (subquery trong from).




-- @ex 3.38  [with]  ★★☆
-- Dùng with: tìm dept_name của (các) khoa có budget lớn nhất.




-- @ex 3.39  [with]  ★★★
-- Dùng with 2 bảng tạm: các khoa có tổng lương lớn hơn trung bình của tổng lương các khoa.




-- @ex 3.40  [scalar subquery]  ★★☆
-- Liệt kê mọi khoa cùng số instructor của khoa đó (`num_instructors`) — dùng scalar subquery trong select.




-- @ex 3.41  [insert]  ★☆☆
-- Thêm môn `CS-437`, title `Database Systems`, khoa `Comp. Sci.`, 4 tín chỉ. (Hệ thống sẽ kiểm tra bảng course sau khi chạy.)




-- @ex 3.42  [insert null]  ★☆☆
-- Thêm sinh viên `3003`, tên `Green`, khoa `Finance`, tot_cred null — chỉ liệt kê các cột cần thiết.




-- @ex 3.43  [insert ... select]  ★★☆
-- Biến mọi sinh viên khoa `Comp. Sci.` có tot_cred > 100 thành instructor cùng khoa với lương 30000 (insert … select).




-- @ex 3.44  [delete]  ★★☆
-- Xoá mọi instructor thuộc các khoa đặt ở toà nhà `Watson`.




-- @ex 3.45  [delete]  ★★☆
-- Xoá mọi instructor có lương thấp hơn lương trung bình của tất cả instructor.




-- @ex 3.46  [update]  ★☆☆
-- Tăng 5% lương cho các instructor có lương dưới 70000.




-- @ex 3.47  [update case]  ★★☆
-- Dùng một câu update với `case`: lương > 90000 tăng 3%, còn lại tăng 5%.




-- @ex 3.48  [update scalar subquery]  ★★★
-- Tính lại `tot_cred` cho mọi sinh viên = tổng credits các môn đã qua (grade khác F và khác null). Sinh viên chưa qua môn nào thì tot_cred = 0 (không phải null).
-- Gợi ý: coalesce(sum(credits), 0) hoặc case when sum(credits) is not null then ... else 0 end




-- @ex 3.49  [alter table]  ★★☆
-- Thêm cột `email varchar(50)` vào bảng student. Sau đó gán email `zhang@uni.edu` cho sinh viên `00128`.




-- @ex 3.50  [create table]  ★★☆
-- Tạo bảng `club(club_id char(4), name varchar(30) not null, dept_name varchar(20))` với primary key club_id và foreign key dept_name tham chiếu department. Thêm câu lạc bộ `C001`, `Robotics Club`, `Comp. Sci.`.


