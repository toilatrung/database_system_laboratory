# Chương 8 — Kiểu dữ liệu phức tạp

*Complex Data Types · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch8`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Phạm vi
Chương 8 không nằm trong lịch học CS4420 nhưng thuộc Part 3 của sách (*Application Design and Development*). Slide chia làm 4 mảng:

| Slide | Nội dung |
|---|---|
| 8.2 – 8.14 | **Dữ liệu bán cấu trúc**: thuộc tính multivalued, mảng, JSON, XML, RDF và knowledge graph, SPARQL |
| 8.15 – 8.30 | **Object orientation**: kiểu do người dùng định nghĩa, kế thừa kiểu và kế thừa bảng, reference type, object-relational mapping |
| 8.31 – 8.38 | **Dữ liệu văn bản**: keyword query, TF-IDF, PageRank, đo hiệu quả truy hồi (precision/recall) |
| 8.39 – 8.48 | **Dữ liệu không gian**: kiểu hình học, dữ liệu địa lý, truy vấn không gian, PostGIS |

Practice Lab chạy **PostgreSQL**, nên mọi bài dùng cú pháp PostgreSQL: `jsonb`, mảng `text[]`, `create type ... as (...)`, `inherits`, `tsvector` và kiểu hình học có sẵn (`point`, `polygon`, `box`) thay cho PostGIS.

### 1. Vì sao cần kiểu phức tạp
Mô hình quan hệ chuẩn yêu cầu **1NF** (giá trị nguyên tố). Nhiều ứng dụng hiện đại cần lưu dữ liệu có cấu trúc lồng hoặc thay đổi linh hoạt:
- **Lược đồ linh hoạt (flexible schema)**: mỗi bản ghi có tập thuộc tính khác nhau (hồ sơ người dùng, sản phẩm với thuộc tính riêng). Cách *wide column* hoặc *sparse column* làm bảng rất rộng và nhiều null.
- **Kiểu đa trị (multivalued)**: tập (set), multiset, mảng (array) — ví dụ `keyword_set` của sách, `phone_number` của instructor.
- **Dữ liệu trao đổi giữa ứng dụng**: web service trả về JSON/XML.
- **Đồ thị tri thức**: dữ liệu dạng (subject, predicate, object).

### 2. Mảng và multiset (slide 8.5)
```sql
create table cx_book (
  isbn varchar(10) primary key,
  title varchar(40),
  author_array text[],          -- có thứ tự: tác giả thứ nhất, thứ hai…
  publisher cx_publisher,       -- composite type (name, branch)
  keyword_set text[]            -- dùng như một tập
);
select title from cx_book where 'Jones' = any(author_array);
select author_array[1] from cx_book;                       -- chỉ số bắt đầu từ 1
select isbn, a.author, a.pos
from cx_book, unnest(author_array) with ordinality as a(author, pos);   -- "bỏ lồng" (unnesting)
select isbn, array_agg(author order by pos) ... group by isbn;          -- "lồng" (nesting)
```
| Toán tử | Ý nghĩa |
|---|---|
| `x = any(arr)` | x thuộc mảng |
| `arr1 && arr2` | hai mảng có phần tử chung |
| `arr1 @> arr2` | arr1 chứa mọi phần tử của arr2 |
| `cardinality(arr)` | số phần tử |
| `unnest(arr) with ordinality` | mảng → bảng (giữ vị trí) |
| `array_agg(x order by ...)` | bảng → mảng |

### 3. JSON (slide 8.6–8.7)
JSON = *JavaScript Object Notation*: object `{"key": value}`, array `[...]`, giá trị chuỗi/số/boolean/null, lồng nhau tuỳ ý. Dùng để trao đổi dữ liệu giữa ứng dụng và lưu dữ liệu có lược đồ linh hoạt.

PostgreSQL có `json` (lưu nguyên văn) và **`jsonb`** (dạng nhị phân, đánh index được, khoá không trùng và được sắp xếp lại).

| Toán tử / hàm | Ví dụ | Kết quả |
|---|---|---|
| `->` | `doc -> 'address'` | giá trị JSON |
| `->>` | `doc ->> 'email'` | text |
| `#>>` | `doc #>> '{address,city}'` | text theo đường dẫn |
| `?` | `doc ? 'scholarship'` | có khoá không |
| `@>` | `doc @> '{"hobbies":["chess"]}'` | chứa (containment) |
| `jsonb_array_elements_text` | | mảng JSON → các dòng |
| `jsonb_build_object`, `jsonb_agg` | | bảng → JSON (lồng nhau) |
| `jsonb_set`, `||` | | sửa/ghép document |

Tạo JSON lồng nhau từ bảng quan hệ (PE 8.1a):
```sql
select jsonb_build_object('ID', s.ID, 'name', s.name,
         'takes', (select jsonb_agg(jsonb_build_object('course_id', t.course_id, 'grade', t.grade) order by t.course_id)
                   from takes t where t.ID = s.ID))
from student s where s.name = 'Shankar';
```
Nhược điểm của JSON so với bảng quan hệ: lặp tên khoá (tốn chỗ), không có ràng buộc kiểu/khoá ngoại; vì vậy CSDL thường lưu dạng nén (BSON, jsonb).

### 4. XML (slide 8.8)
XML dùng **thẻ (tag)** lồng nhau `<course><course_id>CS-101</course_id>...</course>`, có thuộc tính trong thẻ mở. Truy vấn bằng XPath/XQuery; SQL có kiểu `xml` và các hàm `xmlelement`, `xmlattributes`, `xmlagg`, `xmlforest`.
```sql
select xmlelement(name course, xmlattributes(course_id as id), xmlelement(name title, title))
from course where course_id = 'CS-101';
-- <course id="CS-101"><title>Intro. to Computer Science</title></course>
```

### 5. RDF và knowledge graph (slide 8.9–8.14)
- **RDF** (*Resource Description Format*) biểu diễn mọi thông tin bằng **triple** (subject, predicate, object). Thuộc tính của entity: (10101, name, "Srinivasan"). Relationship: (10101, teaches, sec1).
- Tập triple = **đồ thị**: node là entity hoặc giá trị, cạnh có nhãn là predicate → *knowledge graph* (Wikidata, DBpedia, Google Knowledge Graph).
- Relationship n-ngôi được **reify** (tạo node nhân tạo cho relationship) hoặc dùng *quad* (thêm context).
- **SPARQL**: truy vấn bằng *triple pattern* có biến `?x`:
```
select ?title
where { ?s name "Zhang" . ?s takes ?sec . ?sec sec_course ?c . ?c title ?title . }
```
Lưu triple trong một bảng `cx_triple(subject, predicate, object)` thì **mỗi triple pattern = một bản sao của bảng**, biến dùng chung = điều kiện join:
```sql
select distinct c.object as title
from cx_triple s, cx_triple tk, cx_triple sc, cx_triple c
where s.predicate = 'name' and s.object = 'Zhang'
  and tk.subject = s.subject and tk.predicate = 'takes'
  and sc.subject = tk.object and sc.predicate = 'sec_course'
  and c.subject = sc.object and c.predicate = 'title';
```

