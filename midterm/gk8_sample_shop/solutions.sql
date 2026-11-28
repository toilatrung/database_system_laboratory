-- =====================================================================
-- CS4420 · Đề mẫu 2 · Cửa hàng — Đề mẫu 2 — 20 truy vấn trên Shop database (Shop Database: 20 SQL Query Exercises)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex GK8.01  [Q1 where]  ★☆☆
-- Cho mã và tên các khách hàng ở thành phố Hanoi. Kết quả: `cust_id, name`.
SELECT cust_id, name
FROM sh_customer
WHERE city = 'Hanoi';

-- @ex GK8.02  [Q2 where >=]  ★☆☆
-- Liệt kê các sản phẩm có giá niêm yết từ 400 trở lên. Kết quả: `product_id, name, price`.
SELECT product_id, name, price
FROM sh_product
WHERE price >= 400;

-- @ex GK8.03  [Q3 where]  ★☆☆
-- Liệt kê tên các sản phẩm thuộc danh mục Audio. Kết quả: `name`.
SELECT name
FROM sh_product
WHERE category = 'Audio';

-- @ex GK8.04  [Q4 join]  ★☆☆
-- Với mỗi khách hàng, cho mã, tên, thành phố, vùng (`region`) và phí giao (`ship_fee`) của thành phố đó. Kết quả: `cust_id, name, city, region, ship_fee`.
SELECT c.cust_id, c.name, c.city, r.region, r.ship_fee
FROM sh_customer c
JOIN sh_region r ON r.city = c.city;

-- @ex GK8.05  [Q5 join + distinct]  ★☆☆
-- Tên các sản phẩm (không trùng) mà khách C01 đã mua, ở mọi đơn. Kết quả: `name`.
-- Gợi ý: sh_orders → sh_order_item → sh_product; C01 mua Earbuds nhiều lần.
SELECT DISTINCT p.name
FROM sh_orders o
JOIN sh_order_item i ON i.order_id = o.order_id
JOIN sh_product p    ON p.product_id = i.product_id
WHERE o.cust_id = 'C01';

-- @ex GK8.06  [Q6 join + lọc ngày]  ★★☆
-- Mã và tên các khách đã mua Earbuds (P05) trong tháng 1/2025 (mỗi khách một dòng). Kết quả: `cust_id, name`.
-- Gợi ý: order_date >= '2025-01-01' AND order_date < '2025-02-01'.
SELECT DISTINCT c.cust_id, c.name
FROM sh_customer c
JOIN sh_orders o     ON o.cust_id = c.cust_id
JOIN sh_order_item i ON i.order_id = o.order_id
WHERE i.product_id = 'P05'
  AND o.order_date >= '2025-01-01' AND o.order_date < '2025-02-01';

-- @ex GK8.07  [Q7 3 bảng, so cột]  ★★☆
-- Tìm nhà cung cấp có cung cấp sản phẩm thuộc danh mục khác với chuyên môn (`specialty`) của mình. Kết quả: `name` (nhà cung cấp), `specialty`, `product` (tên sản phẩm) — mỗi bộ ba một dòng.
SELECT DISTINCT s.name, s.specialty, p.name AS product
FROM sh_supplier s
JOIN sh_supplies sp ON sp.supplier_id = s.supplier_id
JOIN sh_product p   ON p.product_id = sp.product_id
WHERE p.category <> s.specialty;

-- @ex GK8.08  [Q8 join + distinct]  ★☆☆
-- Tên các khách hàng (không trùng) đã mua Headphones (P06). Kết quả: `name`.
SELECT DISTINCT c.name
FROM sh_customer c
JOIN sh_orders o     ON o.cust_id = c.cust_id
JOIN sh_order_item i ON i.order_id = o.order_id
WHERE i.product_id = 'P06';

-- @ex GK8.09  [Q9 join, so cột]  ★★☆
-- Mã và tên các khách đã mua ít nhất một dòng hàng với giá bán thấp hơn giá niêm yết (`unit_price < price`), mỗi khách một dòng. Kết quả: `cust_id, name`.
SELECT DISTINCT c.cust_id, c.name
FROM sh_customer c
JOIN sh_orders o     ON o.cust_id = c.cust_id
JOIN sh_order_item i ON i.order_id = o.order_id
JOIN sh_product p    ON p.product_id = i.product_id
WHERE i.unit_price < p.price;

-- @ex GK8.10  [Q10 not exists]  ★★☆
-- Mã và tên các khách chưa đặt đơn nào. Kết quả: `cust_id, name`.
SELECT c.cust_id, c.name
FROM sh_customer c
WHERE NOT EXISTS (SELECT 1 FROM sh_orders o WHERE o.cust_id = c.cust_id);

