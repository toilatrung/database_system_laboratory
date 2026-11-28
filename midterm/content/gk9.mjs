// Đề mẫu 3 — 20 truy vấn cùng dạng với Đề mẫu GK7 nhưng trên Airline database (lab/db/exam_airline.sql).
export default {
  key: 'gk9',
  slug: 'gk9_sample_airline',
  label: 'Đề mẫu 3 · Hãng bay',
  navLabel: 'Đề mẫu 3',
  kind: 'Đề thi',
  short: 'GK-M3',
  title: 'Airline Database: 20 SQL Query Exercises',
  titleVi: 'Đề mẫu 3 — 20 truy vấn trên Airline database',
  dbPanel: 'fl_',

  summary: `
### 1. Đề này là gì
20 truy vấn cùng dạng với **Đề mẫu (GK7)** trên lược đồ hãng bay. Qn ở đây cùng dạng với Qn của GK7. Bấm **Database** để xem bảng, **Debug** để chạy từng bước.

| Bảng | Ý nghĩa (so với University) |
|---|---|
| \`fl_airport(code, city, country)\` | sân bay (NRT **không có phi công**) |
| \`fl_route(route_id, origin, dest, distance)\` | tuyến bay; \`origin\`, \`dest\` đều trỏ tới \`fl_airport\` (≈ \`course\`) |
| \`fl_requires(route_id, required_id)\` | chặng nối: muốn bay \`route_id\` phải có vé \`required_id\` (≈ \`prereq\`) |
| \`fl_flight(route_id, flight_date)\` | chuyến bay cụ thể, khoá **2 cột** (≈ \`section\`) |
| \`fl_pilot(pilot_id, name, base, salary)\`, \`fl_crew\` | phi công và chuyến họ lái (≈ \`instructor\`/\`teaches\`) |
| \`fl_passenger(pax_id, name, country, tier)\`, \`fl_booking\` | hành khách và vé (≈ \`student\`/\`takes\`) |
| \`fl_booking.seat_class\` | F / J / W / Y, có \`NULL\` và mã lạ \`'X'\` (≈ \`grade\`) |

### 2. Điểm mới so với GK7
- **Q4:** join **cùng một bảng hai lần** (\`fl_airport\` cho điểm đi và điểm đến) → phải đặt hai alias.
- **Q16:** tổng lương theo **sân bay gốc**, tính cả sân bay không có phi công.
- **Q19:** phép chia trên **tuyến** (mọi tuyến từ HAN có chuyến năm 2025) thay vì học kỳ.

### 3. Bẫy hay gặp
- **Q5, Q8:** một khách bay cùng tuyến nhiều lần, hai tuyến cùng đến Danang → \`DISTINCT\`.
- **Q13, Q17, Q20:** \`fl_crew\` và \`fl_booking\` phải khớp **cả** \`route_id\` **và** \`flight_date\`. Chỉ khớp \`route_id\` thì R05 ngày 20/02 bị coi là "đã có phi công" (Q13), và Emi bị tính bay với 3 phi công (Q17).
- **Q14:** trung bình tính cả khách chưa đặt vé (Gia, Hana).
- **Q15:** đếm **ngày bay** phân biệt của cùng một tuyến.
- **Q20:** \`NULL\` và \`'X'\` bị bỏ bằng inner join với bảng hệ số.
`,

  quiz: [],

  questions: [
    {
      q: '**Q4** — Vì sao cần hai alias cho `fl_airport`? Viết lại Q4 và giải thích chuyện gì xảy ra nếu chỉ join `fl_airport` một lần với điều kiện `a.code = r.origin AND a.code = r.dest`.',
      answer: `Mỗi tuyến cần **hai** dòng sân bay khác nhau: một cho điểm đi, một cho điểm đến, nên phải join hai bản sao:
\`\`\`sql
SELECT r.route_id, o.city AS origin_city, d.city AS dest_city
FROM fl_route r
JOIN fl_airport o ON o.code = r.origin
JOIN fl_airport d ON d.code = r.dest;
\`\`\`
Với một alias và điều kiện \`a.code = r.origin AND a.code = r.dest\`, một dòng sân bay phải vừa là điểm đi vừa là điểm đến → chỉ khớp tuyến có \`origin = dest\`, ở đây **không** có tuyến nào, kết quả rỗng.`,
    },
    {
      q: '**Q17** — Emi (P05) bay R05 ngày 20/01, R03 ngày 01/02 và R07 ngày 18/03. Đếm số phi công của Emi khi join `fl_crew` đúng (2 cột) và sai (chỉ `route_id`).',
      answer: `Đúng (khớp \`route_id\` và \`flight_date\`): R05 20/01 → PL6; R03 01/02 → PL1; R07 18/03 → chưa có phi công. Tổng **2** phi công → Emi **không** thoả "≥ 3".

Sai (chỉ \`route_id\`): R05 → PL6 (mọi ngày của R05); R03 → PL1 **và PL4** (PL4 lái R03 ngày 15/03, không phải chuyến của Emi); R07 → không ai. Tổng **3** phi công → Emi bị đưa nhầm vào kết quả.`,
    },
  ],

  exercises: [
    // ───────────── Cơ bản (1–5)
    { id: 'GK9.01', topic: 'Q1 where', level: 1,
      prompt: 'Cho mã và tên các hành khách có quốc tịch **VN**. Kết quả: `pax_id, name`.',
      solution: `SELECT pax_id, name
FROM fl_passenger
WHERE country = 'VN';` },
    { id: 'GK9.02', topic: 'Q2 where >=', level: 1,
      prompt: 'Liệt kê các tuyến có cự ly **từ 1000 km trở lên**. Kết quả: `route_id, origin, dest, distance`.',
      solution: `SELECT route_id, origin, dest, distance
FROM fl_route
WHERE distance >= 1000;` },
    { id: 'GK9.03', topic: 'Q3 where', level: 1,
      prompt: 'Liệt kê mã sân bay đến (`dest`) của các tuyến **xuất phát từ SGN**. Kết quả: `dest`.',
      solution: `SELECT dest
FROM fl_route
WHERE origin = 'SGN';` },
    { id: 'GK9.04', topic: 'Q4 join 2 lần', level: 1,
      prompt: 'Với mỗi tuyến, cho mã tuyến, **thành phố đi** và **thành phố đến**. Kết quả: `route_id, origin_city, dest_city`.',
      hint: 'Join fl_airport hai lần với hai alias.',
      solution: `SELECT r.route_id, o.city AS origin_city, d.city AS dest_city
FROM fl_route r
JOIN fl_airport o ON o.code = r.origin
JOIN fl_airport d ON d.code = r.dest;` },
    { id: 'GK9.05', topic: 'Q5 join + distinct', level: 1,
      prompt: 'Các **thành phố đến** (không trùng) mà hành khách **P01** đã có vé. Kết quả: `city`.',
      solution: `SELECT DISTINCT a.city
FROM fl_booking b
JOIN fl_route r   ON r.route_id = b.route_id
JOIN fl_airport a ON a.code = r.dest
WHERE b.pax_id = 'P01';` },

    // ───────────── Trung bình (6–13)
    { id: 'GK9.06', topic: 'Q6 join + lọc ngày', level: 2,
      prompt: 'Mã và tên các hành khách có vé tuyến **R01** trong **tháng 1/2025**. Kết quả: `pax_id, name`.',
      solution: `SELECT DISTINCT p.pax_id, p.name
FROM fl_passenger p
JOIN fl_booking b ON b.pax_id = p.pax_id
WHERE b.route_id = 'R01'
  AND b.flight_date >= '2025-01-01' AND b.flight_date < '2025-02-01';` },
    { id: 'GK9.07', topic: 'Q7 3 bảng, so cột', level: 2,
      prompt: 'Tìm phi công đã lái tuyến **xuất phát từ sân bay khác** sân bay gốc (`base`) của mình. Kết quả: `name, base, route_id, origin` — mỗi bộ một dòng.',
      solution: `SELECT DISTINCT p.name, p.base, r.route_id, r.origin
FROM fl_pilot p
JOIN fl_crew c  ON c.pilot_id = p.pilot_id
JOIN fl_route r ON r.route_id = c.route_id
WHERE r.origin <> p.base;` },
    { id: 'GK9.08', topic: 'Q8 join + distinct', level: 1,
      prompt: 'Tên các hành khách (không trùng) có vé tuyến **R01** (ngày nào cũng được). Kết quả: `name`.',
      solution: `SELECT DISTINCT p.name
FROM fl_passenger p
JOIN fl_booking b ON b.pax_id = p.pax_id
WHERE b.route_id = 'R01';` },
    { id: 'GK9.09', topic: 'Q9 join, so cột', level: 2,
      prompt: 'Mã và tên các hành khách đã có vé **ít nhất một tuyến xuất phát từ nước khác** quốc tịch của mình. Kết quả: `pax_id, name`.',
      solution: `SELECT DISTINCT p.pax_id, p.name
FROM fl_passenger p
JOIN fl_booking b ON b.pax_id = p.pax_id
JOIN fl_route r   ON r.route_id = b.route_id
JOIN fl_airport a ON a.code = r.origin
WHERE a.country <> p.country;` },
    { id: 'GK9.10', topic: 'Q10 not exists', level: 2,
      prompt: 'Mã và tên các hành khách **chưa đặt vé nào**. Kết quả: `pax_id, name`.',
      solution: `SELECT p.pax_id, p.name
FROM fl_passenger p
WHERE NOT EXISTS (SELECT 1 FROM fl_booking b WHERE b.pax_id = p.pax_id);` },
    { id: 'GK9.11', topic: 'Q11 not exists', level: 2,
      prompt: 'Các tuyến **chưa khai thác chuyến nào** (không có dòng trong `fl_flight`). Kết quả: `route_id, origin, dest`.',
      solution: `SELECT r.route_id, r.origin, r.dest
FROM fl_route r
WHERE NOT EXISTS (SELECT 1 FROM fl_flight f WHERE f.route_id = r.route_id);` },
    { id: 'GK9.12', topic: 'Q12 phép chia', level: 3,
      prompt: 'Mã và tên các hành khách đã có vé **mọi** tuyến **đến DAD**. Kết quả: `pax_id, name`.',
      solution: `SELECT p.pax_id, p.name
FROM fl_passenger p
WHERE NOT EXISTS (
  SELECT route_id FROM fl_route WHERE dest = 'DAD'
  EXCEPT
  SELECT b.route_id FROM fl_booking b WHERE b.pax_id = p.pax_id
);` },
    { id: 'GK9.13', topic: 'Q13 not exists, khoá 2 cột', level: 2,
      prompt: 'Tìm các chuyến bay **chưa được phân công phi công**. Kết quả: `route_id, flight_date`.',
      hint: 'Một chuyến được xác định bởi cả route_id và flight_date.',
      solution: `SELECT f.route_id, f.flight_date
FROM fl_flight f
WHERE NOT EXISTS (
  SELECT 1 FROM fl_crew c
  WHERE c.route_id = f.route_id AND c.flight_date = f.flight_date
);` },

    // ───────────── Khó (14–20)
    { id: 'GK9.14', topic: 'Q14 so với trung bình', level: 3,
      prompt: 'Tìm hành khách có **số tuyến khác nhau đã đặt** lớn hơn **trung bình** số tuyến khác nhau của mỗi hành khách (tính **cả khách chưa đặt vé**). Kết quả: `pax_id, name, route_count`.',
      solution: `WITH cnt AS (
  SELECT p.pax_id, p.name, COUNT(DISTINCT b.route_id) AS route_count
  FROM fl_passenger p
  LEFT JOIN fl_booking b ON b.pax_id = p.pax_id
  GROUP BY p.pax_id, p.name
)
SELECT pax_id, name, route_count
FROM cnt
WHERE route_count > (SELECT AVG(route_count) FROM cnt);` },
    { id: 'GK9.15', topic: 'Q15 đếm phân biệt', level: 3,
      prompt: 'Tìm hành khách bay **cùng một tuyến** vào **nhiều hơn một** ngày khác nhau. Kết quả: `pax_id, name, route_id, trip_count`.',
      solution: `SELECT p.pax_id, p.name, b.route_id, COUNT(DISTINCT b.flight_date) AS trip_count
FROM fl_booking b
JOIN fl_passenger p ON p.pax_id = b.pax_id
GROUP BY p.pax_id, p.name, b.route_id
HAVING COUNT(DISTINCT b.flight_date) > 1;` },
    { id: 'GK9.16', topic: 'Q16 max kể cả hoà', level: 3,
      prompt: 'Tìm (các) sân bay có **tổng lương phi công đặt gốc tại đó cao nhất**, giữ các sân bay **hoà**, tính cả sân bay **không có phi công** (= 0). Kết quả: `code, total_salary`.',
      solution: `WITH tot AS (
  SELECT a.code, COALESCE(SUM(p.salary), 0) AS total_salary
  FROM fl_airport a
  LEFT JOIN fl_pilot p ON p.base = a.code
  GROUP BY a.code
)
SELECT code, total_salary
FROM tot
WHERE total_salary = (SELECT MAX(total_salary) FROM tot);` },
    { id: 'GK9.17', topic: 'Q17 join khoá 2 cột', level: 3,
      prompt: 'Tìm hành khách đã bay với **ít nhất 3 phi công khác nhau**; phi công phải lái **đúng chuyến** (tuyến và ngày) của vé. Kết quả: `pax_id, name, pilot_count`.',
      solution: `SELECT p.pax_id, p.name, COUNT(DISTINCT c.pilot_id) AS pilot_count
FROM fl_booking b
JOIN fl_crew c      ON c.route_id = b.route_id AND c.flight_date = b.flight_date
JOIN fl_passenger p ON p.pax_id = b.pax_id
GROUP BY p.pax_id, p.name
HAVING COUNT(DISTINCT c.pilot_id) >= 3;` },
    { id: 'GK9.18', topic: 'Q18 not exists lồng', level: 3,
      prompt: 'Tìm hành khách đã có vé **ít nhất một chặng nối** (tuyến có trong `fl_requires`), và với **mọi** chặng nối đã đặt thì cũng có vé (ngày nào cũng được) **mọi** tuyến mà chặng đó cần. Kết quả: `pax_id, name`.',
      solution: `SELECT p.pax_id, p.name
FROM fl_passenger p
WHERE EXISTS (
        SELECT 1 FROM fl_booking b JOIN fl_requires q ON q.route_id = b.route_id
        WHERE b.pax_id = p.pax_id)
  AND NOT EXISTS (
        SELECT 1 FROM fl_booking b JOIN fl_requires q ON q.route_id = b.route_id
        WHERE b.pax_id = p.pax_id
          AND NOT EXISTS (SELECT 1 FROM fl_booking b2
                          WHERE b2.pax_id = p.pax_id AND b2.route_id = q.required_id));` },
    { id: 'GK9.19', topic: 'Q19 phép chia + tập rỗng', level: 3,
      prompt: 'Tìm hành khách đã có vé **mọi tuyến xuất phát từ HAN có chuyến bay trong năm 2025** (vé năm 2025). Nếu năm 2025 không có chuyến nào từ HAN thì **không** trả về ai. Kết quả: `pax_id, name`.',
      solution: `WITH need AS (
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
        WHERE b.pax_id = p.pax_id AND EXTRACT(YEAR FROM b.flight_date) = 2025);` },
    { id: 'GK9.20', topic: 'Q20 quy đổi + avg', level: 3,
      prompt: 'Tìm phi công có **hệ số hạng ghế trung bình** của các vé trên chuyến mình lái lớn hơn **trung bình chung của mọi vé hợp lệ**. Hệ số F=3.0, J=2.0, W=1.5, Y=1.0; bỏ `NULL` và mã lạ. Một vé tính cho **mọi** phi công của chuyến đó. Kết quả: `pilot_id, name, avg_factor` (không làm tròn).',
      solution: `WITH cf(seat_class, factor) AS (
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
HAVING AVG(bk.factor) > (SELECT AVG(factor) FROM bk);` },
  ],
};
