-- =====================================================================
-- CS4420 · Ôn CK · Phần 2 — Practice Exercises Chương 7 (Normalization) (Practice Exercises — Chapter 7)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ck2
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CK2.01  [PE 7.2 — test FD]  ★☆☆
-- Bảng `nf_r_abc(a, b, c)` là instance của PE 7.2. Trả về một dòng, 6 cột boolean theo thứ tự `a_b, a_c, b_a, b_c, c_a, c_b` cho biết mỗi FD A → B, A → C, B → A, B → C, C → A, C → B có thoả trên instance không.
-- Gợi ý: X → Y thoả ⇔ not exists (select X from r group by X having count(distinct Y) > 1)




-- @ex CK2.02  [PE 7.2 — composite FD]  ★★☆
-- Tiếp PE 7.2: trả về một dòng ba cột boolean: `ac_b` (AC → B có thoả), `ab_c` (AB → C có thoả), `ac_unique` (AC có xác định duy nhất mỗi dòng trên instance).




-- @ex CK2.03  [PE 7.9 — test FD]  ★☆☆
-- PE 7.9a: bảng `nf_pe79_r(a, b, c)`. Viết câu truy vấn trả về các giá trị b vi phạm FD B → C (kết quả rỗng ⇔ FD đúng).




-- @ex CK2.04  [PE 7.9 — enforce FD]  ★★★
-- PE 7.9b: PostgreSQL không hỗ trợ `create assertion`. Hãy ép FD B → C trên bảng `nf_pe79_clean(a, b, c)` bằng trigger (before insert or update, raise exception khi có dòng khác cùng b mà khác c).
-- Hệ thống thử chèn (4, 'x', 11) — phải bị từ chối — và (5, 'x', 10) — phải thành công.




-- @ex CK2.05  [PE 7.1 — lossless]  ★★☆
-- PE 7.1 trên dữ liệu: `nf_pe71(a, b, c, d, e)` thoả F = {A → BC, CD → E, B → D, E → A}. Phân rã thành (a, b, c) và (a, d, e). Trả về một dòng ba cột `joined_rows`, `extra`, `missing` (số tuple thừa / thiếu của join so với bảng gốc).




-- @ex CK2.06  [PE 7.6 — keys on data]  ★★☆
-- PE 7.6: candidate key là A, E, BC, CD; B không phải key. Minh hoạ trên `nf_pe71`: trả về một dòng 5 cột boolean `a, e, bc, cd, b` — mỗi tập có xác định duy nhất mỗi dòng của instance không.




-- @ex CK2.07  [PE 7.13 — lost FD]  ★★★
-- PE 7.13 trên dữ liệu: tạo `nf_pe71_r1(a primary key, b, c)` và `nf_pe71_r2(a primary key, d, e)` từ nf_pe71 (A là key của cả hai). Rồi chèn ('a5', 'b1', 'c9') vào r1 và ('a5', 'd9', 'e9') vào r2 — ràng buộc của từng bảng đều thoả.
-- (Hệ thống join hai bảng và tìm các b vi phạm B → D — FD không được bảo toàn.)




-- @ex CK2.08  [PE 7.10 — nulls]  ★★☆
-- PE 7.10: `nf_pe710(a, b, c)` với A → B, một số dòng có a là null. Phân rã thành (a, b) và (a, c). Trả về các dòng của bảng gốc bị mất sau natural join (cột a, b, c).
-- Gợi ý: select * from nf_pe710 except select a, b, c from (...) natural join (...)




-- @ex CK2.09  [PE 7.11 — PK/FK]  ★★☆
-- PE 7.11: phân rã BCNF `nf_in_dep` theo dept_name → building, budget thành `nf_dept(dept_name primary key, building, budget)` và `nf_inst(ID primary key, name, salary, dept_name)` với dept_name foreign key tham chiếu nf_dept; chép dữ liệu sang.
-- (Hệ thống thử xoá khoa Physics khỏi nf_dept và chèn giảng viên thuộc khoa 'Nowhere' — cả hai phải bị foreign key chặn, mã 23503.)




-- @ex CK2.10  [PE 7.12 — u ⊆ join]  ★★☆
-- PE 7.12 trên dữ liệu: u = `nf_r_abc`, phân rã (a, b), (b, c) — r₁, r₂ là projection (loại trùng). Trả về một dòng ba cột: `u_rows`, `joined_rows`, `missing` (số tuple của u không có trong join — phải bằng 0).




-- @ex CK2.11  [PE 7.17 — 3 BCNF decompositions]  ★★★
-- PE 7.17: `nf_pe717(a, b, c, d)` thoả A → B, C → D, B → C. Với ba phân rã {(a,b),(c,d),(b,c)}, {(a,b),(c,d),(a,c)}, {(b,c),(a,d),(a,b)}, trả về một dòng ba cột `extra1, extra2, extra3`: số tuple thừa của natural join các projection so với bảng gốc (lossless ⇒ 0).




-- @ex CK2.12  [PE 7.20 — MVD vs FD]  ★★☆
-- PE 7.20: `nf_pe720(a, b, c)`. Trả về một dòng hai cột boolean: `mvd_a_b` — A →→ B thoả trên instance (với mỗi a, các dòng là đủ mọi tổ hợp b × c); `fd_a_b` — FD A → B có thoả không.




-- @ex CK2.13  [PE 7.20 — 4NF]  ★★☆
-- Phân rã 4NF của PE 7.20: tạo `nf_pe720_ab(a, b)` và `nf_pe720_ac(a, c)` bằng `create table ... as select distinct`. (Hệ thống đếm dòng hai bảng và số tuple thừa của join so với nf_pe720.)




-- @ex CK2.14  [PE 7.3 — cardinality via FD]  ★☆☆
-- PE 7.3 trên bảng `advisor(s_ID, i_ID)` của University: trả về một dòng hai cột boolean `s_to_i` (s_ID → i_ID có thoả) và `i_to_s` (i_ID → s_ID có thoả). Kết quả cho biết quan hệ advisor là một-một hay nhiều-một?


