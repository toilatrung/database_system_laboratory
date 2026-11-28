// Đề mẫu 2 — 20 truy vấn cùng dạng với Đề mẫu GK7 nhưng trên Shop database (lab/db/exam_shop.sql).
export default {
  key: 'gk8',
  slug: 'gk8_sample_shop',
  label: 'Đề mẫu 2 · Cửa hàng',
  navLabel: 'Đề mẫu 2',
  kind: 'Đề thi',
  short: 'GK-M2',
  title: 'Shop Database: 20 SQL Query Exercises',
  titleVi: 'Đề mẫu 2 — 20 truy vấn trên Shop database',
  dbPanel: 'sh_',

  summary: `
### 1. Đề này là gì
20 truy vấn luyện **đúng các dạng của Đề mẫu (GK7)** nhưng trên một lược đồ khác: cửa hàng trực tuyến. Câu Qn ở đây cùng dạng với Qn của GK7. Bấm **Database** để xem bảng, **Debug** để chạy từng bước.

| Bảng | Ý nghĩa |
|---|---|
| \`sh_customer(cust_id, name, city, tier)\` | khách hàng; \`city\` → \`sh_region\` |
| \`sh_region(city, region, ship_fee)\` | vùng và phí giao của mỗi thành phố |
| \`sh_category(category, manager)\` | danh mục (Home **chưa có sản phẩm**) |
| \`sh_product(product_id, name, category, price)\` | sản phẩm, \`price\` = giá niêm yết |
| \`sh_requires(product_id, required_id)\` | phụ kiện cần có sản phẩm chính (giống \`prereq\`) |
| \`sh_supplier(supplier_id, name, country, specialty)\`, \`sh_supplies\` | nhà cung cấp và sản phẩm họ cung cấp (giống \`instructor\`/\`teaches\`) |
| \`sh_orders(order_id, cust_id, order_date, status)\` | đơn hàng; \`status\` = delivered / pending / **cancelled** |
| \`sh_order_item(order_id, line_no, product_id, qty, unit_price)\` | dòng hàng, khoá **(order_id, line_no)**; \`unit_price\` có thể thấp hơn \`price\` |
| \`sh_shipment(order_id, line_no, carrier, ship_date)\` | mỗi dòng hàng được giao riêng; khớp **cả 2 cột** |
| \`sh_review(cust_id, product_id, rating)\` | Excellent / Good / Average / Poor / Terrible, có \`NULL\` và \`'N/A'\` |

### 2. Dạng ↔ câu
| Dạng | Câu | Cách viết |
|---|---|---|
| "chưa từng" | Q10, Q11, Q13 | \`NOT EXISTS\` hoặc \`LEFT JOIN … IS NULL\` |
| Phép chia "mọi …" | Q12, Q19 | \`NOT EXISTS (tập cần có EXCEPT tập đã có)\` |
| So với trung bình | Q14, Q20 | \`WITH\` tính từng nhóm, rồi so với \`(select avg …)\` |
| Lớn nhất kể cả hoà | Q16 | \`= (select max …)\` |
| Khoá nhiều cột | Q13, Q17 | khớp \`order_id\` **và** \`line_no\` |
| Theo tháng | Q6, Q15, Q19 | \`order_date >= '2025-01-01' and order_date < '2025-02-01'\`, \`extract(month from …)\` |

### 3. Bẫy hay gặp
- **Q5, Q8:** khách mua lại cùng sản phẩm (C01 mua Earbuds 3 lần, C09 có 2 dòng Headphones trong một đơn) → \`DISTINCT\`.
- **Q13:** đơn O05 có dòng 1 đã giao, dòng 2 chưa; chỉ so \`order_id\` sẽ bỏ sót dòng 2.
- **Q14:** trung bình phải tính cả khách chưa mua gì (C07, C10) → \`LEFT JOIN\`.
- **Q15:** C09 mua Headphones 2 dòng trong **cùng** một đơn → chỉ là 1 tháng; đếm cặp (năm, tháng) phân biệt.
- **Q16:** bỏ đơn \`cancelled\`; Phones và Computers **hoà** nhau; Home không có sản phẩm → 0.
- **Q18:** "đã có" sản phẩm chính = có mua ở bất kỳ đơn nào **không bị huỷ**.
- **Q20:** \`NULL\` và \`'N/A'\` bị bỏ bằng **inner join** với bảng quy đổi.
`,

  quiz: [],

  questions: [
    {
      q: '**Q13** — Vì sao `NOT EXISTS (… where s.order_id = i.order_id)` (chỉ so `order_id`) cho kết quả sai? Chỉ ra dòng hàng bị bỏ sót.',
      answer: `Khoá của dòng hàng là **(order_id, line_no)**; một shipment chỉ giao đúng một dòng. Nếu chỉ so \`order_id\` thì một dòng được coi là "đã giao" khi **bất kỳ** dòng nào cùng đơn đã giao.

Đơn O05 có dòng 1 (Speaker) đã giao bằng DHL, dòng 2 (Earbuds) chưa giao → chỉ so \`order_id\` thì O05-2 biến mất khỏi kết quả. Tương tự O13-2. Cách đúng:
\`\`\`sql
NOT EXISTS (SELECT 1 FROM sh_shipment s
            WHERE s.order_id = i.order_id AND s.line_no = i.line_no)
\`\`\``,
    },
    {
      q: '**Q16** — Nếu quên bỏ các đơn `cancelled` thì kết quả Q16 đổi thế nào? Nếu dùng `ORDER BY … LIMIT 1` thì sai ở đâu?',
      answer: `Doanh thu (bỏ đơn huỷ): Phones = 800 + 400 + 780 + 400 = **2380**, Computers = 880 + 1500 = **2380** → hai danh mục **hoà**. Đơn O04 (huỷ) có Laptop Pro 1500; nếu không bỏ thì Computers = 3880 và chỉ còn Computers.

\`ORDER BY total DESC LIMIT 1\` chỉ trả **một** dòng nên làm mất danh mục hoà; phải so \`= (SELECT MAX(total) FROM …)\`.`,
    },
  ],

  exercises: [
    // ───────────── Cơ bản (1–5)
    { id: 'GK8.01', topic: 'Q1 where', level: 1,
      prompt: 'Cho mã và tên các khách hàng ở thành phố **Hanoi**. Kết quả: `cust_id, name`.',
      solution: `SELECT cust_id, name
FROM sh_customer
WHERE city = 'Hanoi';` },
    { id: 'GK8.02', topic: 'Q2 where >=', level: 1,
      prompt: 'Liệt kê các sản phẩm có giá niêm yết **từ 400 trở lên**. Kết quả: `product_id, name, price`.',
      solution: `SELECT product_id, name, price
FROM sh_product
WHERE price >= 400;` },
    { id: 'GK8.03', topic: 'Q3 where', level: 1,
      prompt: 'Liệt kê tên các sản phẩm thuộc danh mục **Audio**. Kết quả: `name`.',
      solution: `SELECT name
FROM sh_product
WHERE category = 'Audio';` },
    { id: 'GK8.04', topic: 'Q4 join', level: 1,
      prompt: 'Với mỗi khách hàng, cho mã, tên, thành phố, vùng (`region`) và phí giao (`ship_fee`) của thành phố đó. Kết quả: `cust_id, name, city, region, ship_fee`.',
      solution: `SELECT c.cust_id, c.name, c.city, r.region, r.ship_fee
FROM sh_customer c
JOIN sh_region r ON r.city = c.city;` },
    { id: 'GK8.05', topic: 'Q5 join + distinct', level: 1,
      prompt: 'Tên các sản phẩm (không trùng) mà khách **C01** đã mua, ở mọi đơn. Kết quả: `name`.',
      hint: 'sh_orders → sh_order_item → sh_product; C01 mua Earbuds nhiều lần.',
      solution: `SELECT DISTINCT p.name
FROM sh_orders o
JOIN sh_order_item i ON i.order_id = o.order_id
JOIN sh_product p    ON p.product_id = i.product_id
WHERE o.cust_id = 'C01';` },

    // ───────────── Trung bình (6–13)
    { id: 'GK8.06', topic: 'Q6 join + lọc ngày', level: 2,
      prompt: 'Mã và tên các khách đã mua **Earbuds (P05)** trong **tháng 1/2025** (mỗi khách một dòng). Kết quả: `cust_id, name`.',
      hint: "order_date >= '2025-01-01' AND order_date < '2025-02-01'.",
      solution: `SELECT DISTINCT c.cust_id, c.name
FROM sh_customer c
JOIN sh_orders o     ON o.cust_id = c.cust_id
JOIN sh_order_item i ON i.order_id = o.order_id
WHERE i.product_id = 'P05'
  AND o.order_date >= '2025-01-01' AND o.order_date < '2025-02-01';` },
    { id: 'GK8.07', topic: 'Q7 3 bảng, so cột', level: 2,
      prompt: 'Tìm nhà cung cấp có cung cấp sản phẩm **thuộc danh mục khác** với chuyên môn (`specialty`) của mình. Kết quả: `name` (nhà cung cấp), `specialty`, `product` (tên sản phẩm) — mỗi bộ ba một dòng.',
      solution: `SELECT DISTINCT s.name, s.specialty, p.name AS product
FROM sh_supplier s
JOIN sh_supplies sp ON sp.supplier_id = s.supplier_id
JOIN sh_product p   ON p.product_id = sp.product_id
WHERE p.category <> s.specialty;` },
    { id: 'GK8.08', topic: 'Q8 join + distinct', level: 1,
      prompt: 'Tên các khách hàng (không trùng) đã mua **Headphones (P06)**. Kết quả: `name`.',
      solution: `SELECT DISTINCT c.name
FROM sh_customer c
JOIN sh_orders o     ON o.cust_id = c.cust_id
JOIN sh_order_item i ON i.order_id = o.order_id
WHERE i.product_id = 'P06';` },
    { id: 'GK8.09', topic: 'Q9 join, so cột', level: 2,
      prompt: 'Mã và tên các khách đã mua **ít nhất một dòng hàng với giá bán thấp hơn giá niêm yết** (`unit_price < price`), mỗi khách một dòng. Kết quả: `cust_id, name`.',
      solution: `SELECT DISTINCT c.cust_id, c.name
FROM sh_customer c
JOIN sh_orders o     ON o.cust_id = c.cust_id
JOIN sh_order_item i ON i.order_id = o.order_id
JOIN sh_product p    ON p.product_id = i.product_id
WHERE i.unit_price < p.price;` },
    { id: 'GK8.10', topic: 'Q10 not exists', level: 2,
      prompt: 'Mã và tên các khách **chưa đặt đơn nào**. Kết quả: `cust_id, name`.',
      solution: `SELECT c.cust_id, c.name
FROM sh_customer c
WHERE NOT EXISTS (SELECT 1 FROM sh_orders o WHERE o.cust_id = c.cust_id);` },
    { id: 'GK8.11', topic: 'Q11 not exists', level: 2,
      prompt: 'Mã và tên các sản phẩm **chưa từng xuất hiện trong dòng hàng nào**. Kết quả: `product_id, name`.',
      solution: `SELECT p.product_id, p.name
FROM sh_product p
WHERE NOT EXISTS (SELECT 1 FROM sh_order_item i WHERE i.product_id = p.product_id);` },
    { id: 'GK8.12', topic: 'Q12 phép chia', level: 3,
      prompt: 'Mã và tên các khách đã mua **mọi** sản phẩm của danh mục **Audio** (ở đơn nào cũng được). Kết quả: `cust_id, name`.',
      hint: 'NOT EXISTS (sản phẩm Audio EXCEPT sản phẩm khách đã mua).',
      solution: `SELECT c.cust_id, c.name
FROM sh_customer c
WHERE NOT EXISTS (
  SELECT product_id FROM sh_product WHERE category = 'Audio'
  EXCEPT
  SELECT i.product_id
  FROM sh_orders o JOIN sh_order_item i ON i.order_id = o.order_id
  WHERE o.cust_id = c.cust_id
);` },
    { id: 'GK8.13', topic: 'Q13 not exists, khoá 2 cột', level: 2,
      prompt: 'Tìm các dòng hàng **chưa được giao** (không có shipment) của những đơn **không bị huỷ**. Kết quả: `order_id, line_no, product_id`.',
      hint: 'Shipment phải khớp cả order_id và line_no.',
      solution: `SELECT i.order_id, i.line_no, i.product_id
FROM sh_order_item i
JOIN sh_orders o ON o.order_id = i.order_id
WHERE o.status <> 'cancelled'
  AND NOT EXISTS (
        SELECT 1 FROM sh_shipment s
        WHERE s.order_id = i.order_id AND s.line_no = i.line_no);` },

    // ───────────── Khó (14–20)
    { id: 'GK8.14', topic: 'Q14 so với trung bình', level: 3,
      prompt: 'Tìm khách có **số sản phẩm khác nhau đã mua** lớn hơn **trung bình** số sản phẩm khác nhau của mỗi khách (trung bình tính **cả khách chưa mua gì**; tính mọi đơn). Kết quả: `cust_id, name, product_count`.',
      hint: 'sh_customer LEFT JOIN sh_orders LEFT JOIN sh_order_item, COUNT(DISTINCT i.product_id).',
      solution: `WITH cnt AS (
  SELECT c.cust_id, c.name, COUNT(DISTINCT i.product_id) AS product_count
  FROM sh_customer c
  LEFT JOIN sh_orders o     ON o.cust_id = c.cust_id
  LEFT JOIN sh_order_item i ON i.order_id = o.order_id
  GROUP BY c.cust_id, c.name
)
SELECT cust_id, name, product_count
FROM cnt
WHERE product_count > (SELECT AVG(product_count) FROM cnt);` },
    { id: 'GK8.15', topic: 'Q15 đếm cặp phân biệt', level: 3,
      prompt: 'Tìm khách mua **cùng một sản phẩm** ở **nhiều hơn một** tháng khác nhau (cặp năm, tháng của `order_date`). Kết quả: `cust_id, name, product_id, month_count`.',
      hint: 'DISTINCT (cust_id, product_id, năm, tháng) trước, rồi mới đếm.',
      solution: `SELECT c.cust_id, c.name, x.product_id, COUNT(*) AS month_count
FROM (SELECT DISTINCT o.cust_id, i.product_id,
             EXTRACT(YEAR FROM o.order_date) AS y, EXTRACT(MONTH FROM o.order_date) AS m
      FROM sh_orders o JOIN sh_order_item i ON i.order_id = o.order_id) x
JOIN sh_customer c ON c.cust_id = x.cust_id
GROUP BY c.cust_id, c.name, x.product_id
HAVING COUNT(*) > 1;` },
    { id: 'GK8.16', topic: 'Q16 max kể cả hoà', level: 3,
      prompt: 'Tìm (các) danh mục có **doanh thu cao nhất** (tổng `qty * unit_price`, **bỏ đơn `cancelled`**), giữ các danh mục **hoà**, và tính cả danh mục **không có doanh thu** (= 0). Kết quả: `category, revenue`.',
      hint: 'sh_category LEFT JOIN (dòng hàng của đơn không huỷ, kèm category), COALESCE(SUM(...), 0).',
      solution: `WITH sold AS (
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
WHERE revenue = (SELECT MAX(revenue) FROM rev);` },
    { id: 'GK8.17', topic: 'Q17 join khoá 2 cột', level: 3,
      prompt: 'Tìm khách có hàng được giao bởi **ít nhất 3 hãng vận chuyển khác nhau**; shipment phải khớp **đúng dòng hàng** của khách. Kết quả: `cust_id, name, carrier_count`.',
      solution: `SELECT c.cust_id, c.name, COUNT(DISTINCT s.carrier) AS carrier_count
FROM sh_orders o
JOIN sh_order_item i ON i.order_id = o.order_id
JOIN sh_shipment s   ON s.order_id = i.order_id AND s.line_no = i.line_no
JOIN sh_customer c   ON c.cust_id = o.cust_id
GROUP BY c.cust_id, c.name
HAVING COUNT(DISTINCT s.carrier) >= 3;` },
    { id: 'GK8.18', topic: 'Q18 not exists lồng', level: 3,
      prompt: 'Tìm khách đã mua **ít nhất một sản phẩm cần sản phẩm chính** (có trong `sh_requires`), và với **mọi** sản phẩm như vậy đã mua thì cũng đã mua **mọi** sản phẩm chính nó cần. Chỉ tính các đơn **không bị huỷ**. Kết quả: `cust_id, name`.',
      hint: 'Tạo bought(cust_id, product_id) từ đơn không huỷ; EXISTS (mua sp có yêu cầu) AND NOT EXISTS (một yêu cầu chưa có trong bought).',
      solution: `WITH bought AS (
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
                          WHERE b2.cust_id = c.cust_id AND b2.product_id = r.required_id));` },
    { id: 'GK8.19', topic: 'Q19 phép chia + tập rỗng', level: 3,
      prompt: 'Tìm khách đã đặt ít nhất một đơn trong **mọi tháng của năm 2025 có đơn hàng** (tính mọi đơn). Nếu năm 2025 không có đơn nào thì **không** trả về khách nào. Kết quả: `cust_id, name`.',
      hint: 'NOT EXISTS (các tháng có đơn năm 2025 EXCEPT các tháng khách đặt năm 2025) cùng EXISTS (đơn năm 2025).',
      solution: `SELECT c.cust_id, c.name
FROM sh_customer c
WHERE EXISTS (SELECT 1 FROM sh_orders WHERE EXTRACT(YEAR FROM order_date) = 2025)
  AND NOT EXISTS (
        SELECT EXTRACT(MONTH FROM order_date) FROM sh_orders
        WHERE EXTRACT(YEAR FROM order_date) = 2025
        EXCEPT
        SELECT EXTRACT(MONTH FROM o.order_date) FROM sh_orders o
        WHERE o.cust_id = c.cust_id AND EXTRACT(YEAR FROM o.order_date) = 2025);` },
    { id: 'GK8.20', topic: 'Q20 quy đổi + avg', level: 3,
      prompt: 'Tìm nhà cung cấp có **điểm đánh giá trung bình** của các sản phẩm mình cung cấp lớn hơn **trung bình chung của mọi đánh giá hợp lệ**. Quy đổi Excellent=5, Good=4, Average=3, Poor=2, Terrible=1; bỏ `NULL` và giá trị lạ. Một đánh giá tính cho **mọi** nhà cung cấp của sản phẩm đó. Kết quả: `supplier_id, name, avg_score` (không làm tròn).',
      hint: 'WITH sc(rating, score) AS (VALUES ...); inner join với sh_review tự bỏ NULL và N/A.',
      solution: `WITH sc(rating, score) AS (
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
HAVING AVG(rv.score) > (SELECT AVG(score) FROM rv);` },
  ],
};
