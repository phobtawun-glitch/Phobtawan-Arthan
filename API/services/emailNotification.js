const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: Number(process.env.EMAIL_SMTP_PORT || 587),
  secure: process.env.EMAIL_SMTP_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
});

const sendEmailNotification = async (email, subject, html) => {
  if (!email) {
    throw new Error("ไม่มี Email ของสมาชิก");
  }

  if (
    !process.env.EMAIL_SMTP_HOST ||
    !process.env.EMAIL_SMTP_USER ||
    !process.env.EMAIL_SMTP_PASSWORD
  ) {
    throw new Error("ยังไม่ได้ตั้งค่า Email SMTP");
  }

  try {
    const info = await transporter.sendMail({
      from: `"Lost and Found" <${process.env.EMAIL_SMTP_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log("===== EMAIL NOTIFICATION SENT =====");
    console.log("EMAIL:", email);
    console.log("MESSAGE ID:", info.messageId);

    return true;
  } catch (error) {
    console.error(
      "EMAIL NOTIFICATION ERROR:",
      error
    );

    return false;
  }
};

module.exports = {
  sendEmailNotification,
};