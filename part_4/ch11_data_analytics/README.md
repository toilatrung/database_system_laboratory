# Chương 11 — Phân tích dữ liệu (Data Warehouse, OLAP, Data Mining)

*Data Analytics · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch11`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Phạm vi
Chương 11 không nằm trong lịch thi CS4420, nhưng các phép OLAP (`cube`, `rollup`, window function) đã xuất hiện ở Chương 5 nên rất hợp để ôn lại SQL nâng cao. Slide: *Chapter 11 — Data Analytics* (db-book.com). Dữ liệu lab: star schema `olap_*` theo Figure 11.2.

### 1. Data analytics là gì (slide 11.2–11.4)
- **OLTP** (online transaction processing): nhiều giao dịch nhỏ, cập nhật thường xuyên, truy cập ít dòng — database nghiệp vụ.
- **Data analytics**: xử lý dữ liệu để suy ra **mẫu, xu hướng, quyết định**: báo cáo tổng hợp, OLAP, thống kê, machine learning / data mining.
- Quy trình: thu thập dữ liệu từ nhiều nguồn → **data warehouse** → phân tích (OLAP, mining) → hỗ trợ quyết định (*business intelligence*, *decision support*).

### 2. Data warehouse (slide 11.5–11.15)
Kho lưu trữ dữ liệu **lịch sử, đã tích hợp** từ nhiều nguồn, dưới một lược đồ thống nhất, đặt ở một nơi để phân tích không ảnh hưởng tới hệ OLTP.

Các vấn đề thiết kế:
- **Khi nào và cách nào thu thập dữ liệu**:
  - **Source-driven**: nguồn tự đẩy dữ liệu (liên tục hoặc định kỳ) sang warehouse.
  - **Destination-driven**: warehouse định kỳ gửi yêu cầu lấy dữ liệu mới từ nguồn.
  - So sánh ở PE 11.1.
- **Schema nào**: các nguồn có lược đồ khác nhau → phải **schema integration**.
- **Data cleansing**: sửa lỗi nhập liệu, địa chỉ sai chính tả, gộp các bản ghi trùng (*merge–purge*, *householding*).
- **Cập nhật** sự thay đổi từ nguồn: giống bài toán bảo trì materialized view.
- **Tóm tắt**: có thể chỉ lưu dữ liệu tổng hợp thay vì chi tiết.
- Quy trình **ETL**: Extract – Transform – Load (hoặc ELT: nạp trước rồi biến đổi trong warehouse).
- **Data lake**: lưu dữ liệu thô nhiều dạng, chưa tích hợp — rẻ và linh hoạt hơn nhưng truy vấn phức tạp hơn.

### 3. Multidimensional data và star schema (slide 11.9–11.12)
- **Measure attribute**: giá trị đo được, có thể aggregate (number, price).
- **Dimension attribute**: chiều để nhóm và xem measure (item, store, date, customer).
- **Fact table**: bảng lớn chứa measure và khoá ngoại tới các **dimension table** (thường nhỏ).
- **Star schema**: một fact table + các dimension table nối trực tiếp (Figure 11.2: sales + item_info, store, customer, date_info).
- **Snowflake schema**: dimension table được chuẩn hoá tiếp thành nhiều bảng (ví dụ store → city → state).
- Dimension thường có **hierarchy**: date → month → quarter → year; store → city → state → country.

### 4. Lưu trữ cho warehouse — column-oriented storage (slide 11.13–11.15)
- **Row store**: mỗi tuple lưu liền nhau — tốt cho OLTP (đọc/ghi cả dòng).
- **Column store**: mỗi **cột** lưu thành một file/mảng riêng; tuple thứ i = phần tử thứ i của mỗi cột (PE 11.2).
  - Ưu: truy vấn phân tích chỉ đọc vài cột → giảm I/O; dữ liệu cùng kiểu nên **nén** tốt; tận dụng CPU cache, xử lý vector.
  - Nhược: lấy/sửa một tuple đầy đủ phải đọc nhiều chỗ; insert/update đắt.
- Ví dụ: Vertica, Amazon Redshift, Google BigQuery, Parquet/ORC (định dạng file).

### 5. OLAP (slide 11.16–11.35)
**Online analytical processing**: phân tích tương tác dữ liệu đa chiều.
- **Cross-tabulation (pivot table)**: giá trị của một chiều làm tiêu đề cột, chiều kia làm tiêu đề dòng, ô là aggregate; thêm dòng/cột **all** cho tổng.
- **Data cube**: tổng quát của cross-tab cho n chiều — mọi tổ hợp nhóm theo tập con của các chiều (2<sup>n</sup> group by).
- Thao tác:
  - **Pivoting**: đổi chiều nào làm dòng/cột.
  - **Slicing**: cố định một chiều ở một giá trị (ví dụ chỉ năm 2018). **Dicing**: cố định nhiều chiều / một khoảng giá trị.
  - **Rollup**: đi lên mức thô hơn của hierarchy (ngày → tháng → năm). **Drill down**: ngược lại, xuống mức chi tiết.
- Hiện thực: **MOLAP** (mảng đa chiều trong bộ nhớ), **ROLAP** (trên database quan hệ), **HOLAP** (lai).

OLAP trong SQL:
```sql
-- mọi tập con của {item_name, color, clothes_size}: 8 nhóm
select item_name, color, clothes_size, sum(quantity)
from sales group by cube (item_name, color, clothes_size);