-- @ex GK8.11  [Q11 not exists]  ★★☆
-- Mã và tên các sản phẩm chưa từng xuất hiện trong dòng hàng nào. Kết quả: `product_id, name`.
SELECT p.product_id, p.name
FROM sh_product p
WHERE NOT EXISTS (SELECT 1 FROM sh_order_item i WHERE i.product_id = p.product_id);

-- @ex GK8.12  [Q12 phép chia]  ★★★
-- Mã và tên các khách đã mua mọi sản phẩm của danh mục Audio (ở đơn nào cũng được). Kết quả: `cust_id, name`.
-- Gợi ý: NOT EXISTS (sản phẩm Audio EXCEPT sản phẩm khách đã mua).
SELECT c.cust_id, c.name
FROM sh_customer c
WHERE NOT EXISTS (
  SELECT product_id FROM sh_product WHERE category = 'Audio'
  EXCEPT
  SELECT i.product_id
  FROM sh_orders o JOIN sh_order_item i ON i.order_id = o.order_id
  WHERE o.cust_id = c.cust_id
);

-- @ex GK8.13  [Q13 not exists, khoá 2 cột]  ★★☆
-- Tìm các dòng hàng chưa được giao (không có shipment) của những đơn không bị huỷ. Kết quả: `order_id, line_no, product_id`.
-- Gợi ý: Shipment phải khớp cả order_id và line_no.
SELECT i.order_id, i.line_no, i.product_id
FROM sh_order_item i
JOIN sh_orders o ON o.order_id = i.order_id
WHERE o.status <> 'cancelled'
  AND NOT EXISTS (
        SELECT 1 FROM sh_shipment s
        WHERE s.order_id = i.order_id AND s.line_no = i.line_no);

-- @ex GK8.14  [Q14 so với trung bình]  ★★★
-- Tìm khách có số sản phẩm khác nhau đã mua lớn hơn trung bình số sản phẩm khác nhau của mỗi khách (trung bình tính cả khách chưa mua gì; tính mọi đơn). Kết quả: `cust_id, name, product_count`.
-- Gợi ý: sh_customer LEFT JOIN sh_orders LEFT JOIN sh_order_item, COUNT(DISTINCT i.product_id).
WITH cnt AS (
  SELECT c.cust_id, c.name, COUNT(DISTINCT i.product_id) AS product_count
  FROM sh_customer c
  LEFT JOIN sh_orders o     ON o.cust_id = c.cust_id
  LEFT JOIN sh_order_item i ON i.order_id = o.order_id
  GROUP BY c.cust_id, c.name
)
SELECT cust_id, name, product_count
FROM cnt
WHERE product_count > (SELECT AVG(product_count) FROM cnt);

-- @ex GK8.15  [Q15 đếm cặp phân biệt]  ★★★
-- Tìm khách mua cùng một sản phẩm ở nhiều hơn một tháng khác nhau (cặp năm, tháng của `order_date`). Kết quả: `cust_id, name, product_id, month_count`.
-- Gợi ý: DISTINCT (cust_id, product_id, năm, tháng) trước, rồi mới đếm.
SELECT c.cust_id, c.name, x.product_id, COUNT(*) AS month_count
FROM (SELECT DISTINCT o.cust_id, i.product_id,
             EXTRACT(YEAR FROM o.order_date) AS y, EXTRACT(MONTH FROM o.order_date) AS m
      FROM sh_orders o JOIN sh_order_item i ON i.order_id = o.order_id) x
JOIN sh_customer c ON c.cust_id = x.cust_id
GROUP BY c.cust_id, c.name, x.product_id
HAVING COUNT(*) > 1;

-- @ex GK8.16  [Q16 max kể cả hoà]  ★★★
-- Tìm (các) danh mục có doanh thu cao nhất (tổng `qty * unit_price`, bỏ đơn `cancelled`), giữ các danh mục hoà, và tính cả danh mục không có doanh thu (= 0). Kết quả: `category, revenue`.
-- Gợi ý: sh_category LEFT JOIN (dòng hàng của đơn không huỷ, kèm category), COALESCE(SUM(...), 0).
WITH sold AS (
  SELECT p.category, i.qty * i.unit_price AS amount
  FROM sh_order_item i
  JOIN sh_orders o  ON o.order_id = i.order_id
  JOIN sh_product p ON p.product_id = i.product_id
  WHERE o.status <> 'cancelled'
),
rev AS (
  SELECT g.category, COALESCE(SUM(s.amount), 0) AS revenue
  FROM sh_category g
  LEFT JOIN sold s ON s.category = g.category
  GROUP BY g.category
)
SELECT category, revenue
FROM rev
WHERE revenue = (SELECT MAX(revenue) FROM rev);

