-- Dữ liệu bổ sung cho "Đề mẫu · 20 truy vấn" (midterm/content/gk7.mjs).
-- Dữ liệu mẫu của sách chỉ có năm 2017–2018, còn đề hỏi Fall 2025 / "mọi học kỳ năm 2025".
-- File này chỉ được nạp cho các bài của đề mẫu, bên trong transaction của mỗi lần chạy
-- (chạy xong là rollback), nên không ảnh hưởng các phần khác.
insert into section values
  ('CS-101',  '1', 'Spring', 2025, 'Packard', '101',  'H'),
  ('CS-347',  '1', 'Summer', 2025, 'Taylor',  '3128', 'A'),
  ('CS-101',  '1', 'Fall',   2025, 'Packard', '101',  'H'),
  ('CS-319',  '1', 'Fall',   2025, 'Watson',  '120',  'D'),
  ('HIS-351', '1', 'Fall',   2025, 'Painter', '514',  'C');   -- chưa phân công giảng viên

insert into teaches values
  ('10101', 'CS-101', '1', 'Spring', 2025),
  ('10101', 'CS-347', '1', 'Summer', 2025),
  ('10101', 'CS-101', '1', 'Fall',   2025),
  ('22222', 'CS-101', '1', 'Fall',   2025),   -- Einstein (Physics) cùng dạy CS-101
  ('45565', 'CS-319', '1', 'Fall',   2025);

insert into takes values
  ('98765', 'CS-101', '1', 'Fall',   2025, 'B'),    -- học lại CS-101
  ('44553', 'CS-101', '1', 'Fall',   2025, 'A-'),   -- SV Physics học môn Comp. Sci.
  ('12345', 'CS-319', '1', 'Fall',   2025, 'B+'),   -- 12345 đủ mọi môn Comp. Sci.
  ('23121', 'CS-101', '1', 'Spring', 2025, 'W');    -- điểm không nằm trong thang điểm
