import nodemailer, { Transporter } from "nodemailer";

// Email configuration interface
interface EmailConfig {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
}

// Initialize nodemailer transporter
const createTransporter = (): Transporter => {
  // For development, you can use a test account or your actual SMTP settings
  // Common options: Gmail, SendGrid, Mailgun, AWS SES, etc.

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    // For Gmail, you might need to use an App Password instead of regular password
    // For other services, adjust accordingly
  });

  return transporter;
};

// Verify transporter configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email service configured successfully");
    return true;
  } catch (error) {
    console.error("❌ Email service configuration error:", error);
    return false;
  }
};

// Send email function
export const sendEmail = async (config: EmailConfig): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(config.to) ? config.to.join(", ") : config.to,
      subject: config.subject,
      html: config.html,
      text: config.text,
      cc: config.cc
        ? Array.isArray(config.cc)
          ? config.cc.join(", ")
          : config.cc
        : undefined,
      bcc: config.bcc
        ? Array.isArray(config.bcc)
          ? config.bcc.join(", ")
          : config.bcc
        : undefined,
      attachments: config.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
};

// Helper function to send HTML emails (most common use case)
export const sendHtmlEmail = async (
  to: string | string[],
  subject: string,
  htmlContent: string
): Promise<boolean> => {
  return sendEmail({
    to,
    subject,
    html: htmlContent,
  });
};

// Helper function to send plain text emails
export const sendTextEmail = async (
  to: string | string[],
  subject: string,
  textContent: string
): Promise<boolean> => {
  return sendEmail({
    to,
    subject,
    text: textContent,
  });
};

// Export the transporter for advanced use cases
export { createTransporter };
