-- =====================================================================
-- CS4420 · Chương 5 — SQL nâng cao (Advanced SQL)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch5
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex 5.01  [function]  ★★☆
-- Tạo function `dept_count(dname varchar(20)) returns integer` (PL/pgSQL) trả về số instructor của khoa. Sau đó dùng nó tìm dept_name, budget của các khoa có hơn 2 instructor.
-- Gợi ý: Đặt tên tham số là dname (không phải dept_name) để khỏi nhầm với tên cột.




-- @ex 5.02  [table function]  ★★☆
-- Tạo table function `instructor_of(dname varchar(20))` trả về bảng (ID, name, dept_name, salary) gồm instructor của khoa dname.
-- Gợi ý: returns table (...) language sql as $$ select ... $$; dùng: select * from instructor_of('Music')




-- @ex 5.03  [procedure]  ★★☆
-- Tạo procedure `dept_count_proc(in dname varchar(20), out d_count integer)`. Gọi thử bằng `call dept_count_proc('Physics', null);`




-- @ex 5.04  [for loop]  ★★☆
-- Tạo function `building_budget(bldg varchar(15)) returns numeric` tính tổng budget các khoa đặt ở toà nhà bldg bằng vòng lặp for (không dùng sum).




-- @ex 5.05  [if / elsif]  ★☆☆
-- Tạo function `salary_level(sal numeric) returns varchar` trả về `'high'` nếu sal ≥ 90000, `'medium'` nếu sal ≥ 70000, ngược lại `'low'`.




-- @ex 5.06  [procedure + update]  ★★☆
-- Tạo procedure `give_raise(dname varchar(20), pct numeric)` tăng lương pct% cho instructor khoa dname. Gọi `call give_raise('Comp. Sci.', 10);`




-- @ex 5.07  [row trigger]  ★★★
-- Cài trigger `credits_earned` như slide bằng PostgreSQL: khi grade của takes được update từ F hoặc null sang điểm qua (khác F, không null) thì cộng credits của môn vào tot_cred của sinh viên.
-- Hệ thống sẽ thử: Tanaka BIO-301 null → B (cộng 4), rồi B → A (không cộng), Levy CS-101 Fall F → B (cộng 4).
-- Gợi ý: create function ... returns trigger (dùng new, old) + create trigger ... after update of grade on takes for each row when (...) execute function ...




-- @ex 5.08  [before trigger]  ★★☆
-- Tạo trigger before insert or update trên takes: nếu grade là chuỗi rỗng `''` hoặc chỉ toàn khoảng trắng thì đổi thành null.




-- @ex 5.09  [audit trigger]  ★★☆
-- Tạo bảng `salary_audit(ID varchar(5), old_salary numeric(8,2), new_salary numeric(8,2))` và trigger ghi lại mỗi lần salary của instructor thay đổi (chỉ khi giá trị thực sự khác).
-- Gợi ý: when (old.salary is distinct from new.salary)




-- @ex 5.10  [statement trigger]  ★★★
-- Tạo bảng `update_log(table_name text, num_rows integer)` và một trigger statement-level (`for each statement`) dùng transition table (`referencing new table as ...`) để ghi số dòng bị update mỗi khi chạy update trên instructor.




-- @ex 5.11  [with recursive]  ★★☆
-- Dùng with recursive trên emp_super: tìm tất cả supervisor (trực tiếp và gián tiếp) của `Bob`.




-- @ex 5.12  [transitive closure]  ★★☆
-- Trước tiên thêm 2 dòng prereq `('CS-319', 'CS-190')` và `('BIO-399', 'BIO-301')` để có chuỗi nhiều mức. Sau đó tính rec_prereq(course_id, prereq_id) — transitive closure của prereq.




-- @ex 5.13  [recursion + depth]  ★★★
-- Tìm mọi cấp dưới (trực tiếp và gián tiếp) của `Mary` cùng cấp độ (`level`: cấp dưới trực tiếp = 1, cấp dưới của họ = 2, …). Trả về person, level.




