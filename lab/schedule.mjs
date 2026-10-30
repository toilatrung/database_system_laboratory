// Lịch học & kế hoạch thi CS4420 — dùng để sinh trang tổng (index.html).
// `links`: [part, chapter key] để trang tổng gắn liên kết tới đúng phần luyện tập.
export default [
  { week: 1, content: 'Introduction, Relational Model (first 2 operators)', links: [[1, 'ch1'], [1, 'ch2']] },
  { week: 2, content: 'Relational Model (last 4 operators)', links: [[1, 'ch2']] },
  { week: 3, content: 'Introduction to SQL — tới slide 25 & Practice', links: [[1, 'ch3']] },
  { week: 4, content: 'Introduction to SQL — slide 25–47 & Practice', links: [[1, 'ch3']] },
  { week: 5, content: 'Introduction to SQL — slide 48–62 & Practice', note: 'Project Announcement', links: [[1, 'ch3']] },
  { week: 6, content: 'Intermediate SQL', links: [[1, 'ch4']] },
  { week: 7, content: 'Intermediate SQL', note: 'Bắt đầu ôn giữa kỳ', links: [[1, 'ch4'], [3, 'gk1']] },
  { week: 8, content: 'Midterm', exam: 'midterm', note: 'Chương 1–4', links: [[3, 'gk1'], [3, 'gk2'], [3, 'gk3'], [3, 'gk4']] },
  { week: 9, content: 'ER design — Chapter 6, tới slide 43', links: [[2, 'ch6']] },
  { week: 10, content: 'ER design — Chapter 6, slide 44–73', links: [[2, 'ch6']] },
  { week: 11, content: 'Normalization — Chapter 7, tới slide 21', links: [[2, 'ch7']] },
  { week: 12, content: 'Normalization — Chapter 7, slide 21–35', links: [[2, 'ch7']] },
  { week: 13, content: 'Team Project Presentation', note: 'Song song: ôn cuối kỳ', links: [[4, 'ck1'], [4, 'ck2']] },
  { week: 14, content: 'Team Project Presentation', note: 'Song song: ôn cuối kỳ', links: [[4, 'ck3']] },
  { week: 15, content: 'Final Exam', exam: 'final', note: 'Chương 6–7 (+ SQL nền tảng)', links: [[4, 'ck1'], [4, 'ck2'], [4, 'ck3'], [4, 'ck4']] },
];