### 6. Object orientation (slide 8.15–8.30)
**Kiểu do người dùng định nghĩa** (structured type):
```sql
create type cx_name as (first_name varchar(20), middle_initial char(1), last_name varchar(20));
create table person (ID varchar(5) primary key, name cx_name, phones varchar(15)[]);
select (name).last_name from person;          -- PostgreSQL cần ngoặc quanh tên cột composite
insert into person values ('1', row('Ann', 'B', 'Lee'), array['555-1']);
```
**Domain**: kiểu có ràng buộc, `create domain dollars as numeric(12,2) check (value >= 0)`.

**Kế thừa (inheritance)**:
- *Type inheritance* (SQL chuẩn): `create type Student under Person (degree varchar(20))`.
- *Table inheritance*: SQL chuẩn `create table students of Student under people`; PostgreSQL viết `create table student_t (...) inherits (people_t)`.
- Truy vấn bảng cha **trả về cả dòng của bảng con** (mọi student đều là person); `from only people_t` để lấy riêng bảng cha. Cột ẩn `tableoid` cho biết dòng nằm ở bảng nào.
- Ràng buộc nhất quán: mỗi dòng của bảng con tương ứng **đúng một** dòng ở bảng cha (khi xem qua bảng cha).
- Lưu ý PostgreSQL: primary key/unique **không** được kế thừa sang bảng con.

**Reference type** (SQL chuẩn): `head ref(Person) scope people`, truy cập bằng `head->name` (path expression thay cho join). PostgreSQL không có `ref`; dùng foreign key + join.

**Object-relational mapping (ORM)** — Hibernate, Django ORM, SQLAlchemy: ánh xạ class ↔ bảng, tự sinh SQL; tiện cho lập trình viên nhưng truy vấn phức tạp thường kém hiệu quả hơn SQL viết tay.

### 7. Dữ liệu văn bản (slide 8.31–8.38)
- **Keyword query**: tìm document chứa các từ khoá, xếp hạng theo độ liên quan.
- **TF-IDF** (định nghĩa của sách):
  - TF(d, t) = log(1 + n(d, t) / n(d)) — n(d, t): số lần t xuất hiện trong d; n(d): số từ của d.
  - IDF(t) = 1 / n(t) — n(t): số document chứa t.
  - r(d, Q) = Σ<sub>t∈Q</sub> TF(d, t) · IDF(t).
- **Stop word** (and, the, of…) thường bị bỏ; **stemming** đưa từ về gốc (queries → query).
- **PageRank**: độ "uy tín" của trang theo cấu trúc liên kết. Với N trang, hệ số giảm chấn δ (thường 0.85):
  P[j] = (1 − δ)/N + δ · Σ<sub>i→j</sub> P[i] / outdeg(i). Lặp cho tới khi hội tụ. Biểu diễn bằng relation: `link(src, dst)`, `rank(page, p)`.
- **Đo hiệu quả**: *precision* = tỉ lệ kết quả trả về là liên quan; *recall* = tỉ lệ tài liệu liên quan được trả về.
- PostgreSQL full-text search: `to_tsvector('english', body) @@ to_tsquery('english', 'schema & query')`, xếp hạng bằng `ts_rank`.

### 8. Dữ liệu không gian (slide 8.39–8.48)
- **Dữ liệu hình học (geometric)**: điểm, đường (line, polyline), đa giác (polygon); **dữ liệu địa lý (geographic)**: toạ độ trên mặt cầu, bản đồ raster/vector.
- Ứng dụng: GIS, CAD, bản đồ, tìm đường.
- Truy vấn không gian: **nearness** (gần nhất, trong bán kính), **region** (điểm nằm trong vùng), **spatial join** (cặp đối tượng gần nhau), giao/hợp vùng.
- **PostGIS**: `ST_Contains`, `ST_Within`, `ST_Distance`, `ST_DWithin`, `ST_Intersects`.
- Practice Lab dùng kiểu hình học có sẵn của PostgreSQL:

| PostGIS | PostgreSQL built-in |
|---|---|
| `ST_Contains(poly, pt)` | `poly @> pt` |
| `ST_Distance(a, b)` | `a <-> b` |
| `ST_DWithin(a, b, d)` | `a <-> b <= d` |
| `ST_Intersects(a, b)` | `a && b` (polygon/box) |
| kNN: `order by a <-> b limit k` | như PostGIS |

- Index không gian: **R-tree** (PostgreSQL dùng GiST) — chi tiết ở Chương 14/24.

### Mẹo làm bài
- Composite: luôn viết `(cột).field`, ví dụ `(publisher).name`; trong `from` có thể dùng `(c).*` để bung.
- So sánh JSON bằng `::text` chỉ an toàn với `jsonb` (đã chuẩn hoá thứ tự khoá).
- `jsonb_agg`/`array_agg` luôn kèm `order by` để kết quả tất định.
- Bảng kế thừa: `select ... from parent` gồm cả con; `from only parent` chỉ bảng cha.

## 2. Trắc nghiệm (11 câu)

**Câu 1.** Toán tử `->>` khác `->` trên cột jsonb thế nào?

- A. `->>` trả về text, `->` trả về jsonb
- B. `->>` đi sâu hai cấp
- C. `->>` chỉ dùng cho mảng
- D. Không khác gì

<details><summary>Đáp án</summary>

**A** — `doc -> 'address'` là jsonb (đi tiếp được), `doc ->> 'email'` là text để so sánh/hiển thị.

</details>

**Câu 2.** Câu nào tìm document jsonb có `"hobbies"` chứa phần tử "chess"?

- A. doc ->> 'hobbies' = 'chess'
- B. doc @> '{"hobbies": ["chess"]}'
- C. doc ? 'chess'
- D. 'chess' = any(doc)

<details><summary>Đáp án</summary>

**B** — Containment `@>`: document vế trái chứa cấu trúc vế phải; mảng chứa được hiểu là chứa phần tử.

</details>

**Câu 3.** Trong RDF, mỗi mẩu thông tin được biểu diễn bằng gì?

- A. Một bảng
- B. Một triple (subject, predicate, object)
- C. Một cây XML
- D. Một cặp key-value

<details><summary>Đáp án</summary>

**B** — Thuộc tính lẫn relationship đều là triple; tập triple tạo thành đồ thị.

</details>

**Câu 4.** Dịch một truy vấn SPARQL có 4 triple pattern sang SQL trên bảng triple(subject, predicate, object) cần mấy bản sao của bảng?

- A. 1
- B. 2
- C. 4
- D. Tuỳ số biến

<details><summary>Đáp án</summary>

**C** — Mỗi triple pattern là một bản sao (bí danh); biến dùng chung thành điều kiện join.

</details>

**Câu 5.** PostgreSQL: `create table truck (cargo int) inherits (vehicle)`. `select count(*) from vehicle` đếm gì?