-- chỉ các tiền tố: (a, b, c), (a, b), (a), ()
group by rollup (a, b, c)

-- hierarchy trên hai chiều độc lập (PE 11.4): tích của hai rollup
group by rollup (country, state, city, store_id), rollup (year, quarter, month, date)

-- tuỳ chọn tập nhóm
group by grouping sets ((color, clothes_size), (clothes_size, item_name))
```
- Dòng tổng hợp có **null** ở cột không tham gia nhóm. Hàm `grouping(col)` trả 1 khi null đó là "all" (không phải null thật trong dữ liệu) → `case when grouping(item_name) = 1 then 'all' else item_name end`.
- Pivot thủ công: `count(*) filter (where year = 2017)` hoặc `sum(case when ... then ... end)`; SQL Server/Oracle có `pivot`.

Window function (Chương 5, rất hay dùng trong phân tích):
- `rank()`, `dense_rank()`, `row_number()`, `ntile(n)`, `percent_rank()`.
- Tổng luỹ kế: `sum(x) over (order by date)`; trung bình trượt: `avg(x) over (order by date rows between 1 preceding and current row)`; theo nhóm: `partition by`.
- Tỉ lệ trong nhóm: `x / sum(x) over (partition by category)`.

### 6. Data mining (slide 11.36–11.55)
Tìm mẫu hữu ích từ dữ liệu lớn một cách (bán) tự động.
- **Prediction / classification**: dự đoán lớp của một đối tượng từ các thuộc tính, học từ **training set** có nhãn.
  - **Decision tree**: mỗi node trong là một điều kiện trên thuộc tính, mỗi lá là một lớp (có thể kèm confidence) — PE 11.5. Chọn thuộc tính tách bằng độ đo *purity* (Gini, entropy / information gain).
  - **Bayesian classifier** (naive Bayes: giả định các thuộc tính độc lập), **SVM**, **neural network / deep learning**.
  - **Regression**: dự đoán giá trị số (linear regression).
  - Đánh giá: **accuracy** = (tp + tn)/tổng; **recall / sensitivity** = tp/pos; **precision** = tp/(tp + fp); **specificity** = tn/neg (PE 11.6). Với lớp mất cân bằng (bệnh hiếm), accuracy cao có thể vô nghĩa — classifier luôn đoán "âm tính" vẫn đạt 95%.
  - Tránh **overfitting**: đánh giá trên tập test tách riêng, **cross-validation**.
- **Association rules**: luật dạng *bread ⇒ milk* trên dữ liệu giỏ hàng.
  - **Support** của tập I = tỉ lệ giao dịch chứa mọi phần tử của I.
  - **Confidence** của A ⇒ B = support(A ∪ B) / support(A) = P(B | A).
  - Tìm *large itemsets* (support ≥ ngưỡng) bằng thuật toán **a priori**: một tập chỉ có thể large nếu mọi tập con của nó large.
- **Clustering**: nhóm các điểm gần nhau (k-means, hierarchical clustering) — không cần nhãn.
- Khác: text mining, sentiment analysis, phát hiện bất thường, **collaborative filtering** cho recommendation.

### 7. Ghi nhớ nhanh
| Câu hỏi | Trả lời ngắn |
|---|---|
| Fact vs dimension? | Fact: measure + FK, rất lớn. Dimension: mô tả chiều, nhỏ |
| cube(a, b) sinh mấy nhóm? | 4: (a, b), (a), (b), () |
| rollup(a, b, c)? | (a, b, c), (a, b), (a), () |
| Phân biệt null "all" với null thật? | `grouping(col)` |
| Column store tốt khi nào? | Truy vấn aggregate đọc ít cột trên nhiều dòng |
| Confidence của A ⇒ B? | support(A ∪ B) / support(A) |
| Classifier luôn đoán âm tính? | Accuracy cao nhưng recall = 0 |

## 2. Trắc nghiệm (11 câu)

**Câu 1.** Trong star schema của Figure 11.2, bảng nào là fact table?

- A. item_info
- B. store
- C. sales
- D. date_info

<details><summary>Đáp án</summary>

**C** — sales chứa measure (number, price) và khoá ngoại tới các dimension.

</details>

**Câu 2.** `group by cube (a, b, c)` tạo ra bao nhiêu nhóm (grouping)?

- A. 3
- B. 4
- C. 6
- D. 8

<details><summary>Đáp án</summary>

**D** — Mọi tập con của {a, b, c}: 2³ = 8.

</details>

**Câu 3.** `group by rollup (country, state, city)` KHÔNG chứa nhóm nào?

- A. (country, state, city)
- B. (country, state)
- C. (state)
- D. ()

<details><summary>Đáp án</summary>

**C** — rollup chỉ sinh các tiền tố: (country, state, city), (country, state), (country), ().

</details>

**Câu 4.** Hàm `grouping(color)` trả về 1 khi nào?

- A. color là null trong dữ liệu
- B. Dòng là dòng tổng hợp trên mọi giá trị color
- C. color có giá trị lớn nhất
- D. Không bao giờ

<details><summary>Đáp án</summary>

**B** — Phân biệt null "all" của cube/rollup với null thật.

</details>

**Câu 5.** Đi từ doanh số theo ngày lên doanh số theo quý là thao tác OLAP nào?

- A. Drill down
- B. Rollup
- C. Slicing
- D. Pivoting

<details><summary>Đáp án</summary>

**B** — Rollup = lên mức thô hơn của hierarchy.

</details>

**Câu 6.** Vì sao column store hợp với truy vấn phân tích?

- A. Insert một tuple nhanh hơn
- B. Chỉ đọc các cột cần dùng và nén tốt
- C. Không cần index
- D. Hỗ trợ transaction tốt hơn

<details><summary>Đáp án</summary>

**B** — Truy vấn aggregate thường chỉ đụng vài cột trên rất nhiều dòng.

</details>

**Câu 7.** Kiến trúc thu thập dữ liệu nào cho phép đẩy dữ liệu mới sang warehouse ngay khi có?

- A. Destination-driven
- B. Source-driven
- C. Snowflake
- D. MOLAP

<details><summary>Đáp án</summary>

**B** — Source-driven: nguồn chủ động gửi (PE 11.1).

</details>

**Câu 8.** Có 5 giao dịch; {diaper, beer} xuất hiện ở 3, {diaper} ở 4. Confidence của diaper ⇒ beer?

- A. 0.6
- B. 0.75
- C. 0.8
- D. 1.0

<details><summary>Đáp án</summary>

**B** — support(diaper, beer)/support(diaper) = (3/5)/(4/5) = 0.75.

</details>

**Câu 9.** Bệnh có ở 5% người được test. Classifier luôn đoán "không bệnh" có accuracy và recall bao nhiêu?

- A. 95% và 0
- B. 5% và 100%
- C. 50% và 50%
- D. 95% và 95%

<details><summary>Đáp án</summary>

**A** — Đúng với 95% người không bệnh, nhưng không phát hiện được ai có bệnh (PE 11.6).

</details>

**Câu 10.** Muốn sàng lọc để xét nghiệm thêm (bỏ sót người bệnh là tệ nhất), nên ưu tiên chỉ số nào?

- A. Precision
- B. Recall
- C. Specificity
- D. Accuracy

<details><summary>Đáp án</summary>

**B** — Recall cao = ít bỏ sót người thật sự có bệnh.

</details>

**Câu 11.** Thuật toán a priori dựa trên tính chất nào?

- A. Mọi tập con của một large itemset đều large
- B. Mọi tập cha của một large itemset đều large
- C. Support tăng khi thêm phần tử
- D. Confidence luôn bằng support

<details><summary>Đáp án</summary>

**A** — Nên chỉ cần mở rộng các tập đã large ở bước trước.

</details>

## 3. Câu hỏi tự luận (6 câu)

**Câu 1.** 

> **Exercise 11.1.** Compared with a destination-driven architecture, what are the benefits and drawbacks of a source-driven architecture for gathering data into a data warehouse?

**PE 11.1.** So với kiến trúc destination-driven, kiến trúc source-driven để thu thập dữ liệu vào data warehouse có ưu, nhược điểm gì?

<details><summary>Gợi ý đáp án</summary>

Source-driven: **nguồn** chủ động gửi dữ liệu; destination-driven: **warehouse** định kỳ hỏi nguồn.

Ưu điểm của source-driven:
- Dữ liệu được chuyển **ngay khi có**; destination-driven muốn vậy phải hỏi nguồn rất thường xuyên → overhead lớn.
- Nguồn **không cần giữ lịch sử** thay đổi: cập nhật xong gửi đi là xong. Với destination-driven, nguồn phải lưu mọi thay đổi chưa được warehouse lấy → tốn bộ nhớ ở nguồn.

Nhược điểm (= ưu điểm của destination-driven):
- Nguồn phải **chủ động** và tự xử lý lỗi (ví dụ không liên lạc được warehouse một thời gian). Destination-driven chỉ cần nguồn trả lời truy vấn — nguồn thụ động, đơn giản; chỉ warehouse chủ động.
- Warehouse **khó kiểm soát** thời điểm nạp dữ liệu; destination-driven cho phép warehouse chọn lúc nạp dữ liệu và lúc phục vụ truy vấn, tránh làm cùng lúc (xung đột lock).

</details>

**Câu 2.** 

> **Exercise 11.2.** Draw a diagram showing how the *classroom* relation of the university example (Appendix A) would be stored using a column-oriented storage structure.

**PE 11.2.** Vẽ cách relation classroom (building, room_number, capacity) được lưu theo column-oriented storage.

<details><summary>Gợi ý đáp án</summary>

Mỗi thuộc tính một file (mảng); tuple thứ i gồm phần tử thứ i của mỗi file. Nếu mỗi giá trị có kích thước cố định thì số thứ tự dòng suy ra từ vị trí; nếu không phải lưu kèm row number.

| # | building | | # | room_number | | # | capacity |
|---|---|---|---|---|---|---|---|
| 1 | Packard | | 1 | 101 | | 1 | 500 |
| 2 | Painter | | 2 | 514 | | 2 | 10 |
| 3 | Taylor | | 3 | 3128 | | 3 | 70 |
| 4 | Watson | | 4 | 100 | | 4 | 30 |
| 5 | Watson | | 5 | 120 | | 5 | 50 |

Truy vấn `select avg(capacity) from classroom` chỉ đọc file capacity. Cột building có giá trị lặp (Watson, Watson) → nén được (run-length encoding). Bài CH11.18 mô phỏng cách lưu này.

</details>

**Câu 3.** 

> **Exercise 11.3.** For the *takes* relation, write an SQL query computing a cross-tab with one column for each of the years 2017 and 2018 plus a column “all”, and one row for each course plus a row “all”. Each cell holds the number of students who took that course in that year; the “all” column aggregates over all years and the “all” row aggregates over all courses.

**PE 11.3.** Viết SQL tính cross-tab trên takes: cột 2017, 2018 và all; mỗi course một dòng và một dòng all; ô = số sinh viên học course đó trong năm đó.

<details><summary>Gợi ý đáp án</summary>

```sql
select coalesce(course_id, 'all') as course_id,
       count(distinct ID) filter (where year = 2017) as y2017,
       count(distinct ID) filter (where year = 2018) as y2018,
       count(distinct ID) as "all"
