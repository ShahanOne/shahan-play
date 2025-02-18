require('dotenv').config();
const { App } = require('@slack/bolt');
const cron = require('node-cron');
const port = process.env.PORT || 3000;
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const botToken = process.env.SLACK_BOT_TOKEN;

// console.log('PORT:', process.env.PORT);
// console.log('SLACK_SIGNING_SECRET set:', !!signingSecret);
// console.log('SLACK_BOT_TOKEN set:', !!botToken);

if (!signingSecret || !botToken) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const app = new App({
  signingSecret,
  token: botToken,
});

(async () => {
  try {
    await app.start(port);
    console.log(`⚡️ Bolt app is running on port ${port}!`);

    app.message(async ({ message, say }) => {
      try {
        if (
          message.text.includes(`<@${process.env.BOT_USER_ID}> quote`) ||
          message.text.includes('quote')
        ) {
          const response = await fetch('https://zenquotes.io/api/random');
          const data = await response.json();
          const quote = data[0].q;
          const author = data[0].a;
          await say(
            `Hi <@${message.user}>, here is a quote for you:\n "${quote}" - ${author}`
          );
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        await say(
          'Sorry, I could not fetch a quote at the moment. Try again later!'
        );
      }
    });

    app.message(async ({ message, say }) => {
      try {
        if (
          message.text.includes(`<@${process.env.BOT_USER_ID}> inspire me`) ||
          message.text.includes('inspire me')
        ) {
          const response = await fetch(
            `https://api.unsplash.com/photos/random?query=inspiration&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
          );
          const data = await response.json();

          if (data.urls) {
            const imageUrl = data.urls.regular;
            await say({
              text: `Here is some inspiration for you, <@${message.user}>!`,
              attachments: [
                { image_url: imageUrl, alt_text: 'Inspirational Image' },
              ],
            });
          } else {
            await say('Sorry, I could not find an inspiring image 😕');
          }
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        await say('Oops! Something went wrong while fetching an image.');
      }
    });

    // Schedule the daily quote message
    cron.schedule('0 9 * * *', async () => {
      try {
        const response = await fetch('https://zenquotes.io/api/today');
        const data = await response.json();
        const quote = data[0].q;
        const author = data[0].a;

        await app.client.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          channel: 'C08DMHC68N6', //channel ID
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
