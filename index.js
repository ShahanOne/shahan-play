require('dotenv').config();
const { App } = require('@slack/bolt');
const OpenAI = require('openai');
const cron = require('node-cron');

const port = process.env.PORT || 3000;
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const botToken = process.env.SLACK_BOT_TOKEN;
const botUserId = process.env.BOT_USER_ID;
const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
const allChannelId = 'C08DMHC68N6';
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!signingSecret || !botToken) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const app = new App({
  signingSecret,
  token: botToken,
});

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Function to interact with OpenAI API
async function getChatGPTResponse(userMessage) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    return "Sorry, I couldn't process that request.";
  }
}

(async () => {
  try {
    await app.start(port);
    console.log(`⚡️ Bolt app is running on port ${port}!`);

    // Handle Messages
    app.message(async ({ message, say }) => {
      try {
        const text = message.text.toLowerCase();

        if (text.includes(`@gpt`)) {
          const userMessage = text.replace(`@gpt`, '').trim();
          if (!userMessage) {
            await say(`⚠️ Please provide a message after mentioning me.`);
            return;
          }

          if (userMessage) {
            await say(`🤖 Thinking...`);
            const chatGPTResponse = await getChatGPTResponse(userMessage);
            await say(`💬 ${chatGPTResponse}`);
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
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `Here is some inspiration for you, <@${message.user}>!`,
                  },
                },
                {
                  type: 'image',
                  image_url: imageUrl,
                  alt_text: 'Inspirational Image',
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