from takes
group by rollup (course_id);
```
- `rollup (course_id)` thêm dòng tổng (course_id = null → hiển thị 'all'); an toàn vì course_id của takes không bao giờ null (dùng `grouping(course_id)` cho chắc).
- Cột năm dùng `filter` (hoặc `sum(case when year = 2017 then 1 else 0 end)`).
- `count(distinct ID)`: một sinh viên học lại cùng course (45678 học CS-101 năm 2017 và 2018) chỉ tính một lần ở cột all; ô all–all là số sinh viên khác nhau đã học bất kỳ môn nào. Nếu đếm số lần đăng ký thì dùng count(*). Bài CH11.01.

Cách khác: `group by cube (course_id, year)` rồi pivot; với SQL Server/Oracle có `pivot`.

</details>

**Câu 4.** 

> **Exercise 11.4.** For the data-warehouse schema of Figure 11.2, write an SQL query that summarizes sales numbers and price by store and by date, together with the hierarchies on store and on date.
> 
> *Figure 11.2 — Star schema for a data warehouse:*
> 
> - fact table sales (item_id, store_id, customer_id, date, number, price)
> - item_info (item_id, itemname, color, size, category)
> - store (store_id, city, state, country)
> - customer (customer_id, name, street, city, state, zipcode, country)
> - date_info (date, month, quarter, year)

**PE 11.4.** Với lược đồ Figure 11.2, viết SQL tóm tắt number và price theo store và date, kèm hierarchy trên store và date.

<details><summary>Gợi ý đáp án</summary>

```sql
select st.store_id, st.city, st.state, st.country,
       d.date, d.month, d.quarter, d.year,
       sum(s.number), sum(s.price)
