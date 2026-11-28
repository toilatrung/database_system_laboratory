# Đề mẫu 2 · Cửa hàng — Đề mẫu 2 — 20 truy vấn trên Shop database

*Shop Database: 20 SQL Query Exercises · Database System Concepts, 7th Ed.*

> **Cách học:** *Tự luận lý thuyết* → *Bài tập SQL* → *Ghi nhớ nhanh*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk8`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tự luận lý thuyết (2 câu)

**Câu 1.** **Q13** — Vì sao `NOT EXISTS (… where s.order_id = i.order_id)` (chỉ so `order_id`) cho kết quả sai? Chỉ ra dòng hàng bị bỏ sót.

<details><summary>Gợi ý đáp án</summary>

Khoá của dòng hàng là **(order_id, line_no)**; một shipment chỉ giao đúng một dòng. Nếu chỉ so `order_id` thì một dòng được coi là "đã giao" khi **bất kỳ** dòng nào cùng đơn đã giao.

Đơn O05 có dòng 1 (Speaker) đã giao bằng DHL, dòng 2 (Earbuds) chưa giao → chỉ so `order_id` thì O05-2 biến mất khỏi kết quả. Tương tự O13-2. Cách đúng:
```sql
NOT EXISTS (SELECT 1 FROM sh_shipment s
            WHERE s.order_id = i.order_id AND s.line_no = i.line_no)
