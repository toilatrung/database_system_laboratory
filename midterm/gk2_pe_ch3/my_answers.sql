-- =====================================================================
-- CS4420 · Ôn GK · Phần 2 — Practice Exercises Chương 3 (Introduction to SQL) (Practice Exercises — Chapter 3)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- gk2
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex GK2.01  [PE 3.1a where]  ★☆☆
-- PE 3.1a — Title các course của khoa Comp. Sci. có 3 credits.




-- @ex GK2.02  [PE 3.1b join, distinct]  ★☆☆
-- PE 3.1b — ID của mọi sinh viên được dạy bởi một instructor tên Einstein, không trùng lặp.
-- Gợi ý: takes khớp teaches trên (course_id, sec_id, semester, year); teaches.ID = instructor.ID.




-- @ex GK2.03  [PE 3.1c max]  ★☆☆
-- PE 3.1c — Lương cao nhất của một instructor.




-- @ex GK2.04  [PE 3.1d subquery]  ★☆☆
-- PE 3.1d — ID, name của mọi instructor có lương cao nhất (có thể nhiều người).




-- @ex GK2.05  [PE 3.1e scalar subquery]  ★★☆
-- PE 3.1e — Enrollment (số sinh viên) của mỗi section mở ở Fall 2017: course_id, sec_id, enrollment. Section không có sinh viên phải có enrollment 0.
-- Gợi ý: Scalar subquery trong select.




-- @ex GK2.06  [PE 3.1e empty section]  ★★☆
-- PE 3.1e (bẫy section rỗng) — Tạo view `gk_fall2017_enrollment(course_id, sec_id, enrollment)` chứa enrollment của mỗi section Fall 2017. Khi chấm, hệ thống thêm một section Fall 2017 không có sinh viên rồi đọc view: section đó phải có enrollment 0.
-- Gợi ý: Cách join + group by sẽ làm mất section mới.




-- @ex GK2.07  [PE 3.1f max of aggregate]  ★★☆
-- PE 3.1f — Enrollment lớn nhất trên mọi section ở Fall 2017 (một giá trị).




-- @ex GK2.08  [PE 3.1g with]  ★★☆
-- PE 3.1g — Các section (course_id, sec_id) có enrollment lớn nhất ở Fall 2017. Dùng `with`.




-- @ex GK2.09  [PE 3.2a grade points]  ★★☆
-- PE 3.2a — Tổng grade points (credits × points) mà sinh viên `12345` đạt được qua mọi course đã học. Bảng `grade_points(grade, points)` có sẵn.




-- @ex GK2.10  [PE 3.2b GPA]  ★★☆
-- PE 3.2b — GPA của sinh viên `12345`: tổng grade points chia tổng credits của các course tương ứng. Đặt tên cột `GPA`.




-- @ex GK2.11  [PE 3.2c group by]  ★★☆
-- PE 3.2c — ID và GPA của mỗi sinh viên (chỉ những sinh viên có ít nhất một môn đã có điểm).




-- @ex GK2.12  [PE 3.2c union null]  ★★★
-- PE 3.2c (đầy đủ) — Như GK2.11 nhưng sinh viên chưa học môn nào cũng xuất hiện với GPA = null. Không dùng outer join (dùng `union` như lời giải sách).




-- @ex GK2.13  [PE 3.2d null grade]  ★★★
-- PE 3.2d — Sinh viên `98988` (Tanaka) có một môn chưa có điểm (grade null). Trả về hai cột: `naive_gpa` = sum(credits × points) / sum(credits) tính trên `takes natural join course left join grade_points using (grade)` (không lọc gì), và `correct_gpa` = GPA chỉ tính các môn đã có điểm.
-- Gợi ý: Ở cách naive, credits của môn null vẫn bị cộng vào mẫu số (vì sum(credits) không bỏ qua dòng có points null). Dùng case when grade is null then 0 else credits end.




-- @ex GK2.14  [PE 3.3a update]  ★☆☆
-- PE 3.3a — Tăng 10% lương của mỗi instructor khoa Comp. Sci.




-- @ex GK2.15  [PE 3.3b delete]  ★☆☆
-- PE 3.3b — Xoá mọi course chưa bao giờ được mở (không xuất hiện trong section).




-- @ex GK2.16  [PE 3.3c insert select]  ★★☆
-- PE 3.3c — Chèn mọi student có `tot_cred > 100` làm instructor cùng khoa. Sách dùng lương 10000, nhưng schema có `check (salary > 29000)` nên lệnh đó bị từ chối (23514) — hãy dùng lương 30000.




-- @ex GK2.17  [PE 3.4a count distinct]  ★★☆
-- PE 3.4a (Insurance database) — Tổng số người sở hữu xe có dính tai nạn năm 2017.
-- Gợi ý: accident → participated → owns (theo license_plate); count(distinct ...).




