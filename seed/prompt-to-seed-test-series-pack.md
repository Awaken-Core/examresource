# Prompt for coding agent: Ingest the supplied Test Series Seed Pack

Use the attached `govtpariksha-test-series-seed-pack.json` as the canonical source of all demo content, and `govtpariksha-test-series-seed-pack.md` as its human-readable reference.

Update the existing `apps/server/scripts/seed-test-series.mjs` script (and only the minimum related files) so the current seed command inserts or safely updates this data in the verified local development MongoDB database named `govtpariksha`.

Requirements:
- Inspect the actual current Mongoose schemas and adapt the JSON manifest to them; do not blindly insert unknown fixture fields.
- Preserve the existing seed script and seed-managed records where possible. Do not delete unrelated records, clear collections, or reset the database.
- Ensure exactly five series from this pack have coherent demo hierarchy: three subjects per series, an exam-specific chapter per assigned subject, six published individual tests per series (two Subject-wise, two Chapter-wise, two Full Tests), and three sections per Full Test.
- The pack includes original questions with exact answer keys, explanations, English/Hindi strings, question mappings, and test configuration. Keep option IDs/correctness consistent and preserve exact numerical answer matching.
- Since subjects and questions are shared, upsert them globally and create distinct TestSeriesSubject, Chapter, and QuestionMapping relationships per series. Resolve references with stable slugs/seed keys.
- Ensure every test/section references eligible mapped questions, has the declared question count, and has consistent snapshots according to the existing publish workflow. For fixed tests, persist the fixed selected question set. For random-per-attempt tests, preserve the intended eligible question pool configuration supported by the live schema/service.
- Keep the existing sixth series (such as RRB Group D) and any other unrelated records intact; do not delete them. It is acceptable to leave their previous seed content in place, but report exact final counts.
- Use a deterministic, idempotent strategy. Do not overwrite manually edited non-seed data. Do not run against production. Do not print secrets/connection strings. If the target database cannot be verified as the local dev database, stop before writing.
- Run the seed command twice, verify record counts remain stable, run type checks/build/tests relevant to the script, and query public APIs. Report per-series subject/chapter/test counts and any mapping or schema mismatches.
- Do not modify the frontend UI in this task.
