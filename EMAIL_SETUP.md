# Email Service Setup

This project uses Nodemailer for sending emails. The email service is configured in `src/utils/emailService.ts`.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # SMTP server host (default: smtp.gmail.com)
SMTP_PORT=587                      # SMTP port (default: 587)
SMTP_SECURE=false                  # Use SSL/TLS (true for 465, false for 587)
SMTP_USER=your-email@gmail.com     # Your email address
SMTP_PASSWORD=your-app-password    # Your email password or app password
SMTP_FROM=your-email@gmail.com     # From email address (defaults to SMTP_USER)
```

## Gmail Setup

If using Gmail, you'll need to:

1. Enable 2-Step Verification on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated app password as `SMTP_PASSWORD`

## Other Email Providers

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASSWORD=your-aws-secret-key
```

## Usage Examples

### Send HTML Email

```typescript
import { sendHtmlEmail } from "./utils/emailService";

await sendHtmlEmail(
  "recipient@example.com",
  "Welcome!",
  "<h1>Welcome to our service!</h1><p>Thank you for joining.</p>"
);
```

### Send Text Email

```typescript
import { sendTextEmail } from "./utils/emailService";

await sendTextEmail(
  "recipient@example.com",
  "Notification",
  "This is a plain text email."
);
```

### Send Email with Full Options

```typescript
import { sendEmail } from "./utils/emailService";

await sendEmail({
  to: ["user1@example.com", "user2@example.com"],
  subject: "Important Update",
  html: "<h1>Update</h1><p>Here's the update...</p>",
  cc: "manager@example.com",
  bcc: "archive@example.com",
  attachments: [
    {
      filename: "document.pdf",
      path: "/path/to/document.pdf",
    },
  ],
});
```

## Functions Available

- `sendEmail(config)` - Full-featured email sending with all options
- `sendHtmlEmail(to, subject, htmlContent)` - Quick HTML email
- `sendTextEmail(to, subject, textContent)` - Quick plain text email
- `verifyEmailConfig()` - Verify SMTP configuration (called on server startup)

All functions return a `Promise<boolean>` indicating success or failure.
