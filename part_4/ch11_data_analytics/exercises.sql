-- =====================================================================
-- CS4420 · Chương 11 — Phân tích dữ liệu (Data Warehouse, OLAP, Data Mining) (Data Analytics)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch11
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH11.01  [PE 11.3 cross-tab]  ★★☆
-- Đề gốc: Exercise 11.3. For the *takes* relation, write an SQL query computing a cross-tab with one column for each of the years 2017 and 2018 plus a column “all”, and one row for each course plus a row “all”. Each cell holds the number of students who took that course in that year; the “all” column aggregates over all years and the “all” row aggregates over all courses.
--
-- PE 11.3 trên takes: một dòng cho mỗi course_id và một dòng `all`; các cột `course_id`, `y2017`, `y2018`, `all`. Mỗi ô là số sinh viên khác nhau (count distinct ID) học course đó trong năm đó; cột `all` gộp mọi năm, dòng `all` gộp mọi course. Ô không có ai là 0.
-- Gợi ý: `count(distinct ID) filter (where year = 2017)`; `group by rollup (course_id)`; `coalesce(course_id, 'all')`.




-- @ex CH11.02  [PE 11.4 rollup hierarchies]  ★★★
-- Đề gốc: Exercise 11.4. For the data-warehouse schema of Figure 11.2, write an SQL query that summarizes sales numbers and price by store and by date, together with the hierarchies on store and on date.
--
-- *Figure 11.2 — Star schema for a data warehouse:*
--
-- - fact table sales (item_id, store_id, customer_id, date, number, price)
-- - item_info (item_id, itemname, color, size, category)
-- - store (store_id, city, state, country)
-- - customer (customer_id, name, street, city, state, zipcode, country)
-- - date_info (date, month, quarter, year)
--
-- PE 11.4 trên star schema lab: fact `olap_sales(sale_id, item_id, store_id, customer_id, date, number, price)`, dimension `olap_store(store_id, city, state, country)` và `olap_date_info(date, month, quarter, year)`. Tóm tắt `sum(number)` và `sum(price)` theo store và date kèm hierarchy store → city → state → country và date → month → quarter → year. Trả về các cột theo thứ tự: country, state, city, store_id, year, quarter, month, date, total_number, total_price.
-- Gợi ý: Hai rollup trong cùng group by: `rollup (country, state, city, store_id), rollup (year, quarter, month, date)`.




-- @ex CH11.03  [cube]  ★★☆
-- Data cube hai chiều: tổng `price` theo `category` (olap_item_info) và `country` (olap_store), gồm mọi tổ hợp: (category, country), (category), (country) và tổng chung. Trả về category, country, total_price (null ở chiều không tham gia nhóm).




-- @ex CH11.04  [grouping()]  ★★☆
-- Rollup theo hierarchy category → itemname: tổng `number`, với dòng tổng hiển thị chữ `all` thay vì null (dùng hàm `grouping`). Trả về category, itemname, total_number.
-- Gợi ý: `case when grouping(i.itemname) = 1 then 'all' else i.itemname end`




-- @ex CH11.05  [grouping sets]  ★★☆
-- Chỉ cần hai báo cáo trong một truy vấn: tổng `number` theo từng category, và tổng `number` theo từng năm (`year` của olap_date_info) — không cần tổ hợp category × year hay tổng chung. Trả về category, year, total_number.




-- @ex CH11.06  [slice & dice]  ★☆☆
-- Dice cube theo country = `USA`: tổng `price` theo category và year, chỉ các cửa hàng ở USA. Trả về category, year, total_price.




-- @ex CH11.07  [pivot]  ★★☆
-- Pivot doanh thu năm 2018: mỗi category một dòng, bốn cột `q1`, `q2`, `q3`, `q4` là tổng price của quý tương ứng (0 nếu không có bán).
-- Gợi ý: `coalesce(sum(s.price) filter (where d.quarter = 1), 0) as q1`




-- @ex CH11.08  [rank]  ★☆☆
-- Xếp hạng các cửa hàng theo tổng doanh thu (sum price) giảm dần: trả về store_id, total, rnk (`rank()`), sắp theo rnk rồi store_id.
-- (Thứ tự dòng được chấm.)




