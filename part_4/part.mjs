// Cấu hình Part 4 — ôn thi cuối kỳ (tuần 15: Chương 6–7, kèm SQL nền tảng).
export default {
  number: 4,
  title: 'Part 4 — Ôn tập cuối kỳ',
  subtitle: 'Chương 6–7 theo Practice Exercises của sách, ôn lại SQL nền tảng + đề thi thử',
  lead: 'Thi cuối kỳ ở tuần 15, trọng tâm Chương 6 (E-R) và Chương 7 (Normalization). Đề chủ yếu lấy từ Practice Exercises của sách, nên hai phần đầu đi qua TOÀN BỘ Practice Exercises 6.1–6.13 và 7.1–7.20 (đánh số đúng như sách). Phần 3 ôn nhanh SQL và đại số quan hệ phòng khi đề có câu tổng hợp. Phần cuối là đề thi thử.',
  weeks: 'Tuần 13–15',
  storage: 'cs4420p4',
  unit: 'Phần',
  fdTool: true,
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'practice_datasets.sql', 'er_tables.sql', 'normalization_tables.sql', 'final_tables.sql'],
  chapters: ['ck1', 'ck2', 'ck3', 'ck4'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Bảng cho Chương 6–7 và đề thi thử', tables: [], prefix: ['er_', 'nf_', 'fr_'] },
    { title: 'Employee / Bank / Insurance (Practice Exercises chương 2–4)', tables: ['employee', 'works', 'company', 'manages', 'branch', 'customer', 'loan', 'borrower', 'account', 'depositor', 'person', 'car', 'accident', 'owns', 'participated'] },
    { title: 'Bảng phụ khác' },
  ],
};
