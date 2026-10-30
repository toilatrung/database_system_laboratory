// Cấu hình Part 3 — đọc bởi lab/tools (build, verify, grade, sql).
export default {
  number: 3,
  title: 'Part 3 — Chương 8 và 9',
  subtitle: 'Kiểu dữ liệu phức tạp (JSON, mảng, kiểu đối tượng, RDF, văn bản, không gian) · Phát triển ứng dụng',
  lead: 'Chương 8 mở rộng mô hình quan hệ cho dữ liệu bán cấu trúc (JSON, XML), kiểu do người dùng định nghĩa, kế thừa, RDF, truy vấn văn bản và dữ liệu không gian. Chương 9 nhìn CSDL từ phía ứng dụng web: cách ứng dụng gửi SQL, phân trang, cache, giao dịch cho mỗi request, và bảo mật (SQL injection, phân quyền, mật khẩu, mã hoá). Bài SQL chạy trên PostgreSQL thật: jsonb, mảng, composite type, kiểu hình học thay cho PostGIS, prepared statement, upsert, row-level security.',
  weeks: 'Ngoài lịch học',
  storage: 'cs4420part3',
  unit: 'Chương',
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'practice_datasets.sql', 'p3_complex.sql', 'p3_app.sql'],
  chapters: ['ch8', 'ch9'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Bảng cho bài tập Chương 8 (Complex Data Types)', tables: [], prefix: 'cx_' },
    { title: 'Bảng cho bài tập Chương 9 (Application Development)', tables: [], prefix: 'app_' },
    { title: 'Employee database (Figure 8.8 / Practice Exercises chương 2–4)', tables: ['employee', 'works', 'company', 'manages'] },
    { title: 'Bảng phụ khác' },
  ],
};
