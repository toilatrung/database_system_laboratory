-- =====================================================================
-- CS4420 · Chương 14 — Index (Indexing)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch14
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH14.01  [create index]  ★☆☆
-- Tạo index B+-tree (mặc định) trên `instructor(dept_name)` để tăng tốc các truy vấn lọc theo khoa. Hệ thống liệt kê mọi index (không kể primary key) của instructor qua catalog.




-- @ex CH14.02  [composite index]  ★★☆
-- Truy vấn thường xuyên: `select * from instructor where dept_name = ? and salary > ?`. Tạo một composite index phù hợp nhất (thứ tự cột quan trọng: điều kiện bằng trước, điều kiện khoảng sau).




-- @ex CH14.03  [unique expression index]  ★★☆
-- Không cho hai sinh viên có tên trùng nhau không phân biệt hoa thường: tạo unique index trên `lower(name)` của student. Hệ thống kiểm tra catalog, rồi thử chèn sinh viên ('99001', 'SHANKAR', 'Comp. Sci.', 0) — phải bị từ chối (23505).




-- @ex CH14.04  [partial index]  ★★☆
-- Chỉ các truy vấn về giảng viên lương cao (salary > 80000) cần index trên salary. Tạo partial index trên `instructor(salary)` chỉ chứa các dòng có `salary > 80000`.




-- @ex CH14.05  [hash index]  ★☆☆
-- Tạo hash index trên `student(name)` (chỉ dùng cho so sánh bằng).




-- @ex CH14.06  [covering index]  ★★☆
-- Truy vấn `select grade from takes where course_id = ?` chạy rất thường xuyên. Tạo covering index trên `takes(course_id)` có kèm cột grade (`include`) để trả lời mà không cần đọc bảng takes. Hệ thống đọc định nghĩa index từ `pg_indexes`.




-- @ex CH14.07  [catalog: existing indexes]  ★★☆
-- Hầu hết hệ thống tự tạo index cho primary key. Dùng catalog `pg_indexes`, liệt kê mọi index của các bảng section, takes, teaches: tablename, indexname và `columns` = phần trong ngoặc của indexdef (ví dụ `id, course_id, ...`). Sắp theo tablename.
-- Gợi ý: `substring(indexdef from '\((.*)\)')`.




-- @ex CH14.08  [PE 14.2 one clustering index]  ★★★
-- Đề gốc: Exercise 14.2. Can a relation in general have two clustering indices on different search keys? Explain your answer.
--
-- Minh hoạ PE 14.2 trong PostgreSQL: tạo index `ix_inst_salary` trên instructor(salary) và `ix_inst_name` trên instructor(name); `cluster instructor using ix_inst_salary`, rồi `cluster instructor using ix_inst_name`. Cuối cùng trả về tên các index của instructor (`indexrelid::regclass::text`) và cột `indisclustered`, sắp theo tên. (Chỉ một index có thể là clustering index.)
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)




-- @ex CH14.09  [PE 14.13a bitmap on salary]  ★★☆
-- Đề gốc: Exercise 14.13 (a). Consider the *instructor* relation of Figure 14.1.
--
-- a. Build a bitmap index on the attribute *salary*, splitting salary values into four ranges: below 50,000; 50,000 to below 60,000; 60,000 to below 70,000; and 70,000 and above.
--
-- *Figure 14.1 — The instructor relation:*
--
-- | ID | name | dept_name | salary |
-- |---|---|---|---|
-- | 10101 | Srinivasan | Comp. Sci. | 65000 |
-- | 12121 | Wu | Finance | 90000 |
-- | 15151 | Mozart | Music | 40000 |
-- | 22222 | Einstein | Physics | 95000 |
-- | 32343 | El Said | History | 60000 |
-- | 33456 | Gold | Physics | 87000 |
-- | 45565 | Katz | Comp. Sci. | 75000 |
-- | 58583 | Califieri | History | 62000 |
-- | 76543 | Singh | Finance | 80000 |
-- | 76766 | Crick | Biology | 72000 |
-- | 83821 | Brandt | Comp. Sci. | 92000 |
-- | 98345 | Kim | Elec. Eng. | 80000 |
--
-- Lập bitmap index trên salary của instructor theo 4 khoảng: S1 (< 50000), S2 (50000 – < 60000), S3 (60000 – < 70000), S4 (≥ 70000). Record được đánh số theo thứ tự ID tăng dần; bitmap là chuỗi các ký tự 0/1 (không có khoảng trắng). Trả về `range` và `bitmap`, sắp theo range. Khoảng không có giá trị nào vẫn phải có dòng (toàn 0).
-- (Thứ tự dòng được chấm.)




