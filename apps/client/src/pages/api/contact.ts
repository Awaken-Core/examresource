import type { APIRoute } from 'astro';
import { contactEmail } from '../../data/site';

export const prerender = false;

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  testDetails?: string;
  message: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: ContactPayload = await request.json();
    const { name, email, subject, testDetails, message } = data;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please fill in all required fields (Name, Email, and Message).',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide a valid email address.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const recipientEmail =
      import.meta.env.CONTACT_RECEIVER_EMAIL ||
      process.env.CONTACT_RECEIVER_EMAIL ||
      contactEmail;

    const emailSubject = `[GovtPariksha Inquiry] ${subject || 'Contact Form'}: ${name.trim()}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; overflow: hidden; }
            .header { background: #131316; color: #ffffff; padding: 24px; }
            .header h2 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; }
            .badge { display: inline-block; background: rgba(50, 124, 246, 0.2); color: #327CF6; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-top: 8px; }
            .body { padding: 24px; line-height: 1.6; }
            .field { margin-bottom: 16px; }
            .label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #71717a; margin-bottom: 4px; }
            .value { font-size: 15px; color: #09090b; }
            .message-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; white-space: pre-wrap; font-size: 14px; color: #27272a; margin-top: 8px; }
            .footer { padding: 16px 24px; background: #fafafa; border-top: 1px solid #e4e4e7; font-size: 12px; color: #a1a1aa; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Inquiry on GovtPariksha</h2>
              <div class="badge">${escapeHtml(subject || 'General Inquiry')}</div>
            </div>
            <div class="body">
              <div class="field">
                <div class="label">Sender Name</div>
                <div class="value"><strong>${escapeHtml(name)}</strong></div>
              </div>
              <div class="field">
                <div class="label">Sender Email</div>
                <div class="value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
              </div>
              ${
                testDetails?.trim()
                  ? `
              <div class="field">
                <div class="label">Test or Exam Reference</div>
                <div class="value">${escapeHtml(testDetails.trim())}</div>
              </div>
              `
                  : ''
              }
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${escapeHtml(message.trim())}</div>
              </div>
            </div>
            <div class="footer">
              Submitted from https://govtpariksha.com/contact-us • Click Reply to answer the student directly.
            </div>
          </div>
        </body>
      </html>
    `;

    // 1. Resend API (HTTP-based, zero extra dependencies)
    const resendApiKey =
      import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const fromEmail =
        import.meta.env.RESEND_FROM_EMAIL ||
        process.env.RESEND_FROM_EMAIL ||
        'GovtPariksha <onboarding@resend.dev>';

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          reply_to: email.trim(),
          subject: emailSubject,
          html: htmlContent,
        }),
      });

      if (!resendRes.ok) {
        const errorText = await resendRes.text();
        console.error('Resend delivery error:', errorText);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to deliver message via email provider. Please try again or email us directly.',
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Your inquiry has been received. We will reply within 24 to 48 hours!',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Brevo API (HTTP-based alternative: https://api.brevo.com/v3/smtp/email)
    const brevoApiKey =
      import.meta.env.BREVO_API_KEY || process.env.BREVO_API_KEY;

    if (brevoApiKey) {
      const fromEmail =
        import.meta.env.BREVO_FROM_EMAIL ||
        process.env.BREVO_FROM_EMAIL ||
        recipientEmail;

      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'GovtPariksha Portal', email: fromEmail },
          to: [{ email: recipientEmail, name: 'GovtPariksha Support' }],
          replyTo: { email: email.trim(), name: name.trim() },
          subject: emailSubject,
          htmlContent: htmlContent,
        }),
      });

      if (!brevoRes.ok) {
        const errorText = await brevoRes.text();
        console.error('Brevo delivery error:', errorText);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to deliver message. Please email us directly.',
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Your inquiry has been received. We will reply within 24 to 48 hours!',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fallback: Log inquiry when no API key is set yet
    console.warn(
      'Notice: Set RESEND_API_KEY (recommended) or BREVO_API_KEY in apps/client/.env to receive emails in your inbox.'
    );
    console.info('Contact submission received:', {
      name,
      email,
      subject,
      testDetails,
      message,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message received! (Setup: add RESEND_API_KEY in .env for live inbox delivery)',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Internal server error while processing message.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
