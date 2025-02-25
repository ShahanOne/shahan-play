const sendMail = async ({ command, ack, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'send_email_modal',
        title: { type: 'plain_text', text: 'Send an Email' },
        blocks: [
          {
            type: 'input',
            block_id: 'email_input',
            label: { type: 'plain_text', text: 'Recipient Email' },
            element: {
              type: 'plain_text_input',
              action_id: 'email',
              placeholder: { type: 'plain_text', text: 'Enter email' },
            },
          },
          {
            type: 'input',
            block_id: 'message_input',
            label: { type: 'plain_text', text: 'Message' },
            element: {
              type: 'plain_text_input',
              action_id: 'message',
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'Enter your message',
              },
            },
          },
        ],
        submit: { type: 'plain_text', text: 'Send' },
      },
    });
  } catch (error) {
    console.error('Error opening email modal:', error);
  }
};

module.exports = { sendMail };
