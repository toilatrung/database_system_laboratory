// Cấu hình Part 1 — đọc bởi lab/tools (build, verify, grade, sql).
export default {
  number: 1,
  title: 'Part 1 — Chương 1 đến 5',
  subtitle: 'Introduction · Relational Model · SQL (cơ bản, trung cấp, nâng cao)',
  lead: 'Mỗi chương gồm tóm tắt kiến thức, trắc nghiệm, câu hỏi tự luận và bài tập SQL tự chấm. Mọi câu SQL chạy trên PostgreSQL thật ngay trong trình duyệt, với University database của sách.',
  weeks: 'Tuần 1–7',
  storage: 'cs4420p1',
  unit: 'Chương',
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql'],
  chapters: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Bảng phụ cho bài tập chương 3–5' },
  ],
};