-- @ex GK8.17  [Q17 join khoá 2 cột]  ★★★
-- Tìm khách có hàng được giao bởi ít nhất 3 hãng vận chuyển khác nhau; shipment phải khớp đúng dòng hàng của khách. Kết quả: `cust_id, name, carrier_count`.
SELECT c.cust_id, c.name, COUNT(DISTINCT s.carrier) AS carrier_count
FROM sh_orders o
JOIN sh_order_item i ON i.order_id = o.order_id
JOIN sh_shipment s   ON s.order_id = i.order_id AND s.line_no = i.line_no
JOIN sh_customer c   ON c.cust_id = o.cust_id
GROUP BY c.cust_id, c.name
HAVING COUNT(DISTINCT s.carrier) >= 3;

-- @ex GK8.18  [Q18 not exists lồng]  ★★★
-- Tìm khách đã mua ít nhất một sản phẩm cần sản phẩm chính (có trong `sh_requires`), và với mọi sản phẩm như vậy đã mua thì cũng đã mua mọi sản phẩm chính nó cần. Chỉ tính các đơn không bị huỷ. Kết quả: `cust_id, name`.
-- Gợi ý: Tạo bought(cust_id, product_id) từ đơn không huỷ; EXISTS (mua sp có yêu cầu) AND NOT EXISTS (một yêu cầu chưa có trong bought).
WITH bought AS (
  SELECT DISTINCT o.cust_id, i.product_id
  FROM sh_orders o JOIN sh_order_item i ON i.order_id = o.order_id
  WHERE o.status <> 'cancelled'
)
SELECT c.cust_id, c.name
FROM sh_customer c
WHERE EXISTS (
        SELECT 1 FROM bought b JOIN sh_requires r ON r.product_id = b.product_id
        WHERE b.cust_id = c.cust_id)
  AND NOT EXISTS (
        SELECT 1 FROM bought b JOIN sh_requires r ON r.product_id = b.product_id
        WHERE b.cust_id = c.cust_id
          AND NOT EXISTS (SELECT 1 FROM bought b2
                          WHERE b2.cust_id = c.cust_id AND b2.product_id = r.required_id));

-- @ex GK8.19  [Q19 phép chia + tập rỗng]  ★★★
-- Tìm khách đã đặt ít nhất một đơn trong mọi tháng của năm 2025 có đơn hàng (tính mọi đơn). Nếu năm 2025 không có đơn nào thì không trả về khách nào. Kết quả: `cust_id, name`.
-- Gợi ý: NOT EXISTS (các tháng có đơn năm 2025 EXCEPT các tháng khách đặt năm 2025) cùng EXISTS (đơn năm 2025).
SELECT c.cust_id, c.name
FROM sh_customer c
WHERE EXISTS (SELECT 1 FROM sh_orders WHERE EXTRACT(YEAR FROM order_date) = 2025)
  AND NOT EXISTS (
        SELECT EXTRACT(MONTH FROM order_date) FROM sh_orders
        WHERE EXTRACT(YEAR FROM order_date) = 2025
        EXCEPT
        SELECT EXTRACT(MONTH FROM o.order_date) FROM sh_orders o
        WHERE o.cust_id = c.cust_id AND EXTRACT(YEAR FROM o.order_date) = 2025);

-- @ex GK8.20  [Q20 quy đổi + avg]  ★★★
-- Tìm nhà cung cấp có điểm đánh giá trung bình của các sản phẩm mình cung cấp lớn hơn trung bình chung của mọi đánh giá hợp lệ. Quy đổi Excellent=5, Good=4, Average=3, Poor=2, Terrible=1; bỏ `NULL` và giá trị lạ. Một đánh giá tính cho mọi nhà cung cấp của sản phẩm đó. Kết quả: `supplier_id, name, avg_score` (không làm tròn).
-- Gợi ý: WITH sc(rating, score) AS (VALUES ...); inner join với sh_review tự bỏ NULL và N/A.
WITH sc(rating, score) AS (
  VALUES ('Excellent', 5), ('Good', 4), ('Average', 3), ('Poor', 2), ('Terrible', 1)
),
rv AS (
  SELECT r.product_id, sc.score
  FROM sh_review r
  JOIN sc ON sc.rating = r.rating
)
SELECT s.supplier_id, s.name, AVG(rv.score) AS avg_score
FROM rv
JOIN sh_supplies sp ON sp.product_id = rv.product_id
JOIN sh_supplier s  ON s.supplier_id = sp.supplier_id
GROUP BY s.supplier_id, s.name
HAVING AVG(rv.score) > (SELECT AVG(score) FROM rv);
