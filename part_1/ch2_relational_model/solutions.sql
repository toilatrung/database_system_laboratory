-- =====================================================================
-- CS4420 · Chương 2 — Mô hình quan hệ & Đại số quan hệ (Intro to Relational Model)
-- Dialect: PostgreSQL. Database: University (db/*.sql)
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại db/*.sql.

-- @ex 2.01  [σ select]  ★☆☆
-- Viết SQL tương đương với σ[dept_name="Physics"](instructor).
-- Gợi ý: σ ứng với mệnh đề where; lấy mọi cột.
select * from instructor where dept_name = 'Physics';

-- @ex 2.02  [σ select]  ★☆☆
-- σ[dept_name="Physics" ∧ salary>90000](instructor)
-- Gợi ý: ∧ là and.
select * from instructor where dept_name = 'Physics' and salary > 90000;

-- @ex 2.03  [σ select]  ★☆☆
-- σ[dept_name=building](department) — khoa có tên trùng với tên toà nhà (so sánh 2 thuộc tính).
-- Gợi ý: Kết quả có thể rỗng — vẫn đúng!
select * from department where dept_name = building;

-- @ex 2.04  [Π project]  ★☆☆
-- Π[ID, name, salary](instructor). Nhớ rằng project trong relational algebra loại bỏ dòng trùng.
-- Gợi ý: select distinct ...
select distinct ID, name, salary from instructor;

-- @ex 2.05  [composition]  ★☆☆
-- Π[name](σ[dept_name="Physics"](instructor))
select distinct name from instructor where dept_name = 'Physics';

-- @ex 2.06  [× product]  ★★☆
-- Đếm số tuple của instructor × teaches (trả về 1 cột, 1 dòng).
-- Gợi ý: from instructor, teaches; dùng count(*).
select count(*) from instructor, teaches;

-- @ex 2.07  [⋈ join]  ★★☆
-- σ[instructor.ID = teaches.ID](instructor × teaches) — trả về tất cả cột của cả hai bảng.
-- Gợi ý: Cartesian product + điều kiện where.
select * from instructor, teaches where instructor.ID = teaches.ID;

-- @ex 2.08  [∪ union]  ★★☆
-- Π[course_id](σ[semester="Fall" ∧ year=2017](section)) ∪ Π[course_id](σ[semester="Spring" ∧ year=2018](section))
select course_id from section where semester = 'Fall' and year = 2017
union
select course_id from section where semester = 'Spring' and year = 2018;

-- @ex 2.09  [∩ intersection]  ★★☆
-- Các course_id được dạy ở cả Fall 2017 và Spring 2018.
select course_id from section where semester = 'Fall' and year = 2017
intersect
select course_id from section where semester = 'Spring' and year = 2018;

-- @ex 2.10  [− difference]  ★★☆
-- Các course_id dạy ở Fall 2017 nhưng không dạy ở Spring 2018.
select course_id from section where semester = 'Fall' and year = 2017
except
select course_id from section where semester = 'Spring' and year = 2018;

-- @ex 2.11  [ρ rename]  ★★★
-- Không dùng max: tìm lương cao nhất bằng cách lấy tất cả mức lương trừ đi các mức lương nhỏ hơn một mức lương khác (xem câu hỏi tự luận cùng chương).
-- Gợi ý: instructor × ρ_d(instructor) ⇒ from instructor, instructor as d
select salary from instructor
except
select instructor.salary
from instructor, instructor as d
where instructor.salary < d.salary;

-- @ex 2.12  [𝒢 aggregation]  ★★☆
-- [dept_name]𝒢[avg(salary)](instructor) — trả về dept_name và lương trung bình.
select dept_name, avg(salary) from instructor group by dept_name;

-- @ex 2.13  [𝒢 aggregation]  ★★☆
-- 𝒢[count(course_id)](σ[year=2018](section)) — số section trong năm 2018.
select count(course_id) from section where year = 2018;

-- @ex 2.14  [keys]  ★★★
-- Kiểm tra bằng dữ liệu: {ID, course_id} có phải superkey của takes không? Liệt kê các cặp (ID, course_id) xuất hiện nhiều hơn 1 lần trong takes, kèm số lần.
-- Gợi ý: group by ID, course_id having count(*) > 1
select ID, course_id, count(*)
from takes
group by ID, course_id
having count(*) > 1;
