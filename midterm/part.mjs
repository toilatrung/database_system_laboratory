// Cấu hình mục Ôn thi giữa kỳ (tuần 8: Chương 1–4).
export default {
  group: 'exam',
  label: 'Ôn giữa kỳ',
  number: null,
  order: 1,
  title: 'Ôn tập giữa kỳ',
  subtitle: 'Chương 1–4: đề nguyên bản, biến tấu và đề mẫu 20 truy vấn',
  lead: 'Thi giữa kỳ ở tuần 8, phạm vi Chương 1–4. Đề thi không có trắc nghiệm: gồm tự luận lý thuyết và viết SQL. Mỗi phần có câu lý thuyết để tự viết ra giấy và câu SQL để chạy, chấm trên dữ liệu mẫu: đề nguyên bản từ bài tập của bạn, các biến tấu của chúng, và đề mẫu 20 truy vấn trên University database (có popup Database để xem bảng và chạy thử truy vấn).',
  weeks: 'Tuần 7–8',
  storage: 'cs4420p3',
  unit: 'Phần',
  // Exam format: no multiple choice. Essays and SQL first, the cheat sheet last.
  steps: ['questions', 'ex', 'summary'],
  stepLabels: { questions: 'Tự luận lý thuyết', ex: 'Bài tập SQL', summary: 'Ghi nhớ nhanh' },
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'practice_datasets.sql'],
  chapters: ['gk5', 'gk6', 'gk7'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Employee database (Figure 2.17, 3.19, 4.12)', tables: ['employee', 'works', 'company', 'manages'] },
    { title: 'Bank database (Figure 2.18, 3.18)', tables: ['branch', 'customer', 'loan', 'borrower', 'account', 'depositor'] },
    { title: 'Insurance database (Figure 3.17)', tables: ['person', 'car', 'accident', 'owns', 'participated'] },
    { title: 'Bảng khác (marks, grade_points, bảng phụ)' },
  ],
};
