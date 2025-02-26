const Imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const cheerio = require('cheerio');

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

const cleanHtmlEmail = (html) => {
  const $ = cheerio.load(html);
  return $('body').text().trim() || html;
};

const checkEmails = async () => {
  try {
    const connection = await Imap.connect(imapConfig);
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN']; // Fetch unread emails
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    for (const message of messages) {
      const header = message.parts.find((part) => part.which === 'HEADER');
      const body = message.parts.find((part) => part.which === 'TEXT');

      if (!body || !body.body) {
        console.warn('Skipping email: No body content found.');
        continue;
      }

      const parsed = await simpleParser(body.body);
      const subject = header?.body?.subject?.[0] || 'No Subject';
      const sender = parsed.from?.text || 'Unknown sender';

      // Clean email body
      let textBody =
        parsed.text || cleanHtmlEmail(parsed.html) || 'No body content';

      // Send email to Slack
      await app.client.chat.postMessage({
        channel: mailsChannel,
        text: `📩 *New Email Received* \n*From:* ${sender} \n*Subject:* ${subject} \n\n${textBody}`,
      });
    }

    await connection.end();
  } catch (error) {
    console.error('Error fetching emails:', error);
  }
};

export default checkEmails;