```

</details>

**Câu 2.** **Q16** — Nếu quên bỏ các đơn `cancelled` thì kết quả Q16 đổi thế nào? Nếu dùng `ORDER BY … LIMIT 1` thì sai ở đâu?

<details><summary>Gợi ý đáp án</summary>

Doanh thu (bỏ đơn huỷ): Phones = 800 + 400 + 780 + 400 = **2380**, Computers = 880 + 1500 = **2380** → hai danh mục **hoà**. Đơn O04 (huỷ) có Laptop Pro 1500; nếu không bỏ thì Computers = 3880 và chỉ còn Computers.

`ORDER BY total DESC LIMIT 1` chỉ trả **một** dòng nên làm mất danh mục hoà; phải so `= (SELECT MAX(total) FROM …)`.

</details>

## 2. Bài tập SQL (20 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK8.01 | Q1 where | ★☆☆ | Cho mã và tên các khách hàng ở thành phố Hanoi. Kết quả: `cust_id, name`. |
| GK8.02 | Q2 where >= | ★☆☆ | Liệt kê các sản phẩm có giá niêm yết từ 400 trở lên. Kết quả: `product_id, name, price`. |
| GK8.03 | Q3 where | ★☆☆ | Liệt kê tên các sản phẩm thuộc danh mục Audio. Kết quả: `name`. |
| GK8.04 | Q4 join | ★☆☆ | Với mỗi khách hàng, cho mã, tên, thành phố, vùng (`region`) và phí giao (`ship_fee`) của thành phố đó. Kết quả: `cust_id, name, city, region, ship_fee`. |
| GK8.05 | Q5 join + distinct | ★☆☆ | Tên các sản phẩm (không trùng) mà khách C01 đã mua, ở mọi đơn. Kết quả: `name`. |
| GK8.06 | Q6 join + lọc ngày | ★★☆ | Mã và tên các khách đã mua Earbuds (P05) trong tháng 1/2025 (mỗi khách một dòng). Kết quả: `cust_id, name`. |
| GK8.07 | Q7 3 bảng, so cột | ★★☆ | Tìm nhà cung cấp có cung cấp sản phẩm thuộc danh mục khác với chuyên môn (`specialty`) của mình. Kết quả: `name` (nhà cung cấp), `specialty`, `product` (tên sản phẩm) — mỗi bộ ba một dòng. |
| GK8.08 | Q8 join + distinct | ★☆☆ | Tên các khách hàng (không trùng) đã mua Headphones (P06). Kết quả: `name`. |
| GK8.09 | Q9 join, so cột | ★★☆ | Mã và tên các khách đã mua ít nhất một dòng hàng với giá bán thấp hơn giá niêm yết (`unit_price < price`), mỗi khách một dòng. Kết quả: `cust_id, name`. |
| GK8.10 | Q10 not exists | ★★☆ | Mã và tên các khách chưa đặt đơn nào. Kết quả: `cust_id, name`. |
| GK8.11 | Q11 not exists | ★★☆ | Mã và tên các sản phẩm chưa từng xuất hiện trong dòng hàng nào. Kết quả: `product_id, name`. |
| GK8.12 | Q12 phép chia | ★★★ | Mã và tên các khách đã mua mọi sản phẩm của danh mục Audio (ở đơn nào cũng được). Kết quả: `cust_id, name`. |
| GK8.13 | Q13 not exists, khoá 2 cột | ★★☆ | Tìm các dòng hàng chưa được giao (không có shipment) của những đơn không bị huỷ. Kết quả: `order_id, line_no, product_id`. |
| GK8.14 | Q14 so với trung bình | ★★★ | Tìm khách có số sản phẩm khác nhau đã mua lớn hơn trung bình số sản phẩm khác nhau của mỗi khách (trung bình tính cả khách chưa mua gì; tính mọi đơn). Kết quả: `cust_id, name, product_count`. |
| GK8.15 | Q15 đếm cặp phân biệt | ★★★ | Tìm khách mua cùng một sản phẩm ở nhiều hơn một tháng khác nhau (cặp năm, tháng của `order_date`). Kết quả: `cust_id, name, product_id, month_count`. |
| GK8.16 | Q16 max kể cả hoà | ★★★ | Tìm (các) danh mục có doanh thu cao nhất (tổng `qty * unit_price`, bỏ đơn `cancelled`), giữ các danh mục hoà, và tính cả danh mục không có doanh thu (= 0). Kết quả: `category, revenue`. |
| GK8.17 | Q17 join khoá 2 cột | ★★★ | Tìm khách có hàng được giao bởi ít nhất 3 hãng vận chuyển khác nhau; shipment phải khớp đúng dòng hàng của khách. Kết quả: `cust_id, name, carrier_count`. |
| GK8.18 | Q18 not exists lồng | ★★★ | Tìm khách đã mua ít nhất một sản phẩm cần sản phẩm chính (có trong `sh_requires`), và với mọi sản phẩm như vậy đã mua thì cũng đã mua mọi sản phẩm chính nó cần. Chỉ tính các đơn không bị huỷ. Kết quả: `cust_id, name`. |
| GK8.19 | Q19 phép chia + tập rỗng | ★★★ | Tìm khách đã đặt ít nhất một đơn trong mọi tháng của năm 2025 có đơn hàng (tính mọi đơn). Nếu năm 2025 không có đơn nào thì không trả về khách nào. Kết quả: `cust_id, name`. |
| GK8.20 | Q20 quy đổi + avg | ★★★ | Tìm nhà cung cấp có điểm đánh giá trung bình của các sản phẩm mình cung cấp lớn hơn trung bình chung của mọi đánh giá hợp lệ. Quy đổi Excellent=5, Good=4, Average=3, Poor=2, Terrible=1; bỏ `NULL` và giá trị lạ. Một đánh giá tính cho mọi nhà cung cấp của sản phẩm đó. Kết quả: `supplier_id, name, avg_score` (không làm tròn). |

## 3. Ghi nhớ nhanh

### 1. Đề này là gì
20 truy vấn luyện **đúng các dạng của Đề mẫu (GK7)** nhưng trên một lược đồ khác: cửa hàng trực tuyến. Câu Qn ở đây cùng dạng với Qn của GK7. Bấm **Database** để xem bảng, **Debug** để chạy từng bước.

| Bảng | Ý nghĩa |
|---|---|
| `sh_customer(cust_id, name, city, tier)` | khách hàng; `city` → `sh_region` |
| `sh_region(city, region, ship_fee)` | vùng và phí giao của mỗi thành phố |
| `sh_category(category, manager)` | danh mục (Home **chưa có sản phẩm**) |
| `sh_product(product_id, name, category, price)` | sản phẩm, `price` = giá niêm yết |
| `sh_requires(product_id, required_id)` | phụ kiện cần có sản phẩm chính (giống `prereq`) |
| `sh_supplier(supplier_id, name, country, specialty)`, `sh_supplies` | nhà cung cấp và sản phẩm họ cung cấp (giống `instructor`/`teaches`) |
| `sh_orders(order_id, cust_id, order_date, status)` | đơn hàng; `status` = delivered / pending / **cancelled** |
| `sh_order_item(order_id, line_no, product_id, qty, unit_price)` | dòng hàng, khoá **(order_id, line_no)**; `unit_price` có thể thấp hơn `price` |
| `sh_shipment(order_id, line_no, carrier, ship_date)` | mỗi dòng hàng được giao riêng; khớp **cả 2 cột** |
| `sh_review(cust_id, product_id, rating)` | Excellent / Good / Average / Poor / Terrible, có `NULL` và `'N/A'` |

### 2. Dạng ↔ câu
| Dạng | Câu | Cách viết |
|---|---|---|
| "chưa từng" | Q10, Q11, Q13 | `NOT EXISTS` hoặc `LEFT JOIN … IS NULL` |
| Phép chia "mọi …" | Q12, Q19 | `NOT EXISTS (tập cần có EXCEPT tập đã có)` |
| So với trung bình | Q14, Q20 | `WITH` tính từng nhóm, rồi so với `(select avg …)` |
| Lớn nhất kể cả hoà | Q16 | `= (select max …)` |
| Khoá nhiều cột | Q13, Q17 | khớp `order_id` **và** `line_no` |
| Theo tháng | Q6, Q15, Q19 | `order_date >= '2025-01-01' and order_date < '2025-02-01'`, `extract(month from …)` |

### 3. Bẫy hay gặp
- **Q5, Q8:** khách mua lại cùng sản phẩm (C01 mua Earbuds 3 lần, C09 có 2 dòng Headphones trong một đơn) → `DISTINCT`.
- **Q13:** đơn O05 có dòng 1 đã giao, dòng 2 chưa; chỉ so `order_id` sẽ bỏ sót dòng 2.
- **Q14:** trung bình phải tính cả khách chưa mua gì (C07, C10) → `LEFT JOIN`.
- **Q15:** C09 mua Headphones 2 dòng trong **cùng** một đơn → chỉ là 1 tháng; đếm cặp (năm, tháng) phân biệt.
- **Q16:** bỏ đơn `cancelled`; Phones và Computers **hoà** nhau; Home không có sản phẩm → 0.
- **Q18:** "đã có" sản phẩm chính = có mua ở bất kỳ đơn nào **không bị huỷ**.
- **Q20:** `NULL` và `'N/A'` bị bỏ bằng **inner join** với bảng quy đổi.
