const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, html }) => {
  try {
    const isPlaceholderSmtp =
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      process.env.SMTP_USER.includes('your-email') ||
      process.env.SMTP_PASSWORD?.includes('your-app-password');

    // If SMTP details are not configured, print to console as fallback
    if (isPlaceholderSmtp) {
      console.log('--------------------------------------------');
      console.log(`[EMAIL SEND SIMULATION to: ${email}]`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${html.replace(/<[^>]*>/g, '')}`);
      console.log('--------------------------------------------');
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'CodeRank'}" <${process.env.FROM_EMAIL || 'noreply@coderank.com'}>`,
      to: email,
      subject,
      html,
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = sendEmail;
