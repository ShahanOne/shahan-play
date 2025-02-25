const modalSubmission = async ({ ack, body, view, client }) => {
  await ack(); // Acknowledge the modal submission

  const userInput = view.state.values.user_input.input_value.value;
  const userId = body.user.id;

  await client.chat.postMessage({
    // channel: 'C08DMHC68N6',
    channel: userId, // Send a DM to the user
    text: `You submitted: "${userInput}"`,
  });
};

module.exports = { modalSubmission };
