// const WebSocket = require("ws");
// const readline = require("readline");
// const chalk = require("chalk");
// const emoji = require("node-emoji");
import WebSocket from "ws";
import readline from "readline";
import chalk from "chalk";
import * as emoji from "node-emoji";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const socket = new WebSocket("ws://localhost:8080");

let username = "";

// Ask for a username first
rl.question(chalk.blue("Enter your username: "), (name) => {
  username = name.trim();
  console.log(chalk.green(`👋 Welcome, ${username}! Start chatting below:`));
  socket.send(username); // Send username to the server
  rl.setPrompt(chalk.yellow(`${username}: `));
  rl.prompt();
});

socket.on("open", () => {
  console.log(chalk.green("✅ Connected to WebSocket server!"));
});

socket.on("message", (data) => {
  const messageText = data.toString();
  const formattedMessage = emoji.emojify(messageText); // Convert emoji codes
  if (formattedMessage.includes("(Private)")) {
    console.log(chalk.magenta(`\n💌 ${formattedMessage}`));
  } else if (formattedMessage.includes("@bot")) {
    console.log(chalk.green(`\n🤖 ${formattedMessage}`));
  } else {
    console.log(`\n💬 ${chalk.cyan(formattedMessage)}`);
  }
  rl.prompt(true);
});

rl.on("line", (message) => {
  if (message.trim()) {
    socket.send(message);
  }
  rl.prompt();
});

socket.on("close", () => {
  console.log(chalk.red("❌ Disconnected from server"));
  process.exit(0);
});
