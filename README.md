# CLI Chat

A real-time command-line chat application with AI bot integration, featuring multiple server implementations with different storage and AI capabilities.

## Features

- 🔄 **Real-time messaging** via WebSocket connections
- 🤖 **AI Bot integration** with OpenAI GPT models
- 📦 **Multiple server options**:
  - Basic file-based logging (`server.js`)
  - MongoDB storage (`mdbserver.js`)
  - Vector embeddings with semantic search (`mdbVectorServer.js`)
- 🎨 **Colorized terminal interface** with emoji support
- 🔍 **Intelligent context retrieval** for bot responses (vector server)
- 💾 **Persistent chat history**

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (for database servers)
- OpenAI API key
- MongoDB Atlas account (for vector search functionality)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd cli-chat
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   Create a `.env` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   MONGODB_URI=your_mongodb_connection_string_here
   ```

4. **MongoDB Atlas Vector Search Setup** (for `mdbVectorServer.js` only)

   If using the vector server, create a vector search index in MongoDB Atlas:

   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 1536,
         "similarity": "cosine"
       }
     ]
   }
   ```

   Name the index: `message_vector_index`

## Getting Started

### Choose Your Server

The project includes three different server implementations:

#### 1. Basic Server (`server.js`)

- File-based chat logging
- Basic AI bot functionality
- Simple setup, no database required

```bash
node server/server.js
```

#### 2. MongoDB Server (`mdbserver.js`)

- MongoDB storage for chat messages
- AI bot with persistent message history
- Requires MongoDB connection

```bash
node server/mdbserver.js
```

#### 3. Vector Server (`mdbVectorServer.js`) - **Recommended**

- MongoDB storage with vector embeddings
- Semantic search for intelligent context retrieval
- Advanced AI responses based on chat history
- Requires MongoDB Atlas with vector search

```bash
node server/mdbVectorServer.js
```

### Start the Client

In a separate terminal (or multiple terminals for multiple users):

```bash
node client/client.js
```

## Usage

### Basic Chat

1. **Start a server** (choose one of the three options above)
2. **Launch the client(s)** - you can run multiple clients for different users
3. **Enter your username** when prompted
4. **Start chatting!**

### Interacting with the AI Bot

To trigger the AI bot, mention `@bot` in your message:

```
john: @bot what's the weather like?
🤖 @bot: I don't have access to real-time weather data, but I can help you with other questions!

sarah: @bot can you summarize our conversation?
🤖 @bot: Based on our chat history, you've been discussing...
```

### Special Features

- **Emoji support**: Use emoji codes like `:smile:` or `:rocket:`
- **Real-time messaging**: All connected users see messages instantly
- **Smart context** (vector server): The bot remembers and references previous conversations
- **Persistent storage**: Chat history is saved and retrievable

## Server Comparison

| Feature           | Basic Server | MongoDB Server | Vector Server       |
| ----------------- | ------------ | -------------- | ------------------- |
| Storage           | File-based   | MongoDB        | MongoDB + Vectors   |
| AI Bot            | ✅           | ✅             | ✅                  |
| Context Awareness | Limited      | Basic          | Advanced (Semantic) |
| Setup Complexity  | Low          | Medium         | High                |
| Performance       | Good         | Better         | Best                |
| Recommended For   | Development  | Production     | AI-Heavy Use        |

## API Costs & Optimization

The vector server optimizes OpenAI API usage by:

- Only generating embeddings for messages containing `@bot`
- Storing embeddings for both user queries and bot responses
- Using semantic search to provide relevant context
- Avoiding unnecessary API calls for regular chat messages

## Development

### Project Structure

```
cli-chat/
├── client/
│   └── client.js          # Terminal chat client
├── server/
│   ├── server.js          # Basic file-based server
│   ├── mdbserver.js       # MongoDB server
│   └── mdbVectorServer.js # Vector embedding server
├── package.json
├── chat.log              # Chat history (basic server)
└── .env                  # Environment variables
```

### Dependencies

- **ws**: WebSocket server and client
- **chalk**: Terminal colors and styling
- **node-emoji**: Emoji support
- **mongodb**: MongoDB driver
- **openai**: OpenAI API client
- **dotenv**: Environment variable management
- **readline**: Terminal input handling

## Troubleshooting

### Common Issues

1. **Connection refused**

   - Ensure the server is running on port 8080
   - Check firewall settings

2. **MongoDB connection errors**

   - Verify your `MONGODB_URI` in `.env`
   - Ensure MongoDB service is running
   - Check network connectivity to MongoDB Atlas

3. **OpenAI API errors**

   - Verify your `OPENAI_API_KEY` in `.env`
   - Check API quota and billing status
   - Ensure you have access to the required models

4. **Vector search not working**
   - Confirm vector search index is created in MongoDB Atlas
   - Verify index name matches `message_vector_index`
   - Check that embeddings are being stored in the database

### Logs

- Server logs display in the terminal running the server
- Chat history is saved to `chat.log` (basic server) or MongoDB (database servers)
- Use MongoDB Compass or Atlas interface to inspect stored data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
