-- =====================================================================
-- CS4420 · Chương 8 — Kiểu dữ liệu phức tạp (Complex Data Types)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch8
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH8.01  [jsonb ->>, #>>]  ★☆☆
-- Bảng `cx_profile(ID, doc jsonb)`. Trả về `ID`, `email` (khoá `email`) và `city` (khoá `city` nằm trong object `address`) của mọi hồ sơ. Hồ sơ thiếu khoá thì giá trị là null.




-- @ex CH8.02  [jsonb @> containment]  ★☆☆
-- ID và name (từ bảng student) của các sinh viên có `"chess"` trong mảng `hobbies` của hồ sơ.
-- Gợi ý: doc @> '{"hobbies": ["chess"]}'




-- @ex CH8.03  [jsonb_array_length, ?]  ★★☆
-- Với mỗi hồ sơ: `ID`, `num_phones` (số phần tử của mảng `phones`, bằng 0 nếu không có khoá `phones`) và `has_scholarship` (boolean: hồ sơ có khoá `scholarship` không).




-- @ex CH8.04  [jsonb_array_elements_text]  ★★☆
-- "Bỏ lồng" mảng `hobbies`: với mỗi sở thích, trả về `hobby` và `num_students` (số sinh viên có sở thích đó).




-- @ex CH8.05  [jsonb_set / ||]  ★★☆
-- Cập nhật hồ sơ của sinh viên `12345`: thêm khoá `scholarship` với giá trị số 1000 và đổi `address.city` thành `"Berkeley"` (giữ nguyên các khoá khác). Hệ thống đọc lại hồ sơ đó.
-- Gợi ý: doc || '{"scholarship": 1000}' rồi jsonb_set(..., '{address,city}', '"Berkeley"')




-- @ex CH8.06  [PE 8.1a JSON lồng nhau]  ★★★
-- Đề gốc: Exercise 8.1 (a). Using the sample university database, present the information about the student named Shankar — his *student* tuple, the *takes* tuples that belong to him, and the *course* tuples that those *takes* tuples refer to — in each of the following forms:
--
-- a. JSON, with a suitable nested structure.
--
-- Sinh một giá trị (cột `shankar`, kiểu `text` = `jsonb::text`) mô tả sinh viên Shankar theo đúng cấu trúc:
-- ```
-- {"ID": ..., "name": ..., "dept_name": ..., "tot_cred": ,
--  "takes": [ {"course_id": ..., "sec_id": ..., "semester": ..., "year": , "grade": ...,
--              "course": {"title": ..., "credits": }} , ... ]}
-- ```
-- Mảng `takes` sắp theo course_id. Dùng `jsonb_build_object` và `jsonb_agg`.




-- @ex CH8.07  [PE 8.1b XML]  ★★★
-- Đề gốc: Exercise 8.1 (b). Using the sample university database, present the information about the student named Shankar — his *student* tuple, the *takes* tuples that belong to him, and the *course* tuples that those *takes* tuples refer to — in each of the following forms:
--
-- b. XML, with the same nesting as in part a.
--
-- Sinh một giá trị XML (cột `shankar`, ép sang `text`) cùng cấu trúc lồng như CH8.06:
-- ```
-- Shankar
--   Intro. to Computer Science4
--   ...
--
-- ```
-- (không có khoảng trắng/xuống dòng giữa các thẻ; các `takes` sắp theo course_id). Dùng `xmlelement`, `xmlattributes`, `xmlagg`.




-- @ex CH8.08  [PE 8.1c RDF triples]  ★★☆
-- Đề gốc: Exercise 8.1 (c). Using the sample university database, present the information about the student named Shankar — his *student* tuple, the *takes* tuples that belong to him, and the *course* tuples that those *takes* tuples refer to — in each of the following forms:
--
-- c. RDF triples.
--
-- `cx_triple(subject, predicate, object)` chứa University database dạng RDF (section được định danh `course_id/sec_id/semester/year`). Trả về mọi triple (subject, predicate, object) mô tả Shankar: các triple có subject là ID của Shankar, cộng các triple có subject là một course mà Shankar đã học (qua takes → sec_course).




-- @ex CH8.09  [PE 8.2a triple pattern join]  ★★☆
-- Đề gốc: Exercise 8.2 (a). Take the RDF representation of university data illustrated in Figure 8.3. Express each of the following queries in SPARQL.
--
-- a. Find the titles of every course taken by any student whose name is Zhang.
--
-- *Figure 8.3 — RDF representation of part of the university data (subject, predicate, object):*
--
-- | subject | predicate | object |
-- |---|---|---|
-- | 10101 | instance-of | instructor |
-- | 10101 | name | "Srinivasan" |
-- | 10101 | salary | "65000" |
-- | 00128 | instance-of | student |
-- | 00128 | name | "Zhang" |
-- | 00128 | tot_cred | "102" |
-- | comp_sci | dept_name | "Comp. Sci." |
-- | biology | dept_name | "Biology" |
-- | CS-101 | instance-of | course |
-- | CS-101 | title | "Intro. to Computer Science" |
-- | CS-101 | course_dept | comp_sci |
-- | sec1 | instance-of | section |
-- | sec1 | sec_course | CS-101 |
-- | sec1 | sec_id | "1" |
-- | sec1 | semester | "Fall" |
-- | sec1 | year | "2017" |
-- | sec1 | classroom | packard-101 |
-- | sec1 | time_slot_id | "H" |
-- | 10101 | inst_dept | comp_sci |
-- | 00128 | stud_dept | comp_sci |
-- | 00128 | takes | sec1 |
-- | 10101 | teaches | sec1 |
--
-- Viết SQL tương đương câu SPARQL của PE 8.2a trên `cx_triple`: title (không trùng) của mọi course mà sinh viên tên Zhang đã học.
-- Gợi ý: Bốn bản sao của cx_triple: (?s name "Zhang"), (?s takes ?sec), (?sec sec_course ?c), (?c title ?title).




-- @ex CH8.10  [PE 8.2b shared variable]  ★★☆
-- Đề gốc: Exercise 8.2 (b). Take the RDF representation of university data illustrated in Figure 8.3. Express each of the following queries in SPARQL.
--
-- b. Find the titles of the courses for which a student named Zhang takes a section that is taught by an instructor named Srinivasan.
--
-- *Figure 8.3 — RDF representation of part of the university data (subject, predicate, object):*
--
-- | subject | predicate | object |
-- |---|---|---|
-- | 10101 | instance-of | instructor |
-- | 10101 | name | "Srinivasan" |
-- | 10101 | salary | "65000" |
-- | 00128 | instance-of | student |
-- | 00128 | name | "Zhang" |
-- | 00128 | tot_cred | "102" |
-- | comp_sci | dept_name | "Comp. Sci." |
-- | biology | dept_name | "Biology" |
-- | CS-101 | instance-of | course |
-- | CS-101 | title | "Intro. to Computer Science" |
-- | CS-101 | course_dept | comp_sci |
-- | sec1 | instance-of | section |
-- | sec1 | sec_course | CS-101 |
-- | sec1 | sec_id | "1" |
-- | sec1 | semester | "Fall" |
-- | sec1 | year | "2017" |
-- | sec1 | classroom | packard-101 |
-- | sec1 | time_slot_id | "H" |
-- | 10101 | inst_dept | comp_sci |
-- | 00128 | stud_dept | comp_sci |
-- | 00128 | takes | sec1 |
-- | 10101 | teaches | sec1 |
--
-- SQL tương đương PE 8.2b trên `cx_triple`: title các course mà Zhang học một section do instructor tên Srinivasan dạy.




-- @ex CH8.11  [PE 8.2c predicate là biến]  ★☆☆
-- Đề gốc: Exercise 8.2 (c). Take the RDF representation of university data illustrated in Figure 8.3. Express each of the following queries in SPARQL.
--
-- c. Without listing the attribute names explicitly in the query, find the names and values of all attributes of the instructor named Srinivasan.
--
-- *Figure 8.3 — RDF representation of part of the university data (subject, predicate, object):*
--
-- | subject | predicate | object |
-- |---|---|---|
-- | 10101 | instance-of | instructor |
-- | 10101 | name | "Srinivasan" |
-- | 10101 | salary | "65000" |
-- | 00128 | instance-of | student |
-- | 00128 | name | "Zhang" |
-- | 00128 | tot_cred | "102" |
-- | comp_sci | dept_name | "Comp. Sci." |
-- | biology | dept_name | "Biology" |
-- | CS-101 | instance-of | course |
-- | CS-101 | title | "Intro. to Computer Science" |
-- | CS-101 | course_dept | comp_sci |
-- | sec1 | instance-of | section |
-- | sec1 | sec_course | CS-101 |
-- | sec1 | sec_id | "1" |
-- | sec1 | semester | "Fall" |
-- | sec1 | year | "2017" |
-- | sec1 | classroom | packard-101 |
-- | sec1 | time_slot_id | "H" |
-- | 10101 | inst_dept | comp_sci |
-- | 00128 | stud_dept | comp_sci |
-- | 00128 | takes | sec1 |
-- | 10101 | teaches | sec1 |
--
-- SQL tương đương PE 8.2c: mọi cặp (`attr`, `value`) = (predicate, object) của instructor tên Srinivasan, không liệt kê tên thuộc tính.




-- @ex CH8.12  [array any, &&]  ★☆☆
-- Bảng `cx_book(isbn, title, author_array text[], publisher cx_publisher, keyword_set text[])`. Trả về title của các sách (a) có `Jones` là một tác giả, hoặc (b) có ít nhất một keyword chung với sách `B3`, trừ chính B3.




-- @ex CH8.13  [unnest with ordinality]  ★★☆
-- Bỏ lồng `author_array`: trả về `isbn`, `pos` (vị trí tác giả, bắt đầu từ 1) và `author`, sắp theo isbn rồi pos. (Thứ tự dòng được chấm.)
-- (Thứ tự dòng được chấm.)




-- @ex CH8.14  [composite (col).field]  ★☆☆
-- Với mỗi tên nhà xuất bản (trường `name` của cột composite `publisher`): `publisher_name`, số sách `num_books` và mảng các title `titles` (sắp theo title).




-- @ex CH8.15  [PE 8.4 unnest composite array]  ★★☆
-- Đề gốc: Exercise 8.4. A database schema has a relation Emp whose attributes are listed below; types are given for the multivalued attributes.
--
-- - Emp = (ename, ChildrenSet multiset(Children), SkillSet multiset(Skills))
-- - Children = (name, birthday)
-- - Skills = (type, ExamSet setof(Exams))
-- - Exams = (year, city)
--
-- Define this schema in SQL, declaring the multiset attributes with the SQL Server table-type syntax of Section 8.2.1.1.
--
-- `cx_emp(ename, children cx_child[], skills cx_skill[])` với `cx_child(name, birthday)`. Tên các nhân viên có ít nhất một con sinh vào tháng 3.




-- @ex CH8.16  [PE 8.4 nested unnest]  ★★★
-- Đề gốc: Exercise 8.4. A database schema has a relation Emp whose attributes are listed below; types are given for the multivalued attributes.
--
-- - Emp = (ename, ChildrenSet multiset(Children), SkillSet multiset(Skills))
-- - Children = (name, birthday)
-- - Skills = (type, ExamSet setof(Exams))
-- - Exams = (year, city)
--
-- Define this schema in SQL, declaring the multiset attributes with the SQL Server table-type syntax of Section 8.2.1.1.
--
-- `cx_skill(type, exams cx_exam[])`, `cx_exam(year, city)`. Tên các nhân viên đã thi kỹ năng `typing` ở thành phố `Dayton` (unnest hai cấp).




-- @ex CH8.17  [PE 8.4 nest lại]  ★★☆
-- Đề gốc: Exercise 8.4. A database schema has a relation Emp whose attributes are listed below; types are given for the multivalued attributes.
--
-- - Emp = (ename, ChildrenSet multiset(Children), SkillSet multiset(Skills))
-- - Children = (name, birthday)
-- - Skills = (type, ExamSet setof(Exams))
-- - Exams = (year, city)
--
-- Define this schema in SQL, declaring the multiset attributes with the SQL Server table-type syntax of Section 8.2.1.1.
--
-- Với mỗi loại skill: `type`, số nhân viên có skill đó (`num_emps`) và tổng số lần thi của skill đó trên mọi nhân viên (`num_exams`; skill không có lần thi nào tính 0).




-- @ex CH8.18  [PE 8.3 table inheritance]  ★★★
-- Đề gốc: Exercise 8.3. A car-rental company keeps a database of every vehicle in its current fleet. For every vehicle it stores the vehicle identification number, license number, manufacturer, model, purchase date, and color. Some kinds of vehicles carry extra data:
--
-- - Trucks: cargo capacity.
-- - Sports cars: horsepower, and the minimum age required of the renter.
-- - Vans: number of passengers.
-- - Off-road vehicles: ground clearance, and drivetrain (four-wheel or two-wheel drive).
--
-- Write an SQL schema definition for this database, using inheritance where it is appropriate.
--
-- Hiện thực PE 8.3 bằng kế thừa bảng của PostgreSQL:
-- - `cx_vehicle(vin varchar(17) primary key, license_no varchar(15), manufacturer varchar(30), model varchar(30), purchase_date date, color varchar(20))`
-- - `cx_truck(cargo_capacity integer)`, `cx_sports_car(horsepower integer, min_renter_age integer)`, `cx_van(num_passengers integer)`, `cx_offroad(ground_clearance real, drivetrain varchar(3) check (drivetrain in ('4WD', '2WD')))` — mỗi bảng inherits (cx_vehicle).
--
-- Hệ thống chèn một xe vào mỗi bảng (kể cả cx_vehicle), thử chèn một xe off-road có drivetrain 'AWD', rồi đếm số xe theo bảng thực chứa nó (qua `tableoid`).




-- @ex CH8.19  [PE 8.5 composite types, array, method]  ★★★
-- Đề gốc: Exercise 8.5. Figure 8.7 shows an E-R diagram for the entity set *instructor*. Write an SQL schema definition that corresponds to this E-R diagram, using Oracle or PostgreSQL syntax and representing *phone_number* as an array of 10 elements.
--
-- *Figure 8.7 — E-R diagram with composite, multivalued, and derived attributes:*
--
-- ```
-- instructor
--   ID
--   name
--     first_name
--     middle_initial
--     last_name
--   address
--     street
--       street_number
--       street_name
--       apt_number
--     city
--     state
--     zip
--   { phone_number }
--   date_of_birth
--   age ( )
-- ```
--
-- Hiện thực Figure 8.7 (PE 8.5):
-- - `cx_name(first_name varchar(15), middle_initial char(1), last_name varchar(15))`
-- - `cx_street(street_number varchar(4), street_name varchar(15), apt_number varchar(7))`
-- - `cx_address(street cx_street, city varchar(15), state varchar(15), zip char(6))`
-- - bảng `cx_instructor_obj(ID varchar(5) primary key, name cx_name, address cx_address, phone_number varchar(15)[], date_of_birth date)` với ràng buộc tối đa 10 số điện thoại
-- - hàm `cx_age(dob date, on_date date) returns integer` (số năm tròn) cho derived attribute age().
--
-- Hệ thống chèn một instructor rồi đọc last_name, street_name, city, số điện thoại thứ 2, tuổi ngày 2026-01-01, và thử chèn một instructor có 11 số điện thoại.




-- @ex CH8.20  [PE 8.6b group by + all]  ★★☆
-- Đề gốc: Exercise 8.6 (b). Take the relational schema of Figure 8.8.
--
-- b. Write each of these queries in SQL on that schema: (i) find the company with the most employees; (ii) find the company with the smallest payroll; (iii) find the companies whose employees earn, on average, a higher salary than the average salary at First Bank Corporation.
--
-- *Figure 8.8 — Relational database for Exercise 8.6:*
--
-- - employee (person_name, street, city)
-- - works (person_name, company_name, salary)
-- - company (company_name, city)
-- - manages (person_name, manager_name)
--
-- Trên Employee database của Practice Lab (`works(ID, company_name, salary)`): (ii) tên công ty có tổng lương (payroll) nhỏ nhất (trả về tất cả nếu hoà) cùng `payroll`.




-- @ex CH8.21  [PE 8.7 TF-IDF]  ★★★
-- Đề gốc: Exercise 8.7. Using suitable definitions of term frequency and inverse document frequency, compute how relevant each Practice Exercise of this chapter is to the query “SQL relation”.
--
-- `cx_pe_doc(pe_id, body)` chứa đề (đã diễn đạt lại) của các bài 8.1–8.9. Tách từ bằng `regexp_split_to_table(lower(body), '\s+')` (mọi từ đều tính, kể cả stop word). Với truy vấn Q = {"sql", "relation"} và định nghĩa của sách:
-- TF(d, t) = ln(1 + n(d, t)/n(d)), IDF(t) = 1/n(t), r(d, Q) = Σ TF(d, t)·IDF(t)
-- (dùng log tự nhiên `ln`; n(t) = số document chứa t). Trả về `pe_id` và `relevance` (làm tròn 4 chữ số) của các document có relevance > 0.
-- Gợi ý: CTE words(pe_id, w); doc_len(pe_id, n); tf(pe_id, term, cnt); df(term, n_docs).




-- @ex CH8.22  [full-text search tsvector]  ★★☆
-- Full-text search của PostgreSQL trên `cx_pe_doc`: trả về `pe_id` và `rank` (= `ts_rank`, làm tròn 4 chữ số) của các bài khớp truy vấn `to_tsquery('english', 'schema & query')` (cấu hình `english` để stemming: queries → query).




-- @ex CH8.23  [PE 8.8 PageRank một bước]  ★★★
-- Đề gốc: Exercise 8.8. Show how the matrices used to compute PageRank can be stored as relations. Then write an SQL query that performs one step of the iterative PageRank technique, so that the whole algorithm can be implemented as a loop around that query.
--
-- `cx_link(src, dst)` là đồ thị web (trang = mọi giá trị xuất hiện ở src hoặc dst, N trang). Giả sử mọi trang có rank ban đầu 1/N. Viết một câu SQL tính rank sau một bước PageRank với δ = 0.85:
-- P'[j] = (1 − δ)/N + δ · Σ[i→j] P[i]/outdeg(i).
-- Trả về `page` và `rank` (làm tròn 4 chữ số) cho mọi trang (kể cả trang không có liên kết tới).




-- @ex CH8.24  [PE 8.8 PageRank lặp]  ★★★
-- Đề gốc: Exercise 8.8. Show how the matrices used to compute PageRank can be stored as relations. Then write an SQL query that performs one step of the iterative PageRank technique, so that the whole algorithm can be implemented as a loop around that query.
--
-- Tạo bảng `cx_rank(page char(1) primary key, p numeric)` khởi tạo 1/N cho mọi trang của `cx_link`, rồi dùng một khối `do $$ ... $$` lặp 30 bước PageRank (δ = 0.85), mỗi bước ghi đè cx_rank bằng kết quả của bước trước. Hệ thống đọc `page` và `round(p, 3)` sắp theo page.
-- Gợi ý: Trong vòng lặp: tính bước mới vào bảng tạm (create temp table ... as / hoặc update ... from (subquery)).
-- (Thứ tự dòng được chấm.)




-- @ex CH8.25  [PE 8.9a point in polygon]  ★☆☆
-- Đề gốc: Exercise 8.9 (a). Assume the *student* relation has an attribute *location* of type point, and the *classroom* relation has an attribute *location* of type polygon. Using the PostGIS spatial functions and predicates introduced in the chapter, write these queries in SQL:
--
-- a. Find the names of the students whose location lies inside the classroom Packard 101.
--
-- `cx_student_loc(ID, location point)` và `cx_room_area(building, room_number, area polygon)` (đơn vị mét). Tên các sinh viên có vị trí nằm trong phòng Packard 101.
-- Gợi ý: polygon @> point




-- @ex CH8.26  [PE 8.9b within distance]  ★★☆
-- Đề gốc: Exercise 8.9 (b). Assume the *student* relation has an attribute *location* of type point, and the *classroom* relation has an attribute *location* of type polygon. Using the PostGIS spatial functions and predicates introduced in the chapter, write these queries in SQL:
--
-- b. Find every classroom that lies within 100 meters of Packard 101; assume all distances are measured in meters.
--
-- Các phòng (building, room_number) nằm trong vòng 100 m của Packard 101 (khoảng cách giữa hai đa giác `` ≤ 100), không kể chính Packard 101; kèm `dist` làm tròn 1 chữ số.




-- @ex CH8.27  [PE 8.9c,d nearest neighbor, spatial join]  ★★☆
-- Đề gốc: Exercise 8.9 (c, d). Assume the *student* relation has an attribute *location* of type point, and the *classroom* relation has an attribute *location* of type polygon. Using the PostGIS spatial functions and predicates introduced in the chapter, write these queries in SQL:
--
-- c. Find the ID and name of the student who is geographically closest to the student whose ID is 12345.
--
-- d. Find the IDs and names of every pair of students whose locations are less than 200 meters apart.
--
-- Trả về hai loại dòng trong một kết quả `(kind, id1, id2)`: (c) một dòng `kind = 'nearest'`, id1 = `12345`, id2 = ID sinh viên gần 12345 nhất; (d) mỗi cặp sinh viên cách nhau dưới 200 m một dòng `kind = 'pair'` với id1 < id2.


