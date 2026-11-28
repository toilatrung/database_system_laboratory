-- =====================================================================
-- CS4420 · Đề mẫu 3 · Hãng bay — Đề mẫu 3 — 20 truy vấn trên Airline database (Airline Database: 20 SQL Query Exercises)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex GK9.01  [Q1 where]  ★☆☆
-- Cho mã và tên các hành khách có quốc tịch VN. Kết quả: `pax_id, name`.
SELECT pax_id, name
FROM fl_passenger
WHERE country = 'VN';

-- @ex GK9.02  [Q2 where >=]  ★☆☆
-- Liệt kê các tuyến có cự ly từ 1000 km trở lên. Kết quả: `route_id, origin, dest, distance`.
SELECT route_id, origin, dest, distance
FROM fl_route
WHERE distance >= 1000;

-- @ex GK9.03  [Q3 where]  ★☆☆
-- Liệt kê mã sân bay đến (`dest`) của các tuyến xuất phát từ SGN. Kết quả: `dest`.
SELECT dest
FROM fl_route
WHERE origin = 'SGN';

-- @ex GK9.04  [Q4 join 2 lần]  ★☆☆
-- Với mỗi tuyến, cho mã tuyến, thành phố đi và thành phố đến. Kết quả: `route_id, origin_city, dest_city`.
-- Gợi ý: Join fl_airport hai lần với hai alias.
SELECT r.route_id, o.city AS origin_city, d.city AS dest_city
FROM fl_route r
JOIN fl_airport o ON o.code = r.origin
JOIN fl_airport d ON d.code = r.dest;

-- @ex GK9.05  [Q5 join + distinct]  ★☆☆
-- Các thành phố đến (không trùng) mà hành khách P01 đã có vé. Kết quả: `city`.
SELECT DISTINCT a.city
FROM fl_booking b
JOIN fl_route r   ON r.route_id = b.route_id
JOIN fl_airport a ON a.code = r.dest
WHERE b.pax_id = 'P01';

-- @ex GK9.06  [Q6 join + lọc ngày]  ★★☆
-- Mã và tên các hành khách có vé tuyến R01 trong tháng 1/2025. Kết quả: `pax_id, name`.
SELECT DISTINCT p.pax_id, p.name
FROM fl_passenger p
JOIN fl_booking b ON b.pax_id = p.pax_id
WHERE b.route_id = 'R01'
  AND b.flight_date >= '2025-01-01' AND b.flight_date < '2025-02-01';

-- @ex GK9.07  [Q7 3 bảng, so cột]  ★★☆
-- Tìm phi công đã lái tuyến xuất phát từ sân bay khác sân bay gốc (`base`) của mình. Kết quả: `name, base, route_id, origin` — mỗi bộ một dòng.
SELECT DISTINCT p.name, p.base, r.route_id, r.origin
FROM fl_pilot p
JOIN fl_crew c  ON c.pilot_id = p.pilot_id
JOIN fl_route r ON r.route_id = c.route_id
WHERE r.origin <> p.base;

-- @ex GK9.08  [Q8 join + distinct]  ★☆☆
-- Tên các hành khách (không trùng) có vé tuyến R01 (ngày nào cũng được). Kết quả: `name`.
SELECT DISTINCT p.name
FROM fl_passenger p
JOIN fl_booking b ON b.pax_id = p.pax_id
WHERE b.route_id = 'R01';

-- @ex GK9.09  [Q9 join, so cột]  ★★☆
-- Mã và tên các hành khách đã có vé ít nhất một tuyến xuất phát từ nước khác quốc tịch của mình. Kết quả: `pax_id, name`.
SELECT DISTINCT p.pax_id, p.name
FROM fl_passenger p
JOIN fl_booking b ON b.pax_id = p.pax_id
JOIN fl_route r   ON r.route_id = b.route_id
JOIN fl_airport a ON a.code = r.origin
WHERE a.country <> p.country;

-- @ex GK9.10  [Q10 not exists]  ★★☆
-- Mã và tên các hành khách chưa đặt vé nào. Kết quả: `pax_id, name`.
SELECT p.pax_id, p.name
FROM fl_passenger p
WHERE NOT EXISTS (SELECT 1 FROM fl_booking b WHERE b.pax_id = p.pax_id);

-- @ex GK9.11  [Q11 not exists]  ★★☆
-- Các tuyến chưa khai thác chuyến nào (không có dòng trong `fl_flight`). Kết quả: `route_id, origin, dest`.
SELECT r.route_id, r.origin, r.dest
FROM fl_route r
WHERE NOT EXISTS (SELECT 1 FROM fl_flight f WHERE f.route_id = r.route_id);

-- @ex GK9.12  [Q12 phép chia]  ★★★
-- Mã và tên các hành khách đã có vé mọi tuyến đến DAD. Kết quả: `pax_id, name`.
SELECT p.pax_id, p.name
FROM fl_passenger p
WHERE NOT EXISTS (
  SELECT route_id FROM fl_route WHERE dest = 'DAD'
  EXCEPT
  SELECT b.route_id FROM fl_booking b WHERE b.pax_id = p.pax_id
);

-- @ex GK9.13  [Q13 not exists, khoá 2 cột]  ★★☆
-- Tìm các chuyến bay chưa được phân công phi công. Kết quả: `route_id, flight_date`.
-- Gợi ý: Một chuyến được xác định bởi cả route_id và flight_date.
SELECT f.route_id, f.flight_date
FROM fl_flight f
WHERE NOT EXISTS (
  SELECT 1 FROM fl_crew c
  WHERE c.route_id = f.route_id AND c.flight_date = f.flight_date
);

