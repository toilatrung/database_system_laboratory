-- =====================================================================
-- CS4420 · Chương 11 — Phân tích dữ liệu (Data Warehouse, OLAP, Data Mining) (Data Analytics)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH11.01  [PE 11.3 cross-tab]  ★★☆
-- Đề gốc: Exercise 11.3. For the *takes* relation, write an SQL query computing a cross-tab with one column for each of the years 2017 and 2018 plus a column “all”, and one row for each course plus a row “all”. Each cell holds the number of students who took that course in that year; the “all” column aggregates over all years and the “all” row aggregates over all courses.
--
-- PE 11.3 trên takes: một dòng cho mỗi course_id và một dòng `all`; các cột `course_id`, `y2017`, `y2018`, `all`. Mỗi ô là số sinh viên khác nhau (count distinct ID) học course đó trong năm đó; cột `all` gộp mọi năm, dòng `all` gộp mọi course. Ô không có ai là 0.
-- Gợi ý: `count(distinct ID) filter (where year = 2017)`; `group by rollup (course_id)`; `coalesce(course_id, 'all')`.
select coalesce(course_id, 'all') as course_id,
       count(distinct ID) filter (where year = 2017) as y2017,
       count(distinct ID) filter (where year = 2018) as y2018,
       count(distinct ID) as "all"
from takes
group by rollup (course_id);

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
select st.country, st.state, st.city, s.store_id,
       d.year, d.quarter, d.month, d.date,
       sum(s.number) as total_number, sum(s.price) as total_price
from olap_sales s
join olap_store st on st.store_id = s.store_id
join olap_date_info d on d.date = s.date
group by rollup (st.country, st.state, st.city, s.store_id),
         rollup (d.year, d.quarter, d.month, d.date);

-- @ex CH11.03  [cube]  ★★☆
-- Data cube hai chiều: tổng `price` theo `category` (olap_item_info) và `country` (olap_store), gồm mọi tổ hợp: (category, country), (category), (country) và tổng chung. Trả về category, country, total_price (null ở chiều không tham gia nhóm).
select i.category, st.country, sum(s.price) as total_price
from olap_sales s
join olap_item_info i on i.item_id = s.item_id
join olap_store st on st.store_id = s.store_id
group by cube (i.category, st.country);

-- @ex CH11.04  [grouping()]  ★★☆
-- Rollup theo hierarchy category → itemname: tổng `number`, với dòng tổng hiển thị chữ `all` thay vì null (dùng hàm `grouping`). Trả về category, itemname, total_number.
-- Gợi ý: `case when grouping(i.itemname) = 1 then 'all' else i.itemname end`
select case when grouping(i.category) = 1 then 'all' else i.category end as category,
       case when grouping(i.itemname) = 1 then 'all' else i.itemname end as itemname,
       sum(s.number) as total_number
from olap_sales s
join olap_item_info i on i.item_id = s.item_id
group by rollup (i.category, i.itemname);

-- @ex CH11.05  [grouping sets]  ★★☆
-- Chỉ cần hai báo cáo trong một truy vấn: tổng `number` theo từng category, và tổng `number` theo từng năm (`year` của olap_date_info) — không cần tổ hợp category × year hay tổng chung. Trả về category, year, total_number.
select i.category, d.year, sum(s.number) as total_number
from olap_sales s
join olap_item_info i on i.item_id = s.item_id
join olap_date_info d on d.date = s.date
group by grouping sets ((i.category), (d.year));

-- @ex CH11.06  [slice & dice]  ★☆☆
-- Dice cube theo country = `USA`: tổng `price` theo category và year, chỉ các cửa hàng ở USA. Trả về category, year, total_price.
select i.category, d.year, sum(s.price) as total_price
from olap_sales s
join olap_item_info i on i.item_id = s.item_id
join olap_store st on st.store_id = s.store_id
join olap_date_info d on d.date = s.date
where st.country = 'USA'
group by i.category, d.year;

-- @ex CH11.07  [pivot]  ★★☆
-- Pivot doanh thu năm 2018: mỗi category một dòng, bốn cột `q1`, `q2`, `q3`, `q4` là tổng price của quý tương ứng (0 nếu không có bán).
-- Gợi ý: `coalesce(sum(s.price) filter (where d.quarter = 1), 0) as q1`
select i.category,
       coalesce(sum(s.price) filter (where d.quarter = 1), 0) as q1,
       coalesce(sum(s.price) filter (where d.quarter = 2), 0) as q2,
       coalesce(sum(s.price) filter (where d.quarter = 3), 0) as q3,
       coalesce(sum(s.price) filter (where d.quarter = 4), 0) as q4
from olap_sales s
join olap_item_info i on i.item_id = s.item_id
join olap_date_info d on d.date = s.date
where d.year = 2018
group by i.category;

