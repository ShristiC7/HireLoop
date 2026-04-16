interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[Email] No RESEND_API_KEY — skipping email to ${to}: ${subject}`);
    return;
  }

  const fromEmail = process.env.EMAIL_FROM || "noreply@hireloop.app";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `HireLoop <${fromEmail}>`,
      to,
      subject,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f7ff; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(99,102,241,0.08); }
  .header { background: linear-gradient(135deg, #6366f1 0%, #f97316 100%); padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
  .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
  .body { padding: 32px; color: #374151; line-height: 1.6; }
  .footer { padding: 24px 32px; background: #f9fafb; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center; }
  a { color: #6366f1; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ HireLoop</h1>
      <p>AI-Powered Campus Recruitment</p>
    </div>
    <div class="body">${html}</div>
    <div class="footer">
      <p>You are receiving this email because you have an account on HireLoop.</p>
      <p><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Email] Failed to send to ${to}:`, error);
  } else {
    console.log(`[Email] Sent to ${to}: ${subject}`);
  }
}

export function applicationStatusEmail(status: string, jobTitle: string, company: string): string {
  const statusMessages: Record<string, { heading: string; body: string; color: string }> = {
    applied: {
      heading: "Application Received!",
      body: `We've received your application for <strong>${jobTitle}</strong> at <strong>${company}</strong>. The recruiter will review your profile and get back to you soon.`,
      color: "#3b82f6",
    },
    shortlisted: {
      heading: "You've been Shortlisted! 🎉",
      body: `Great news! You've been shortlisted for <strong>${jobTitle}</strong> at <strong>${company}</strong>. The recruiter will be in touch to schedule an interview. Keep an eye on your HireLoop dashboard!`,
      color: "#8b5cf6",
    },
    interview: {
      heading: "Interview Scheduled",
      body: `Your interview for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been scheduled. Please log in to your HireLoop dashboard to see the interview details including date, time, and meeting link.`,
      color: "#f59e0b",
    },
    offer: {
      heading: "Offer Extended! 🎊",
      body: `Congratulations! <strong>${company}</strong> has extended an offer for the <strong>${jobTitle}</strong> position. Please log in to your HireLoop dashboard to review and respond to the offer.`,
      color: "#10b981",
    },
    rejected: {
      heading: "Application Update",
      body: `Thank you for your interest in <strong>${jobTitle}</strong> at <strong>${company}</strong>. After careful consideration, they've decided to move forward with other candidates. Don't be discouraged — keep applying to other opportunities on HireLoop!`,
      color: "#ef4444",
    },
  };

  const info = statusMessages[status] ?? statusMessages.applied;
  return `
    <div style="border-left: 4px solid ${info.color}; padding-left: 16px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 8px; color: ${info.color};">${info.heading}</h2>
      <p style="margin: 0;">${info.body}</p>
    </div>
    <p>Log in to your <a href="${process.env.FRONTEND_URL || "https://hireloop.app"}/student/applications">HireLoop dashboard</a> to track all your applications.</p>
  `;
}