from sales s
join store st on s.store_id = st.store_id
join date_info d on s.date = d.date
group by rollup (st.country, st.state, st.city, st.store_id),
         rollup (d.year, d.quarter, d.month, d.date);
```
Mỗi `rollup` liệt kê hierarchy từ thô tới chi tiết; hai rollup đặt cạnh nhau sinh **tích** các mức (5 × 5 = 25 tổ hợp nhóm), tức tổng theo mọi cặp (mức store, mức date) — từ (store, ngày) tới (toàn quốc, toàn thời gian). Bài CH11.02.

</details>

**Câu 5.** 

> **Exercise 11.5.** Classification can use classification rules, each with a condition, a class, and a confidence — the percentage of inputs satisfying the condition that belong to that class.
> 
> For example, one credit-rating rule could have the condition “salary between $30,000 and $50,000 and education level graduate”, class *good*, and confidence 80%. A second rule could have the condition “salary between $30,000 and $50,000 and education level high-school”, class *satisfactory*, confidence 80%. A third rule could have the condition “salary above $50,001”, class *excellent*, confidence 90%. Show a decision-tree classifier corresponding to these rules.
> 
> Show how the decision-tree classifier can be extended to record the confidence values.

**PE 11.5.** Vẽ decision tree tương ứng ba luật xếp hạng tín dụng (salary 30k–50k & graduate → good 80%; salary 30k–50k & high-school → satisfactory 80%; salary > 50k → excellent 90%), và mở rộng để ghi confidence.

<details><summary>Gợi ý đáp án</summary>

```
                 salary?
        /           |              \
  < 30,000    30,000–50,000      > 50,000
  (không có         |           excellent (90%)
    luật)      education?
               /         \
         graduate     high-school
        good (80%)   satisfactory (80%)
