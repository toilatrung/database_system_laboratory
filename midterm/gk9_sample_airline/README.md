# Đề mẫu 3 · Hãng bay — Đề mẫu 3 — 20 truy vấn trên Airline database

*Airline Database: 20 SQL Query Exercises · Database System Concepts, 7th Ed.*

> **Cách học:** *Tự luận lý thuyết* → *Bài tập SQL* → *Ghi nhớ nhanh*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk9`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tự luận lý thuyết (2 câu)

**Câu 1.** **Q4** — Vì sao cần hai alias cho `fl_airport`? Viết lại Q4 và giải thích chuyện gì xảy ra nếu chỉ join `fl_airport` một lần với điều kiện `a.code = r.origin AND a.code = r.dest`.

<details><summary>Gợi ý đáp án</summary>

Mỗi tuyến cần **hai** dòng sân bay khác nhau: một cho điểm đi, một cho điểm đến, nên phải join hai bản sao:
```sql
SELECT r.route_id, o.city AS origin_city, d.city AS dest_city
FROM fl_route r
JOIN fl_airport o ON o.code = r.origin
JOIN fl_airport d ON d.code = r.dest;
```
Với một alias và điều kiện `a.code = r.origin AND a.code = r.dest`, một dòng sân bay phải vừa là điểm đi vừa là điểm đến → chỉ khớp tuyến có `origin = dest`, ở đây **không** có tuyến nào, kết quả rỗng.

</details>

**Câu 2.** **Q17** — Emi (P05) bay R05 ngày 20/01, R03 ngày 01/02 và R07 ngày 18/03. Đếm số phi công của Emi khi join `fl_crew` đúng (2 cột) và sai (chỉ `route_id`).

<details><summary>Gợi ý đáp án</summary>

Đúng (khớp `route_id` và `flight_date`): R05 20/01 → PL6; R03 01/02 → PL1; R07 18/03 → chưa có phi công. Tổng **2** phi công → Emi **không** thoả "≥ 3".

Sai (chỉ `route_id`): R05 → PL6 (mọi ngày của R05); R03 → PL1 **và PL4** (PL4 lái R03 ngày 15/03, không phải chuyến của Emi); R07 → không ai. Tổng **3** phi công → Emi bị đưa nhầm vào kết quả.

</details>

## 2. Bài tập SQL (20 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK9.01 | Q1 where | ★☆☆ | Cho mã và tên các hành khách có quốc tịch VN. Kết quả: `pax_id, name`. |
| GK9.02 | Q2 where >= | ★☆☆ | Liệt kê các tuyến có cự ly từ 1000 km trở lên. Kết quả: `route_id, origin, dest, distance`. |
| GK9.03 | Q3 where | ★☆☆ | Liệt kê mã sân bay đến (`dest`) của các tuyến xuất phát từ SGN. Kết quả: `dest`. |
| GK9.04 | Q4 join 2 lần | ★☆☆ | Với mỗi tuyến, cho mã tuyến, thành phố đi và thành phố đến. Kết quả: `route_id, origin_city, dest_city`. |
| GK9.05 | Q5 join + distinct | ★☆☆ | Các thành phố đến (không trùng) mà hành khách P01 đã có vé. Kết quả: `city`. |
| GK9.06 | Q6 join + lọc ngày | ★★☆ | Mã và tên các hành khách có vé tuyến R01 trong tháng 1/2025. Kết quả: `pax_id, name`. |
| GK9.07 | Q7 3 bảng, so cột | ★★☆ | Tìm phi công đã lái tuyến xuất phát từ sân bay khác sân bay gốc (`base`) của mình. Kết quả: `name, base, route_id, origin` — mỗi bộ một dòng. |
| GK9.08 | Q8 join + distinct | ★☆☆ | Tên các hành khách (không trùng) có vé tuyến R01 (ngày nào cũng được). Kết quả: `name`. |
| GK9.09 | Q9 join, so cột | ★★☆ | Mã và tên các hành khách đã có vé ít nhất một tuyến xuất phát từ nước khác quốc tịch của mình. Kết quả: `pax_id, name`. |
| GK9.10 | Q10 not exists | ★★☆ | Mã và tên các hành khách chưa đặt vé nào. Kết quả: `pax_id, name`. |
| GK9.11 | Q11 not exists | ★★☆ | Các tuyến chưa khai thác chuyến nào (không có dòng trong `fl_flight`). Kết quả: `route_id, origin, dest`. |
| GK9.12 | Q12 phép chia | ★★★ | Mã và tên các hành khách đã có vé mọi tuyến đến DAD. Kết quả: `pax_id, name`. |
| GK9.13 | Q13 not exists, khoá 2 cột | ★★☆ | Tìm các chuyến bay chưa được phân công phi công. Kết quả: `route_id, flight_date`. |
| GK9.14 | Q14 so với trung bình | ★★★ | Tìm hành khách có số tuyến khác nhau đã đặt lớn hơn trung bình số tuyến khác nhau của mỗi hành khách (tính cả khách chưa đặt vé). Kết quả: `pax_id, name, route_count`. |
| GK9.15 | Q15 đếm phân biệt | ★★★ | Tìm hành khách bay cùng một tuyến vào nhiều hơn một ngày khác nhau. Kết quả: `pax_id, name, route_id, trip_count`. |
| GK9.16 | Q16 max kể cả hoà | ★★★ | Tìm (các) sân bay có tổng lương phi công đặt gốc tại đó cao nhất, giữ các sân bay hoà, tính cả sân bay không có phi công (= 0). Kết quả: `code, total_salary`. |
| GK9.17 | Q17 join khoá 2 cột | ★★★ | Tìm hành khách đã bay với ít nhất 3 phi công khác nhau; phi công phải lái đúng chuyến (tuyến và ngày) của vé. Kết quả: `pax_id, name, pilot_count`. |
| GK9.18 | Q18 not exists lồng | ★★★ | Tìm hành khách đã có vé ít nhất một chặng nối (tuyến có trong `fl_requires`), và với mọi chặng nối đã đặt thì cũng có vé (ngày nào cũng được) mọi tuyến mà chặng đó cần. Kết quả: `pax_id, name`. |
| GK9.19 | Q19 phép chia + tập rỗng | ★★★ | Tìm hành khách đã có vé mọi tuyến xuất phát từ HAN có chuyến bay trong năm 2025 (vé năm 2025). Nếu năm 2025 không có chuyến nào từ HAN thì không trả về ai. Kết quả: `pax_id, name`. |
| GK9.20 | Q20 quy đổi + avg | ★★★ | Tìm phi công có hệ số hạng ghế trung bình của các vé trên chuyến mình lái lớn hơn trung bình chung của mọi vé hợp lệ. Hệ số F=3.0, J=2.0, W=1.5, Y=1.0; bỏ `NULL` và mã lạ. Một vé tính cho mọi phi công của chuyến đó. Kết quả: `pilot_id, name, avg_factor` (không làm tròn). |

## 3. Ghi nhớ nhanh

### 1. Đề này là gì
20 truy vấn cùng dạng với **Đề mẫu (GK7)** trên lược đồ hãng bay. Qn ở đây cùng dạng với Qn của GK7. Bấm **Database** để xem bảng, **Debug** để chạy từng bước.

| Bảng | Ý nghĩa (so với University) |
|---|---|
| `fl_airport(code, city, country)` | sân bay (NRT **không có phi công**) |
| `fl_route(route_id, origin, dest, distance)` | tuyến bay; `origin`, `dest` đều trỏ tới `fl_airport` (≈ `course`) |
| `fl_requires(route_id, required_id)` | chặng nối: muốn bay `route_id` phải có vé `required_id` (≈ `prereq`) |
| `fl_flight(route_id, flight_date)` | chuyến bay cụ thể, khoá **2 cột** (≈ `section`) |
| `fl_pilot(pilot_id, name, base, salary)`, `fl_crew` | phi công và chuyến họ lái (≈ `instructor`/`teaches`) |
| `fl_passenger(pax_id, name, country, tier)`, `fl_booking` | hành khách và vé (≈ `student`/`takes`) |
| `fl_booking.seat_class` | F / J / W / Y, có `NULL` và mã lạ `'X'` (≈ `grade`) |

### 2. Điểm mới so với GK7
- **Q4:** join **cùng một bảng hai lần** (`fl_airport` cho điểm đi và điểm đến) → phải đặt hai alias.
- **Q16:** tổng lương theo **sân bay gốc**, tính cả sân bay không có phi công.
- **Q19:** phép chia trên **tuyến** (mọi tuyến từ HAN có chuyến năm 2025) thay vì học kỳ.

### 3. Bẫy hay gặp
- **Q5, Q8:** một khách bay cùng tuyến nhiều lần, hai tuyến cùng đến Danang → `DISTINCT`.
- **Q13, Q17, Q20:** `fl_crew` và `fl_booking` phải khớp **cả** `route_id` **và** `flight_date`. Chỉ khớp `route_id` thì R05 ngày 20/02 bị coi là "đã có phi công" (Q13), và Emi bị tính bay với 3 phi công (Q17).
- **Q14:** trung bình tính cả khách chưa đặt vé (Gia, Hana).
- **Q15:** đếm **ngày bay** phân biệt của cùng một tuyến.
- **Q20:** `NULL` và `'X'` bị bỏ bằng inner join với bảng hệ số.
