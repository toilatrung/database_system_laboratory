-- =====================================================================
-- CS4420 · Chương 2 — Mô hình quan hệ & Đại số quan hệ (Intro to Relational Model)
-- Dialect: PostgreSQL. Database: University (db/*.sql)
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động:   npm run grade -- ch2
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex 2.01  [σ select]  ★☆☆
-- Viết SQL tương đương với σ[dept_name="Physics"](instructor).
-- Gợi ý: σ ứng với mệnh đề where; lấy mọi cột.




-- @ex 2.02  [σ select]  ★☆☆
-- σ[dept_name="Physics" ∧ salary>90000](instructor)
-- Gợi ý: ∧ là and.




-- @ex 2.03  [σ select]  ★☆☆
-- σ[dept_name=building](department) — khoa có tên trùng với tên toà nhà (so sánh 2 thuộc tính).
-- Gợi ý: Kết quả có thể rỗng — vẫn đúng!




-- @ex 2.04  [Π project]  ★☆☆
-- Π[ID, name, salary](instructor). Nhớ rằng project trong relational algebra loại bỏ dòng trùng.
-- Gợi ý: select distinct ...




-- @ex 2.05  [composition]  ★☆☆
-- Π[name](σ[dept_name="Physics"](instructor))




-- @ex 2.06  [× product]  ★★☆
-- Đếm số tuple của instructor × teaches (trả về 1 cột, 1 dòng).
-- Gợi ý: from instructor, teaches; dùng count(*).




-- @ex 2.07  [⋈ join]  ★★☆
-- σ[instructor.ID = teaches.ID](instructor × teaches) — trả về tất cả cột của cả hai bảng.
-- Gợi ý: Cartesian product + điều kiện where.




-- @ex 2.08  [∪ union]  ★★☆
-- Π[course_id](σ[semester="Fall" ∧ year=2017](section)) ∪ Π[course_id](σ[semester="Spring" ∧ year=2018](section))




-- @ex 2.09  [∩ intersection]  ★★☆
-- Các course_id được dạy ở cả Fall 2017 và Spring 2018.




-- @ex 2.10  [− difference]  ★★☆
-- Các course_id dạy ở Fall 2017 nhưng không dạy ở Spring 2018.




-- @ex 2.11  [ρ rename]  ★★★
-- Không dùng max: tìm lương cao nhất bằng cách lấy tất cả mức lương trừ đi các mức lương nhỏ hơn một mức lương khác (xem câu hỏi tự luận cùng chương).
-- Gợi ý: instructor × ρ_d(instructor) ⇒ from instructor, instructor as d




-- @ex 2.12  [𝒢 aggregation]  ★★☆
-- [dept_name]𝒢[avg(salary)](instructor) — trả về dept_name và lương trung bình.




-- @ex 2.13  [𝒢 aggregation]  ★★☆
-- 𝒢[count(course_id)](σ[year=2018](section)) — số section trong năm 2018.




-- @ex 2.14  [keys]  ★★★
-- Kiểm tra bằng dữ liệu: {ID, course_id} có phải superkey của takes không? Liệt kê các cặp (ID, course_id) xuất hiện nhiều hơn 1 lần trong takes, kèm số lần.
-- Gợi ý: group by ID, course_id having count(*) > 1


