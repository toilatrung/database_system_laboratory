# Ôn GK · Phần 1 — Practice Exercises Chương 1–2 (Introduction, Relational Model)

*Practice Exercises — Chapters 1–2 · Practice Exercises 1.1–1.5, 2.1–2.9 · Database System Concepts, 7th Ed.*

> **Cách học:** *Tự luận lý thuyết* → *Bài tập SQL* → *Ghi nhớ nhanh*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk1`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tự luận lý thuyết (14 câu)

**Câu 1.** 

> **Exercise 1.1.** This chapter has described several major advantages of a database system. What are two disadvantages?

**PE 1.1** — Chương 1 nêu nhiều ưu điểm của database system. Hãy nêu **hai nhược điểm**.

<details><summary>Gợi ý đáp án</summary>

1. Việc cài đặt (setup) database system đòi hỏi nhiều **kiến thức, tiền bạc, kỹ năng và thời gian** hơn.
2. **Độ phức tạp** của database có thể dẫn tới **hiệu năng kém** (overhead không cần thiết với ứng dụng nhỏ, đơn giản).

</details>

**Câu 2.** 

> **Exercise 1.2.** List five ways in which the type declaration system of a language such as Java or C++ differs from the data definition language used in a database.

**PE 1.2** — Nêu **năm** điểm khác nhau giữa hệ thống khai báo kiểu (type declaration) của Java/C++ và data-definition language (DDL) của database.

<details><summary>Gợi ý đáp án</summary>

1. Thực thi lệnh DDL **tạo ra object thật** trong database; khai báo kiểu trong ngôn ngữ lập trình chỉ là **trừu tượng** dùng trong chương trình.
2. DDL cho phép khai báo **consistency constraints** (domain constraint, referential integrity…); hệ kiểu của ngôn ngữ lập trình thường không có.
3. DDL hỗ trợ **authorization** — cấp quyền truy cập khác nhau cho từng user; ngôn ngữ lập trình không có (cùng lắm là private/protected giữa các class).
4. Hệ kiểu của ngôn ngữ lập trình thường **giàu hơn** nhiều so với SQL (SQL chủ yếu có số, chuỗi; một số DB có array, object).
5. DDL tập trung vào **kiểu của các attribute của relation**; ngôn ngữ lập trình cho phép tạo **object và collection of objects**.

</details>

**Câu 3.** 

> **Exercise 1.3.** List six major steps that you would take in setting up a database for a particular enterprise.

**PE 1.3** — Liệt kê **sáu bước chính** khi xây dựng một database cho một doanh nghiệp cụ thể.

<details><summary>Gợi ý đáp án</summary>

1. Xác định **yêu cầu mức cao** của doanh nghiệp → tài liệu *system requirements specification*.
2. Xác định **model** chứa mọi loại dữ liệu và mối quan hệ cần thiết (ví dụ E-R model).
3. Xác định **integrity constraints** trên dữ liệu.
4. Xác định **mức vật lý** (physical level).
5. Với mỗi bài toán thường xuyên (công việc của nhân viên, người dùng web), thiết kế **giao diện người dùng** và viết **application programs** thực hiện nó.
6. **Tạo và khởi tạo** (create/initialize) database.

</details>

**Câu 4.** 

> **Exercise 1.4.** Suppose you want to build a video site similar to YouTube. Consider each of the points listed in Section 1.2 as disadvantages of keeping data in a file-processing system. Discuss the relevance of each of these points to the storage of actual video data, and to metadata about the video, such as title, the user who uploaded it, tags, and which users viewed it.

**PE 1.4** — Xây dựng một video site kiểu YouTube. Với **từng** nhược điểm của file-processing system ở Section 1.2, hãy bàn xem nó có liên quan tới việc lưu **dữ liệu video** và **metadata** (title, người upload, tag, ai đã xem) hay không.

<details><summary>Gợi ý đáp án</summary>

| Nhược điểm | Đánh giá |
|---|---|
| Data redundancy & inconsistency | Liên quan phần nào tới **metadata**; không liên quan tới video (video không bị cập nhật). Ít mối quan hệ nên ít dư thừa. |
| Difficulty in accessing data | Nếu chỉ truy cập qua vài giao diện định sẵn thì không sao; nhưng muốn tìm theo điều kiện phức tạp trên metadata thì lưu trong file sẽ phải viết chương trình riêng → cần database. |
| Data isolation | Không lớn: dữ liệu chủ yếu được **tạo mới** chứ không sửa; lịch sử xem cũng append-only. Có thể có vấn đề nếu có thêm phân quyền. |
| Integrity problems | Ít ràng buộc ngoài primary key; nếu dữ liệu phân tán thì khó bảo đảm primary key. Không phải vấn đề lớn. |
| Atomicity problems | **Quan trọng**: upload video thì video và metadata phải được thêm **cùng lúc** (atomic), cần cơ chế recovery khi lỗi. |
| Concurrent-access anomalies | Ít xảy ra vì dữ liệu không bị cập nhật. |
| Security problems | Liên quan nếu hệ thống có phân quyền (video riêng tư…). |

</details>

**Câu 5.** 

> **Exercise 1.5.** Keyword queries used in web search are quite different from database queries. List key differences between the two, in terms of the way the queries are specified and in terms of what is the result of a query.

**PE 1.5** — Keyword query của web search khác database query thế nào, về **cách đặc tả** truy vấn và về **kết quả**?

<details><summary>Gợi ý đáp án</summary>

- **Đặc tả**: web search chỉ là danh sách từ khoá, **không có cú pháp** cụ thể; database query có **cú pháp chặt chẽ** (SQL), cho phép diễn đạt truy vấn phức tạp (join, aggregate, subquery…).
- **Kết quả**: web search trả về **danh sách URL có xếp hạng** kèm đoạn trích nội dung; trong mô hình quan hệ kết quả **luôn là một bảng** (relation).

</details>

**Câu 6.** 

> **Exercise 2.1.** Consider the employee database of Figure 2.17. What are the appropriate primary keys?
> 
> *Figure 2.17 — Employee database* (primary keys underlined):
> 
> - employee (<u>ID</u>, person_name, street, city)
> - works (<u>ID</u>, company_name, salary)
> - company (<u>company_name</u>, city)

**PE 2.1** — Với Employee database (Figure 2.17): employee(ID, person_name, street, city), works(ID, company_name, salary), company(company_name, city). Primary key thích hợp là gì?

<details><summary>Gợi ý đáp án</summary>

- employee(**ID**, person_name, street, city)
- works(**ID**, company_name, salary) — mỗi người làm cho một công ty
- company(**company_name**, city)

*Lưu ý dữ liệu mẫu:* bảng `company` trong Practice Lab dùng khoá (company_name, city) vì PE 3.9e giả sử một công ty có thể ở nhiều thành phố.

</details>

**Câu 7.** 

> **Exercise 2.2.** Consider the foreign-key constraint from the *dept_name* attribute of *instructor* to the *department* relation. Give examples of inserts and deletes to these relations that can cause a violation of the foreign-key constraint.

**PE 2.2** — Xét foreign key từ instructor.dept_name tới department. Cho ví dụ một **insert** và một **delete** có thể vi phạm ràng buộc này.

<details><summary>Gợi ý đáp án</summary>

- **Insert** tuple (10111, Ostrom, Economics, 110000) vào **instructor** khi bảng department không có khoa Economics → vi phạm.
- **Delete** tuple (Biology, Watson, 90000) khỏi **department** khi vẫn còn instructor (hoặc student) có dept_name = Biology → vi phạm.

Trong schema của Practice Lab, các foreign key tới department khai báo `on delete set null` nên delete Biology **không** bị từ chối mà dept_name của Crick bị đặt thành null (xem bài GK1.02). Với foreign key không có hành động kèm theo, delete sẽ bị từ chối.

</details>

**Câu 8.** 

> **Exercise 2.3.** Consider the *time_slot* relation. Given that a particular time slot can meet more than once in a week, explain why *day* and *start_time* are part of the primary key of this relation, while *end_time* is not.

**PE 2.3** — Một time slot có thể họp nhiều lần trong tuần. Giải thích vì sao **day** và **start_time** thuộc primary key của time_slot còn **end_time** thì không.

<details><summary>Gợi ý đáp án</summary>

- Một lớp (cùng time_slot_id) thường học **nhiều ngày** khác nhau trong tuần, thậm chí nhiều lần một ngày → chỉ time_slot_id không đủ phân biệt, cần thêm **day** và **start_time**.
- Một lớp bắt đầu vào một thời điểm cụ thể của một ngày thì **chỉ kết thúc vào một thời điểm** → end_time bị xác định bởi (time_slot_id, day, start_time), thêm vào sẽ làm key không còn tối thiểu.

(Trong dữ liệu mẫu, start_time được tách thành start_hr, start_min.)

</details>

**Câu 9.** 

> **Exercise 2.4.** In the instance of *instructor* shown in Figure 2.1, no two instructors have the same name. From this, can we conclude that *name* can be used as a superkey (or primary key) of *instructor*?

**PE 2.4** — Trong instance của instructor (Figure 2.1) không có hai instructor trùng tên. Có thể kết luận name là superkey (hoặc primary key) của instructor không?

<details><summary>Gợi ý đáp án</summary>

**Không.** Với instance này tên là duy nhất, nhưng nói chung không đảm bảo (trừ khi trường có quy định không ai được trùng tên — rất khó xảy ra). Key là ràng buộc phải đúng với **mọi instance hợp lệ**, không suy ra từ một instance. Bài GK1.04 chèn thêm một "Einstein" thứ hai — database chấp nhận, chứng tỏ name không phải key.

</details>

**Câu 10.** 

> **Exercise 2.5.** What is the result of first performing the Cartesian product of *student* and *advisor*, and then performing a selection operation on the result with the predicate *s_id* = *ID*? (Using the symbolic notation of relational algebra, this query can be written as σ<sub>s_id=ID</sub>(*student* × *advisor*).)

**PE 2.5** — Kết quả của σ<sub>s_id=ID</sub>(student × advisor) là gì?

<details><summary>Gợi ý đáp án</summary>

Schema kết quả gồm **mọi attribute của student rồi tới mọi attribute của advisor** (ID, name, dept_name, tot_cred, s_id, i_id).

- Với mỗi sinh viên **có advisor**: một dòng gồm thông tin sinh viên, s_id (bằng ID) và i_id (ID của advisor).
- Sinh viên **không có advisor** không xuất hiện.
- Sinh viên có **nhiều advisor** xuất hiện nhiều lần tương ứng.

SQL: `select * from student, advisor where s_id = student.ID` (GK1.05).

</details>

**Câu 11.** 

> **Exercise 2.6.** Consider the employee database of Figure 2.17. Give an expression in the relational algebra to express each of the following queries:
> 
> a. Find the name of each employee who lives in city “Miami”.
> 
> b. Find the name of each employee whose salary is greater than $100000.
> 
> c. Find the name of each employee who lives in “Miami” and whose salary is greater than $100000.
> 
> *Figure 2.17 — Employee database* (primary keys underlined):
> 
> - employee (<u>ID</u>, person_name, street, city)
> - works (<u>ID</u>, company_name, salary)
> - company (<u>company_name</u>, city)

**PE 2.6** — Viết biểu thức đại số quan hệ trên Employee database: (a) tên nhân viên sống ở Miami; (b) tên nhân viên có salary > 100000; (c) tên nhân viên sống ở Miami **và** salary > 100000.

<details><summary>Gợi ý đáp án</summary>

a. Π<sub>person_name</sub>(σ<sub>city="Miami"</sub>(employee))
b. Π<sub>person_name</sub>(σ<sub>salary>100000</sub>(employee ⋈ works))
c. Π<sub>person_name</sub>(σ<sub>city="Miami" ∧ salary>100000</sub>(employee ⋈ works))

SQL tương ứng: GK1.07, GK1.08, GK1.09. Nhớ Π loại trùng → `select distinct`.

</details>

**Câu 12.** 

> **Exercise 2.7.** Consider the bank database of Figure 2.18. Give an expression in the relational algebra for each of the following queries:
> 
> a. Find the name of each branch located in “Chicago”.
> 
> b. Find the ID of each borrower who has a loan in branch “Downtown”.
> 
> *Figure 2.18 — Bank database* (primary keys underlined):
> 
> - branch (<u>branch_name</u>, branch_city, assets)
> - customer (<u>ID</u>, customer_name, customer_street, customer_city)
> - loan (<u>loan_number</u>, branch_name, amount)
> - borrower (<u>ID, loan_number</u>)
> - account (<u>account_number</u>, branch_name, balance)
> - depositor (<u>ID, account_number</u>)

**PE 2.7** — Bank database: (a) tên các branch ở Chicago; (b) ID những borrower có loan ở branch Downtown.

<details><summary>Gợi ý đáp án</summary>

a. Π<sub>branch_name</sub>(σ<sub>branch_city="Chicago"</sub>(branch))
b. Π<sub>ID</sub>(σ<sub>branch_name="Downtown"</sub>(borrower ⋈<sub>borrower.loan_number=loan.loan_number</sub> loan))

SQL: GK1.10, GK1.11.

</details>

**Câu 13.** 

> **Exercise 2.8.** Consider the employee database of Figure 2.17. Give an expression in the relational algebra to express each of the following queries:
> 
> a. Find the ID and name of each employee who does not work for “BigBank”.
> 
> b. Find the ID and name of each employee who earns at least as much as every employee in the database.
> 
> *Figure 2.17 — Employee database* (primary keys underlined):
> 
> - employee (<u>ID</u>, person_name, street, city)
> - works (<u>ID</u>, company_name, salary)
> - company (<u>company_name</u>, city)

**PE 2.8** — Employee database: (a) ID và tên mỗi nhân viên **không** làm cho BigBank; (b) ID và tên mỗi nhân viên có lương **ít nhất bằng mọi** nhân viên khác.

<details><summary>Gợi ý đáp án</summary>

a. Tìm những người làm cho BigBank rồi lấy phần bù:

Π<sub>ID,person_name</sub>(employee) − Π<sub>ID,person_name</sub>(employee ⋈<sub>employee.ID=works.ID</sub> σ<sub>company_name="BigBank"</sub>(works))

b. Tìm những người **có ai đó lương cao hơn** (so sánh hai tuple của cùng relation → rename), rồi lấy phần bù:

Π<sub>ID,person_name</sub>(employee ⋈ works) − Π<sub>A.ID,A.person_name</sub>(ρ<sub>A</sub>(employee ⋈ works) ⋈<sub>A.salary<B.salary</sub> ρ<sub>B</sub>(employee ⋈ works))

*Lưu ý:* lời giải của sách viết ρ<sub>A</sub>(employee) và A.salary, nhưng salary nằm trong works nên phải join với works. Nếu dùng Π(employee) ở vế trái, người **không có trong works** (không có lương, như Leo Vu trong dữ liệu mẫu) cũng lọt vào kết quả — vì vậy vế trái cũng phải là employee ⋈ works.

SQL: GK1.12, GK1.13.

</details>

**Câu 14.** 

> **Exercise 2.9.** The division operator of relational algebra, “÷”, is defined as follows. Let r(R) and s(S) be relations, and let S ⊆ R; that is, every attribute of schema S is also in schema R. Given a tuple t, let t[S] denote the projection of tuple t on the attributes in S. Then r ÷ s is a relation on schema R − S (that is, on the schema containing all attributes of schema R that are not in schema S). A tuple t is in r ÷ s if and only if both of two conditions hold:
> 
> - t is in Π<sub>R−S</sub>(r)
> - For every tuple t<sub>s</sub> in s, there is a tuple t<sub>r</sub> in r satisfying both of the following:
>   - t<sub>r</sub>[S] = t<sub>s</sub>[S]
>   - t<sub>r</sub>[R − S] = t
> 
> Given the above definition:
> 
> a. Write a relational algebra expression using the division operator to find the IDs of all students who have taken all Comp. Sci. courses. (Hint: project *takes* to just ID and *course_id*, and generate the set of all Comp. Sci. *course_id*s using a select expression, before doing the division.)
> 
> b. Show how to write the above query in relational algebra, without using division. (By doing so, you would have shown how to define the division operation using the other relational algebra operations.)

**PE 2.9** — Định nghĩa phép chia r ÷ s. (a) Dùng phép chia tìm ID các sinh viên đã học **tất cả** course của khoa Comp. Sci. (b) Viết lại không dùng phép chia.

<details><summary>Gợi ý đáp án</summary>

a. Π<sub>ID,course_id</sub>(takes) ÷ Π<sub>course_id</sub>(σ<sub>dept_name="Comp. Sci."</sub>(course))

b. Đặt r ← Π<sub>ID,course_id</sub>(takes), s ← Π<sub>course_id</sub>(σ<sub>dept_name="Comp. Sci."</sub>(course)):

Π<sub>ID</sub>(takes) − Π<sub>ID</sub>((Π<sub>ID</sub>(takes) × s) − r)

Tổng quát: r ÷ s = Π<sub>R−S</sub>(r) − Π<sub>R−S</sub>((Π<sub>R−S</sub>(r) × s) − Π<sub>R−S,S</sub>(r)).

Giải thích: Π<sub>R−S</sub>(r) cho mọi tuple thoả điều kiện 1 của định nghĩa. (Π<sub>R−S</sub>(r) × s) − Π<sub>R−S,S</sub>(r) là các cặp (ứng viên, phần tử của s) **không có** trong r; ứng viên xuất hiện trong đó vi phạm điều kiện "với mọi t<sub>s</sub> ∈ s" nên bị trừ đi.

*Trên dữ liệu mẫu*, không sinh viên nào học đủ 5 course Comp. Sci. nên kết quả (a) **rỗng**. Bài GK1.14 vì vậy chấm phiên bản khoa **Physics**; GK1.15–GK1.16 luyện công thức (b) với một divisor cho kết quả khác rỗng.

</details>

## 2. Bài tập SQL (16 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK1.01 | PE 2.1 primary key | ★☆☆ | Exercise 2.1. Consider the employee database of Figure 2.17. What are the appropriate primary keys?  *Figure 2.17 — Employee database* (primary keys underlined):  - employee (ID, person_name, street, city) - works (ID, company_name, salary) - company (company_name, city)<br>PE 2.1 — Tạo ba bảng `gk_employee(ID, person_name, street, city)`, `gk_works(ID, company_name, salary)`, `gk_company(company_name, city)` với primary key đúng như lời giải PE 2.1 (kiểu dữ liệu tuỳ chọn). |
| GK1.02 | PE 2.2 foreign key | ★★☆ | Exercise 2.2. Consider the foreign-key constraint from the *dept_name* attribute of *instructor* to the *department* relation. Give examples of inserts and deletes to these relations that can cause a violation of the foreign-key constraint.<br>PE 2.2 — Viết một câu select trả về 3 cột: (1) kết quả `try_sql` khi insert `('10111', 'Ostrom', 'Economics', 110000)` vào instructor; (2) kết quả `try_sql` khi delete khoa `Biology` khỏi department; (3) số instructor có `dept_name is null` sau lệnh delete (dùng `sql_value`). |
| GK1.03 | PE 2.3 time_slot key | ★☆☆ | Exercise 2.3. Consider the *time_slot* relation. Given that a particular time slot can meet more than once in a week, explain why *day* and *start_time* are part of the primary key of this relation, while *end_time* is not.<br>PE 2.3 — Minh hoạ vì sao time_slot_id không đủ làm khoá: liệt kê các `time_slot_id` họp nhiều hơn một lần trong tuần cùng số lần họp (`num_meetings`). |
| GK1.04 | PE 2.4 superkey | ★☆☆ | Exercise 2.4. In the instance of *instructor* shown in Figure 2.1, no two instructors have the same name. From this, can we conclude that *name* can be used as a superkey (or primary key) of *instructor*?<br>PE 2.4 — Chèn instructor `('99001', 'Einstein', 'Comp. Sci.', 70000)` rồi trả về các instructor tên `Einstein` (ID, name, dept_name). Database chấp nhận → name không phải superkey. |
| GK1.05 | PE 2.5 σ over × | ★☆☆ | Exercise 2.5. What is the result of first performing the Cartesian product of *student* and *advisor*, and then performing a selection operation on the result with the predicate *s_id* = *ID*? (Using the symbolic notation of relational algebra, this query can be written as σ[s_id=ID](*student* × *advisor*).)<br>PE 2.5 — Viết SQL cho σ[s_id=ID](student × advisor) (giữ mọi cột của cả hai bảng). |
| GK1.06 | PE 2.5 missing tuples | ★★☆ | Exercise 2.5. What is the result of first performing the Cartesian product of *student* and *advisor*, and then performing a selection operation on the result with the predicate *s_id* = *ID*? (Using the symbolic notation of relational algebra, this query can be written as σ[s_id=ID](*student* × *advisor*).)<br>PE 2.5 (mở rộng) — Những sinh viên nào không xuất hiện trong kết quả của σ[s_id=ID](student × advisor)? Trả về ID, name. |
| GK1.07 | PE 2.6a σ, Π | ★☆☆ | Exercise 2.6 (a). Consider the employee database of Figure 2.17. Give an expression in the relational algebra to express each of the following queries:  a. Find the name of each employee who lives in city “Miami”.  *Figure 2.17 — Employee database* (primary keys underlined):  - employee (ID, person_name, street, city) - works (ID, company_name, salary) - company (company_name, city)<br>PE 2.6a — Π[person_name](σ[city="Miami"](employee)). |
| GK1.08 | PE 2.6b join | ★☆☆ | Exercise 2.6 (b). Consider the employee database of Figure 2.17. Give an expression in the relational algebra to express each of the following queries:  b. Find the name of each employee whose salary is greater than $100000.  *Figure 2.17 — Employee database* (primary keys underlined):  - employee (ID, person_name, street, city) - works (ID, company_name, salary) - company (company_name, city)<br>PE 2.6b — Tên mỗi nhân viên có salary > 100000: Π[person_name](σ[salary>100000](employee ⋈ works)). |
| GK1.09 | PE 2.6c join | ★☆☆ | Exercise 2.6 (c). Consider the employee database of Figure 2.17. Give an expression in the relational algebra to express each of the following queries:  c. Find the name of each employee who lives in “Miami” and whose salary is greater than $100000.  *Figure 2.17 — Employee database* (primary keys underlined):  - employee (ID, person_name, street, city) - works (ID, company_name, salary) - company (company_name, city)<br>PE 2.6c — Tên mỗi nhân viên sống ở Miami và có salary > 100000. |
| GK1.10 | PE 2.7a σ, Π | ★☆☆ | Exercise 2.7 (a). Consider the bank database of Figure 2.18. Give an expression in the relational algebra for each of the following queries:  a. Find the name of each branch located in “Chicago”.  *Figure 2.18 — Bank database* (primary keys underlined):  - branch (branch_name, branch_city, assets) - customer (ID, customer_name, customer_street, customer_city) - loan (loan_number, branch_name, amount) - borrower (ID, loan_number) - account (account_number, branch_name, balance) - depositor (ID, account_number)<br>PE 2.7a (Bank database) — Tên mỗi branch ở Chicago. |
| GK1.11 | PE 2.7b θ-join | ★☆☆ | Exercise 2.7 (b). Consider the bank database of Figure 2.18. Give an expression in the relational algebra for each of the following queries:  b. Find the ID of each borrower who has a loan in branch “Downtown”.  *Figure 2.18 — Bank database* (primary keys underlined):  - branch (branch_name, branch_city, assets) - customer (ID, customer_name, customer_street, customer_city) - loan (loan_number, branch_name, amount) - borrower (ID, loan_number) - account (account_number, branch_name, balance) - depositor (ID, account_number)<br>PE 2.7b — ID mỗi borrower có loan ở branch Downtown. |
| GK1.12 | PE 2.8a set difference | ★★☆ | Exercise 2.8 (a). Consider the employee database of Figure 2.17. Give an expression in the relational algebra to express each of the following queries:  a. Find the ID and name of each employee who does not work for “BigBank”.  *Figure 2.17 — Employee database* (primary keys underlined):  - employee (ID, person_name, street, city) - works (ID, company_name, salary) - company (company_name, city)<br>PE 2.8a — ID và tên mỗi nhân viên không làm cho BigBank (kể cả người không có trong works). Viết theo đúng cấu trúc đại số: tất cả trừ (`except`) những người làm cho BigBank. |
| GK1.13 | PE 2.8b rename | ★★★ | Exercise 2.8 (b). Consider the employee database of Figure 2.17. Give an expression in the relational algebra to express each of the following queries:  b. Find the ID and name of each employee who earns at least as much as every employee in the database.  *Figure 2.17 — Employee database* (primary keys underlined):  - employee (ID, person_name, street, city) - works (ID, company_name, salary) - company (company_name, city)<br>PE 2.8b — ID và tên mỗi nhân viên có lương ít nhất bằng mọi nhân viên. Viết theo cấu trúc đại số: (người có lương) trừ (người mà có ai đó lương cao hơn — dùng hai bí danh A, B của `employee natural join works`). Không dùng `max`. |
| GK1.14 | PE 2.9a division | ★★★ | Exercise 2.9 (a). The division operator of relational algebra, “÷”, is defined as follows. Let r(R) and s(S) be relations, and let S ⊆ R; that is, every attribute of schema S is also in schema R. Given a tuple t, let t[S] denote the projection of tuple t on the attributes in S. Then r ÷ s is a relation on schema R − S (that is, on the schema containing all attributes of schema R that are not in schema S). A tuple t is in r ÷ s if and only if both of two conditions hold:  - t is in Π[R−S](r) - For every tuple t[s] in s, there is a tuple t[r] in r satisfying both of the following:   - t[r][S] = t[s][S]   - t[r][R − S] = t  Given the above definition:  a. Write a relational algebra expression using the division operator to find the IDs of all students who have taken all Comp. Sci. courses. (Hint: project *takes* to just ID and *course_id*, and generate the set of all Comp. Sci. *course_id*s using a select expression, before doing the division.)<br>PE 2.9a (biến thể) — ID các sinh viên đã học tất cả course của khoa Physics: Π[ID,course_id](takes) ÷ Π[course_id](σ[dept_name="Physics"](course)). (Với Comp. Sci. như trong sách, kết quả trên dữ liệu mẫu là rỗng.) Dùng `not exists (... except ...)`. |
| GK1.15 | PE 2.9b division by formula | ★★★ | Exercise 2.9. The division operator of relational algebra, “÷”, is defined as follows. Let r(R) and s(S) be relations, and let S ⊆ R; that is, every attribute of schema S is also in schema R. Given a tuple t, let t[S] denote the projection of tuple t on the attributes in S. Then r ÷ s is a relation on schema R − S (that is, on the schema containing all attributes of schema R that are not in schema S). A tuple t is in r ÷ s if and only if both of two conditions hold:  - t is in Π[R−S](r) - For every tuple t[s] in s, there is a tuple t[r] in r satisfying both of the following:   - t[r][S] = t[s][S]   - t[r][R − S] = t  Given the above definition:  a. Write a relational algebra expression using the division operator to find the IDs of all students who have taken all Comp. Sci. courses. (Hint: project *takes* to just ID and *course_id*, and generate the set of all Comp. Sci. *course_id*s using a select expression, before doing the division.)  b. Show how to write the above query in relational algebra, without using division. (By doing so, you would have shown how to define the division operation using the other relational algebra operations.)<br>PE 2.9b — Viết phép chia bằng công thức Π[ID](r) − Π[ID]((Π[ID](r) × s) − r) với r = Π[ID,course_id](takes) và s = các course mà sinh viên `00128` (Zhang) đã học. Kết quả: ID các sinh viên đã học mọi course của Zhang. |
| GK1.16 | PE 2.9 division check | ★★☆ | Exercise 2.9. The division operator of relational algebra, “÷”, is defined as follows. Let r(R) and s(S) be relations, and let S ⊆ R; that is, every attribute of schema S is also in schema R. Given a tuple t, let t[S] denote the projection of tuple t on the attributes in S. Then r ÷ s is a relation on schema R − S (that is, on the schema containing all attributes of schema R that are not in schema S). A tuple t is in r ÷ s if and only if both of two conditions hold:  - t is in Π[R−S](r) - For every tuple t[s] in s, there is a tuple t[r] in r satisfying both of the following:   - t[r][S] = t[s][S]   - t[r][R − S] = t  Given the above definition:  a. Write a relational algebra expression using the division operator to find the IDs of all students who have taken all Comp. Sci. courses. (Hint: project *takes* to just ID and *course_id*, and generate the set of all Comp. Sci. *course_id*s using a select expression, before doing the division.)  b. Show how to write the above query in relational algebra, without using division. (By doing so, you would have shown how to define the division operation using the other relational algebra operations.)<br>PE 2.9 (kiểm tra lại) — Cùng truy vấn với GK1.15 nhưng viết bằng `group by ... having count(distinct course_id) = (select count(*) ...)`: ID các sinh viên đã học mọi course mà `00128` đã học. |

## 3. Ghi nhớ nhanh

### Cách dùng phần này
Đề giữa kỳ chủ yếu lấy từ **Practice Exercises** của sách. Phần này đi qua **toàn bộ** Practice Exercises (PE) Chương 1 và 2, đánh số đúng như sách. Câu lý thuyết nằm ở bước *Tự luận lý thuyết* (có đề gốc tiếng Anh); câu đại số quan hệ có **cả** đáp án đại số (tự luận) **và** bài SQL tương đương chạy trên dữ liệu mẫu (Employee database, Bank database, University).

| PE | Nội dung | Tự luận | Bài SQL |
|---|---|---|---|
| 1.1 | Hai nhược điểm của DBMS | Câu 1 | — |
| 1.2 | 5 điểm khác nhau giữa type declaration (Java/C++) và DDL | Câu 2 | — |
| 1.3 | 6 bước xây dựng database cho một doanh nghiệp | Câu 3 | — |
| 1.4 | Video site kiểu YouTube vs file-processing system | Câu 4 | — |
| 1.5 | Keyword query (web search) vs database query | Câu 5 | — |
| 2.1 | Primary key của Employee database | Câu 6 | GK1.01 |
| 2.2 | Insert/delete vi phạm foreign key | Câu 7 | GK1.02 |
| 2.3 | Vì sao day, start_time thuộc khoá của time_slot, end_time thì không | Câu 8 | GK1.03 |
| 2.4 | name có là superkey của instructor không? | Câu 9 | GK1.04 |
| 2.5 | σ<sub>s_id=ID</sub>(student × advisor) | Câu 10 | GK1.05, GK1.06 |
| 2.6 a–c | Đại số quan hệ trên Employee database | Câu 11 | GK1.07–GK1.09 |
| 2.7 a–b | Đại số quan hệ trên Bank database | Câu 12 | GK1.10–GK1.11 |
| 2.8 a–b | Set difference, rename | Câu 13 | GK1.12–GK1.13 |
| 2.9 a–b | Phép chia (division) | Câu 14 | GK1.14–GK1.16 |

### Chương 1 — ý chính hay thi
- **Nhược điểm của file-processing system** (Section 1.2): data redundancy & inconsistency, difficulty in accessing data, data isolation, integrity problems, atomicity problems, concurrent-access anomalies, security problems. PE 1.4 bắt bạn đánh giá *từng* điểm cho một ứng dụng cụ thể.
- **Nhược điểm của DBMS** (PE 1.1): tốn chi phí/kiến thức/thời gian cài đặt; độ phức tạp có thể làm hiệu năng kém (với ứng dụng đơn giản).
- **DDL ≠ type declaration** (PE 1.2): DDL *tạo object thật* trong database, khai báo được **constraint** (domain, referential integrity), có **authorization**; hệ kiểu của ngôn ngữ lập trình *giàu hơn* nhưng chỉ là trừu tượng trong chương trình.
- **Database query vs keyword query** (PE 1.5): SQL có cú pháp chặt, diễn đạt truy vấn phức tạp, **kết quả luôn là một bảng**; web search nhận danh sách từ khoá, trả về danh sách URL **xếp hạng** kèm snippet.

### Chương 2 — keys
| Khái niệm | Định nghĩa | Bẫy hay gặp |
|---|---|---|
| Superkey | K xác định duy nhất mỗi tuple | Mọi tập chứa superkey cũng là superkey |
| Candidate key | Superkey tối thiểu | {A, B} chứa key {A} thì **không** là candidate key |
| Primary key | Candidate key được chọn | Không suy ra từ **một instance** (PE 2.4) |
| Foreign key | Giá trị phải có ở relation được tham chiếu | Vi phạm khi **insert** vào referencing hoặc **delete** ở referenced (PE 2.2) |

Key là ràng buộc trên **schema** (mọi instance hợp lệ), không phải nhận xét về dữ liệu hiện tại.

### Chương 2 — relational algebra ↔ SQL
| Đại số | SQL |
|---|---|
| σ<sub>p</sub>(r) | `select * from r where p` |
| Π<sub>A,B</sub>(r) | `select distinct A, B from r` (đại số **loại trùng**) |
| r × s | `from r, s` |
| r ⋈<sub>θ</sub> s | `from r join s on θ` |
| r ∪ s, r − s, r ∩ s | `union`, `except`, `intersect` |
| ρ<sub>A</sub>(r) | `from r as A` |
| r ÷ s | *không có trong SQL* → `not exists (... except ...)` |

### Phép chia (PE 2.9)
r(R) ÷ s(S), S ⊆ R: các tuple t trên R − S sao cho **với mọi** t<sub>s</sub> ∈ s, (t, t<sub>s</sub>) ∈ r.

r ÷ s = Π<sub>R−S</sub>(r) − Π<sub>R−S</sub>((Π<sub>R−S</sub>(r) × s) − Π<sub>R−S,S</sub>(r))

Đọc: lấy mọi ứng viên, ghép với **mọi** phần tử của s, trừ đi những cặp thật sự có trong r → còn lại các cặp *thiếu*; ứng viên nào có cặp thiếu thì bị loại.

### Bẫy thường gặp
- Dùng σ cho "**mọi**" (every employee, all courses) — phải dùng **set difference** hoặc **division**.
- Quên **rename** khi so sánh relation với chính nó (PE 2.8b: ρ<sub>A</sub>, ρ<sub>B</sub>).
- PE 2.6b/2.8b: salary nằm ở **works**, không phải employee → phải join. (Lời giải trong sách của 2.8b viết A.salary trên employee — xem Câu 13.)
- σ trên × chỉ giữ những cặp khớp: sinh viên **không có** advisor biến mất khỏi kết quả (PE 2.5).
