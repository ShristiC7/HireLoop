import nodemailer from "nodemailer";

interface EmailPayload {
  toName: string;
  toEmail: string;
  jobTitle: string;
  companyName: string;
  status: string;
  interviewDate?: Date;
}

export async function sendApplicationStatusEmail(payload: EmailPayload) {
  const { toName, toEmail, jobTitle, companyName, status, interviewDate } = payload;
  
  let subject = "";
  let text = "";

  switch (status) {
    case "shortlisted":
      subject = `Good News! You've been shortlisted for ${jobTitle} at ${companyName}`;
      text = `Hi ${toName},\n\nCongratulations! Your application for the ${jobTitle} role at ${companyName} has been shortlisted. The recruitment team will reach out soon regarding next steps.\n\nBest regards,\nHireLoop Team`;
      break;
    case "interview":
      subject = `Interview Scheduled: ${jobTitle} at ${companyName}`;
      text = `Hi ${toName},\n\nYour interview for the ${jobTitle} role at ${companyName} has been scheduled for ${interviewDate?.toLocaleString() ?? "a future date"}. Good luck!\n\nBest regards,\nHireLoop Team`;
      break;
    case "offer":
      subject = `Congratulations! Job Offer for ${jobTitle} at ${companyName}`;
      text = `Hi ${toName},\n\nWe are thrilled to inform you that you have received an offer for the ${jobTitle} role at ${companyName}! Please check your portal for details.\n\nBest regards,\nHireLoop Team`;
      break;
    case "rejected":
      subject = `Update regarding your application for ${jobTitle} at ${companyName}`;
      text = `Hi ${toName},\n\nThank you for applying to the ${jobTitle} role at ${companyName}. Unfortunately, the team has decided not to proceed with your application at this time.\n\nKeep trying, and best of luck!\n\nHireLoop Team`;
      break;
    default:
      subject = `Application Update: ${jobTitle} at ${companyName}`;
      text = `Hi ${toName},\n\nThe status of your application for ${jobTitle} at ${companyName} has been updated to: ${status}.\n\nBest regards,\nHireLoop Team`;
  }

  // If SMTP is not defined, just log it. This allows the app to run without failure during development.
  const smtpUrl = process.env.SMTP_URL;
  if (!smtpUrl) {
    console.log(`[MAILER MOCK] Sending email to ${toEmail}`);
    console.log(`[MAILER MOCK] Subject: ${subject}`);
    console.log(`[MAILER MOCK] Body:\n${text}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport(smtpUrl);
    await transporter.sendMail({
      from: '"HireLoop" <noreply@hireloop.cc>',
      to: toEmail,
      subject,
      text,
    });
    console.log(`[MAILER] Email successfully sent to ${toEmail}`);
  } catch (error) {
    console.error(`[MAILER] Failed to send email to ${toEmail}:`, error);
  }
}