-- @ex CH11.08  [rank]  ★☆☆
-- Xếp hạng các cửa hàng theo tổng doanh thu (sum price) giảm dần: trả về store_id, total, rnk (`rank()`), sắp theo rnk rồi store_id.
-- (Thứ tự dòng được chấm.)
select store_id, sum(price) as total, rank() over (order by sum(price) desc) as rnk
from olap_sales
group by store_id
order by rnk, store_id;

-- @ex CH11.09  [ntile]  ★☆☆
-- Chia các cửa hàng thành 2 nhóm theo tổng doanh thu giảm dần bằng `ntile(2)`: trả về store_id, total, half (1 = nửa doanh thu cao).
select store_id, sum(price) as total, ntile(2) over (order by sum(price) desc) as half
from olap_sales
group by store_id;

-- @ex CH11.10  [running total]  ★★☆
-- Doanh thu theo ngày và tổng luỹ kế: với mỗi date có bán, trả về date, day_total (sum price của ngày) và running_total (tổng từ ngày đầu tới ngày đó), sắp theo date.
-- Gợi ý: `sum(sum(price)) over (order by date)`
-- (Thứ tự dòng được chấm.)
select date, sum(price) as day_total, sum(sum(price)) over (order by date) as running_total
from olap_sales
group by date
order by date;

-- @ex CH11.11  [moving average]  ★★☆
-- Trung bình trượt 2 ngày bán: với mỗi date, day_total và moving_avg = trung bình day_total của ngày đó và ngày bán liền trước (ngày đầu tiên chỉ có chính nó), làm tròn 2 chữ số, sắp theo date.
-- Gợi ý: `avg(sum(price)) over (order by date rows between 1 preceding and current row)`
-- (Thứ tự dòng được chấm.)
select date, sum(price) as day_total,
       round(avg(sum(price)) over (order by date rows between 1 preceding and current row), 2) as moving_avg
from olap_sales
group by date
order by date;

-- @ex CH11.12  [share within group]  ★★☆
-- Với mỗi dòng bán của category `menswear`: sale_id, price và `share` = price / tổng price của cả category, làm tròn 3 chữ số.
-- Gợi ý: `sum(s.price) over (partition by i.category)` — window function được tính sau where.
select s.sale_id, s.price,
       round(s.price / sum(s.price) over (partition by i.category), 3) as share
from olap_sales s
join olap_item_info i on i.item_id = s.item_id
where i.category = 'menswear';

-- @ex CH11.13  [median]  ★★☆
-- Trung vị (median) của `price` theo từng category, dùng aggregate có thứ tự `percentile_cont(0.5) within group (order by ...)`. Trả về category, median_price.
select i.category, percentile_cont(0.5) within group (order by s.price) as median_price
from olap_sales s
join olap_item_info i on i.item_id = s.item_id
group by i.category;

-- @ex CH11.14  [itemset support]  ★★☆
-- `olap_basket(trans_id, item)` là dữ liệu giỏ hàng. Tìm mọi cặp sản phẩm {x, y} (x < y theo thứ tự chữ cái) có support ≥ 0.6 (tỉ lệ giao dịch chứa cả hai). Trả về x, y, cnt (số giao dịch), support (làm tròn 2 chữ số).
-- Gợi ý: Self-join olap_basket cùng trans_id với `a.item < b.item`; chia cho số giao dịch `count(distinct trans_id)` (ép numeric).
with n as (select count(distinct trans_id)::numeric as n from olap_basket)
select a.item as x, b.item as y, count(*) as cnt, round(count(*) / n.n, 2) as support
from olap_basket a
join olap_basket b on a.trans_id = b.trans_id and a.item < b.item,
n
group by a.item, b.item, n.n
having count(*) / n.n >= 0.6;

-- @ex CH11.15  [association rules]  ★★★
-- Tìm mọi luật kết hợp x ⇒ y giữa hai sản phẩm khác nhau với support(x, y) ≥ 0.4 và confidence = support(x, y) / support(x) ≥ 0.7. Trả về x, y, support, confidence (đều làm tròn 2 chữ số).
-- Gợi ý: CTE đếm từng sản phẩm và từng cặp có thứ tự (a.item <> b.item); confidence = count(cặp) / count(x).
with n as (select count(distinct trans_id)::numeric as n from olap_basket),
one as (select item, count(*) as c from olap_basket group by item),
two as (select a.item as x, b.item as y, count(*) as c
        from olap_basket a join olap_basket b on a.trans_id = b.trans_id and a.item <> b.item
        group by a.item, b.item)
select two.x, two.y,
       round(two.c / n.n, 2) as support,
       round(two.c::numeric / one.c, 2) as confidence
from two join one on one.item = two.x, n
where two.c / n.n >= 0.4 and two.c::numeric / one.c >= 0.7;