- A. Chỉ dòng chèn trực tiếp vào vehicle
- B. Dòng của vehicle và mọi bảng con
- C. Chỉ dòng của truck
- D. Lỗi

<details><summary>Đáp án</summary>

**B** — Bảng cha "nhìn thấy" dòng của bảng con; dùng `from only vehicle` để loại bảng con.

</details>

**Câu 6.** Cách đúng để lấy trường `name` của cột composite `publisher` trong PostgreSQL?

- A. publisher.name
- B. (publisher).name
- C. publisher->name
- D. publisher[name]

<details><summary>Đáp án</summary>

**B** — Không có ngoặc, PostgreSQL hiểu `publisher` là tên bảng.

</details>

**Câu 7.** Theo định nghĩa của sách, IDF(t) bằng?

- A. log(N / n(t))
- B. 1 / n(t)
- C. n(d, t) / n(d)
- D. n(t) / N

<details><summary>Đáp án</summary>

**B** — Sách dùng IDF(t) = 1/n(t), với n(t) là số document chứa t; TF(d,t) = log(1 + n(d,t)/n(d)).

</details>

**Câu 8.** Trong PageRank, trang không có liên kết nào trỏ tới sẽ có rank sau một bước lặp là?

- A. 0
- B. (1 − δ)/N
- C. 1/N
- D. δ/N

<details><summary>Đáp án</summary>

**B** — Phần tổng Σ rỗng, chỉ còn phần "nhảy ngẫu nhiên" (1 − δ)/N.

</details>

**Câu 9.** Truy vấn "5 nhà hàng gần tôi nhất" thuộc loại truy vấn không gian nào?

- A. Region query
- B. Nearest-neighbor query
- C. Spatial join
- D. Range query trên B+-tree

<details><summary>Đáp án</summary>

**B** — kNN: `order by location <-> my_point limit 5`.

</details>

**Câu 10.** Vì sao `jsonb_agg(... )` nên có `order by` bên trong?

- A. Để chạy nhanh hơn
- B. Để thứ tự phần tử trong mảng JSON tất định
- C. Vì cú pháp bắt buộc
- D. Để loại trùng

<details><summary>Đáp án</summary>

**B** — Không có order by, thứ tự gom phụ thuộc kế hoạch thực thi.

</details>

**Câu 11.** Nhược điểm chính của việc lưu JSON thay vì bảng quan hệ chuẩn hoá?

- A. Không lưu được số
- B. Không có ràng buộc kiểu/khoá ngoại và lặp tên khoá
- C. Không truy vấn được bằng SQL
- D. Không lồng nhau được

<details><summary>Đáp án</summary>

**B** — Linh hoạt đổi lấy mất ràng buộc toàn vẹn; jsonb giảm chi phí lưu trữ nhưng vẫn không có FK.

</details>

## 3. Câu hỏi tự luận (9 câu)

**Câu 1.** 

> **Exercise 8.1.** Using the sample university database, present the information about the student named Shankar — his *student* tuple, the *takes* tuples that belong to him, and the *course* tuples that those *takes* tuples refer to — in each of the following forms:
> 
> a. JSON, with a suitable nested structure.
> 
> b. XML, with the same nesting as in part a.
> 
> c. RDF triples.
> 
> d. An RDF graph.

Biểu diễn thông tin của sinh viên Shankar (tuple student, các tuple takes, và course tương ứng) bằng (a) JSON lồng nhau, (b) XML cùng cấu trúc, (c) RDF triple, (d) đồ thị RDF.

<details><summary>Gợi ý đáp án</summary>

Dữ liệu mẫu: Shankar (12345, Comp. Sci., tot_cred 32) học CS-101/1/Fall 2017 (C), CS-190/2/Spring 2017 (A), CS-315/1/Spring 2018 (A), CS-347/1/Fall 2017 (A).

**a. JSON** — student là object ngoài cùng, takes là mảng, mỗi phần tử lồng course:
```json
{ "ID": "12345", "name": "Shankar", "dept_name": "Comp. Sci.", "tot_cred": 32,
  "takes": [
    { "course_id": "CS-101", "sec_id": "1", "semester": "Fall", "year": 2017, "grade": "C",
      "course": { "title": "Intro. to Computer Science", "dept_name": "Comp. Sci.", "credits": 4 } },
    { "course_id": "CS-190", "sec_id": "2", "semester": "Spring", "year": 2017, "grade": "A",
      "course": { "title": "Game Design", "dept_name": "Comp. Sci.", "credits": 4 } },
    ... ] }
```
**b. XML**:
```xml
<student ID="12345">
  <name>Shankar</name><dept_name>Comp. Sci.</dept_name><tot_cred>32</tot_cred>
  <takes course_id="CS-101" sec_id="1" semester="Fall" year="2017" grade="C">
    <course><title>Intro. to Computer Science</title><dept_name>Comp. Sci.</dept_name><credits>4</credits></course>
  </takes>
  ...
</student>
```
**c. RDF triples**: (12345, instance-of, student), (12345, name, "Shankar"), (12345, stud_dept, comp_sci), (12345, tot_cred, "32"); với mỗi lần học, reify thành node takes1: (takes1, student, 12345), (takes1, section, CS-101/1/Fall/2017), (takes1, grade, "C"); section: (CS-101/1/Fall/2017, sec_course, CS-101); course: (CS-101, title, "Intro. to Computer Science"), (CS-101, credits, "4")… (Nếu không cần grade, có thể dùng thẳng (12345, takes, sec) như Figure 8.3; grade là thuộc tính của relationship nên phải reify.)

**d. Đồ thị RDF**: node cho 12345, mỗi section, mỗi course, các giá trị literal; cạnh có nhãn name, takes (hoặc qua node takes1 với cạnh student/section/grade), sec_course, title, credits. Bài CH8.06–CH8.08 sinh (a)–(c) bằng SQL.

</details>

**Câu 2.** 

> **Exercise 8.2.** Take the RDF representation of university data illustrated in Figure 8.3. Express each of the following queries in SPARQL.
> 
> a. Find the titles of every course taken by any student whose name is Zhang.
> 
> b. Find the titles of the courses for which a student named Zhang takes a section that is taught by an instructor named Srinivasan.
> 
> c. Without listing the attribute names explicitly in the query, find the names and values of all attributes of the instructor named Srinivasan.
> 
> *Figure 8.3 — RDF representation of part of the university data (subject, predicate, object):*
> 
> | subject | predicate | object |
> |---|---|---|
> | 10101 | instance-of | instructor |
> | 10101 | name | "Srinivasan" |
> | 10101 | salary | "65000" |
> | 00128 | instance-of | student |
> | 00128 | name | "Zhang" |
> | 00128 | tot_cred | "102" |
> | comp_sci | dept_name | "Comp. Sci." |
> | biology | dept_name | "Biology" |
> | CS-101 | instance-of | course |
> | CS-101 | title | "Intro. to Computer Science" |
> | CS-101 | course_dept | comp_sci |
> | sec1 | instance-of | section |
> | sec1 | sec_course | CS-101 |
> | sec1 | sec_id | "1" |
> | sec1 | semester | "Fall" |
> | sec1 | year | "2017" |
> | sec1 | classroom | packard-101 |
> | sec1 | time_slot_id | "H" |
> | 10101 | inst_dept | comp_sci |
> | 00128 | stud_dept | comp_sci |
> | 00128 | takes | sec1 |
> | 10101 | teaches | sec1 |

