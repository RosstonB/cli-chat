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
let clients = new Map();

// MongoDB setup
const client = new MongoClient(MONGO_URI);
let chatCollection;
async function connectDB() {
  await client.connect();
  chatCollection = client.db("chatdb").collection("messages");
  console.log("✅ Connected to MongoDB!");
}
connectDB();

server.on("connection", async (socket) => {
  let username = "";

  socket.on("message", async (message) => {
    message = message.toString();

    if (!username) {
      username = message;
      clients.set(username, socket);
      console.log(`🔗 ${username} connected!`);
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    message = emoji.emojify(message);

    const fullMessage = `${timestamp} ${username}: ${message}`;
    console.log(`💬 [CHAT] ${fullMessage}`);

    // Store in MongoDB (without embedding for regular messages)
    await chatCollection.insertOne({ username, message, timestamp });

    // Broadcast message to all clients
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(fullMessage);
      }
    });

    // AI Bot response if mentioned
    if (message.includes("@bot")) {
      console.log(
        `🤖 [BOT TRIGGERED] ${username} asked: ${message
          .replace("@bot", "")
          .trim()}`
      );

      // Generate embedding only for bot messages
      const embedding = await getEmbedding(message);

      const relevantMessages = await retrieveRelevantMessages(embedding);
      const botResponse = await getAIResponse(
        message.replace("@bot", "").trim(),
        relevantMessages
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

// Generate vector embedding for a message
async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding Error:", error);
    return [];
  }
}

// Retrieve relevant past messages using vector search
async function retrieveRelevantMessages(queryEmbedding) {
  const results = await chatCollection
    .aggregate([
      {
        $vectorSearch: {
          index: "message_vector_index", // Make sure to create this index in MongoDB Atlas
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5,
        },
      },
    ])
    .toArray();

  return results.map((doc) => doc.message).join("\n");
}

// AI response with retrieved context
async function getAIResponse(prompt, context) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI chatbot that remembers previous messages.",
        },
        {
          role: "user",
          content: `Here is the chat history:\n${context}\nUser: ${prompt}`,
        },
      ],
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "I encountered an error processing your request.";
  }
}
