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