Viết SPARQL trên dữ liệu RDF của Figure 8.3: (a) title các course Zhang học; (b) title các course mà Zhang học một section do Srinivasan dạy; (c) mọi thuộc tính và giá trị của instructor Srinivasan mà không liệt kê tên thuộc tính.

<details><summary>Gợi ý đáp án</summary>

```
a. select ?title
   where { ?s name "Zhang" . ?s takes ?sec . ?sec sec_course ?c . ?c title ?title . }

b. select ?title
   where { ?s name "Zhang" . ?s takes ?sec .
           ?i name "Srinivasan" . ?i teaches ?sec .
           ?sec sec_course ?c . ?c title ?title . }

c. select ?attr ?value
   where { ?i name "Srinivasan" . ?i ?attr ?value . }
```
Điểm mấu chốt: biến dùng chung (`?sec`) chính là join; ở (c) predicate cũng là biến — điều mà SQL trên bảng quan hệ thường không làm được (phải liệt kê cột), nhưng làm được trên bảng triple. Bài CH8.09–CH8.11 viết các câu này bằng SQL trên `cx_triple`.

</details>

**Câu 3.** 

> **Exercise 8.3.** A car-rental company keeps a database of every vehicle in its current fleet. For every vehicle it stores the vehicle identification number, license number, manufacturer, model, purchase date, and color. Some kinds of vehicles carry extra data:
> 
> - Trucks: cargo capacity.
> - Sports cars: horsepower, and the minimum age required of the renter.
> - Vans: number of passengers.
> - Off-road vehicles: ground clearance, and drivetrain (four-wheel or two-wheel drive).
> 
> Write an SQL schema definition for this database, using inheritance where it is appropriate.

Thiết kế lược đồ SQL có kế thừa cho đội xe của công ty cho thuê: mọi xe có VIN, biển số, hãng, model, ngày mua, màu; truck có cargo capacity; sports car có horsepower và tuổi tối thiểu của người thuê; van có số chỗ; off-road có ground clearance và drivetrain (4WD/2WD).

<details><summary>Gợi ý đáp án</summary>

SQL chuẩn (type + table inheritance):
```sql
create type Vehicle as (vehicle_id integer, license_number char(15), manufacturer char(30),
                        model char(30), purchase_date date, color varchar(20)) not final;
create table vehicle of Vehicle;
create table truck       (cargo_capacity integer) under vehicle;
create table sportsCar   (horsepower integer, renter_age_requirement integer) under vehicle;
create table van         (num_passengers integer) under vehicle;
create table offRoadVehicle (ground_clearance real, drivetrain char(3)) under vehicle;
```
PostgreSQL: `create table cx_truck (cargo_capacity integer) inherits (cx_vehicle)`… (bài CH8.18). Truy vấn `select * from vehicle` trả về mọi xe; `only vehicle` chỉ xe "thường". Drivetrain có thể là domain/enum với check `in ('4WD','2WD')`. Lưu ý PostgreSQL không kế thừa primary key → phải khai báo lại ở từng bảng con nếu cần.

</details>

**Câu 4.** 

> **Exercise 8.4.** A database schema has a relation Emp whose attributes are listed below; types are given for the multivalued attributes.
> 
> - Emp = (ename, ChildrenSet **multiset**(Children), SkillSet **multiset**(Skills))
> - Children = (name, birthday)
> - Skills = (type, ExamSet **setof**(Exams))
> - Exams = (year, city)
> 
> Define this schema in SQL, declaring the multiset attributes with the SQL Server table-type syntax of Section 8.2.1.1.

Định nghĩa Emp = (ename, ChildrenSet multiset(Children), SkillSet multiset(Skills)), Children = (name, birthday), Skills = (type, ExamSet setof(Exams)), Exams = (year, city) bằng SQL, dùng cú pháp table type của SQL Server.

<details><summary>Gợi ý đáp án</summary>

SQL Server không cho cột kiểu bảng trong bảng thường, nhưng cho khai báo **table type** để dùng làm kiểu tham số/biến; theo cách của sách:
```sql
create type Exams    as table (year int, city varchar(20));
create type Skills   as table (type varchar(20), ExamSet Exams);
create type Children as table (name varchar(20), birthday date);
create table Emp (ename varchar(20), ChildrenSet Children, SkillSet Skills);
```
Các truy vấn trên lược đồ lồng nhau (lời giải sách): nhân viên có con sinh tháng 3; nhân viên đã thi kỹ năng typing ở Dayton; các loại skill khác nhau:
```sql
select ename from emp as e, e.ChildrenSet as c where 'March' in (select birthday.month from c);
select e.ename from emp as e, e.SkillSet as s, s.ExamSet as x where s.type = 'typing' and x.city = 'Dayton';
select distinct s.type from emp as e, e.SkillSet as s;
```
PostgreSQL biểu diễn bằng composite type + mảng: `cx_emp(ename, children cx_child[], skills cx_skill[])`, với `cx_skill(type, exams cx_exam[])`, và dùng `unnest` thay cho `e.ChildrenSet as c` (bài CH8.15–CH8.17).

</details>

**Câu 5.** 

> **Exercise 8.5.** Figure 8.7 shows an E-R diagram for the entity set *instructor*. Write an SQL schema definition that corresponds to this E-R diagram, using Oracle or PostgreSQL syntax and representing *phone_number* as an array of 10 elements.
> 
> *Figure 8.7 — E-R diagram with composite, multivalued, and derived attributes:*
> 
> ```
> instructor
>   ID
>   name
>     first_name
>     middle_initial
>     last_name
>   address
>     street
>       street_number
>       street_name
>       apt_number
>     city
>     state
>     zip
>   { phone_number }
>   date_of_birth
>   age ( )
> ```

Viết lược đồ SQL (Oracle hoặc PostgreSQL) cho entity instructor của Figure 8.7: name và address là composite (address có street lồng street_number, street_name, apt_number), phone_number là mảng 10 phần tử, date_of_birth và derived attribute age().

<details><summary>Gợi ý đáp án</summary>

