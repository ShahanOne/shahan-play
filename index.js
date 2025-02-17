require('dotenv').config();
const axios = require('axios');
const { App } = require('@slack/bolt');

const port = process.env.PORT || 3000;
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const botToken = process.env.SLACK_BOT_TOKEN;

console.log('PORT:', process.env.PORT);
console.log('SLACK_SIGNING_SECRET set:', !!signingSecret);
console.log('SLACK_BOT_TOKEN set:', !!botToken);

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

    app.message('quote', async ({ message, say }) => {
      try {
        const response = await axios.get('https://api.quotable.io/random');
        const quote = response.data.content;
        const author = response.data.author;
        await say(
          `Hi <@${message.user}>, here is a quote for you: "${quote}" - ${author}`
        );
      } catch (error) {
        console.error('Error fetching quote:', error);
        await say(
          'Sorry, I could not fetch a quote at the moment. Try again later!'
        );
      }
    });
  } catch (error) {
    console.error('⚠️ Error starting the app:', error);
    process.exit(1);
  }
})();
