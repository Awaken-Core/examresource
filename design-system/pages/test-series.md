# Test Series & CBT Interface Design Rules

## Structure
1. **Catalog View (`/test-series`)**:
   - Card grid listing active test series packages.
   - Highlights total tests, syllabus coverage, and attempt status.
2. **CBT Exam Engine (`/test-series/[id]/attempt`)**:
   - High-fidelity NTA / TCS iON examination interface simulation.
   - Left side: Question navigation palette, subject tabs, question timer.
   - Main panel: Bilingual question text, mathematical formulae (KaTeX), multiple-choice options.
   - Color coding: Answered (Green), Not Answered (Red), Marked for Review (Purple), Not Visited (Gray).

