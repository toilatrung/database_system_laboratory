// Cấu hình mục Ôn thi giữa kỳ (tuần 8: Chương 1–4).
export default {
  group: 'exam',
  label: 'Ôn giữa kỳ',
  number: null,
  order: 1,
  title: 'Ôn tập giữa kỳ',
  subtitle: 'Chương 1–4 theo Practice Exercises của sách + đề thi thử',
  lead: 'Thi giữa kỳ ở tuần 8, phạm vi Chương 1–4. Đề thi không có trắc nghiệm: gồm tự luận lý thuyết và viết SQL, chủ yếu lấy từ Practice Exercises của sách. Vì vậy mỗi phần ở đây đi qua toàn bộ Practice Exercises của chương: câu lý thuyết (kèm đề gốc tiếng Anh) để tự viết ra giấy, câu SQL để chạy và chấm trên dữ liệu mẫu. Phần cuối là đề thi thử 90 phút.',
  weeks: 'Tuần 7–8',
  storage: 'cs4420p3',
  unit: 'Phần',
  // Exam format: no multiple choice. Essays and SQL first, the cheat sheet last.
  steps: ['questions', 'ex', 'summary'],
  stepLabels: { questions: 'Tự luận lý thuyết', ex: 'Bài tập SQL', summary: 'Ghi nhớ nhanh' },
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'practice_datasets.sql'],
  chapters: ['gk1', 'gk2', 'gk3', 'gk4'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Employee database (Figure 2.17, 3.19, 4.12)', tables: ['employee', 'works', 'company', 'manages'] },
    { title: 'Bank database (Figure 2.18, 3.18)', tables: ['branch', 'customer', 'loan', 'borrower', 'account', 'depositor'] },
    { title: 'Insurance database (Figure 3.17)', tables: ['person', 'car', 'accident', 'owns', 'participated'] },
    { title: 'Bảng khác (marks, grade_points, Exercise 4.10, bảng phụ)' },
  ],
};