-- @ex CH14.10  [PE 14.13b bitmap AND]  ★★★
-- Đề gốc: Exercise 14.13 (b). Consider the *instructor* relation of Figure 14.1.
--
-- b. A query asks for all instructors in the Finance department whose salary is 80,000 or more. Describe the steps for answering the query and show the intermediate and final bitmaps built along the way.
--
-- *Figure 14.1 — The instructor relation:*
--
-- | ID | name | dept_name | salary |
-- |---|---|---|---|
-- | 10101 | Srinivasan | Comp. Sci. | 65000 |
-- | 12121 | Wu | Finance | 90000 |
-- | 15151 | Mozart | Music | 40000 |
-- | 22222 | Einstein | Physics | 95000 |
-- | 32343 | El Said | History | 60000 |
-- | 33456 | Gold | Physics | 87000 |
-- | 45565 | Katz | Comp. Sci. | 75000 |
-- | 58583 | Califieri | History | 62000 |
-- | 76543 | Singh | Finance | 80000 |
-- | 76766 | Crick | Biology | 72000 |
-- | 83821 | Brandt | Comp. Sci. | 92000 |
-- | 98345 | Kim | Elec. Eng. | 80000 |
--
-- Tiếp CH14.09: trả về ba dòng (`name`, `bitmap`) theo thứ tự: 'S4' (bitmap salary ≥ 70000), 'Finance' (bitmap dept_name = Finance), 'S4 AND Finance' (AND từng bit). Dùng kiểu `bit varying` và toán tử `&` cho phép AND, rồi đổi về text.
-- Gợi ý: `string_agg(...)::varbit`, rồi `(a & b)::text`.
-- (Thứ tự dòng được chấm.)




-- @ex CH14.11  [PE 14.13b answer from bitmap]  ★★★
-- Đề gốc: Exercise 14.13 (b). Consider the *instructor* relation of Figure 14.1.
--
-- b. A query asks for all instructors in the Finance department whose salary is 80,000 or more. Describe the steps for answering the query and show the intermediate and final bitmaps built along the way.
--
-- *Figure 14.1 — The instructor relation:*
--
-- | ID | name | dept_name | salary |
-- |---|---|---|---|
-- | 10101 | Srinivasan | Comp. Sci. | 65000 |
-- | 12121 | Wu | Finance | 90000 |
-- | 15151 | Mozart | Music | 40000 |
-- | 22222 | Einstein | Physics | 95000 |
-- | 32343 | El Said | History | 60000 |
-- | 33456 | Gold | Physics | 87000 |
-- | 45565 | Katz | Comp. Sci. | 75000 |
-- | 58583 | Califieri | History | 62000 |
-- | 76543 | Singh | Finance | 80000 |
-- | 76766 | Crick | Biology | 72000 |
-- | 83821 | Brandt | Comp. Sci. | 92000 |
-- | 98345 | Kim | Elec. Eng. | 80000 |
--
-- Hoàn tất PE 14.13b: dùng bitmap `S4 AND Finance` (như CH14.10), lấy các instructor ở những vị trí có bit 1 (vị trí theo thứ tự ID tăng dần, bắt đầu từ 1), rồi kiểm tra lại điều kiện salary ≥ 80000. Trả về ID, name, salary.
-- Gợi ý: `row_number() over (order by ID)` để có vị trí; `substring(bits from pos for 1) = '1'`.