```
- Node gốc tách theo salary; nhánh 30k–50k tách tiếp theo education; các lá là lớp.
- Ghi confidence: mỗi **lá** lưu thêm confidence của lớp (80%, 80%, 90%) — hoặc tổng quát hơn, lưu **phân bố** các lớp ở lá (ví dụ good 80%, satisfactory 15%, poor 5%), từ đó lớp dự đoán là lớp có tỉ lệ cao nhất và confidence là tỉ lệ đó.
- Nhánh salary < 30,000 (và nhánh education khác) không có luật → lá "unknown" hoặc lớp mặc định.

Bài CH11.15 hiện thực cây bằng `case`, CH11.16 đo confidence thực tế của từng luật trên dữ liệu.

</details>

**Câu 6.** 

> **Exercise 11.6.** A classifier predicts whether a person has a particular disease. 95% of the people tested do not have it. Let *pos* be the fraction of actual positives (5% of the test cases) and *neg* the fraction of actual negatives (95% of the test cases). Consider these classifiers:
> 
> - C<sub>1</sub> always predicts negative (a rather useless classifier).
> - C<sub>2</sub> predicts positive for 80% of the people who actually have the disease, but also for 5% of the people who do not.
> - C<sub>3</sub> predicts positive for 95% of the people who actually have the disease, but also for 20% of the people who do not.
> 
> For each classifier, *t_pos* is the true-positive fraction (prediction positive and the person has the disease) and *f_pos* the false-positive fraction (prediction positive but the person does not have the disease); *t_neg* and *f_neg* are the true-negative and false-negative fractions, defined in the same way for negative predictions.
> 
> a. Compute these metrics for each classifier:
> 
> - Accuracy = (t_pos + t_neg)/(pos + neg): the fraction of cases the classifier classifies correctly.
> - Recall (sensitivity) = t_pos/pos: how many of the actual positives are classified positive.
> - Precision = t_pos/(t_pos + f_pos): how often a positive prediction is right.
> - Specificity = t_neg/neg.
> 
> b. If the classification results will be used to select people for further screening for the disease, how would you choose among the classifiers?
> 
> c. If instead the results will be used to start medication, and the medication could be harmful to someone without the disease, how would you choose among the classifiers?

**PE 11.6.** Tính accuracy, recall, precision, specificity cho C1 (luôn âm tính), C2 (80% / 5%), C3 (95% / 20%); chọn classifier cho (b) sàng lọc tiếp, (c) bắt đầu dùng thuốc có hại nếu không bệnh.

<details><summary>Gợi ý đáp án</summary>

pos = 0.05, neg = 0.95.

| | t_pos | f_pos | t_neg | f_neg |
|---|---|---|---|---|
| C1 | 0 | 0 | 0.95 | 0.05 |
| C2 | 0.8 × 0.05 = 0.04 | 0.05 × 0.95 = 0.0475 | 0.9025 | 0.01 |
| C3 | 0.95 × 0.05 = 0.0475 | 0.2 × 0.95 = 0.19 | 0.76 | 0.0025 |

a.
| | Accuracy | Recall | Precision | Specificity |
|---|---|---|---|---|
| C1 | 0.95 | 0 | không xác định (0/0) | 1 |
| C2 | 0.9425 | 0.80 | 0.04/0.0875 ≈ 0.457 | 0.95 |
| C3 | 0.8075 | 0.95 | 0.0475/0.2375 = 0.20 | 0.80 |

C1 có accuracy cao nhất nhưng vô dụng: accuracy gây hiểu lầm khi lớp mất cân bằng.

b. Sàng lọc để xét nghiệm thêm: bỏ sót người bệnh là tệ nhất, dương tính giả chỉ tốn thêm một lần xét nghiệm → chọn **recall cao nhất: C3**.

c. Dùng thuốc có hại cho người không bệnh: dương tính giả là tệ nhất → cần **precision (và specificity) cao: C2** (dương tính đúng ≈ 46% so với 20% của C3). Thực tế nên kết hợp: C3 để sàng lọc, rồi một xét nghiệm chính xác hơn trước khi điều trị.

Bài CH11.17 tính các chỉ số này trên tập 2000 ca `olap_test`.

</details>

## 4. Bài tập SQL (19 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH11.01 | PE 11.3 cross-tab | ★★☆ | Exercise 11.3. For the *takes* relation, write an SQL query computing a cross-tab with one column for each of the years 2017 and 2018 plus a column “all”, and one row for each course plus a row “all”. Each cell holds the number of students who took that course in that year; the “all” column aggregates over all years and the “all” row aggregates over all courses.<br>PE 11.3 trên takes: một dòng cho mỗi course_id và một dòng `all`; các cột `course_id`, `y2017`, `y2018`, `all`. Mỗi ô là số sinh viên khác nhau (count distinct ID) học course đó trong năm đó; cột `all` gộp mọi năm, dòng `all` gộp mọi course. Ô không có ai là 0. |
| CH11.02 | PE 11.4 rollup hierarchies | ★★★ | Exercise 11.4. For the data-warehouse schema of Figure 11.2, write an SQL query that summarizes sales numbers and price by store and by date, together with the hierarchies on store and on date.  *Figure 11.2 — Star schema for a data warehouse:*  - fact table sales (item_id, store_id, customer_id, date, number, price) - item_info (item_id, itemname, color, size, category) - store (store_id, city, state, country) - customer (customer_id, name, street, city, state, zipcode, country) - date_info (date, month, quarter, year)<br>PE 11.4 trên star schema lab: fact `olap_sales(sale_id, item_id, store_id, customer_id, date, number, price)`, dimension `olap_store(store_id, city, state, country)` và `olap_date_info(date, month, quarter, year)`. Tóm tắt `sum(number)` và `sum(price)` theo store và date kèm hierarchy store → city → state → country và date → month → quarter → year. Trả về các cột theo thứ tự: country, state, city, store_id, year, quarter, month, date, total_number, total_price. |
| CH11.03 | cube | ★★☆ | Data cube hai chiều: tổng `price` theo `category` (olap_item_info) và `country` (olap_store), gồm mọi tổ hợp: (category, country), (category), (country) và tổng chung. Trả về category, country, total_price (null ở chiều không tham gia nhóm). |
| CH11.04 | grouping() | ★★☆ | Rollup theo hierarchy category → itemname: tổng `number`, với dòng tổng hiển thị chữ `all` thay vì null (dùng hàm `grouping`). Trả về category, itemname, total_number. |
| CH11.05 | grouping sets | ★★☆ | Chỉ cần hai báo cáo trong một truy vấn: tổng `number` theo từng category, và tổng `number` theo từng năm (`year` của olap_date_info) — không cần tổ hợp category × year hay tổng chung. Trả về category, year, total_number. |
| CH11.06 | slice & dice | ★☆☆ | Dice cube theo country = `USA`: tổng `price` theo category và year, chỉ các cửa hàng ở USA. Trả về category, year, total_price. |
| CH11.07 | pivot | ★★☆ | Pivot doanh thu năm 2018: mỗi category một dòng, bốn cột `q1`, `q2`, `q3`, `q4` là tổng price của quý tương ứng (0 nếu không có bán). |
| CH11.08 | rank | ★☆☆ | Xếp hạng các cửa hàng theo tổng doanh thu (sum price) giảm dần: trả về store_id, total, rnk (`rank()`), sắp theo rnk rồi store_id. |
| CH11.09 | ntile | ★☆☆ | Chia các cửa hàng thành 2 nhóm theo tổng doanh thu giảm dần bằng `ntile(2)`: trả về store_id, total, half (1 = nửa doanh thu cao). |
| CH11.10 | running total | ★★☆ | Doanh thu theo ngày và tổng luỹ kế: với mỗi date có bán, trả về date, day_total (sum price của ngày) và running_total (tổng từ ngày đầu tới ngày đó), sắp theo date. |
| CH11.11 | moving average | ★★☆ | Trung bình trượt 2 ngày bán: với mỗi date, day_total và moving_avg = trung bình day_total của ngày đó và ngày bán liền trước (ngày đầu tiên chỉ có chính nó), làm tròn 2 chữ số, sắp theo date. |
| CH11.12 | share within group | ★★☆ | Với mỗi dòng bán của category `menswear`: sale_id, price và `share` = price / tổng price của cả category, làm tròn 3 chữ số. |
| CH11.13 | median | ★★☆ | Trung vị (median) của `price` theo từng category, dùng aggregate có thứ tự `percentile_cont(0.5) within group (order by ...)`. Trả về category, median_price. |
| CH11.14 | itemset support | ★★☆ | `olap_basket(trans_id, item)` là dữ liệu giỏ hàng. Tìm mọi cặp sản phẩm {x, y} (x < y theo thứ tự chữ cái) có support ≥ 0.6 (tỉ lệ giao dịch chứa cả hai). Trả về x, y, cnt (số giao dịch), support (làm tròn 2 chữ số). |
| CH11.15 | association rules | ★★★ | Tìm mọi luật kết hợp x ⇒ y giữa hai sản phẩm khác nhau với support(x, y) ≥ 0.4 và confidence = support(x, y) / support(x) ≥ 0.7. Trả về x, y, support, confidence (đều làm tròn 2 chữ số). |
| CH11.16 | PE 11.5 decision tree | ★★☆ | Exercise 11.5. Classification can use classification rules, each with a condition, a class, and a confidence — the percentage of inputs satisfying the condition that belong to that class.  For example, one credit-rating rule could have the condition “salary between $30,000 and $50,000 and education level graduate”, class *good*, and confidence 80%. A second rule could have the condition “salary between $30,000 and $50,000 and education level high-school”, class *satisfactory*, confidence 80%. A third rule could have the condition “salary above $50,001”, class *excellent*, confidence 90%. Show a decision-tree classifier corresponding to these rules.  Show how the decision-tree classifier can be extended to record the confidence values.<br>Hiện thực decision tree của PE 11.5 bằng `case` trên `olap_applicant(id, salary, education, credit)`: salary > 50000 → `excellent`; salary từ 30000 đến 50000 (gồm hai đầu) và education `graduate` → `good`; salary 30000–50000 và `high-school` → `satisfactory`; còn lại → `unknown`. Trả về id, predicted. |
| CH11.17 | PE 11.5 rule confidence | ★★★ | Exercise 11.5. Classification can use classification rules, each with a condition, a class, and a confidence — the percentage of inputs satisfying the condition that belong to that class.  For example, one credit-rating rule could have the condition “salary between $30,000 and $50,000 and education level graduate”, class *good*, and confidence 80%. A second rule could have the condition “salary between $30,000 and $50,000 and education level high-school”, class *satisfactory*, confidence 80%. A third rule could have the condition “salary above $50,001”, class *excellent*, confidence 90%. Show a decision-tree classifier corresponding to these rules.  Show how the decision-tree classifier can be extended to record the confidence values.<br>Đo confidence thực tế của ba luật PE 11.5 trên olap_applicant (cột `credit` là nhãn thật): với mỗi luật, `rule` (dùng đúng nhãn `R1` = 30000–50000 & graduate ⇒ good, `R2` = 30000–50000 & high-school ⇒ satisfactory, `R3` = salary > 50000 ⇒ excellent), `matched` (số người thoả điều kiện) và `confidence` = tỉ lệ người thoả điều kiện có đúng lớp của luật, làm tròn 2 chữ số. |
| CH11.18 | PE 11.6 metrics | ★★★ | Exercise 11.6. A classifier predicts whether a person has a particular disease. 95% of the people tested do not have it. Let *pos* be the fraction of actual positives (5% of the test cases) and *neg* the fraction of actual negatives (95% of the test cases). Consider these classifiers:  - C[1] always predicts negative (a rather useless classifier). - C[2] predicts positive for 80% of the people who actually have the disease, but also for 5% of the people who do not. - C[3] predicts positive for 95% of the people who actually have the disease, but also for 20% of the people who do not.  For each classifier, *t_pos* is the true-positive fraction (prediction positive and the person has the disease) and *f_pos* the false-positive fraction (prediction positive but the person does not have the disease); *t_neg* and *f_neg* are the true-negative and false-negative fractions, defined in the same way for negative predictions.  a. Compute these metrics for each classifier:  - Accuracy = (t_pos + t_neg)/(pos + neg): the fraction of cases the classifier classifies correctly. - Recall (sensitivity) = t_pos/pos: how many of the actual positives are classified positive. - Precision = t_pos/(t_pos + f_pos): how often a positive prediction is right. - Specificity = t_neg/neg.  b. If the classification results will be used to select people for further screening for the disease, how would you choose among the classifiers?  c. If instead the results will be used to start medication, and the medication could be harmful to someone without the disease, how would you choose among the classifiers?<br>`olap_test(case_id, actual, c1, c2, c3)`: 2000 ca, `actual` = có bệnh thật; c1, c2, c3 là dự đoán (true = dương tính) của ba classifier PE 11.6. Mỗi classifier một dòng: name (`c1`, `c2`, `c3`), accuracy, recall, precision, specificity — làm tròn 4 chữ số; precision là null khi classifier không bao giờ đoán dương tính. |
| CH11.19 | PE 11.2 column store | ★★☆ | Exercise 11.2. Draw a diagram showing how the *classroom* relation of the university example (Appendix A) would be stored using a column-oriented storage structure.<br>Mô phỏng column store của PE 11.2: tạo ba bảng "cột" `olap_col_building(row_no, value)`, `olap_col_room(row_no, value)`, `olap_col_capacity(row_no, value)` từ classroom, với row_no = thứ tự của tuple khi sắp theo (building, room_number), bắt đầu từ 1. Hệ thống ghép lại ba cột theo row_no để dựng lại relation. |
