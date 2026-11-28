-- =====================================================================
-- CS4420 · Đề mẫu 3 · Hãng bay — Đề mẫu 3 — 20 truy vấn trên Airline database (Airline Database: 20 SQL Query Exercises)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- gk9
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex GK9.01  [Q1 where]  ★☆☆
-- Cho mã và tên các hành khách có quốc tịch VN. Kết quả: `pax_id, name`.




-- @ex GK9.02  [Q2 where >=]  ★☆☆
-- Liệt kê các tuyến có cự ly từ 1000 km trở lên. Kết quả: `route_id, origin, dest, distance`.




-- @ex GK9.03  [Q3 where]  ★☆☆
-- Liệt kê mã sân bay đến (`dest`) của các tuyến xuất phát từ SGN. Kết quả: `dest`.




-- @ex GK9.04  [Q4 join 2 lần]  ★☆☆
-- Với mỗi tuyến, cho mã tuyến, thành phố đi và thành phố đến. Kết quả: `route_id, origin_city, dest_city`.
-- Gợi ý: Join fl_airport hai lần với hai alias.




-- @ex GK9.05  [Q5 join + distinct]  ★☆☆
-- Các thành phố đến (không trùng) mà hành khách P01 đã có vé. Kết quả: `city`.




-- @ex GK9.06  [Q6 join + lọc ngày]  ★★☆
-- Mã và tên các hành khách có vé tuyến R01 trong tháng 1/2025. Kết quả: `pax_id, name`.




-- @ex GK9.07  [Q7 3 bảng, so cột]  ★★☆
-- Tìm phi công đã lái tuyến xuất phát từ sân bay khác sân bay gốc (`base`) của mình. Kết quả: `name, base, route_id, origin` — mỗi bộ một dòng.




-- @ex GK9.08  [Q8 join + distinct]  ★☆☆
-- Tên các hành khách (không trùng) có vé tuyến R01 (ngày nào cũng được). Kết quả: `name`.




-- @ex GK9.09  [Q9 join, so cột]  ★★☆
-- Mã và tên các hành khách đã có vé ít nhất một tuyến xuất phát từ nước khác quốc tịch của mình. Kết quả: `pax_id, name`.




-- @ex GK9.10  [Q10 not exists]  ★★☆
-- Mã và tên các hành khách chưa đặt vé nào. Kết quả: `pax_id, name`.




-- @ex GK9.11  [Q11 not exists]  ★★☆
-- Các tuyến chưa khai thác chuyến nào (không có dòng trong `fl_flight`). Kết quả: `route_id, origin, dest`.




-- @ex GK9.12  [Q12 phép chia]  ★★★
-- Mã và tên các hành khách đã có vé mọi tuyến đến DAD. Kết quả: `pax_id, name`.




-- @ex GK9.13  [Q13 not exists, khoá 2 cột]  ★★☆
-- Tìm các chuyến bay chưa được phân công phi công. Kết quả: `route_id, flight_date`.
-- Gợi ý: Một chuyến được xác định bởi cả route_id và flight_date.




-- @ex GK9.14  [Q14 so với trung bình]  ★★★
-- Tìm hành khách có số tuyến khác nhau đã đặt lớn hơn trung bình số tuyến khác nhau của mỗi hành khách (tính cả khách chưa đặt vé). Kết quả: `pax_id, name, route_count`.




-- @ex GK9.15  [Q15 đếm phân biệt]  ★★★
-- Tìm hành khách bay cùng một tuyến vào nhiều hơn một ngày khác nhau. Kết quả: `pax_id, name, route_id, trip_count`.




-- @ex GK9.16  [Q16 max kể cả hoà]  ★★★
-- Tìm (các) sân bay có tổng lương phi công đặt gốc tại đó cao nhất, giữ các sân bay hoà, tính cả sân bay không có phi công (= 0). Kết quả: `code, total_salary`.




-- @ex GK9.17  [Q17 join khoá 2 cột]  ★★★
-- Tìm hành khách đã bay với ít nhất 3 phi công khác nhau; phi công phải lái đúng chuyến (tuyến và ngày) của vé. Kết quả: `pax_id, name, pilot_count`.




-- @ex GK9.18  [Q18 not exists lồng]  ★★★
-- Tìm hành khách đã có vé ít nhất một chặng nối (tuyến có trong `fl_requires`), và với mọi chặng nối đã đặt thì cũng có vé (ngày nào cũng được) mọi tuyến mà chặng đó cần. Kết quả: `pax_id, name`.




-- @ex GK9.19  [Q19 phép chia + tập rỗng]  ★★★
-- Tìm hành khách đã có vé mọi tuyến xuất phát từ HAN có chuyến bay trong năm 2025 (vé năm 2025). Nếu năm 2025 không có chuyến nào từ HAN thì không trả về ai. Kết quả: `pax_id, name`.




-- @ex GK9.20  [Q20 quy đổi + avg]  ★★★
-- Tìm phi công có hệ số hạng ghế trung bình của các vé trên chuyến mình lái lớn hơn trung bình chung của mọi vé hợp lệ. Hệ số F=3.0, J=2.0, W=1.5, Y=1.0; bỏ `NULL` và mã lạ. Một vé tính cho mọi phi công của chuyến đó. Kết quả: `pilot_id, name, avg_factor` (không làm tròn).


