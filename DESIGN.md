# Interface design

The assessment uses a minimalist application interface with one consistent visual language across registration, questions, admin login, results and answer review.

- White surfaces on a very light cool background; borders define form and question surfaces without shadows.
- One blue accent (`#3457ce`) for primary actions, selected answers and progress; green and red are reserved for result states.
- A system sans-serif for headings, controls and data. Tabular numerals are used for the timer and scores.
- Shared wordmark in `components/Brand.tsx`. No admin links on student pages.
- Registration: task explanation and instructions beside a compact details form on desktop, one column on mobile.
- Assessment: a readable central column, persistent question position, remaining time, full-width answer choices, and Previous/Next/Submit controls. Native dialog provides submission confirmation and keyboard focus.
- Admin: flat summary, compact scrollable results table, and question-by-question review separated by simple rules.
- Responsive breakpoints: 960, 740 and 520 pixels. Input font sizes stay at 16px. No decorative animation, external fonts or UI dependencies.
- Application behavior, answer locking, question bank, scoring and PostgreSQL APIs remain unchanged.
