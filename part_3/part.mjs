// Cấu hình Part 3 — ôn thi giữa kỳ (tuần 8: Chương 1–4).
export default {
  number: 3,
  title: 'Part 3 — Ôn tập giữa kỳ',
  subtitle: 'Chương 1–4 theo Practice Exercises của sách + đề thi thử',
  lead: 'Thi giữa kỳ ở tuần 8, phạm vi Chương 1–4 (Introduction, Relational Model, Intro SQL, Intermediate SQL). Đề chủ yếu lấy từ Practice Exercises của sách, nên mỗi phần dưới đây đi qua TOÀN BỘ Practice Exercises của từng chương (đánh số đúng như sách) và chạy được trên dữ liệu mẫu. Phần cuối là đề thi thử có giới hạn thời gian.',
  weeks: 'Tuần 7–8',
  storage: 'cs4420p3',
  unit: 'Phần',
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
