export default async function handler(req, res) {
  // 1. Only allow POST requests (Telegram sends webhooks as POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Validate environment variables
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const REPO_OWNER = 'Vaibhavsrivastava-6105';
  const REPO_NAME = 'My-Portfolio';
  const FILE_PATH = 'src/data/portfolio.json';

  if (!GITHUB_TOKEN || !TELEGRAM_TOKEN) {
    console.error("Missing environment variables");
    return res.status(500).json({ error: 'Missing config' });
  }

  // 3. Extract the message from the Telegram update
  const update = req.body;
  if (!update || !update.message || !update.message.text) {
    return res.status(200).send('OK'); // Return 200 so Telegram doesn't retry
  }

  const chatId = update.message.chat.id;
  const text = update.message.text.trim();

  // Helper function to send messages back to Telegram
  const reply = async (messageText) => {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: messageText }),
    });
  };

  try {
    // 4. Parse commands
    if (text === '/start') {
      await reply("🤖 Welcome to your Portfolio Bot!\n\nCommands:\n/bio [text] - Update your bio\n/title [text] - Update your title");
      return res.status(200).send('OK');
    }

    let command = '';
    let payload = '';

    if (text.startsWith('/bio ')) {
      command = 'bio';
      payload = text.replace('/bio ', '').trim();
    } else if (text.startsWith('/title ')) {
      command = 'title';
      payload = text.replace('/title ', '').trim();
    } else {
      await reply("Unknown command. Try /bio [text] or /title [text]");
      return res.status(200).send('OK');
    }

    await reply(`⏳ Updating ${command}... This will trigger a Vercel rebuild.`);

    // 5. Fetch current portfolio.json from GitHub
    const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getRes = await fetch(fileUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!getRes.ok) {
      throw new Error(`GitHub API error: ${getRes.statusText}`);
    }

    const fileData = await getRes.json();
    const sha = fileData.sha;
    
    // Decode base64 content
    const currentContentStr = Buffer.from(fileData.content, 'base64').toString('utf8');
    const portfolioData = JSON.parse(currentContentStr);

    // 6. Modify the data
    if (command === 'bio') {
      portfolioData.hero.bio = payload;
    } else if (command === 'title') {
      portfolioData.hero.title = payload;
    }

    // 7. Commit the change back to GitHub
    const newContentStr = JSON.stringify(portfolioData, null, 2);
    const newContentBase64 = Buffer.from(newContentStr).toString('base64');

    const putRes = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🤖 Bot: Updated ${command} via Telegram`,
        content: newContentBase64,
        sha: sha
      })
    });

    if (!putRes.ok) {
      throw new Error(`GitHub API PUT error: ${putRes.statusText}`);
    }

    await reply("✅ Successfully updated GitHub! Vercel is now rebuilding your site. Changes will be live in ~1 minute.");

  } catch (error) {
    console.error(error);
    await reply(`❌ Error: ${error.message}`);
  }

  return res.status(200).send('OK');
}