```sql
create type Name    as (first_name varchar(15), middle_initial char(1), last_name varchar(15));
create type Street  as (street_number varchar(4), street_name varchar(15), apt_number varchar(7));
create type Address as (street Street, city varchar(15), state varchar(15), zip char(6));
create table instructor (
  ID            varchar(5) primary key,
  name          Name,
  address       Address,
  phone_number  varchar(15)[10],          -- Oracle: varray(10) of char(7)
  date_of_birth date
);
```
Derived attribute **age** không lưu mà thành **method** (SQL:1999 `method integer age()`) — trong PostgreSQL là hàm:
```sql
create function age(dob date, on_date date) returns integer as
$$ select extract(year from age(on_date, dob))::int $$ language sql;
```
Truy cập: `(name).last_name`, `((address).street).street_name`, `phone_number[1]`. Lưu ý PostgreSQL không ép kích thước `[10]`; muốn ép thì thêm `check (cardinality(phone_number) <= 10)` (bài CH8.19).

</details>

**Câu 6.** 

> **Exercise 8.6.** Take the relational schema of Figure 8.8.
> 
> a. Write an SQL schema definition for it in which the foreign-key relationships are expressed with references (reference types).
> 
> b. Write each of these queries in SQL on that schema: (i) find the company with the most employees; (ii) find the company with the smallest payroll; (iii) find the companies whose employees earn, on average, a higher salary than the average salary at First Bank Corporation.
> 
> *Figure 8.8 — Relational database for Exercise 8.6:*
> 
> - employee (person_name, street, city)
> - works (person_name, company_name, salary)
> - company (company_name, city)
> - manages (person_name, manager_name)

Với lược đồ Figure 8.8 (employee, works, company, manages theo person_name): (a) định nghĩa lại bằng reference type; (b) viết SQL: công ty nhiều nhân viên nhất, công ty có tổng lương nhỏ nhất, công ty có lương trung bình cao hơn First Bank Corporation.

<details><summary>Gợi ý đáp án</summary>

a.
```sql
create type Employee as (person_name varchar(30), street varchar(15), city varchar(15));
create type Company  as (company_name varchar(15), city varchar(15));
create table employee of Employee;
create table company  of Company;
create type Works   as (person ref(Employee) scope employee, comp ref(Company) scope company, salary int);
create table works of Works;
create type Manages as (person ref(Employee) scope employee, manager ref(Employee) scope employee);
create table manages of Manages;
```
b. Dùng path expression `comp->company_name` thay cho join:
```sql
select comp->company_name from works group by comp
having count(person) >= all (select count(person) from works group by comp);
select comp->company_name from works group by comp
having sum(salary) <= all (select sum(salary) from works group by comp);
select comp->company_name from works group by comp
having avg(salary) > (select avg(salary) from works where comp->company_name = 'First Bank Corporation');
```
PostgreSQL không có `ref`; bản tương đương dùng foreign key + `group by company_name` (bài CH8.20 trên bảng works của Practice Lab).

</details>

**Câu 7.** 

> **Exercise 8.7.** Using suitable definitions of term frequency and inverse document frequency, compute how relevant each Practice Exercise of this chapter is to the query “SQL relation”.

Tính độ liên quan (TF-IDF) của từng Practice Exercise chương 8 với truy vấn "SQL relation".

<details><summary>Gợi ý đáp án</summary>

Định nghĩa (Section 8.3 / 31.2): TF(d, t) = log(1 + n(d, t)/n(d)), IDF(t) = 1/n(t), r(d, Q) = Σ TF(d, t)·IDF(t). Các bước:
1. Với mỗi bài d: đếm số từ n(d) (có thể gồm cả stop word) và số lần xuất hiện của "SQL" và "relation".
2. n(SQL), n(relation) = số bài có chứa từ đó.
3. Bài không chứa từ nào có độ liên quan 0, bỏ qua.
4. Cộng hai thành phần, sắp giảm dần.

Lời giải sách (log cơ số 2, đếm trên văn bản gốc) cho bảng có các cột #words, #SQL, #relation, TF, relevance; bài nào ngắn mà chứa nhiều lần "relation" (vì từ hiếm, IDF lớn) sẽ đứng đầu. Bài CH8.21 tính đúng quy trình này bằng SQL trên `cx_pe_doc` (đề đã diễn đạt lại nên con số khác sách, nhưng cách tính giống hệt). Nhận xét: TF dùng log để một từ lặp nhiều lần không áp đảo; chia cho n(d) để bài dài không được lợi.

</details>

**Câu 8.** 

> **Exercise 8.8.** Show how the matrices used to compute PageRank can be stored as relations. Then write an SQL query that performs one step of the iterative PageRank technique, so that the whole algorithm can be implemented as a loop around that query.

Biểu diễn các ma trận của PageRank bằng relation và viết một câu SQL thực hiện một bước lặp.

<details><summary>Gợi ý đáp án</summary>

Ma trận chuyển T[i, j] = 1/N<sub>i</sub> nếu i có liên kết tới j (N<sub>i</sub> = số liên kết ra của i), thưa nên lưu dạng relation:
- `link(src, dst)` (hoặc `T(i, j, prob)` với prob = 1/outdeg(i)),
- `rank(page, p)` — vector PageRank hiện tại, khởi tạo 1/N.

Một bước: P'[j] = (1 − δ)/N + δ · Σ<sub>i→j</sub> P[i] / outdeg(i).
```sql
with outdeg as (select src, count(*) as n from link group by src),
     pages  as (select src as page from link union select dst from link),
     total  as (select count(*) as n from pages)
select pg.page,
       (1 - 0.85) / total.n + 0.85 * coalesce(sum(r.p / o.n), 0) as p
from pages pg cross join total
     left join link l   on l.dst = pg.page
     left join rank r   on r.page = l.src
     left join outdeg o on o.src = l.src
group by pg.page, total.n;
```
Toàn bộ thuật toán = lặp: ghi kết quả vào rank (update/insert vào bảng mới) cho tới khi thay đổi nhỏ hơn ngưỡng. **Left join** để trang không có liên kết tới vẫn có rank (1 − δ)/N. Bài CH8.22–CH8.23.

</details>

**Câu 9.** 

> **Exercise 8.9.** Assume the *student* relation has an attribute *location* of type point, and the *classroom* relation has an attribute *location* of type polygon. Using the PostGIS spatial functions and predicates introduced in the chapter, write these queries in SQL:
> 
> a. Find the names of the students whose location lies inside the classroom Packard 101.
> 
> b. Find every classroom that lies within 100 meters of Packard 101; assume all distances are measured in meters.
> 
> c. Find the ID and name of the student who is geographically closest to the student whose ID is 12345.
> 
> d. Find the IDs and names of every pair of students whose locations are less than 200 meters apart.

student.location kiểu point, classroom.location kiểu polygon. Dùng PostGIS viết: (a) sinh viên ở trong phòng Packard 101; (b) các phòng trong vòng 100 m của Packard 101; (c) sinh viên gần nhất với sinh viên 12345; (d) các cặp sinh viên cách nhau dưới 200 m.

<details><summary>Gợi ý đáp án</summary>

