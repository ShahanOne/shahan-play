require('dotenv').config();
const { App } = require('@slack/bolt');
// const OpenAI = require('openai');
const cron = require('node-cron');
// const { HfInference } = require('@huggingface/inference');

const port = process.env.PORT || 3000;
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const botToken = process.env.SLACK_BOT_TOKEN;
const botUserId = process.env.BOT_USER_ID;
const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
const allChannelId = 'C08DMHC68N6';
// const openaiApiKey = process.env.OPENAI_API_KEY;
const hfApiKey = process.env.HF_API_KEY;

// const client = new HfInference(hfApiKey);

if (
  !signingSecret ||
  !botToken ||
  !botUserId ||
  !unsplashAccessKey ||
  !hfApiKey
) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const app = new App({
  signingSecret,
  token: botToken,
});

// const openai = new OpenAI({
//   apiKey: openaiApiKey,
// });

// Function to interact with OpenAI API
// async function getChatGPTResponse(userMessage) {
//   try {
//     const response = await openai.chat.completions.create({
//       model: 'gpt-3.5-turbo',
//       messages: [
//         { role: 'system', content: 'You are a helpful assistant.' },
//         { role: 'user', content: userMessage },
//       ],
//       temperature: 0.7,
//       max_tokens: 100,
//     });

//     return response.choices[0].message.content;
//   } catch (error) {
//     console.error('Error with OpenAI API:', error);
//     return "Sorry, I couldn't process that request.";
//   }
// }

// async function getAIResponse(userMessage) {
//   const chatCompletion = await client.chatCompletion({
//     model: 'meta-llama/Llama-3.2-3B-Instruct',
//     messages: [
//       {
//         role: 'user',
//         content: userMessage,
//       },
//     ],
//     provider: 'hf-inference',
//     max_tokens: 100,
//   });

//   const reply = chatCompletion.choices[0].message;
//   console.log(reply);
//   return reply || "Sorry, I couldn't generate a response.";
// }

(async () => {
  try {
    await app.start(port);
    console.log(`⚡️ Bolt app is running on port ${port}!`);

    // Handle Messages
    app.message(async ({ message, say }) => {
      try {
        const text = message.text.toLowerCase();
        if (text.includes(`@ai`)) {
          const userMessage = text.replace(`@ai`, '').trim();
          if (!userMessage) {
            await say(`⚠️ Please provide a message after mentioning me.`);
            return;
          }

          if (userMessage) {
            await say(`🤖 Thinking...`);
            // const aiResponse = await getAIResponse(userMessage);
            // await say(`💬 ${aiResponse}`);
            await say(`💬 AI not available at the moment`);
          }
        } else if (
          text.includes(`<@${botUserId}> quote`) ||
          text.includes('quote')
        ) {
          const response = await fetch('https://zenquotes.io/api/random');
          const data = await response.json();
          const quote = data[0].q;
          const author = data[0].a;

          await say(
            `Hi <@${message.user}>, here is a quote for you:\n"${quote}" - ${author}`
          );
        } else if (
          text.includes(`<@${botUserId}> amaze me`) ||
          text.includes('amaze me')
        ) {
          const response = await fetch(
            `https://api.unsplash.com/photos/random?query=amazing&client_id=${unsplashAccessKey}`
          );
          const data = await response.json();

          if (data.urls) {
            const imageUrl = data.urls.regular;
            await say({
              text: `Here is something amazing for you, <@${message.user}>!`,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `Here is something amazing for you, <@${message.user}>!`,
                  },
                },
                {
                  type: 'image',
                  image_url: imageUrl,
                  alt_text: 'amazing Image',
                },
              ],
            });
          } else {
            await say('Sorry, I could not find an inspiring image 😕');
          }
        }
      } catch (error) {
        console.error('Error handling message:', error);
        await say('Oops! Something went wrong.');
      }
    });

    app.command('/openmodal', async ({ command, ack, client }) => {
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
    });

    // 🔹 Handle Modal Submission
    app.view('modal_submission', async ({ ack, body, view, client }) => {
      await ack(); // Acknowledge the modal submission

      const userInput = view.state.values.user_input;
      const userId = body.user.id;

      await client.chat.postMessage({
        channel: 'C08DMHC68N6',
        // channel: userId, // Send a DM to the user
        text: `You submitted: "${userInput}"`,
      });
    });

    // Scheduled Daily Quote
    cron.schedule('0 9 * * *', async () => {
      try {
        const response = await fetch('https://zenquotes.io/api/today');
        const data = await response.json();
        const quote = data[0].q;
        const author = data[0].a;

        await app.client.chat.postMessage({
          token: botToken,
          channel: allChannelId,
          text: `Good morning! 🌞 Here's a daily quote:\n "${quote}" - ${author}`,
        });

        console.log('✅ Daily quote sent!');
      } catch (error) {
        console.error('Error sending scheduled message:', error);
      }
    });
  } catch (error) {
    console.error('⚠️ Error starting the app:', error);
    process.exit(1);
  }
})();
