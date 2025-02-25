const nodemailer = require('nodemailer');

//sending mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail email
    pass: process.env.EMAIL_PASS, // App Password (not your Gmail password)
  },
});

async function sendEmail(to, message) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Message from Slack Bot',
    text: message,
  };

  return transporter.sendMail(mailOptions);
}

const sendEmailModal = async ({ ack, body, view, client }) => {
  await ack(); // Acknowledge the submission

  const userEmail = view.state.values.email_input.email.value;
  const userMessage = view.state.values.message_input.message.value;
  const userId = body.user.id;

  try {
    // Send email using Nodemailer
    await sendEmail(userEmail, userMessage);

    // Notify the user in Slack
    await client.chat.postMessage({
      channel: userId,
      text: `📧 Email successfully sent to ${userEmail}!`,
    });
  } catch (error) {
    console.error('Error sending email:', error);

    await client.chat.postMessage({
      channel: userId,
      text: `⚠️ Failed to send email. Please try again.`,
    });
  }
};

module.exports = { sendEmailModal };
