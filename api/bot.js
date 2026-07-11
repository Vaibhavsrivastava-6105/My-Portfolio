import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
  const REPO_OWNER = 'Vaibhavsrivastava-6105';
  const REPO_NAME = 'My-Portfolio';
  const FILE_PATH = 'src/data/portfolio.json';

  if (!GITHUB_TOKEN || !TELEGRAM_TOKEN || !process.env.KV_REST_API_URL) {
    return res.status(500).json({ error: 'Missing config' });
  }

  const update = req.body;
  if (!update) return res.status(200).send('OK');

  let incomingChatId = null;
  if (update.message) incomingChatId = update.message.chat.id;
  else if (update.callback_query) incomingChatId = update.callback_query.message.chat.id;

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
      await sendMessage(incomingChatId, "⛔ <b>Unauthorized Access.</b>");
      if (update.callback_query) await answerCallback(update.callback_query.id, "Unauthorized");
      return res.status(200).send('OK');
    }
  }

  // GitHub Helpers
  const fetchPortfolioData = async () => {
    const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getRes = await fetch(fileUrl, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!getRes.ok) throw new Error(`GitHub API GET error`);
    const fileData = await getRes.json();
    const portfolioData = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
    return { portfolioData, fileData, fileUrl };
  };

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
    if (!putRes.ok) throw new Error(`GitHub API PUT error`);
  };

  // State Machine Configuration
  const wizards = {
    add_project: {
      steps: [
        { key: 'title', prompt: "<b>Step 1/5:</b> What is the title of the project?" },
        { key: 'description', prompt: "<b>Step 2/5:</b> Please provide a description." },
        { key: 'tech', prompt: "<b>Step 3/5:</b> List the technologies used, separated by commas (e.g. React, Node, Tailwind)." },
        { key: 'github', prompt: "<b>Step 4/5:</b> Provide the GitHub URL.", skippable: true },
        { key: 'demo', prompt: "<b>Step 5/5:</b> Provide the Live Demo URL.", skippable: true }
      ]
    },
    add_achievement: {
      steps: [
        { key: 'title', prompt: "<b>Step 1/4:</b> What is the title of the achievement?" },
        { key: 'description', prompt: "<b>Step 2/4:</b> Please provide a description." },
        { key: 'badgeUrl', prompt: "<b>Step 3/4:</b> Provide a link to the badge image.", skippable: true },
        { key: 'certificateUrl', prompt: "<b>Step 4/4:</b> Provide a link to the certificate.", skippable: true }
      ]
    }
  };

  const sendWizardPrompt = async (chatId, session) => {
    const wizardDef = wizards[session.action];
    const currentStep = wizardDef.steps[session.step - 1];
    
    let keyboard = { inline_keyboard: [] };
    let row = [];
    if (session.step > 1) row.push({ text: "⬅️ Back", callback_data: "wizard_back" });
    if (currentStep.skippable) row.push({ text: "⏭️ Skip", callback_data: "wizard_skip" });
    if (row.length > 0) keyboard.inline_keyboard.push(row);
    keyboard.inline_keyboard.push([{ text: "❌ Cancel", callback_data: "cancel" }]);

    await sendMessage(chatId, currentStep.prompt, { ...keyboard, force_reply: true });
  };

  const sendConfirmation = async (chatId, session) => {
    let preview = `<b>Preview:</b>\n\n`;
    for (const [key, value] of Object.entries(session.draft)) {
      preview += `<b>${key}:</b> ${value}\n`;
    }
    preview += `\nAre you sure you want to push this to your live website?`;

    const keyboard = {
      inline_keyboard: [
        [{ text: "✅ Confirm & Push", callback_data: "wizard_confirm" }],
        [{ text: "⬅️ Back to Edit", callback_data: "wizard_back" }, { text: "❌ Discard", callback_data: "cancel" }]
      ]
    };
    await sendMessage(chatId, preview, keyboard);
  };

  try {
    let session = await redis.get(`session:${incomingChatId}`);

    // --- HANDLE CALLBACK QUERIES (BUTTON CLICKS) ---
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data;

      if (data === 'cancel') {
        await redis.del(`session:${chatId}`);
        await answerCallback(cb.id);
        await sendMessage(chatId, "❌ Action cancelled. Type /menu to start again.");
        return res.status(200).send('OK');
      }

      // Start new Wizard
      if (wizards[data]) {
        session = { action: data, step: 1, draft: {} };
        await redis.set(`session:${chatId}`, session);
        await answerCallback(cb.id);
        await sendWizardPrompt(chatId, session);
        return res.status(200).send('OK');
      }

      // Wizard Navigation
      if (session && data === 'wizard_back') {
        if (session.step > 1) {
          session.step--;
          await redis.set(`session:${chatId}`, session);
          await answerCallback(cb.id);
          await sendWizardPrompt(chatId, session);
        } else {
          await answerCallback(cb.id);
        }
        return res.status(200).send('OK');
      }

      if (session && data === 'wizard_skip') {
        const wizardDef = wizards[session.action];
        const currentStep = wizardDef.steps[session.step - 1];
        
        session.draft[currentStep.key] = "#"; // Default skip value
        
        if (session.step < wizardDef.steps.length) {
          session.step++;
          await redis.set(`session:${chatId}`, session);
          await answerCallback(cb.id);
          await sendWizardPrompt(chatId, session);
        } else {
          session.step++; // Move to confirmation step
          await redis.set(`session:${chatId}`, session);
          await answerCallback(cb.id);
          await sendConfirmation(chatId, session);
        }
        return res.status(200).send('OK');
      }

      if (session && data === 'wizard_confirm') {
        await answerCallback(cb.id, "Pushing to GitHub...");
        await sendMessage(chatId, `⏳ <i>Processing your update...</i> This will trigger a Vercel rebuild.`);

        const { portfolioData, fileData, fileUrl } = await fetchPortfolioData();

        if (session.action === 'add_project') {
          if (!portfolioData.projects) portfolioData.projects = [];
          portfolioData.projects.push({
            title: session.draft.title,
            description: session.draft.description,
            tech: session.draft.tech.split(',').map(t => t.trim()),
            github: session.draft.github,
            demo: session.draft.demo
          });
        } else if (session.action === 'add_achievement') {
          if (!portfolioData.achievements) portfolioData.achievements = [];
          portfolioData.achievements.push({
            title: session.draft.title,
            description: session.draft.description,
            badgeUrl: session.draft.badgeUrl,
            certificateUrl: session.draft.certificateUrl
          });
        }

        await commitPortfolioData(portfolioData, fileData, fileUrl, `🤖 Bot: Finished ${session.action} wizard`);
        await redis.del(`session:${chatId}`);
        await sendMessage(chatId, "✅ <b>Successfully updated GitHub!</b>\n\nVercel is now rebuilding your site. Changes will be live in ~1 minute.");
        return res.status(200).send('OK');
      }

      // Simple Text Edits via state
      const simpleEdits = ['edit_bio', 'edit_title', 'edit_status', 'edit_about', 'edit_resume', 'update_hero_image'];
      if (simpleEdits.includes(data)) {
        session = { action: data, step: 1, draft: {} };
        await redis.set(`session:${chatId}`, session);
        await answerCallback(cb.id);
        const prompt = `✏️ <b>Please reply to this message</b> with your new value for ${data.replace('edit_', '').replace('_', ' ')}:`;
        await sendMessage(chatId, prompt, { force_reply: true, inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] });
        return res.status(200).send('OK');
      }

      // Dynamic Deletion Menus (Stateless)
      if (data === 'del_proj_menu' || data === 'del_ach_menu') {
        await answerCallback(cb.id, "Fetching items...");
        const { portfolioData } = await fetchPortfolioData();
        const items = data === 'del_proj_menu' ? (portfolioData.projects || []) : (portfolioData.achievements || []);
        
        if (items.length === 0) {
          await sendMessage(chatId, "You don't have any items to delete!");
          return res.status(200).send('OK');
        }

        const keyboard = { inline_keyboard: [] };
        const prefix = data === 'del_proj_menu' ? 'delete_p_' : 'delete_a_';
        items.forEach((item, i) => {
          keyboard.inline_keyboard.push([{ text: `🗑️ Delete: ${item.title.substring(0, 20)}`, callback_data: `${prefix}${i}` }]);
        });
        keyboard.inline_keyboard.push([{ text: "❌ Cancel", callback_data: "cancel" }]);

        await sendMessage(chatId, "Select an item to permanently delete:", keyboard);
        return res.status(200).send('OK');
      }

      if (data.startsWith('delete_p_') || data.startsWith('delete_a_')) {
        const isProject = data.startsWith('delete_p_');
        const index = parseInt(data.split('_')[2]);
        
        await answerCallback(cb.id, "Deleting...");
        await sendMessage(chatId, "⏳ <i>Deleting item and rebuilding website...</i>");

        const { portfolioData, fileData, fileUrl } = await fetchPortfolioData();
        
        let deletedItemName = "";
        const targetArray = isProject ? portfolioData.projects : portfolioData.achievements;
        
        if (targetArray && targetArray[index]) {
          deletedItemName = targetArray[index].title;
          targetArray.splice(index, 1);
        }

        await commitPortfolioData(portfolioData, fileData, fileUrl, `🤖 Bot: Deleted ${deletedItemName}`);
        await sendMessage(chatId, `✅ <b>Successfully deleted "${deletedItemName}"!</b>\n\nVercel is now rebuilding your site.`);
        return res.status(200).send('OK');
      }

      await answerCallback(cb.id);
      return res.status(200).send('OK');
    }

    // --- HANDLE TEXT MESSAGES ---
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      if (text === '/cancel') {
        await redis.del(`session:${chatId}`);
        await sendMessage(chatId, "❌ Action cancelled. Type /menu to start again.");
        return res.status(200).send('OK');
      }

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

      // Handle Wizard Input
      if (session && session.action.startsWith('add_')) {
        const wizardDef = wizards[session.action];
        const currentStep = wizardDef.steps[session.step - 1];
        
        // Save the input
        session.draft[currentStep.key] = text;

        if (session.step < wizardDef.steps.length) {
          session.step++;
          await redis.set(`session:${chatId}`, session);
          await sendWizardPrompt(chatId, session);
        } else {
          session.step++; // Move to confirmation
          await redis.set(`session:${chatId}`, session);
          await sendConfirmation(chatId, session);
        }
        return res.status(200).send('OK');
      }

      // Handle Simple Edit Input
      if (session && session.action.startsWith('edit_') || session?.action === 'update_hero_image') {
        await sendMessage(chatId, `⏳ <i>Processing your update...</i>`);

        const { portfolioData, fileData, fileUrl } = await fetchPortfolioData();

        if (session.action === 'edit_bio') portfolioData.hero.bio = text;
        else if (session.action === 'edit_title') portfolioData.hero.title = text;
        else if (session.action === 'edit_status') portfolioData.hero.status = text;
        else if (session.action === 'update_hero_image') portfolioData.hero.image = text;
        else if (session.action === 'edit_resume') portfolioData.hero.resumeLink = text;
        else if (session.action === 'edit_about') portfolioData.about.description = text;

        await commitPortfolioData(portfolioData, fileData, fileUrl, `🤖 Bot: Updated via Telegram Menu`);
        await redis.del(`session:${chatId}`);
        await sendMessage(chatId, "✅ <b>Successfully updated GitHub!</b>\n\nVercel is now rebuilding your site.");
        return res.status(200).send('OK');
      }

      // If we got here, it's an unrecognized message
      await sendMessage(chatId, "I didn't understand that. Type /menu to see your options.");
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
