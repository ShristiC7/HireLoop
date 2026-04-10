import nodemailer from "nodemailer";
import { logger } from "../config/logger.js";

// Create reusable transporter (SMTP connection pool)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // true for port 465 (SSL)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ── Core send function ────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, text }) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || "HireLoop <no-reply@hireloop.com>",
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ""), // auto strip HTML for plain-text fallback
        });

        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Email send failed to ${to}:`, error.message);
        // Don't throw — email failures shouldn't break the main flow
        // The user is created, but email sending failed silently
    }
}

// ── Email Templates ───────────────────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #1a1a1a;
`;

const buttonStyle = `
  display: inline-block;
  background-color: #4F46E5;
  color: white !important;
  padding: 14px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin: 20px 0;
`;

// 1. Email Verification
export async function sendVerificationEmail(user, token) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    await sendEmail({
        to: user.email,
        subject: "Verify your HireLoop email",
        html: `
      <div style="${baseStyle}">
        <h1 style="color: #4F46E5;">Welcome to HireLoop! 🚀</h1>
        <p>Hi ${user.firstName || "there"},</p>
        <p>Thanks for signing up. Please verify your email address to get started.</p>
        <a href="${verifyUrl}" style="${buttonStyle}">Verify Email</a>
        <p style="color: #666; font-size: 14px;">
          This link expires in 24 hours.<br>
          If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
    });
}

// 2. Password Reset
export async function sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await sendEmail({
        to: user.email,
        subject: "Reset your HireLoop password",
        html: `
      <div style="${baseStyle}">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.firstName || "there"},</p>
        <p>We received a request to reset your password. Click below to set a new one:</p>
        <a href="${resetUrl}" style="${buttonStyle}">Reset Password</a>
        <p style="color: #666; font-size: 14px;">
          This link expires in 1 hour.<br>
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
    });
}

// 3. Application Status Update
export async function sendApplicationStatusEmail(student, job, status) {
    const statusMessages = {
        SHORTLISTED: {
            subject: `🎉 You've been shortlisted for ${job.title}`,
            message: `Great news! You've been shortlisted for the <strong>${job.title}</strong> position at <strong>${job.companyName}</strong>. Check your application tracker for next steps.`,
        },
        INTERVIEW_SCHEDULED: {
            subject: `📅 Interview scheduled for ${job.title}`,
            message: `Your interview for <strong>${job.title}</strong> at <strong>${job.companyName}</strong> has been scheduled. Login to HireLoop to view the details.`,
        },
        OFFER: {
            subject: `🎊 Congratulations! Offer for ${job.title}`,
            message: `Congratulations! You've received an offer for <strong>${job.title}</strong> at <strong>${job.companyName}</strong>!`,
        },
        REJECTED: {
            subject: `Application update for ${job.title}`,
            message: `Thank you for applying to <strong>${job.title}</strong> at <strong>${job.companyName}</strong>. Unfortunately, they've decided to move forward with other candidates.`,
        },
    };

    const content = statusMessages[status];
    if (!content) return;

    await sendEmail({
        to: student.email,
        subject: content.subject,
        html: `
      <div style="${baseStyle}">
        <p>Hi ${student.firstName},</p>
        <p>${content.message}</p>
        <a href="${process.env.CLIENT_URL}/dashboard/applications" style="${buttonStyle}">
          View Application
        </a>
      </div>
    `,
    });
}

// 4. Recruiter Approval/Rejection by Admin
export async function sendRecruiterApprovalEmail(recruiter, approved, reason) {
    await sendEmail({
        to: recruiter.email,
        subject: approved ? "✅ Your HireLoop account is approved!" : "HireLoop account update",
        html: `
      <div style="${baseStyle}">
        <p>Hi ${recruiter.firstName},</p>
        ${approved
                ? `<p>Your recruiter account for <strong>${recruiter.companyName}</strong> has been approved. You can now post jobs and connect with students.</p>
               <a href="${process.env.CLIENT_URL}/recruiter/dashboard" style="${buttonStyle}">Go to Dashboard</a>`
                : `<p>Unfortunately, your recruiter account application was not approved.</p>
               ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
               <p>Please contact the placement cell for more information.</p>`
            }
      </div>
    `,
    });
}

export { sendEmail };