-- @ex 5.14  [rank]  ★☆☆
-- Xếp hạng sinh viên theo GPA giảm dần từ `student_grades`, sinh viên GPA null xếp cuối. Trả về ID, GPA, s_rank.




-- @ex 5.15  [dense_rank]  ★☆☆
-- Như 5.14 (bỏ qua sinh viên GPA null) nhưng trả về cả `rank()` và `dense_rank()` để so sánh: ID, GPA, r, dr.




-- @ex 5.16  [rank without window]  ★★★
-- Tính hạng như 5.15 (cột r) không dùng window function: hạng = 1 + số sinh viên có GPA cao hơn. Bỏ qua GPA null. Trả về ID, s_rank.




-- @ex 5.17  [partition by]  ★★☆
-- Xếp hạng sinh viên trong từng khoa theo GPA giảm dần (`dept_grades`, bỏ GPA null). Trả về ID, dept_name, dept_rank.




-- @ex 5.18  [top-n per group]  ★★★
-- Sinh viên có GPA cao nhất mỗi khoa (nếu bằng nhau lấy hết). Trả về dept_name, ID, GPA.




-- @ex 5.19  [ntile]  ★★☆
-- Chia sinh viên (GPA không null) thành 4 nhóm (quartile) theo GPA giảm dần. Trả về ID, GPA, quartile. *(Lưu ý: ntile với giá trị trùng có thể không xác định — ở đây hãy thêm ID vào order by để cố định: `order by GPA desc, ID`.)*




-- @ex 5.20  [percent_rank / cume_dist]  ★★☆
-- Với sinh viên có GPA: ID, GPA, `percent_rank()` và `cume_dist()` theo GPA tăng dần.




-- @ex 5.21  [moving average]  ★★☆
-- Từ `daily_sales`: với mỗi ngày, trung bình value của ngày trước, ngày đó và ngày sau (`moving_avg`). Sắp theo sale_date.
-- (Thứ tự dòng được chấm.)




-- @ex 5.22  [running total]  ★★☆
-- Từ `account_txn`: số dư của mỗi tài khoản sau mỗi giao dịch (`balance`). Trả về account_number, date_time, value, balance, sắp theo account_number, date_time.
-- (Thứ tự dòng được chấm.)




-- @ex 5.23  [range window]  ★★★
-- Từ `daily_sales`: với mỗi ngày, tổng value trong 3 ngày gần nhất tính cả ngày đó (`range between interval '2 day' preceding and current row`). Sắp theo sale_date.
-- (Thứ tự dòng được chấm.)




-- @ex 5.24  [cross-tab data]  ★☆☆
-- Tổng quantity theo (item_name, color) từ bảng `sales`.




-- @ex 5.25  [pivot]  ★★☆
-- Tạo cross-tab: mỗi dòng là một item_name, các cột `dark`, `pastel`, `white`, `total` là tổng quantity. Sắp theo item_name.
-- Gợi ý: sum(quantity) filter (where color = 'dark') — hoặc sum(case when color = 'dark' then quantity else 0 end)
-- (Thứ tự dòng được chấm.)




-- @ex 5.26  [cube]  ★★☆
-- Dùng cube(item_name, color): tổng quantity cho mọi tổ hợp, kể cả dòng tổng. Trả về item_name, color, total.




-- @ex 5.27  [grouping()]  ★★★
-- Như 5.26 nhưng thay null "all" bằng chữ `'all'` (dùng `grouping()` + case, tương đương `decode` trong slide).




-- @ex 5.28  [rollup]  ★★☆
-- Dùng rollup(item_name, color, clothes_size): tổng quantity. Trả về item_name, color, clothes_size, total.




-- @ex 5.29  [rollup + hierarchy]  ★★☆
-- Kết hợp `sales` với `itemcategory`, dùng rollup(category, item_name) để có tổng theo từng item, từng category và tổng chung. Trả về category, item_name, total.




-- @ex 5.30  [multiple rollups]  ★★★
-- `group by rollup(item_name), rollup(color, clothes_size)` sinh ra bao nhiêu dòng kết quả trên bảng sales? Viết truy vấn đếm (1 cột, 1 dòng).


