require('dotenv').config();
const { App } = require('@slack/bolt');
const cron = require('node-cron');
const Imap = require('imap-simple');
const { simpleParser } = require('mailparser');
// const OpenAI = require('openai');
// const { HfInference } = require('@huggingface/inference');

const { openModal } = require('./random/commands/openmodal');
const { sendMail } = require('./mail/commands/sendmail');
const { sendEmailModal } = require('./mail/views/sendEmailModal');
const { modalSubmission } = require('./random/views/modalSubmission');
const { openModalAction } = require('./random/actions/openModalAction');

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

//receiving mails
const mailsChannel = 'C08F5B3UC6Q';

const imapConfig = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
  },
};
const extractLatestAndPreviousReply = (emailBody) => {
  const splitBody = emailBody.split(/\nOn .*? wrote:/);
  const latestReply = splitBody[0]?.trim() || 'No recent message';
  const previousReply = splitBody[1]?.trim() || 'No previous message';

  return { latestReply, previousReply };
};

const checkEmails = async () => {
  try {
    const connection = await Imap.connect(imapConfig);
    await connection.openBox('INBOX');

    const searchCriteria = [
      'UNSEEN',
      ['X-GM-RAW', '-in:Social -in:Promotions -in:Spam'],
    ];
    const fetchOptions = { bodies: [''], markSeen: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    for (const message of messages) {
      const all = message.parts.find((part) => part.which === '');
      if (!all || !all.body) continue;

      const parsed = await simpleParser(all.body);

      const subject = parsed.subject || 'No Subject';
      const sender = parsed.from?.text || 'Unknown Sender';
      const textBody = parsed.text || 'No body content';

      // Extract latest and previous replies
      const { latestReply, previousReply } =
        extractLatestAndPreviousReply(textBody);

      const cleanedReply = previousReply.split('\nOn')[0].trim();

      console.log(cleanedReply);
      await app.client.chat.postMessage({
        channel: mailsChannel,
        text: `📩 *New Email Received* \n*From:* ${sender} \n*Subject:* ${subject} \n\n📨 *Message:* \n${latestReply} \n\n📩 *In Reply To:* \n${cleanedReply}`,
      });
    }

    await connection.end();
  } catch (error) {
    console.error('Error fetching emails:', error);
  }
};

// Poll with overlap protection
let isRunning = false;
setInterval(async () => {
  if (isRunning) return;
  isRunning = true;
  try {
    await checkEmails();
  } finally {
    isRunning = false;
  }
}, 60000);

// const checkEmails = async () => {
//   try {
//     const connection = await Imap.connect(imapConfig);
//     await connection.openBox('INBOX');

//     const searchCriteria = ['UNSEEN'];
//     const fetchOptions = { bodies: [''], markSeen: true };

//     const messages = await connection.search(searchCriteria, fetchOptions);
//     for (const message of messages) {
//       const all = message.parts.find((part) => part.which === '');
//       if (!all || !all.body) {
//         console.warn('Skipping email: No body content found.');
//         continue;
//       }

//       const parsed = await simpleParser(all.body);
//       const subject = parsed.subject || 'No Subject';
//       const sender = parsed.from?.text || 'Unknown Sender';
//       const textBody = parsed.text || 'No body content';
//       const inReplyTo = parsed.inReplyTo || '';

//       let mostRecentReply = 'No previous reply found';

//       // If this email is a reply, fetch only the email it directly responds to
//       if (inReplyTo) {
//         const replyCriteria = [['HEADER', 'MESSAGE-ID', inReplyTo]];
//         const replyMessages = await connection.search(
//           replyCriteria,
//           fetchOptions
//         );

//         if (replyMessages.length > 0) {
//           // Since we're looking for a specific Message-ID, there should be at most one match
//           const replyMsg = replyMessages[0];
//           const replyAll = replyMsg.parts.find((part) => part.which === '');
//           if (replyAll && replyAll.body) {
//             const parsedReply = await simpleParser(replyAll.body);
//             mostRecentReply = parsedReply.text || 'No content in reply';
//           }
//         }
//       }

//       // Send to Slack with better formatting
//       await app.client.chat.postMessage({
//         channel: mailsChannel,
//         text:
//           ` *New Email Received*\n` +
//           `*From:* ${sender}\n` +
//           `*Subject:* ${subject}\n` +
//           `*Message:*\n${textBody}\n\n` +
//           `📮 *Most Recent Reply:*\n${mostRecentReply}`,
//       });
//     }

//     await connection.end();
//   } catch (error) {
//     console.error('Error fetching emails:', error);
//   }
// };

// // Check emails every minute
// setInterval(checkEmails, 60000);

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
            `https://api.unsplash.com/photos/random?query=wallpaper&client_id=${unsplashAccessKey}`
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

    //mail
    app.command('/sendmail', sendMail);
    app.view('send_email_modal', sendEmailModal);

    //random commands
    app.command('/openmodal', openModal);
    app.action('open_modal', openModalAction);

    // 🔹 Handle Modal Submission
    app.view('modal_submission', modalSubmission);

    // Listen for the "app_home_opened" event when users open your bot
    app.event('app_home_opened', async ({ event, client }) => {
      try {
        await client.views.publish({
          user_id: event.user,
          view: {
            type: 'home',
            callback_id: 'home_view',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '*Welcome to the bot!* 🚀\nChoose an action below:',
                },
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: 'Show Message' },
                    action_id: 'show_message',
                  },
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: 'Open Modal' },
                    action_id: 'open_modal',
                  },
                ],
              },
            ],
          },
        });
      } catch (error) {
        console.error('Error publishing home tab:', error);
      }
    });

    // Handle "Show Message" button click
    app.action('show_message', async ({ ack, body, client }) => {
      await ack(); // Acknowledge button click

      const userId = body.user.id;
      await client.chat.postMessage({
        channel: userId,
        text: `🎉 You clicked the "Show Message" button!`,
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

//AI
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
