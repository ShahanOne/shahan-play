require('dotenv').config();
const axios = require('axios');
const { App } = require('@slack/bolt');

const port = process.env.PORT || 4000;
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const botToken = process.env.SLACK_BOT_TOKEN;

if (!signingSecret || !botToken) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const app = new App({
  signingSecret: signingSecret,
  token: botToken,
});

(async () => {
  try {
    await app.start(port);
    console.log(`⚡️ Bolt app is running on port ${port}!`);

    app.message('quote', async ({ message, say }) => {
      try {
        const response = await axios.get('https://api.quotable.io/random');
        const quote = response.data.content;
        const author = response.data.author;
        await say(
          `Hi <@${message.user}>, here’s a quote for you: "${quote}" - ${author}`
        );
      } catch (error) {
        console.error('Error fetching quote:', error);
        await say(
          'Sorry, I couldn’t fetch a quote at the moment. Try again later!'
        );
      }
    });
  } catch (error) {
    console.error('⚠️ Error starting the app:', error);
    process.exit(1);
  }
})();