-- @ex CH14.12  [sparse index]  ★★☆
-- `ix_seq_file(pos, id, name)` là file tuần tự đã sắp theo id, mỗi block chứa 3 record (block 0 gồm pos 0–2, …). Dựng sparse index: một entry cho mỗi block gồm `block_no` và `first_id` (id của record đầu block).




-- @ex CH14.13  [sparse index lookup]  ★★★
-- Dùng sparse index của CH14.12 để tìm block cần quét cho các khoá tìm kiếm '33456', '76766', '99999' và '10000': block có `first_id` lớn nhất ≤ khoá (null nếu khoá nhỏ hơn mọi first_id). Trả về `search_key`, `block_no`, và `found` (true nếu id đó thực sự có trong file).




-- @ex CH14.14  [B+-tree fan-out and height]  ★★★
-- Với mỗi dòng của `ix_index_spec(index_name, num_keys, key_bytes, ptr_bytes, block_bytes)`: `fanout` n = ⌊(block_bytes + key_bytes) / (key_bytes + ptr_bytes)⌋ (n con trỏ và n − 1 khoá vừa một block); `min_height` = ⌈log[n](num_keys)⌉ (mọi nút đầy); `max_height` = ⌈log[⌈n/2⌉](num_keys)⌉ (mọi nút chỉ đầy tối thiểu). Dùng hàm `log(b, x)` kiểu numeric.




-- @ex CH14.15  [PE 14.3 node occupancy]  ★☆☆
-- Đề gốc: Exercise 14.3. Build a B+-tree for the key values (2, 3, 5, 7, 11, 17, 19, 23, 29, 31). The tree starts empty and the values are inserted in ascending order. Build the trees for each of the following numbers of pointers that fit in one node:
--
-- a. Four
--
-- b. Six
--
-- c. Eight
--
-- Với n = 4, 6, 8 con trỏ mỗi nút (các trường hợp của PE 14.3): `leaf_min_keys` = ⌈(n − 1)/2⌉, `leaf_max_keys` = n − 1, `inner_min_ptrs` = ⌈n/2⌉, `inner_max_ptrs` = n.




-- @ex CH14.16  [PE 14.8b build cost]  ★★☆
-- Đề gốc: Exercise 14.8 (b). A secondary B+-tree index is to be built on a relation r containing n[r] tuples.
--
-- b. If one random disk access takes 10 milliseconds, what does building the index cost for a relation with 10 million records?
--
-- Chèn từng record vào secondary B+-tree tốn 2 truy cập ngẫu nhiên (đọc + ghi lá), mỗi lần 10 ms (bỏ qua chi phí ghi khi split). Với mỗi index trong `ix_index_spec`, trả về index_name và `build_hours` (làm tròn 1 chữ số) nếu xây bằng cách chèn từng record (mỗi khoá là một record). Thêm dòng 'pe_14_8' cho 10 000 000 record của PE 14.8b.




-- @ex CH14.17  [redundant indexes]  ★★★
-- Bảng `ix_orders` có sẵn nhiều index. Một index (không unique) là thừa nếu danh sách cột của nó là tiền tố thực sự của danh sách cột của một index khác trên cùng bảng (ví dụ (customer_id) so với (customer_id, order_date)). Dùng `pg_index` (cột indkey) tìm các cặp `redundant`, `covered_by` (tên index, `::regclass::text`).
-- Gợi ý: `indkey::text` có dạng '2 3'; tiền tố: `b.indkey::text like a.indkey::text || ' %'`.




-- @ex CH14.18  [drop redundant indexes]  ★★☆
-- Dựa vào CH14.17, xoá các index thừa của ix_orders (ix_orders_cust và ix_orders_date). Hệ thống liệt kê các index còn lại của ix_orders (tên, sắp theo tên).


