export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const REPO_OWNER = 'Vaibhavsrivastava-6105';
  const REPO_NAME = 'My-Portfolio';
  const FILE_PATH = 'src/data/portfolio.json';

  if (!GITHUB_TOKEN || !TELEGRAM_TOKEN) return res.status(500).json({ error: 'Missing config' });

  const update = req.body;
  if (!update) return res.status(200).send('OK');

  const sendMessage = async (chatId, text, replyMarkup = null) => {
    const payload = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const answerCallback = async (callbackQueryId) => {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  };

  try {
    // Handle Button Clicks (Callback Queries)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      await answerCallback(cb.id);

      const prompts = {
        'edit_bio': "✏️ <b>Please reply to this message</b> with your new Bio:",
        'edit_title': "✏️ <b>Please reply to this message</b> with your new Title:",
        'edit_status': "✏️ <b>Please reply to this message</b> with your new Status (e.g. 🟢 Open to work):",
        'edit_about': "✏️ <b>Please reply to this message</b> with your new About Me description:",
        'edit_resume': "✏️ <b>Please reply to this message</b> with your new Resume Link (URL):",
        'add_achievement': "🏆 <b>Please reply to this message</b> with your Achievement in this exact format:\n<code>Title | Description | Badge URL | Certificate URL</code>\n\n(Tip: use # for links you don't have)"
      };

      if (prompts[cb.data]) {
        await sendMessage(chatId, prompts[cb.data], { force_reply: true });
      } else if (cb.data === 'cancel') {
        await sendMessage(chatId, "❌ Action cancelled. Type /menu to start again.");
      }
      return res.status(200).send('OK');
    }

    // Handle normal messages
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      // Show Interactive Menu
      if (text === '/start' || text === '/menu') {
        const keyboard = {
          inline_keyboard: [
            [{ text: "🔴 Update Status Badge", callback_data: "edit_status" }],
            [{ text: "💼 Update Title", callback_data: "edit_title" }, { text: "👤 Update Bio", callback_data: "edit_bio" }],
            [{ text: "📖 Update About Me", callback_data: "edit_about" }, { text: "📎 Update Resume", callback_data: "edit_resume" }],
            [{ text: "🏆 Add Achievement", callback_data: "add_achievement" }],
            [{ text: "❌ Cancel", callback_data: "cancel" }]
          ]
        };
        await sendMessage(chatId, "🤖 <b>Welcome to your Portfolio Bot!</b>\n\nWhat would you like to update?", keyboard);
        return res.status(200).send('OK');
      }

      // Handle Forced Replies
      let command = '';
      let payload = '';

      if (msg.reply_to_message && msg.reply_to_message.text) {
        const promptMsg = msg.reply_to_message.text;
        if (promptMsg.includes('new Bio')) { command = 'bio'; payload = text; }
        else if (promptMsg.includes('new Title')) { command = 'title'; payload = text; }
        else if (promptMsg.includes('new Status')) { command = 'status'; payload = text; }
        else if (promptMsg.includes('new About Me')) { command = 'about'; payload = text; }
        else if (promptMsg.includes('new Resume Link')) { command = 'resume'; payload = text; }
        else if (promptMsg.includes('exact format')) { command = 'achievement'; payload = text; }
      }

      if (!command) {
        await sendMessage(chatId, "I didn't understand that. Type /menu to see your options.");
        return res.status(200).send('OK');
      }

      await sendMessage(chatId, `⏳ <i>Processing your update...</i> This will trigger a Vercel rebuild.`);

      // Fetch, Update, and Push to GitHub
      const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
      const getRes = await fetch(fileUrl, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      
      if (!getRes.ok) throw new Error(`GitHub API GET error: ${getRes.statusText}`);
      const fileData = await getRes.json();
      const portfolioData = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));

      if (command === 'bio') portfolioData.hero.bio = payload;
      else if (command === 'title') portfolioData.hero.title = payload;
      else if (command === 'status') portfolioData.hero.status = payload;
      else if (command === 'resume') portfolioData.hero.resumeLink = payload;
      else if (command === 'about') portfolioData.about.description = payload;
      else if (command === 'achievement') {
        const parts = payload.split('|').map(p => p.trim());
        if (parts.length < 2) {
          await sendMessage(chatId, "❌ Invalid format. Please make sure to use the `|` character to separate Title and Description.");
          return res.status(200).send('OK');
        }
        if (!portfolioData.achievements) portfolioData.achievements = [];
        portfolioData.achievements.push({
          title: parts[0] || "New Achievement",
          description: parts[1] || "",
          badgeUrl: parts[2] || "#",
          certificateUrl: parts[3] || "#"
        });
      }

      const newContentBase64 = Buffer.from(JSON.stringify(portfolioData, null, 2)).toString('base64');
      const putRes = await fetch(fileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `🤖 Bot: Updated ${command} via Telegram Menu`,
          content: newContentBase64,
          sha: fileData.sha
        })
      });

      if (!putRes.ok) throw new Error(`GitHub API PUT error: ${putRes.statusText}`);
      
      await sendMessage(chatId, "✅ <b>Successfully updated GitHub!</b>\n\nVercel is now rebuilding your site. Changes will be live in ~1 minute.");
    }
  } catch (error) {
    console.error(error);
    if (update.message) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: update.message.chat.id, text: `❌ <b>Error:</b> ${error.message}`, parse_mode: 'HTML' }),
      });
    }
  }

  return res.status(200).send('OK');
}