-- @ex CH11.09  [ntile]  ★☆☆
-- Chia các cửa hàng thành 2 nhóm theo tổng doanh thu giảm dần bằng `ntile(2)`: trả về store_id, total, half (1 = nửa doanh thu cao).




-- @ex CH11.10  [running total]  ★★☆
-- Doanh thu theo ngày và tổng luỹ kế: với mỗi date có bán, trả về date, day_total (sum price của ngày) và running_total (tổng từ ngày đầu tới ngày đó), sắp theo date.
-- Gợi ý: `sum(sum(price)) over (order by date)`
-- (Thứ tự dòng được chấm.)




-- @ex CH11.11  [moving average]  ★★☆
-- Trung bình trượt 2 ngày bán: với mỗi date, day_total và moving_avg = trung bình day_total của ngày đó và ngày bán liền trước (ngày đầu tiên chỉ có chính nó), làm tròn 2 chữ số, sắp theo date.
-- Gợi ý: `avg(sum(price)) over (order by date rows between 1 preceding and current row)`
-- (Thứ tự dòng được chấm.)




-- @ex CH11.12  [share within group]  ★★☆
-- Với mỗi dòng bán của category `menswear`: sale_id, price và `share` = price / tổng price của cả category, làm tròn 3 chữ số.
-- Gợi ý: `sum(s.price) over (partition by i.category)` — window function được tính sau where.




-- @ex CH11.13  [median]  ★★☆
-- Trung vị (median) của `price` theo từng category, dùng aggregate có thứ tự `percentile_cont(0.5) within group (order by ...)`. Trả về category, median_price.




-- @ex CH11.14  [itemset support]  ★★☆
-- `olap_basket(trans_id, item)` là dữ liệu giỏ hàng. Tìm mọi cặp sản phẩm {x, y} (x < y theo thứ tự chữ cái) có support ≥ 0.6 (tỉ lệ giao dịch chứa cả hai). Trả về x, y, cnt (số giao dịch), support (làm tròn 2 chữ số).
-- Gợi ý: Self-join olap_basket cùng trans_id với `a.item < b.item`; chia cho số giao dịch `count(distinct trans_id)` (ép numeric).




-- @ex CH11.15  [association rules]  ★★★
-- Tìm mọi luật kết hợp x ⇒ y giữa hai sản phẩm khác nhau với support(x, y) ≥ 0.4 và confidence = support(x, y) / support(x) ≥ 0.7. Trả về x, y, support, confidence (đều làm tròn 2 chữ số).
-- Gợi ý: CTE đếm từng sản phẩm và từng cặp có thứ tự (a.item <> b.item); confidence = count(cặp) / count(x).




-- @ex CH11.16  [PE 11.5 decision tree]  ★★☆
-- Đề gốc: Exercise 11.5. Classification can use classification rules, each with a condition, a class, and a confidence — the percentage of inputs satisfying the condition that belong to that class.
--
-- For example, one credit-rating rule could have the condition “salary between $30,000 and $50,000 and education level graduate”, class *good*, and confidence 80%. A second rule could have the condition “salary between $30,000 and $50,000 and education level high-school”, class *satisfactory*, confidence 80%. A third rule could have the condition “salary above $50,001”, class *excellent*, confidence 90%. Show a decision-tree classifier corresponding to these rules.
--
-- Show how the decision-tree classifier can be extended to record the confidence values.
--
-- Hiện thực decision tree của PE 11.5 bằng `case` trên `olap_applicant(id, salary, education, credit)`: salary > 50000 → `excellent`; salary từ 30000 đến 50000 (gồm hai đầu) và education `graduate` → `good`; salary 30000–50000 và `high-school` → `satisfactory`; còn lại → `unknown`. Trả về id, predicted.




