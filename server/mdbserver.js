import dotenv from "dotenv";
dotenv.config();
import WebSocket, { WebSocketServer } from "ws";
import { MongoClient } from "mongodb";
import * as emoji from "node-emoji";
import { OpenAI } from "openai";

const PORT = 8080;
const MONGO_URI = process.env.MONGODB_URI;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const server = new WebSocketServer({ port: PORT });
let clients = new Map(); // Store clients with usernames

// MongoDB setup
const client = new MongoClient(MONGO_URI);
let chatCollection;

// Connect to MongoDB and select collection
async function connectDB() {
  try {
    await client.connect();
    const db = client.db("chatdb");
    chatCollection = db.collection("messages");
    console.log("✅ Connected to MongoDB!");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
}
connectDB();

server.on("connection", async (socket) => {
  let username = "";

  socket.on("message", async (message) => {
    message = message.toString();

    if (!username) {
      username = message; // First message is username
      clients.set(username, socket);
      console.log(`🔗 ${username} connected!`);

      // Send chat history from MongoDB
      const history = await chatCollection
        .find()
        .sort({ timestamp: 1 })
        .limit(20)
        .toArray();
      history.forEach((msg) =>
        socket.send(`${msg.timestamp} ${msg.username}: ${msg.message}`)
      );

      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    message = emoji.emojify(message);

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

    // Save message to MongoDB
    await chatCollection.insertOne({ username, message, timestamp });

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

      await chatCollection.insertOne({
        username: "@bot",
        message: botResponse,
        timestamp,
      });

      clients.forEach((client) => client.send(botMessage));
      console.log(`🤖 [BOT REPLY] ${botMessage}`);
    }
  });

  socket.on("close", () => {
    console.log(`❌ ${username} disconnected`);
    clients.delete(username);
  });
});

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);

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
