require('dotenv').config();
const port = process.env.PORT || 3000;

const axios = require('axios');
const { App } = require('@slack/bolt');
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const botToken = process.env.SLACK_BOT_TOKEN;

const app = new App({
  signingSecret: signingSecret,
  token: botToken,
});

(async () => {
  await app.start(port);

  app.message('quote', async ({ message, say }) => {
    const response = await axios.get('https://api.quotable.io/random');
    const quote = response.data.content;
    const author = response.data.author;
    const quoteWithAuthor = `${quote} - ${author}`;
    await say(`Hi ${message.user}, A quote for you :- ${quoteWithAuthor}`);
  });

  console.log(`⚡️ Bolt app is running on port ${port}!`);
})();
