// Install dependencies before running:
// npm install @whiskeysockets/baileys qrcode-terminal

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

const OWNER_NUMBER = "2349050704741@s.whatsapp.net"; 
// Replace with your WhatsApp number in this format: 2348123456789@s.whatsapp.net

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  // QR Display & Connection Updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 Scan the QR code below using WhatsApp -> Linked Devices\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ Bot connected successfully");
      await sock.sendMessage(OWNER_NUMBER, {
        text: "✅ WhatsApp Bot is now connected!"
      });
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("⚠️ Connection closed. Reason:", reason);

      // Avoid trying to send messages when disconnected
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔁 Attempting to reconnect...");
        startBot(); // auto-reconnect
      } else {
        console.log("🚫 Bot logged out. Delete ./auth_info and re-scan QR code.");
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Command Handler
  const startTime = Date.now();

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || !msg.key.remoteJid) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text.startsWith(".")) return; // Commands must start with '.'
    const command = text.slice(1).trim().toLowerCase();

    await sock.readMessages([msg.key]); // mark as read

    switch (command) {
      case "tagall": {
        if (!from.endsWith("@g.us")) {
          await sock.sendMessage(from, {
            text: "⚠️ This command only works in groups."
          });
          return;
        }

        const metadata = await sock.groupMetadata(from).catch(() => null);
        if (!metadata)
          return sock.sendMessage(from, { text: "Could not fetch group info." });

        let mentions = [];
        let message = "➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤
╭──────────────────────────────╮
│ 🤖 *HON. AJIBOLA BOT™* ⚡
│   Your Digital Right-Hand
│──────────────────────────────│
│   _Automate_ ⚙️
│   _Elevate_ 🚀
│   _Dominate_ 👑
╰──────────────────────────────╯
➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤
`;

      for (let member of metadata.participants) {
        mentions.push(member.id);
        message += `📍 @${member.id.split("@")[0]}\n`;
      }

      message += `
────────────── ⚡──────────────
    Developed by *Hon. Ajibola*
    © 2025 All Rights Reserved
    🔗 https://wa.link/z6zrve
────────────── ⚡──────────────`;
        }

        await sock.sendMessage(from, {
          text: message.trim(),
          mentions
        });
        break;
      }

      case "ping": {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hrs = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        const secs = uptime % 60;

        const reply = `🏓 *Bot Uptime:*\n${hrs}h ${mins}m ${secs}s`;
        await sock.sendMessage(from, { text: reply });
        break;
      }

      case "help": {
        const helpText = `
🧭 *Available Commands:*

1️⃣ .tagall - Mention all group members  
2️⃣ .ping - Check bot uptime  
3️⃣ .help - Show this help menu  

👑 *Owner:* Caleb
        `.trim();

        await sock.sendMessage(from, { text: helpText });
        break;
      }

      default:
        await sock.sendMessage(from, {
          text: "❓ Unknown command. Type *.help* to see available commands."
        });
    }
  });
}

// Start the bot
startBot();
