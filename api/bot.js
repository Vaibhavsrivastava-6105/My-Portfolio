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

  let incomingChatId = null;
  if (update.message) incomingChatId = update.message.chat.id;
  else if (update.callback_query) incomingChatId = update.callback_query.message.chat.id;

  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

  const sendMessage = async (chatId, text, replyMarkup = null) => {
    const payload = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const answerCallback = async (callbackQueryId, text = "") => {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  };

  if (incomingChatId) {
    if (update.message && update.message.text === '/myid') {
      await sendMessage(incomingChatId, `🔐 Your Secret Chat ID is:\n<code>${incomingChatId}</code>\n\nAdd this to your Vercel Environment Variables as <b>ADMIN_CHAT_ID</b> to lock down your bot.`);
      return res.status(200).send('OK');
    }

    if (ADMIN_CHAT_ID && incomingChatId.toString() !== ADMIN_CHAT_ID) {
      await sendMessage(incomingChatId, "⛔ <b>Unauthorized Access.</b>\nYou are not the owner of this portfolio.");
      if (update.callback_query) await answerCallback(update.callback_query.id, "Unauthorized");
      return res.status(200).send('OK');
    }
  }

  // Helper to fetch current JSON data from GitHub
  const fetchPortfolioData = async () => {
    const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getRes = await fetch(fileUrl, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!getRes.ok) throw new Error(`GitHub API GET error: ${getRes.statusText}`);
    const fileData = await getRes.json();
    const portfolioData = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
    return { portfolioData, fileData, fileUrl };
  };

  // Helper to commit changes
  const commitPortfolioData = async (portfolioData, fileData, fileUrl, commitMessage) => {
    const newContentBase64 = Buffer.from(JSON.stringify(portfolioData, null, 2)).toString('base64');
    const putRes = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: newContentBase64,
        sha: fileData.sha
      })
    });
    if (!putRes.ok) throw new Error(`GitHub API PUT error: ${putRes.statusText}`);
  };

  try {
    // Handle Button Clicks (Callback Queries)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data;

      // Handle simple prompts
      const prompts = {
        'edit_bio': "✏️ <b>Please reply to this message</b> with your new Bio:",
        'edit_title': "✏️ <b>Please reply to this message</b> with your new Title:",
        'edit_status': "✏️ <b>Please reply to this message</b> with your new Status (e.g. 🟢 Open to work):",
        'edit_about': "✏️ <b>Please reply to this message</b> with your new About Me description:",
        'edit_resume': "✏️ <b>Please reply to this message</b> with your new Resume Link (URL):",
        'add_achievement': "🏆 <b>Please reply to this message</b> to add an Achievement in this format:\n<code>Title | Description | Badge URL | Certificate URL</code>\n\n(Use # for links you don't have)",
        'add_project': "💻 <b>Please reply to this message</b> to add a Project in this format:\n<code>Title | Description | React, Tailwind, NextJS | GitHub URL | Demo URL</code>\n\n(Use # for links you don't have)",
        'update_hero_image': "🌅 <b>Please reply to this message</b> with your new Hero Image URL:"
      };

      if (prompts[data]) {
        await answerCallback(cb.id);
        await sendMessage(chatId, prompts[data], { force_reply: true });
        return res.status(200).send('OK');
      } 
      
      if (data === 'cancel') {
        await answerCallback(cb.id);
        await sendMessage(chatId, "❌ Action cancelled. Type /menu to start again.");
        return res.status(200).send('OK');
      }

      // Handle dynamic menus for Deletion
      if (data === 'del_proj_menu') {
        await answerCallback(cb.id, "Fetching projects...");
        const { portfolioData } = await fetchPortfolioData();
        const projects = portfolioData.projects || [];
        
        if (projects.length === 0) {
          await sendMessage(chatId, "You don't have any projects to delete!");
          return res.status(200).send('OK');
        }

        const keyboard = { inline_keyboard: [] };
        projects.forEach((p, i) => {
          keyboard.inline_keyboard.push([{ text: `🗑️ Delete: ${p.title.substring(0, 20)}`, callback_data: `delete_p_${i}` }]);
        });
        keyboard.inline_keyboard.push([{ text: "❌ Cancel", callback_data: "cancel" }]);

        await sendMessage(chatId, "Select a project to permanently delete:", keyboard);
        return res.status(200).send('OK');
      }

      if (data === 'del_ach_menu') {
        await answerCallback(cb.id, "Fetching achievements...");
        const { portfolioData } = await fetchPortfolioData();
        const achievements = portfolioData.achievements || [];
        
        if (achievements.length === 0) {
          await sendMessage(chatId, "You don't have any achievements to delete!");
          return res.status(200).send('OK');
        }

        const keyboard = { inline_keyboard: [] };
        achievements.forEach((a, i) => {
          keyboard.inline_keyboard.push([{ text: `🗑️ Delete: ${a.title.substring(0, 20)}`, callback_data: `delete_a_${i}` }]);
        });
        keyboard.inline_keyboard.push([{ text: "❌ Cancel", callback_data: "cancel" }]);

        await sendMessage(chatId, "Select an achievement to permanently delete:", keyboard);
        return res.status(200).send('OK');
      }

      // Handle actual deletion execution
      if (data.startsWith('delete_p_') || data.startsWith('delete_a_')) {
        const isProject = data.startsWith('delete_p_');
        const index = parseInt(data.split('_')[2]);
        
        await answerCallback(cb.id, "Deleting...");
        await sendMessage(chatId, "⏳ <i>Deleting item and rebuilding website...</i>");

        const { portfolioData, fileData, fileUrl } = await fetchPortfolioData();
        
        let deletedItemName = "";
        if (isProject) {
          if (!portfolioData.projects) portfolioData.projects = [];
          if (portfolioData.projects[index]) {
            deletedItemName = portfolioData.projects[index].title;
            portfolioData.projects.splice(index, 1);
          }
        } else {
          if (!portfolioData.achievements) portfolioData.achievements = [];
          if (portfolioData.achievements[index]) {
            deletedItemName = portfolioData.achievements[index].title;
            portfolioData.achievements.splice(index, 1);
          }
        }

        await commitPortfolioData(portfolioData, fileData, fileUrl, `🤖 Bot: Deleted ${isProject ? 'Project' : 'Achievement'} (${deletedItemName})`);
        await sendMessage(chatId, `✅ <b>Successfully deleted "${deletedItemName}"!</b>\n\nVercel is now rebuilding your site.`);
        return res.status(200).send('OK');
      }

      await answerCallback(cb.id);
      return res.status(200).send('OK');
    }

    // Handle normal messages
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      if (text === '/cancel') {
        await sendMessage(chatId, "❌ Action cancelled. Type /menu to start again.");
        return res.status(200).send('OK');
      }

      // Show Interactive Menu
      if (text === '/start' || text === '/menu') {
        const keyboard = {
          inline_keyboard: [
            [{ text: "🔴 Update Status Badge", callback_data: "edit_status" }],
            [{ text: "💼 Title", callback_data: "edit_title" }, { text: "👤 Bio", callback_data: "edit_bio" }, { text: "🌅 Hero Image", callback_data: "update_hero_image" }],
            [{ text: "📖 About Me", callback_data: "edit_about" }, { text: "📎 Resume", callback_data: "edit_resume" }],
            [{ text: "💻 Add Project", callback_data: "add_project" }, { text: "🗑️ Delete Project", callback_data: "del_proj_menu" }],
            [{ text: "🏆 Add Achievement", callback_data: "add_achievement" }, { text: "🗑️ Delete Achievement", callback_data: "del_ach_menu" }],
            [{ text: "❌ Cancel", callback_data: "cancel" }]
          ]
        };
        await sendMessage(chatId, "🤖 <b>Portfolio Command Center</b>\n\nSelect an action below or type /cancel to abort at any time.", keyboard);
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
        else if (promptMsg.includes('Hero Image')) { command = 'hero_image'; payload = text; }
        else if (promptMsg.includes('add an Achievement')) { command = 'achievement'; payload = text; }
        else if (promptMsg.includes('add a Project')) { command = 'project'; payload = text; }
      }

      if (!command) {
        await sendMessage(chatId, "I didn't understand that. Type /menu to see your options.");
        return res.status(200).send('OK');
      }

      await sendMessage(chatId, `⏳ <i>Processing your update...</i> This will trigger a Vercel rebuild.`);

      const { portfolioData, fileData, fileUrl } = await fetchPortfolioData();

      if (command === 'bio') portfolioData.hero.bio = payload;
      else if (command === 'title') portfolioData.hero.title = payload;
      else if (command === 'status') portfolioData.hero.status = payload;
      else if (command === 'hero_image') portfolioData.hero.image = payload;
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
      else if (command === 'project') {
        const parts = payload.split('|').map(p => p.trim());
        if (parts.length < 3) {
          await sendMessage(chatId, "❌ Invalid format. Make sure to use the `|` character to separate Title, Description, and Tech Stack.");
          return res.status(200).send('OK');
        }
        if (!portfolioData.projects) portfolioData.projects = [];
        portfolioData.projects.push({
          title: parts[0] || "New Project",
          description: parts[1] || "",
          tech: parts[2] ? parts[2].split(',').map(t => t.trim()) : [],
          github: parts[3] || "#",
          demo: parts[4] || "#"
        });
      }

      await commitPortfolioData(portfolioData, fileData, fileUrl, `🤖 Bot: Added ${command} via Telegram Menu`);
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
    } else if (update.callback_query) {
       await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: update.callback_query.message.chat.id, text: `❌ <b>Error:</b> ${error.message}`, parse_mode: 'HTML' }),
      });
    }
  }

  return res.status(200).send('OK');
}