-- @ex CH11.16  [PE 11.5 decision tree]  ★★☆
-- Đề gốc: Exercise 11.5. Classification can use classification rules, each with a condition, a class, and a confidence — the percentage of inputs satisfying the condition that belong to that class.
--
-- For example, one credit-rating rule could have the condition “salary between $30,000 and $50,000 and education level graduate”, class *good*, and confidence 80%. A second rule could have the condition “salary between $30,000 and $50,000 and education level high-school”, class *satisfactory*, confidence 80%. A third rule could have the condition “salary above $50,001”, class *excellent*, confidence 90%. Show a decision-tree classifier corresponding to these rules.
--
-- Show how the decision-tree classifier can be extended to record the confidence values.
--
-- Hiện thực decision tree của PE 11.5 bằng `case` trên `olap_applicant(id, salary, education, credit)`: salary > 50000 → `excellent`; salary từ 30000 đến 50000 (gồm hai đầu) và education `graduate` → `good`; salary 30000–50000 và `high-school` → `satisfactory`; còn lại → `unknown`. Trả về id, predicted.
select id,
       case when salary > 50000 then 'excellent'
            when salary between 30000 and 50000 and education = 'graduate' then 'good'
            when salary between 30000 and 50000 and education = 'high-school' then 'satisfactory'
            else 'unknown' end as predicted
from olap_applicant;

-- @ex CH11.17  [PE 11.5 rule confidence]  ★★★
-- Đề gốc: Exercise 11.5. Classification can use classification rules, each with a condition, a class, and a confidence — the percentage of inputs satisfying the condition that belong to that class.
--
-- For example, one credit-rating rule could have the condition “salary between $30,000 and $50,000 and education level graduate”, class *good*, and confidence 80%. A second rule could have the condition “salary between $30,000 and $50,000 and education level high-school”, class *satisfactory*, confidence 80%. A third rule could have the condition “salary above $50,001”, class *excellent*, confidence 90%. Show a decision-tree classifier corresponding to these rules.
--
-- Show how the decision-tree classifier can be extended to record the confidence values.
--
-- Đo confidence thực tế của ba luật PE 11.5 trên olap_applicant (cột `credit` là nhãn thật): với mỗi luật, `rule` (dùng đúng nhãn `R1` = 30000–50000 & graduate ⇒ good, `R2` = 30000–50000 & high-school ⇒ satisfactory, `R3` = salary > 50000 ⇒ excellent), `matched` (số người thoả điều kiện) và `confidence` = tỉ lệ người thoả điều kiện có đúng lớp của luật, làm tròn 2 chữ số.
-- Gợi ý: Một CTE gán rule và lớp dự đoán cho mỗi người (null nếu không thoả luật nào); rồi `avg(case when credit = cls then 1.0 else 0 end)`.
with r as (
  select credit,
         case when salary > 50000 then 'R3'
              when salary between 30000 and 50000 and education = 'graduate' then 'R1'
              when salary between 30000 and 50000 and education = 'high-school' then 'R2' end as rule,
         case when salary > 50000 then 'excellent'
              when education = 'graduate' then 'good'
              else 'satisfactory' end as cls
  from olap_applicant)
select rule, count(*) as matched,
       round(avg(case when credit = cls then 1.0 else 0 end), 2) as confidence
from r
where rule is not null
group by rule;

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
select c.name,
       round(avg(case when c.p = t.actual then 1.0 else 0 end), 4) as accuracy,
       round(count(*) filter (where c.p and t.actual)::numeric
             / count(*) filter (where t.actual), 4) as recall,
       round(count(*) filter (where c.p and t.actual)::numeric
             / nullif(count(*) filter (where c.p), 0), 4) as precision,
       round(count(*) filter (where not c.p and not t.actual)::numeric
             / count(*) filter (where not t.actual), 4) as specificity
from olap_test t
cross join lateral (values ('c1', t.c1), ('c2', t.c2), ('c3', t.c3)) as c(name, p)
group by c.name;

-- @ex CH11.19  [PE 11.2 column store]  ★★☆
-- Đề gốc: Exercise 11.2. Draw a diagram showing how the *classroom* relation of the university example (Appendix A) would be stored using a column-oriented storage structure.
--
-- Mô phỏng column store của PE 11.2: tạo ba bảng "cột" `olap_col_building(row_no, value)`, `olap_col_room(row_no, value)`, `olap_col_capacity(row_no, value)` từ classroom, với row_no = thứ tự của tuple khi sắp theo (building, room_number), bắt đầu từ 1. Hệ thống ghép lại ba cột theo row_no để dựng lại relation.
-- Gợi ý: `create table olap_col_building as select row_number() over (order by building, room_number) as row_no, building as value from classroom;`
create table olap_col_building as
  select row_number() over (order by building, room_number) as row_no, building as value from classroom;
create table olap_col_room as
  select row_number() over (order by building, room_number) as row_no, room_number as value from classroom;
create table olap_col_capacity as
  select row_number() over (order by building, room_number) as row_no, capacity as value from classroom;

-- Câu truy vấn hệ thống dùng để chấm:
--   select b.row_no, b.value as building, r.value as room_number, c.value as capacity
--   from olap_col_building b
--   join olap_col_room r on r.row_no = b.row_no
--   join olap_col_capacity c on c.row_no = b.row_no
--   order by b.row_no;
