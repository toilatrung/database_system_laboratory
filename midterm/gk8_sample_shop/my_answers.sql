-- =====================================================================
-- CS4420 · Đề mẫu 2 · Cửa hàng — Đề mẫu 2 — 20 truy vấn trên Shop database (Shop Database: 20 SQL Query Exercises)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- gk8
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex GK8.01  [Q1 where]  ★☆☆
-- Cho mã và tên các khách hàng ở thành phố Hanoi. Kết quả: `cust_id, name`.




-- @ex GK8.02  [Q2 where >=]  ★☆☆
-- Liệt kê các sản phẩm có giá niêm yết từ 400 trở lên. Kết quả: `product_id, name, price`.




-- @ex GK8.03  [Q3 where]  ★☆☆
-- Liệt kê tên các sản phẩm thuộc danh mục Audio. Kết quả: `name`.




-- @ex GK8.04  [Q4 join]  ★☆☆
-- Với mỗi khách hàng, cho mã, tên, thành phố, vùng (`region`) và phí giao (`ship_fee`) của thành phố đó. Kết quả: `cust_id, name, city, region, ship_fee`.




-- @ex GK8.05  [Q5 join + distinct]  ★☆☆
-- Tên các sản phẩm (không trùng) mà khách C01 đã mua, ở mọi đơn. Kết quả: `name`.
-- Gợi ý: sh_orders → sh_order_item → sh_product; C01 mua Earbuds nhiều lần.




-- @ex GK8.06  [Q6 join + lọc ngày]  ★★☆
-- Mã và tên các khách đã mua Earbuds (P05) trong tháng 1/2025 (mỗi khách một dòng). Kết quả: `cust_id, name`.
-- Gợi ý: order_date >= '2025-01-01' AND order_date < '2025-02-01'.




-- @ex GK8.07  [Q7 3 bảng, so cột]  ★★☆
-- Tìm nhà cung cấp có cung cấp sản phẩm thuộc danh mục khác với chuyên môn (`specialty`) của mình. Kết quả: `name` (nhà cung cấp), `specialty`, `product` (tên sản phẩm) — mỗi bộ ba một dòng.




-- @ex GK8.08  [Q8 join + distinct]  ★☆☆
-- Tên các khách hàng (không trùng) đã mua Headphones (P06). Kết quả: `name`.




-- @ex GK8.09  [Q9 join, so cột]  ★★☆
-- Mã và tên các khách đã mua ít nhất một dòng hàng với giá bán thấp hơn giá niêm yết (`unit_price < price`), mỗi khách một dòng. Kết quả: `cust_id, name`.




-- @ex GK8.10  [Q10 not exists]  ★★☆
-- Mã và tên các khách chưa đặt đơn nào. Kết quả: `cust_id, name`.




-- @ex GK8.11  [Q11 not exists]  ★★☆
-- Mã và tên các sản phẩm chưa từng xuất hiện trong dòng hàng nào. Kết quả: `product_id, name`.




-- @ex GK8.12  [Q12 phép chia]  ★★★
-- Mã và tên các khách đã mua mọi sản phẩm của danh mục Audio (ở đơn nào cũng được). Kết quả: `cust_id, name`.
-- Gợi ý: NOT EXISTS (sản phẩm Audio EXCEPT sản phẩm khách đã mua).




-- @ex GK8.13  [Q13 not exists, khoá 2 cột]  ★★☆
-- Tìm các dòng hàng chưa được giao (không có shipment) của những đơn không bị huỷ. Kết quả: `order_id, line_no, product_id`.
-- Gợi ý: Shipment phải khớp cả order_id và line_no.




-- @ex GK8.14  [Q14 so với trung bình]  ★★★
-- Tìm khách có số sản phẩm khác nhau đã mua lớn hơn trung bình số sản phẩm khác nhau của mỗi khách (trung bình tính cả khách chưa mua gì; tính mọi đơn). Kết quả: `cust_id, name, product_count`.
-- Gợi ý: sh_customer LEFT JOIN sh_orders LEFT JOIN sh_order_item, COUNT(DISTINCT i.product_id).




-- @ex GK8.15  [Q15 đếm cặp phân biệt]  ★★★
-- Tìm khách mua cùng một sản phẩm ở nhiều hơn một tháng khác nhau (cặp năm, tháng của `order_date`). Kết quả: `cust_id, name, product_id, month_count`.
-- Gợi ý: DISTINCT (cust_id, product_id, năm, tháng) trước, rồi mới đếm.




-- @ex GK8.16  [Q16 max kể cả hoà]  ★★★
-- Tìm (các) danh mục có doanh thu cao nhất (tổng `qty * unit_price`, bỏ đơn `cancelled`), giữ các danh mục hoà, và tính cả danh mục không có doanh thu (= 0). Kết quả: `category, revenue`.
-- Gợi ý: sh_category LEFT JOIN (dòng hàng của đơn không huỷ, kèm category), COALESCE(SUM(...), 0).




-- @ex GK8.17  [Q17 join khoá 2 cột]  ★★★
-- Tìm khách có hàng được giao bởi ít nhất 3 hãng vận chuyển khác nhau; shipment phải khớp đúng dòng hàng của khách. Kết quả: `cust_id, name, carrier_count`.




-- @ex GK8.18  [Q18 not exists lồng]  ★★★
-- Tìm khách đã mua ít nhất một sản phẩm cần sản phẩm chính (có trong `sh_requires`), và với mọi sản phẩm như vậy đã mua thì cũng đã mua mọi sản phẩm chính nó cần. Chỉ tính các đơn không bị huỷ. Kết quả: `cust_id, name`.
-- Gợi ý: Tạo bought(cust_id, product_id) từ đơn không huỷ; EXISTS (mua sp có yêu cầu) AND NOT EXISTS (một yêu cầu chưa có trong bought).




-- @ex GK8.19  [Q19 phép chia + tập rỗng]  ★★★
-- Tìm khách đã đặt ít nhất một đơn trong mọi tháng của năm 2025 có đơn hàng (tính mọi đơn). Nếu năm 2025 không có đơn nào thì không trả về khách nào. Kết quả: `cust_id, name`.
-- Gợi ý: NOT EXISTS (các tháng có đơn năm 2025 EXCEPT các tháng khách đặt năm 2025) cùng EXISTS (đơn năm 2025).




-- @ex GK8.20  [Q20 quy đổi + avg]  ★★★
-- Tìm nhà cung cấp có điểm đánh giá trung bình của các sản phẩm mình cung cấp lớn hơn trung bình chung của mọi đánh giá hợp lệ. Quy đổi Excellent=5, Good=4, Average=3, Poor=2, Terrible=1; bỏ `NULL` và giá trị lạ. Một đánh giá tính cho mọi nhà cung cấp của sản phẩm đó. Kết quả: `supplier_id, name, avg_score` (không làm tròn).
-- Gợi ý: WITH sc(rating, score) AS (VALUES ...); inner join với sh_review tự bỏ NULL và N/A.