-- @ex GK2.18  [PE 3.4b delete in]  ★★☆
-- PE 3.4b — Xoá mọi xe đời 2010 thuộc về người có driver_id `12345`. (owns và participated khai báo `on delete cascade` tới car.)




-- @ex GK2.19  [PE 3.5a case]  ★☆☆
-- PE 3.5a — Hiển thị ID và grade của mỗi sinh viên trong `marks(ID, score)`: F nếu score < 40, C nếu 40 ≤ score < 60, B nếu 60 ≤ score < 80, A nếu score ≥ 80.




-- @ex GK2.20  [PE 3.5b group by case]  ★★☆
-- PE 3.5b — Số sinh viên đạt mỗi grade (grade, count).




-- @ex GK2.21  [PE 3.6 lower like]  ★☆☆
-- PE 3.6 — Tên các department có chứa chuỗi `sci` (không phân biệt hoa thường).




-- @ex GK2.22  [PE 3.6 lower like]  ★☆☆
-- PE 3.6 (biến thể) — Title các course chứa chuỗi `INTRO` không phân biệt hoa thường. (Thử `like '%INTRO%'` trước để thấy like phân biệt hoa thường.)




-- @ex GK2.23  [PE 3.7 empty relation]  ★★★
-- PE 3.7 — Tạo bảng `gk_p(a1 int)` = {1, 2, 3}, `gk_r1(a1 int)` = {1, 2} và `gk_r2(a1 int)` rỗng. Câu của sách `select gk_p.a1 from gk_p, gk_r1, gk_r2 where gk_p.a1 = gk_r1.a1 or gk_p.a1 = gk_r2.a1` trả về rỗng. Viết câu đúng trả về các giá trị của gk_p có trong gk_r1 hoặc gk_r2.
-- Gợi ý: in (select ... union select ...).




-- @ex GK2.24  [PE 3.8a except]  ★☆☆
-- PE 3.8a (Bank database) — ID của mỗi khách hàng có account nhưng không có loan.




-- @ex GK2.25  [PE 3.8b self join]  ★★☆
-- PE 3.8b — ID của mỗi khách hàng sống cùng street và cùng city với khách hàng `12345` (kể cả chính 12345). Lưu ý: lời giải sách viết `S.customer_id` — cột đúng là `ID`.




-- @ex GK2.26  [PE 3.8c join]  ★★☆
-- PE 3.8c — Tên mỗi branch có ít nhất một khách hàng có account ở đó và sống ở Harrison.




-- @ex GK2.27  [PE 3.9a join]  ★☆☆
-- PE 3.9a (Employee database) — ID, tên và thành phố cư trú của mỗi nhân viên làm cho First Bank Corporation.




-- @ex GK2.28  [PE 3.9b in]  ★☆☆
-- PE 3.9b — ID, tên, thành phố của mỗi nhân viên làm cho First Bank Corporation và có lương > 10000.




-- @ex GK2.29  [PE 3.9c not in]  ★★☆
-- PE 3.9c — ID của mỗi nhân viên không làm cho First Bank Corporation, kể cả người không có trong works.
-- Gợi ý: company_name <> ... trên works sẽ bỏ sót người không có trong works.




-- @ex GK2.30  [PE 3.9d > all]  ★★☆
-- PE 3.9d — ID của mỗi nhân viên có lương cao hơn mọi nhân viên của Small Bank Corporation.




-- @ex GK2.31  [PE 3.9e not exists except]  ★★★
-- PE 3.9e — Một công ty có thể đặt ở nhiều thành phố (`company(company_name, city)`). Tên mỗi công ty đặt ở mọi thành phố mà Small Bank Corporation có mặt.




-- @ex GK2.32  [PE 3.9f having >= all]  ★★★
-- PE 3.9f — Tên công ty có nhiều nhân viên nhất (trả về tất cả nếu hoà).




-- @ex GK2.33  [PE 3.9g having avg]  ★★☆
-- PE 3.9g — Tên mỗi công ty có lương trung bình của nhân viên cao hơn lương trung bình ở First Bank Corporation.




-- @ex GK2.34  [PE 3.10a update]  ★☆☆
-- PE 3.10a — Nhân viên có ID `12345` nay sống ở Newtown.




-- @ex GK2.35  [PE 3.10b update case]  ★★★
-- PE 3.10b — Tăng 10% lương cho mỗi manager (xuất hiện trong `manages.manager_id`) làm cho First Bank Corporation, trừ khi lương sau khi tăng vượt 100000 — khi đó chỉ tăng 3%. Viết một lệnh update dùng `case`.




-- @ex GK2.36  [PE 3.10b two updates]  ★★★
-- PE 3.10b (hai lệnh) — Viết lại GK2.35 bằng hai lệnh update không dùng case, theo đúng thứ tự để không ai bị tăng hai lần. Kết quả phải giống GK2.35.
-- Gợi ý: Lệnh 3% (salary * 1.1 > 100000) chạy trước.


