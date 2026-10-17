import 'dotenv/config';
import pg from 'pg';

const AUTHOR_ID = 'b5927845-6b44-4cd6-97d7-0e1898fae4ab';
const CATEGORY_ID = 'd602a6ab-8898-4e86-ad6f-f4b73a44f9a4';
const SLUG = 'rrb-ntpc-10-2-ug-recruitment-2026';

const blocks = [
  {
    type: 'PARAGRAPH',
    value:
      'The Railway Recruitment Board (RRB) has opened online applications for <strong>Non-Technical Popular Categories (NTPC) 10+2 Undergraduate Level</strong> posts under <strong>CEN 07/2026</strong>. This drive covers <strong>1,688 vacancies</strong>. The form opened on <strong>15 October 2026</strong>, and the last date to apply is <strong>13 November 2026</strong>.',
  },
  {
    type: 'PARAGRAPH',
    value:
      'Confirm every date, fee, age limit, and eligibility rule on the <a href="https://rrb.indianrailways.gov.in/" target="_blank" rel="noopener noreferrer">RRB official website</a> and in the official notification before you submit the form.',
  },
  { type: 'HEADING_2', value: 'Key highlights' },
  {
    type: 'TABLE',
    value: `<thead><tr><th>Detail</th><th>Information</th></tr></thead><tbody>
<tr><td>Organization</td><td>Railway Recruitment Board (RRB)</td></tr>
<tr><td>Recruitment</td><td>NTPC 10+2 Undergraduate (Inter Level)</td></tr>
<tr><td>Advertisement</td><td>CEN 07/2026</td></tr>
<tr><td>Total posts</td><td>1,688</td></tr>
<tr><td>Apply from</td><td>15 October 2026</td></tr>
<tr><td>Apply until</td><td>13 November 2026</td></tr>
<tr><td>Fee payment until</td><td>15 November 2026</td></tr>
<tr><td>Age as on</td><td>1 January 2027</td></tr>
<tr><td>Selection</td><td>CBT-1, CBT-2, skill or typing test, document verification, medical examination</td></tr>
<tr><td>Official website</td><td><a href="https://rrb.indianrailways.gov.in/" target="_blank" rel="noopener noreferrer">rrb.indianrailways.gov.in</a></td></tr>
</tbody>`,
  },
  {
    type: 'PARAGRAPH',
    value:
      'The exam date, city intimation, admit card, and result will be announced later. City details are expected about <strong>10 days</strong> before the exam, and the admit card about <strong>4 days</strong> before the exam.',
  },
  { type: 'HEADING_2', value: 'Vacancy details' },
  {
    type: 'PARAGRAPH',
    value: 'Category-wise vacancies for NTPC 10+2 Undergraduate Level posts:',
  },
  {
    type: 'TABLE',
    value: `<thead><tr><th>Category</th><th>Posts</th></tr></thead><tbody>
<tr><td>General</td><td>686</td></tr>
<tr><td>EWS</td><td>163</td></tr>
<tr><td>OBC</td><td>414</td></tr>
<tr><td>SC</td><td>258</td></tr>
<tr><td>ST</td><td>167</td></tr>
<tr><td><strong>Total</strong></td><td><strong>1,688</strong></td></tr>
</tbody>`,
  },
  {
    type: 'PARAGRAPH',
    value:
      'Zone-wise distribution is published in the official notification. Check that table before choosing a zone, because the post and category you select cannot always be changed later.',
  },
  { type: 'HEADING_2', value: 'Eligibility' },
  {
    type: 'PARAGRAPH',
    value:
      'The minimum qualification is a <strong>10+2 (Intermediate)</strong> examination from a recognized board in India.',
  },
  {
    type: 'TABLE',
    value: `<thead><tr><th>Post</th><th>Education</th><th>Marks</th><th>Extra requirement</th></tr></thead><tbody>
<tr><td>Commercial Cum Ticket Clerk</td><td>10+2 from a recognized board</td><td>General, OBC, and EWS: 50%. SC, ST, and PH: pass</td><td>As stated in the notification</td></tr>
<tr><td>Train Clerk</td><td>10+2 from a recognized board</td><td>General, OBC, and EWS: 50%. SC, ST, and PH: pass</td><td>As stated in the notification</td></tr>
<tr><td>Accounts Clerk Cum Typist</td><td>10+2 from a recognized board</td><td>General, OBC, and EWS: 50%. SC, ST, and PH: pass</td><td>Computer typing: English 30 WPM or Hindi 25 WPM</td></tr>
<tr><td>Junior Clerk Cum Typist</td><td>10+2 from a recognized board</td><td>General, OBC, and EWS: 50%. SC, ST, and PH: pass</td><td>Computer typing: English 30 WPM or Hindi 25 WPM</td></tr>
</tbody>`,
  },
  {
    type: 'PARAGRAPH',
    value:
      'Read the post-wise eligibility in CEN 07/2026 before you apply. Typing speed and skill-test rules apply only to the posts named in the notification.',
  },
  { type: 'HEADING_2', value: 'Age limit' },
  {
    type: 'PARAGRAPH',
    value: 'Age is counted as on <strong>1 January 2027</strong>.',
  },
  {
    type: 'BULLET_LIST',
    value: '<li><strong>Minimum age:</strong> 18 years</li><li><strong>Maximum age:</strong> 30 years</li>',
    metadata: { bullet: 'disc' },
  },
  {
    type: 'PARAGRAPH',
    value:
      'RRB allows age relaxation for eligible categories under its rules. The exact relaxation for SC, ST, OBC, PwBD, ex-servicemen, and other categories is given only in the official notification. Use that table when you check whether you qualify.',
  },
  { type: 'HEADING_2', value: 'Application fee' },
  {
    type: 'TABLE',
    value: `<thead><tr><th>Category</th><th>Fee</th></tr></thead><tbody>
<tr><td>General, OBC, and EWS</td><td>₹500</td></tr>
<tr><td>SC, ST, and EBC</td><td>₹250</td></tr>
<tr><td>Women of all categories</td><td>₹250</td></tr>
</tbody>`,
  },
  {
    type: 'PARAGRAPH',
    value: 'After you appear in the Stage I exam, part of the fee is refunded to the bank account given in the application:',
  },
  {
    type: 'BULLET_LIST',
    value:
      '<li><strong>General and OBC:</strong> ₹400 refunded</li><li><strong>Other candidates:</strong> ₹250 refunded</li>',
    metadata: { bullet: 'disc' },
  },
  {
    type: 'PARAGRAPH',
    value:
      'Pay online by debit card, credit card, internet banking, IMPS, cash card, or mobile wallet. The last date for fee payment is <strong>15 November 2026</strong>, two days after the application deadline.',
  },
  { type: 'HEADING_2', value: 'How to apply' },
  {
    type: 'NUMBERED_LIST',
    value: `<li>Read CEN 07/2026 on the <a href="https://rrb.indianrailways.gov.in/" target="_blank" rel="noopener noreferrer">RRB website</a> and note the last date, age limit, education, and post you are eligible for.</li>
<li>Open the online application link for CEN 07/2026 from the official portal.</li>
<li>Register with a valid mobile number and email address, then fill in personal, education, and category details.</li>
<li>Upload the documents and photograph in the size and format given in the notice.</li>
<li>Pay the fee and save the confirmation page and payment receipt.</li>
<li>Submit the form on or before <strong>13 November 2026</strong>.</li>`,
  },
  {
    type: 'PARAGRAPH',
    value:
      'Do not rely on a third-party summary for the final check. If a date, fee, or eligibility line on this page differs from the PDF, follow the official notification.',
  },
  { type: 'HEADING_2', value: 'Selection process' },
  {
    type: 'NUMBERED_LIST',
    value: `<li>Computer Based Test (CBT-1)</li>
<li>Computer Based Test (CBT-2)</li>
<li>Skill test, typing test, or aptitude test, as required for the post</li>
<li>Document verification</li>
<li>Medical examination</li>`,
  },
  {
    type: 'PARAGRAPH',
    value:
      'Clearing one stage does not guarantee appointment. You must meet the medical standard and produce original documents at verification.',
  },
  { type: 'HEADING_2', value: 'Frequently asked questions' },
  { type: 'HEADING_3', value: 'When did the RRB NTPC 10+2 UG application start?' },
  { type: 'PARAGRAPH', value: 'The online application opened on <strong>15 October 2026</strong>.' },
  { type: 'HEADING_3', value: 'What is the last date to apply?' },
  {
    type: 'PARAGRAPH',
    value:
      'The last date to submit the online form is <strong>13 November 2026</strong>. The last date to pay the fee is <strong>15 November 2026</strong>.',
  },
  { type: 'HEADING_3', value: 'What is the age limit?' },
  {
    type: 'PARAGRAPH',
    value:
      'The minimum age is <strong>18 years</strong> and the maximum age is <strong>30 years</strong> as on <strong>1 January 2027</strong>, before category-wise relaxation.',
  },
  { type: 'HEADING_3', value: 'What is the educational qualification?' },
  {
    type: 'PARAGRAPH',
    value:
      'You need a <strong>10+2</strong> pass from a recognized board. General, OBC, and EWS candidates need <strong>50% marks</strong>. SC, ST, and PH candidates need a pass. Typist posts also require computer typing at <strong>English 30 WPM</strong> or <strong>Hindi 25 WPM</strong>.',
  },
  { type: 'HEADING_3', value: 'Where should I apply?' },
  {
    type: 'PARAGRAPH',
    value:
      'Apply only through the <a href="https://rrb.indianrailways.gov.in/" target="_blank" rel="noopener noreferrer">Railway Recruitment Board official website</a>.',
  },
  { type: 'HEADING_2', value: 'Official source' },
  {
    type: 'BULLET_LIST',
    value:
      '<li>Advertisement: <strong>CEN 07/2026</strong></li><li>Portal: <a href="https://rrb.indianrailways.gov.in/" target="_blank" rel="noopener noreferrer">https://rrb.indianrailways.gov.in/</a></li>',
    metadata: { bullet: 'disc' },
  },
  {
    type: 'PARAGRAPH',
    value:
      'This page is a summary for candidates. It is not the legal notice. Check the official notification for vacancy tables, age relaxation, the syllabus, and the application link.',
  },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query('BEGIN');
  const existing = await client.query('select id from blog where slug = $1', [SLUG]);
  if (existing.rowCount) {
    await client.query('delete from blog where id = $1', [existing.rows[0].id]);
  }

  const inserted = await client.query(
    `insert into blog (
      title, slug, description, status, "publishedAt", "authorId", "categoryId",
      "metaTitle", "metaDescription", "canonicalUrl", "noindex", version
    ) values ($1,$2,$3,'PUBLISHED', now(), $4, $5, $6, $7, $8, false, 1)
    returning id`,
    [
      'RRB NTPC 10+2 UG Recruitment 2026',
      SLUG,
      'RRB has opened CEN 07/2026 for 1,688 NTPC 10+2 undergraduate posts. Apply from 15 October 2026 to 13 November 2026.',
      AUTHOR_ID,
      CATEGORY_ID,
      'RRB NTPC 10+2 UG Recruitment 2026: Dates, Vacancies, and Eligibility',
      'RRB NTPC 10+2 UG CEN 07/2026 covers 1,688 posts. Apply online from 15 October 2026 until 13 November 2026. Check age, fee, and eligibility.',
      `${process.env.CLIENT_URL.replace(/\/$/, '')}/rrb-ntpc-10-2-ug-recruitment-2026`,
    ],
  );

  const blogId = inserted.rows[0].id;
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    await client.query(
      `insert into blog_block ("blogId", type, value, position, metadata)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [blogId, block.type, block.value, i, JSON.stringify(block.metadata ?? null)],
    );
  }
  await client.query('COMMIT');
  console.log(`published ${SLUG} (${blogId}) with ${blocks.length} blocks`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