-- @ex GK9.14  [Q14 so với trung bình]  ★★★
-- Tìm hành khách có số tuyến khác nhau đã đặt lớn hơn trung bình số tuyến khác nhau của mỗi hành khách (tính cả khách chưa đặt vé). Kết quả: `pax_id, name, route_count`.
WITH cnt AS (
  SELECT p.pax_id, p.name, COUNT(DISTINCT b.route_id) AS route_count
  FROM fl_passenger p
  LEFT JOIN fl_booking b ON b.pax_id = p.pax_id
  GROUP BY p.pax_id, p.name
)
SELECT pax_id, name, route_count
FROM cnt
WHERE route_count > (SELECT AVG(route_count) FROM cnt);

-- @ex GK9.15  [Q15 đếm phân biệt]  ★★★
-- Tìm hành khách bay cùng một tuyến vào nhiều hơn một ngày khác nhau. Kết quả: `pax_id, name, route_id, trip_count`.
SELECT p.pax_id, p.name, b.route_id, COUNT(DISTINCT b.flight_date) AS trip_count
FROM fl_booking b
JOIN fl_passenger p ON p.pax_id = b.pax_id
GROUP BY p.pax_id, p.name, b.route_id
HAVING COUNT(DISTINCT b.flight_date) > 1;

-- @ex GK9.16  [Q16 max kể cả hoà]  ★★★
-- Tìm (các) sân bay có tổng lương phi công đặt gốc tại đó cao nhất, giữ các sân bay hoà, tính cả sân bay không có phi công (= 0). Kết quả: `code, total_salary`.
WITH tot AS (
  SELECT a.code, COALESCE(SUM(p.salary), 0) AS total_salary
  FROM fl_airport a
  LEFT JOIN fl_pilot p ON p.base = a.code
  GROUP BY a.code
)
SELECT code, total_salary
FROM tot
WHERE total_salary = (SELECT MAX(total_salary) FROM tot);

-- @ex GK9.17  [Q17 join khoá 2 cột]  ★★★
-- Tìm hành khách đã bay với ít nhất 3 phi công khác nhau; phi công phải lái đúng chuyến (tuyến và ngày) của vé. Kết quả: `pax_id, name, pilot_count`.
SELECT p.pax_id, p.name, COUNT(DISTINCT c.pilot_id) AS pilot_count
FROM fl_booking b
JOIN fl_crew c      ON c.route_id = b.route_id AND c.flight_date = b.flight_date
JOIN fl_passenger p ON p.pax_id = b.pax_id
GROUP BY p.pax_id, p.name
HAVING COUNT(DISTINCT c.pilot_id) >= 3;

-- @ex GK9.18  [Q18 not exists lồng]  ★★★
-- Tìm hành khách đã có vé ít nhất một chặng nối (tuyến có trong `fl_requires`), và với mọi chặng nối đã đặt thì cũng có vé (ngày nào cũng được) mọi tuyến mà chặng đó cần. Kết quả: `pax_id, name`.
SELECT p.pax_id, p.name
FROM fl_passenger p
WHERE EXISTS (
        SELECT 1 FROM fl_booking b JOIN fl_requires q ON q.route_id = b.route_id
        WHERE b.pax_id = p.pax_id)
  AND NOT EXISTS (
        SELECT 1 FROM fl_booking b JOIN fl_requires q ON q.route_id = b.route_id
        WHERE b.pax_id = p.pax_id
          AND NOT EXISTS (SELECT 1 FROM fl_booking b2
                          WHERE b2.pax_id = p.pax_id AND b2.route_id = q.required_id));

-- @ex GK9.19  [Q19 phép chia + tập rỗng]  ★★★
-- Tìm hành khách đã có vé mọi tuyến xuất phát từ HAN có chuyến bay trong năm 2025 (vé năm 2025). Nếu năm 2025 không có chuyến nào từ HAN thì không trả về ai. Kết quả: `pax_id, name`.
WITH need AS (
  SELECT DISTINCT f.route_id
  FROM fl_flight f JOIN fl_route r ON r.route_id = f.route_id
  WHERE r.origin = 'HAN' AND EXTRACT(YEAR FROM f.flight_date) = 2025
)
SELECT p.pax_id, p.name
FROM fl_passenger p
WHERE EXISTS (SELECT 1 FROM need)
  AND NOT EXISTS (
        SELECT route_id FROM need
        EXCEPT
        SELECT b.route_id FROM fl_booking b
        WHERE b.pax_id = p.pax_id AND EXTRACT(YEAR FROM b.flight_date) = 2025);

-- @ex GK9.20  [Q20 quy đổi + avg]  ★★★
-- Tìm phi công có hệ số hạng ghế trung bình của các vé trên chuyến mình lái lớn hơn trung bình chung của mọi vé hợp lệ. Hệ số F=3.0, J=2.0, W=1.5, Y=1.0; bỏ `NULL` và mã lạ. Một vé tính cho mọi phi công của chuyến đó. Kết quả: `pilot_id, name, avg_factor` (không làm tròn).
WITH cf(seat_class, factor) AS (
  VALUES ('F', 3.0), ('J', 2.0), ('W', 1.5), ('Y', 1.0)
),
bk AS (
  SELECT b.route_id, b.flight_date, cf.factor
  FROM fl_booking b
  JOIN cf ON cf.seat_class = b.seat_class
)
SELECT p.pilot_id, p.name, AVG(bk.factor) AS avg_factor
FROM bk
JOIN fl_crew c  ON c.route_id = bk.route_id AND c.flight_date = bk.flight_date
JOIN fl_pilot p ON p.pilot_id = c.pilot_id
GROUP BY p.pilot_id, p.name
HAVING AVG(bk.factor) > (SELECT AVG(factor) FROM bk);