```sql
-- a
select s.name from student s, classroom c
where c.building = 'Packard' and c.room_number = '101' and ST_Contains(c.location, s.location);
-- b
select c2.building, c2.room_number from classroom c1, classroom c2
where c1.building = 'Packard' and c1.room_number = '101'
  and not (c2.building = 'Packard' and c2.room_number = '101')
  and ST_DWithin(c1.location, c2.location, 100);         -- hoặc ST_Distance(...) <= 100
-- c
select s2.ID, s2.name from student s1, student s2
where s1.ID = '12345' and s2.ID <> s1.ID
order by ST_Distance(s1.location, s2.location) limit 1;  -- toán tử kNN: s1.location <-> s2.location
-- d
select s1.ID, s1.name, s2.ID, s2.name from student s1, student s2
where s1.ID < s2.ID and ST_Distance(s1.location, s2.location) < 200;
```
Lưu ý: (b) phải loại chính Packard 101 (khoảng cách 0); (c) nếu có hoà thì `limit 1` chọn tuỳ ý — dùng `rank()` nếu cần mọi người hoà; (d) `s1.ID < s2.ID` để mỗi cặp xuất hiện một lần và không ghép một người với chính mình. Practice Lab dùng `@>` và `<->` của PostgreSQL thay cho ST_Contains/ST_Distance (bài CH8.24–CH8.27).

</details>

