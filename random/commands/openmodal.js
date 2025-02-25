const openModal = async ({ command, ack, client }) => {
  await ack(); // ✅ Acknowledge the command

  try {
    await client.views.open({
      trigger_id: command.trigger_id, // ✅ Correct trigger_id from the command
      view: {
        type: 'modal',
        callback_id: 'modal_submission',
        title: { type: 'plain_text', text: 'My Modal' },
        blocks: [
          {
            type: 'input',
            block_id: 'user_input',
            label: { type: 'plain_text', text: 'Enter something:' },
            element: { type: 'plain_text_input', action_id: 'input_value' },
          },
        ],
        submit: { type: 'plain_text', text: 'Submit' },
      },
    });
  } catch (error) {
    console.error('Error opening modal:', error);
  }
};

module.exports = { openModal };