-- @ex CH11.17  [PE 11.5 rule confidence]  ★★★
-- Đề gốc: Exercise 11.5. Classification can use classification rules, each with a condition, a class, and a confidence — the percentage of inputs satisfying the condition that belong to that class.
--
-- For example, one credit-rating rule could have the condition “salary between $30,000 and $50,000 and education level graduate”, class *good*, and confidence 80%. A second rule could have the condition “salary between $30,000 and $50,000 and education level high-school”, class *satisfactory*, confidence 80%. A third rule could have the condition “salary above $50,001”, class *excellent*, confidence 90%. Show a decision-tree classifier corresponding to these rules.
--
-- Show how the decision-tree classifier can be extended to record the confidence values.
--
-- Đo confidence thực tế của ba luật PE 11.5 trên olap_applicant (cột `credit` là nhãn thật): với mỗi luật, `rule` (dùng đúng nhãn `R1` = 30000–50000 & graduate ⇒ good, `R2` = 30000–50000 & high-school ⇒ satisfactory, `R3` = salary > 50000 ⇒ excellent), `matched` (số người thoả điều kiện) và `confidence` = tỉ lệ người thoả điều kiện có đúng lớp của luật, làm tròn 2 chữ số.
-- Gợi ý: Một CTE gán rule và lớp dự đoán cho mỗi người (null nếu không thoả luật nào); rồi `avg(case when credit = cls then 1.0 else 0 end)`.




-- @ex CH11.18  [PE 11.6 metrics]  ★★★
-- Đề gốc: Exercise 11.6. A classifier predicts whether a person has a particular disease. 95% of the people tested do not have it. Let *pos* be the fraction of actual positives (5% of the test cases) and *neg* the fraction of actual negatives (95% of the test cases). Consider these classifiers:
--
-- - C[1] always predicts negative (a rather useless classifier).
-- - C[2] predicts positive for 80% of the people who actually have the disease, but also for 5% of the people who do not.
-- - C[3] predicts positive for 95% of the people who actually have the disease, but also for 20% of the people who do not.
--
-- For each classifier, *t_pos* is the true-positive fraction (prediction positive and the person has the disease) and *f_pos* the false-positive fraction (prediction positive but the person does not have the disease); *t_neg* and *f_neg* are the true-negative and false-negative fractions, defined in the same way for negative predictions.
--
-- a. Compute these metrics for each classifier:
--
-- - Accuracy = (t_pos + t_neg)/(pos + neg): the fraction of cases the classifier classifies correctly.
-- - Recall (sensitivity) = t_pos/pos: how many of the actual positives are classified positive.
-- - Precision = t_pos/(t_pos + f_pos): how often a positive prediction is right.
-- - Specificity = t_neg/neg.
--
-- b. If the classification results will be used to select people for further screening for the disease, how would you choose among the classifiers?
--
-- c. If instead the results will be used to start medication, and the medication could be harmful to someone without the disease, how would you choose among the classifiers?
--
-- `olap_test(case_id, actual, c1, c2, c3)`: 2000 ca, `actual` = có bệnh thật; c1, c2, c3 là dự đoán (true = dương tính) của ba classifier PE 11.6. Mỗi classifier một dòng: name (`c1`, `c2`, `c3`), accuracy, recall, precision, specificity — làm tròn 4 chữ số; precision là null khi classifier không bao giờ đoán dương tính.
-- Gợi ý: `cross join lateral (values ('c1', t.c1), ('c2', t.c2), ('c3', t.c3)) as c(name, p)`; dùng `count(*) filter (where ...)` và `nullif(..., 0)`.




-- @ex CH11.19  [PE 11.2 column store]  ★★☆
-- Đề gốc: Exercise 11.2. Draw a diagram showing how the *classroom* relation of the university example (Appendix A) would be stored using a column-oriented storage structure.
--
-- Mô phỏng column store của PE 11.2: tạo ba bảng "cột" `olap_col_building(row_no, value)`, `olap_col_room(row_no, value)`, `olap_col_capacity(row_no, value)` từ classroom, với row_no = thứ tự của tuple khi sắp theo (building, room_number), bắt đầu từ 1. Hệ thống ghép lại ba cột theo row_no để dựng lại relation.
-- Gợi ý: `create table olap_col_building as select row_number() over (order by building, room_number) as row_no, building as value from classroom;`


