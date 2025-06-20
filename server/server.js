require("dotenv").config();
const WebSocket = require("ws");
const fs = require("fs");
const emoji = require("node-emoji");
const { OpenAI } = require("openai");

const PORT = 8080;
const LOG_FILE = "chat.log";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const server = new WebSocket.Server({ port: PORT });
let clients = new Map(); // Store clients with usernames

// Load chat history
let chatHistory = fs.existsSync(LOG_FILE)
  ? fs.readFileSync(LOG_FILE, "utf-8").split("\n").filter(Boolean)
  : [];

server.on("connection", (socket) => {
  let username = "";

  socket.on("message", async (message) => {
    message = message.toString();

    if (!username) {
      // First message is the username
      username = message;
      clients.set(username, socket);
      console.log(`🔗 ${username} connected!`);
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    message = emoji.emojify(message); // Convert emoji codes to real emojis

    // Private message format: /msg username message
    const pmMatch = message.match(/^\/msg (\w+) (.+)$/);
    if (pmMatch) {
      const targetUser = pmMatch[1];
      const privateMessage = pmMatch[2];

      if (clients.has(targetUser)) {
        clients
          .get(targetUser)
          .send(`(Private) ${timestamp} ${username}: ${privateMessage}`);
        socket.send(
          `(Private) ${timestamp} You -> ${targetUser}: ${privateMessage}`
        );
        console.log(
          `💌 [PRIVATE] ${username} -> ${targetUser}: ${privateMessage}`
        );
      } else {
        socket.send(`❌ User ${targetUser} not found.`);
        console.log(
          `❌ [ERROR] ${username} tried to message non-existent user ${targetUser}`
        );
      }
      return;
    }

    const fullMessage = `${timestamp} ${username}: ${message}`;
    chatHistory.push(fullMessage);
    fs.appendFileSync(LOG_FILE, fullMessage + "\n");

    console.log(`💬 [CHAT] ${fullMessage}`);

    // Broadcast to all clients
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(fullMessage);
      }
    });

    // AI Chatbot Response if message mentions @bot
    if (message.includes("@bot")) {
      console.log(
        `🤖 [BOT TRIGGERED] ${username} asked: ${message
          .replace("@bot", "")
          .trim()}`
      );
      const botResponse = await getAIResponse(
        message.replace("@bot", "").trim()
      );
      const botMessage = `${timestamp} 🤖 @bot: ${botResponse}`;
      clients.forEach((client) => client.send(botMessage));
      fs.appendFileSync(LOG_FILE, botMessage + "\n");
      console.log(`🤖 [BOT REPLY] ${botMessage}`);
    }
  });

  socket.on("close", () => {
    console.log(`❌ ${username} disconnected`);
    clients.delete(username);
  });
});

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);

// AI Chatbot Function
async function getAIResponse(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "I encountered an error processing your request.";
  }
}