## 4. Bài tập SQL (27 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH8.01 | jsonb ->>, #>> | ★☆☆ | Bảng `cx_profile(ID, doc jsonb)`. Trả về `ID`, `email` (khoá `email`) và `city` (khoá `city` nằm trong object `address`) của mọi hồ sơ. Hồ sơ thiếu khoá thì giá trị là null. |
| CH8.02 | jsonb @> containment | ★☆☆ | ID và name (từ bảng student) của các sinh viên có `"chess"` trong mảng `hobbies` của hồ sơ. |
| CH8.03 | jsonb_array_length, ? | ★★☆ | Với mỗi hồ sơ: `ID`, `num_phones` (số phần tử của mảng `phones`, bằng 0 nếu không có khoá `phones`) và `has_scholarship` (boolean: hồ sơ có khoá `scholarship` không). |
| CH8.04 | jsonb_array_elements_text | ★★☆ | "Bỏ lồng" mảng `hobbies`: với mỗi sở thích, trả về `hobby` và `num_students` (số sinh viên có sở thích đó). |
| CH8.05 | jsonb_set / || | ★★☆ | Cập nhật hồ sơ của sinh viên `12345`: thêm khoá `scholarship` với giá trị số 1000 và đổi `address.city` thành `"Berkeley"` (giữ nguyên các khoá khác). Hệ thống đọc lại hồ sơ đó. |
| CH8.06 | PE 8.1a JSON lồng nhau | ★★★ | Exercise 8.1 (a). Using the sample university database, present the information about the student named Shankar — his *student* tuple, the *takes* tuples that belong to him, and the *course* tuples that those *takes* tuples refer to — in each of the following forms:  a. JSON, with a suitable nested structure.<br>Sinh một giá trị (cột `shankar`, kiểu `text` = `jsonb::text`) mô tả sinh viên Shankar theo đúng cấu trúc: ``` {"ID": ..., "name": ..., "dept_name": ..., "tot_cred": ,  "takes": [ {"course_id": ..., "sec_id": ..., "semester": ..., "year": , "grade": ...,              "course": {"title": ..., "credits": }} , ... ]} ``` Mảng `takes` sắp theo course_id. Dùng `jsonb_build_object` và `jsonb_agg`. |
| CH8.07 | PE 8.1b XML | ★★★ | Exercise 8.1 (b). Using the sample university database, present the information about the student named Shankar — his *student* tuple, the *takes* tuples that belong to him, and the *course* tuples that those *takes* tuples refer to — in each of the following forms:  b. XML, with the same nesting as in part a.<br>Sinh một giá trị XML (cột `shankar`, ép sang `text`) cùng cấu trúc lồng như CH8.06: ``` Shankar   Intro. to Computer Science4   ...  ``` (không có khoảng trắng/xuống dòng giữa các thẻ; các `takes` sắp theo course_id). Dùng `xmlelement`, `xmlattributes`, `xmlagg`. |
| CH8.08 | PE 8.1c RDF triples | ★★☆ | Exercise 8.1 (c). Using the sample university database, present the information about the student named Shankar — his *student* tuple, the *takes* tuples that belong to him, and the *course* tuples that those *takes* tuples refer to — in each of the following forms:  c. RDF triples.<br>`cx_triple(subject, predicate, object)` chứa University database dạng RDF (section được định danh `course_id/sec_id/semester/year`). Trả về mọi triple (subject, predicate, object) mô tả Shankar: các triple có subject là ID của Shankar, cộng các triple có subject là một course mà Shankar đã học (qua takes → sec_course). |
| CH8.09 | PE 8.2a triple pattern join | ★★☆ | Exercise 8.2 (a). Take the RDF representation of university data illustrated in Figure 8.3. Express each of the following queries in SPARQL.  a. Find the titles of every course taken by any student whose name is Zhang.  *Figure 8.3 — RDF representation of part of the university data (subject, predicate, object):*  \| subject \| predicate \| object \| \|---\|---\|---\| \| 10101 \| instance-of \| instructor \| \| 10101 \| name \| "Srinivasan" \| \| 10101 \| salary \| "65000" \| \| 00128 \| instance-of \| student \| \| 00128 \| name \| "Zhang" \| \| 00128 \| tot_cred \| "102" \| \| comp_sci \| dept_name \| "Comp. Sci." \| \| biology \| dept_name \| "Biology" \| \| CS-101 \| instance-of \| course \| \| CS-101 \| title \| "Intro. to Computer Science" \| \| CS-101 \| course_dept \| comp_sci \| \| sec1 \| instance-of \| section \| \| sec1 \| sec_course \| CS-101 \| \| sec1 \| sec_id \| "1" \| \| sec1 \| semester \| "Fall" \| \| sec1 \| year \| "2017" \| \| sec1 \| classroom \| packard-101 \| \| sec1 \| time_slot_id \| "H" \| \| 10101 \| inst_dept \| comp_sci \| \| 00128 \| stud_dept \| comp_sci \| \| 00128 \| takes \| sec1 \| \| 10101 \| teaches \| sec1 \|<br>Viết SQL tương đương câu SPARQL của PE 8.2a trên `cx_triple`: title (không trùng) của mọi course mà sinh viên tên Zhang đã học. |
| CH8.10 | PE 8.2b shared variable | ★★☆ | Exercise 8.2 (b). Take the RDF representation of university data illustrated in Figure 8.3. Express each of the following queries in SPARQL.  b. Find the titles of the courses for which a student named Zhang takes a section that is taught by an instructor named Srinivasan.  *Figure 8.3 — RDF representation of part of the university data (subject, predicate, object):*  \| subject \| predicate \| object \| \|---\|---\|---\| \| 10101 \| instance-of \| instructor \| \| 10101 \| name \| "Srinivasan" \| \| 10101 \| salary \| "65000" \| \| 00128 \| instance-of \| student \| \| 00128 \| name \| "Zhang" \| \| 00128 \| tot_cred \| "102" \| \| comp_sci \| dept_name \| "Comp. Sci." \| \| biology \| dept_name \| "Biology" \| \| CS-101 \| instance-of \| course \| \| CS-101 \| title \| "Intro. to Computer Science" \| \| CS-101 \| course_dept \| comp_sci \| \| sec1 \| instance-of \| section \| \| sec1 \| sec_course \| CS-101 \| \| sec1 \| sec_id \| "1" \| \| sec1 \| semester \| "Fall" \| \| sec1 \| year \| "2017" \| \| sec1 \| classroom \| packard-101 \| \| sec1 \| time_slot_id \| "H" \| \| 10101 \| inst_dept \| comp_sci \| \| 00128 \| stud_dept \| comp_sci \| \| 00128 \| takes \| sec1 \| \| 10101 \| teaches \| sec1 \|<br>SQL tương đương PE 8.2b trên `cx_triple`: title các course mà Zhang học một section do instructor tên Srinivasan dạy. |
| CH8.11 | PE 8.2c predicate là biến | ★☆☆ | Exercise 8.2 (c). Take the RDF representation of university data illustrated in Figure 8.3. Express each of the following queries in SPARQL.  c. Without listing the attribute names explicitly in the query, find the names and values of all attributes of the instructor named Srinivasan.  *Figure 8.3 — RDF representation of part of the university data (subject, predicate, object):*  \| subject \| predicate \| object \| \|---\|---\|---\| \| 10101 \| instance-of \| instructor \| \| 10101 \| name \| "Srinivasan" \| \| 10101 \| salary \| "65000" \| \| 00128 \| instance-of \| student \| \| 00128 \| name \| "Zhang" \| \| 00128 \| tot_cred \| "102" \| \| comp_sci \| dept_name \| "Comp. Sci." \| \| biology \| dept_name \| "Biology" \| \| CS-101 \| instance-of \| course \| \| CS-101 \| title \| "Intro. to Computer Science" \| \| CS-101 \| course_dept \| comp_sci \| \| sec1 \| instance-of \| section \| \| sec1 \| sec_course \| CS-101 \| \| sec1 \| sec_id \| "1" \| \| sec1 \| semester \| "Fall" \| \| sec1 \| year \| "2017" \| \| sec1 \| classroom \| packard-101 \| \| sec1 \| time_slot_id \| "H" \| \| 10101 \| inst_dept \| comp_sci \| \| 00128 \| stud_dept \| comp_sci \| \| 00128 \| takes \| sec1 \| \| 10101 \| teaches \| sec1 \|<br>SQL tương đương PE 8.2c: mọi cặp (`attr`, `value`) = (predicate, object) của instructor tên Srinivasan, không liệt kê tên thuộc tính. |
| CH8.12 | array any, && | ★☆☆ | Bảng `cx_book(isbn, title, author_array text[], publisher cx_publisher, keyword_set text[])`. Trả về title của các sách (a) có `Jones` là một tác giả, hoặc (b) có ít nhất một keyword chung với sách `B3`, trừ chính B3. |
| CH8.13 | unnest with ordinality | ★★☆ | Bỏ lồng `author_array`: trả về `isbn`, `pos` (vị trí tác giả, bắt đầu từ 1) và `author`, sắp theo isbn rồi pos. (Thứ tự dòng được chấm.) |
| CH8.14 | composite (col).field | ★☆☆ | Với mỗi tên nhà xuất bản (trường `name` của cột composite `publisher`): `publisher_name`, số sách `num_books` và mảng các title `titles` (sắp theo title). |
| CH8.15 | PE 8.4 unnest composite array | ★★☆ | Exercise 8.4. A database schema has a relation Emp whose attributes are listed below; types are given for the multivalued attributes.  - Emp = (ename, ChildrenSet multiset(Children), SkillSet multiset(Skills)) - Children = (name, birthday) - Skills = (type, ExamSet setof(Exams)) - Exams = (year, city)  Define this schema in SQL, declaring the multiset attributes with the SQL Server table-type syntax of Section 8.2.1.1.<br>`cx_emp(ename, children cx_child[], skills cx_skill[])` với `cx_child(name, birthday)`. Tên các nhân viên có ít nhất một con sinh vào tháng 3. |
| CH8.16 | PE 8.4 nested unnest | ★★★ | Exercise 8.4. A database schema has a relation Emp whose attributes are listed below; types are given for the multivalued attributes.  - Emp = (ename, ChildrenSet multiset(Children), SkillSet multiset(Skills)) - Children = (name, birthday) - Skills = (type, ExamSet setof(Exams)) - Exams = (year, city)  Define this schema in SQL, declaring the multiset attributes with the SQL Server table-type syntax of Section 8.2.1.1.<br>`cx_skill(type, exams cx_exam[])`, `cx_exam(year, city)`. Tên các nhân viên đã thi kỹ năng `typing` ở thành phố `Dayton` (unnest hai cấp). |
| CH8.17 | PE 8.4 nest lại | ★★☆ | Exercise 8.4. A database schema has a relation Emp whose attributes are listed below; types are given for the multivalued attributes.  - Emp = (ename, ChildrenSet multiset(Children), SkillSet multiset(Skills)) - Children = (name, birthday) - Skills = (type, ExamSet setof(Exams)) - Exams = (year, city)  Define this schema in SQL, declaring the multiset attributes with the SQL Server table-type syntax of Section 8.2.1.1.<br>Với mỗi loại skill: `type`, số nhân viên có skill đó (`num_emps`) và tổng số lần thi của skill đó trên mọi nhân viên (`num_exams`; skill không có lần thi nào tính 0). |
| CH8.18 | PE 8.3 table inheritance | ★★★ | Exercise 8.3. A car-rental company keeps a database of every vehicle in its current fleet. For every vehicle it stores the vehicle identification number, license number, manufacturer, model, purchase date, and color. Some kinds of vehicles carry extra data:  - Trucks: cargo capacity. - Sports cars: horsepower, and the minimum age required of the renter. - Vans: number of passengers. - Off-road vehicles: ground clearance, and drivetrain (four-wheel or two-wheel drive).  Write an SQL schema definition for this database, using inheritance where it is appropriate.<br>Hiện thực PE 8.3 bằng kế thừa bảng của PostgreSQL: - `cx_vehicle(vin varchar(17) primary key, license_no varchar(15), manufacturer varchar(30), model varchar(30), purchase_date date, color varchar(20))` - `cx_truck(cargo_capacity integer)`, `cx_sports_car(horsepower integer, min_renter_age integer)`, `cx_van(num_passengers integer)`, `cx_offroad(ground_clearance real, drivetrain varchar(3) check (drivetrain in ('4WD', '2WD')))` — mỗi bảng inherits (cx_vehicle).  Hệ thống chèn một xe vào mỗi bảng (kể cả cx_vehicle), thử chèn một xe off-road có drivetrain 'AWD', rồi đếm số xe theo bảng thực chứa nó (qua `tableoid`). |
| CH8.19 | PE 8.5 composite types, array, method | ★★★ | Exercise 8.5. Figure 8.7 shows an E-R diagram for the entity set *instructor*. Write an SQL schema definition that corresponds to this E-R diagram, using Oracle or PostgreSQL syntax and representing *phone_number* as an array of 10 elements.  *Figure 8.7 — E-R diagram with composite, multivalued, and derived attributes:*  ``` instructor   ID   name     first_name     middle_initial     last_name   address     street       street_number       street_name       apt_number     city     state     zip   { phone_number }   date_of_birth   age ( ) ```<br>Hiện thực Figure 8.7 (PE 8.5): - `cx_name(first_name varchar(15), middle_initial char(1), last_name varchar(15))` - `cx_street(street_number varchar(4), street_name varchar(15), apt_number varchar(7))` - `cx_address(street cx_street, city varchar(15), state varchar(15), zip char(6))` - bảng `cx_instructor_obj(ID varchar(5) primary key, name cx_name, address cx_address, phone_number varchar(15)[], date_of_birth date)` với ràng buộc tối đa 10 số điện thoại - hàm `cx_age(dob date, on_date date) returns integer` (số năm tròn) cho derived attribute age().  Hệ thống chèn một instructor rồi đọc last_name, street_name, city, số điện thoại thứ 2, tuổi ngày 2026-01-01, và thử chèn một instructor có 11 số điện thoại. |
| CH8.20 | PE 8.6b group by + all | ★★☆ | Exercise 8.6 (b). Take the relational schema of Figure 8.8.  b. Write each of these queries in SQL on that schema: (i) find the company with the most employees; (ii) find the company with the smallest payroll; (iii) find the companies whose employees earn, on average, a higher salary than the average salary at First Bank Corporation.  *Figure 8.8 — Relational database for Exercise 8.6:*  - employee (person_name, street, city) - works (person_name, company_name, salary) - company (company_name, city) - manages (person_name, manager_name)<br>Trên Employee database của Practice Lab (`works(ID, company_name, salary)`): (ii) tên công ty có tổng lương (payroll) nhỏ nhất (trả về tất cả nếu hoà) cùng `payroll`. |
| CH8.21 | PE 8.7 TF-IDF | ★★★ | Exercise 8.7. Using suitable definitions of term frequency and inverse document frequency, compute how relevant each Practice Exercise of this chapter is to the query “SQL relation”.<br>`cx_pe_doc(pe_id, body)` chứa đề (đã diễn đạt lại) của các bài 8.1–8.9. Tách từ bằng `regexp_split_to_table(lower(body), '\s+')` (mọi từ đều tính, kể cả stop word). Với truy vấn Q = {"sql", "relation"} và định nghĩa của sách: TF(d, t) = ln(1 + n(d, t)/n(d)), IDF(t) = 1/n(t), r(d, Q) = Σ TF(d, t)·IDF(t) (dùng log tự nhiên `ln`; n(t) = số document chứa t). Trả về `pe_id` và `relevance` (làm tròn 4 chữ số) của các document có relevance > 0. |
| CH8.22 | full-text search tsvector | ★★☆ | Full-text search của PostgreSQL trên `cx_pe_doc`: trả về `pe_id` và `rank` (= `ts_rank`, làm tròn 4 chữ số) của các bài khớp truy vấn `to_tsquery('english', 'schema & query')` (cấu hình `english` để stemming: queries → query). |
| CH8.23 | PE 8.8 PageRank một bước | ★★★ | Exercise 8.8. Show how the matrices used to compute PageRank can be stored as relations. Then write an SQL query that performs one step of the iterative PageRank technique, so that the whole algorithm can be implemented as a loop around that query.<br>`cx_link(src, dst)` là đồ thị web (trang = mọi giá trị xuất hiện ở src hoặc dst, N trang). Giả sử mọi trang có rank ban đầu 1/N. Viết một câu SQL tính rank sau một bước PageRank với δ = 0.85: P'[j] = (1 − δ)/N + δ · Σ[i→j] P[i]/outdeg(i). Trả về `page` và `rank` (làm tròn 4 chữ số) cho mọi trang (kể cả trang không có liên kết tới). |
| CH8.24 | PE 8.8 PageRank lặp | ★★★ | Exercise 8.8. Show how the matrices used to compute PageRank can be stored as relations. Then write an SQL query that performs one step of the iterative PageRank technique, so that the whole algorithm can be implemented as a loop around that query.<br>Tạo bảng `cx_rank(page char(1) primary key, p numeric)` khởi tạo 1/N cho mọi trang của `cx_link`, rồi dùng một khối `do $$ ... $$` lặp 30 bước PageRank (δ = 0.85), mỗi bước ghi đè cx_rank bằng kết quả của bước trước. Hệ thống đọc `page` và `round(p, 3)` sắp theo page. |
| CH8.25 | PE 8.9a point in polygon | ★☆☆ | Exercise 8.9 (a). Assume the *student* relation has an attribute *location* of type point, and the *classroom* relation has an attribute *location* of type polygon. Using the PostGIS spatial functions and predicates introduced in the chapter, write these queries in SQL:  a. Find the names of the students whose location lies inside the classroom Packard 101.<br>`cx_student_loc(ID, location point)` và `cx_room_area(building, room_number, area polygon)` (đơn vị mét). Tên các sinh viên có vị trí nằm trong phòng Packard 101. |
| CH8.26 | PE 8.9b within distance | ★★☆ | Exercise 8.9 (b). Assume the *student* relation has an attribute *location* of type point, and the *classroom* relation has an attribute *location* of type polygon. Using the PostGIS spatial functions and predicates introduced in the chapter, write these queries in SQL:  b. Find every classroom that lies within 100 meters of Packard 101; assume all distances are measured in meters.<br>Các phòng (building, room_number) nằm trong vòng 100 m của Packard 101 (khoảng cách giữa hai đa giác `` ≤ 100), không kể chính Packard 101; kèm `dist` làm tròn 1 chữ số. |
| CH8.27 | PE 8.9c,d nearest neighbor, spatial join | ★★☆ | Exercise 8.9 (c, d). Assume the *student* relation has an attribute *location* of type point, and the *classroom* relation has an attribute *location* of type polygon. Using the PostGIS spatial functions and predicates introduced in the chapter, write these queries in SQL:  c. Find the ID and name of the student who is geographically closest to the student whose ID is 12345.  d. Find the IDs and names of every pair of students whose locations are less than 200 meters apart.<br>Trả về hai loại dòng trong một kết quả `(kind, id1, id2)`: (c) một dòng `kind = 'nearest'`, id1 = `12345`, id2 = ID sinh viên gần 12345 nhất; (d) mỗi cặp sinh viên cách nhau dưới 200 m một dòng `kind = 'pair'` với id1 < id2. |
