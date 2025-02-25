const openModalAction = async ({ ack, body, client }) => {
  await ack();

  await client.views.open({
    trigger_id: body.trigger_id,
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
};

module.exports = { openModalAction };
