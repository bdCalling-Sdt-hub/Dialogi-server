const { addChat, getChatByParticipants } = require('../services/chatService');
const { addMessage, getMessageByChatId } = require('../services/messageService');
const logger = require('../helpers/logger');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const socketIO = (io) => {

  io.use((socket, next) => {
    const token = socket.handshake.headers.authorization;
    if (!token) {
      return next(new Error('Authentication error: Token not provided.'));
    }

    // Extract the token from the Authorization header
    const tokenParts = token.split(' ');
    const tokenValue = tokenParts[1];

    // Verify the token
    jwt.verify(tokenValue, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        console.error(err);
        return next(new Error('Authentication error: Invalid token.'));
      }
      // Attach the decoded token to the socket object for further use
      socket.decodedToken = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    //console.log(`ID: ${socket.id} just connected`);

    socket.on("join-room", (data, callback) => {
      //console.log('someone wants to join--->', data);
      if (data?.roomId) {
        socket.join("room" + data.roomId);
        callback("Join room successful");
      } else {
        callback("Must provide a valid user id");
      }
    });

    socket.on("add-new-chat", async (data, callback) => {
      if (socket.decodedToken.subscription === 'default') {
        return callback({
          status: "Error",
          message: "You must have premium plus subscription to enjoy chat feature",
          data: null
        });
      }
      try {
        var chat;
        if (data?.participants?.length >= 2) {
          if (data?.type === "group" && socket.decodedToken.subscription !== 'premium-plus') {
            return callback({
              status: "Error",
              message: "You must have premium plus subscription to create group chat",
              data: null
            });
          }
          chat = await getChatByParticipants(data);
          if (chat) {
            return callback({
              status: "Success",
              data: {
                chatId: chat._id,
              },
              message: "Chat already exists"
            });
          }
          chat = await addChat(data);
          callback({
            status: "Success",
            data: {
              chatId: chat._id,
            },
            message: "Chat created successfully",
          });
          data.participants.forEach((participant) => {
            const roomID = 'chat-notification::' + participant.toString();
            io.emit(roomID, { status: "Success", message: "New chat created", data: null });
          });
          return;
        } else {
          callback({
            status: "Error",
            message: "Must provide at least 2 participants",
            data: null
          });
        }
      } catch (error) {
        console.error("Error adding new chat:", error.message);
        logger.error("Error adding new chat:", error.message);
        callback({ status: "Error", message: error.message, data: null });
      }
    });

    socket.on("add-new-message", async (data, callback) => {
      if (socket.decodedToken.subscription === 'default') {
        return callback({
          status: "Error",
          message: "You must have premium plus subscription to enjoy chat feature",
          data: null
        });
      }
      try {

        const message = await addMessage(data);

        // const myChat = await chatService.getChatById(message.chat);

        // const roomID = (myChat.participants[0] === data?.sender ? myChat.participants[1] : myChat.participants[0]).toString();

        // const chats = await chatService.getChats(
        //   data?.filter,
        //   data?.options,
        //   data?.userId
        // );

        // io.to("room" + message.chat).emit("chat-list", chats);

        const roomIDs = message?.chat?.participants?.map(participant => 'chat-notification::' + participant.toString()) || [];
        console.log('roomIDs--->', roomIDs, message?.chat?.participants);
        io.emit(roomIDs, message);
        callback({
          status: "Success",
          message: "Message send successfully",
          data: message
        });
      } catch (error) {
        console.error("Error adding new message:", error.message);
        logger.error("Error adding new message:", error.message);
      }
    });

    // get message by chat id

    socket.on("get-messages", async (data, callback) => {
      console.log("get-messages info---->", data);
      try {
        const messages = await messageService.getMessageByChatId(data.chatId);
        if (messages.length > 0) {
          callback({ status: "Success", message: "Messages", data: messages });
        }
      } catch (error) {
        console.error("Error getting messages:", error.message);
        logger.error("Error getting messages:", error.message);
        callback({ status: "Error", message: error.message });
      }
    });

    socket.on("chat-list", async (data, callback) => {
      try {
        console.log("chat list info---->", data);
        const chats = await chatService.getChats(
          data?.filter,
          data?.options,
          data?.userId
        );
        if (chats.length > 0) {
          callback({ status: "Success", message: "Chat list", data: chats });
        }
      } catch (error) {
        console.error("Error getting chat list:", error.message);
        logger.error("Error getting chat list:", error.message);
        callback({ status: "Error", message: error.message });
      }
    });

    socket.on("leave-room", (data) => {
      if (data?.roomId) {
        socket.leave("room" + data.roomId);
      }
    });

    socket.on("typing", function (data) {
      socket.broadcast.to(socket.roomId).emit("startedTyping", data);
    });

    socket.on("typingStopped", function (data) {
      socket.broadcast.to(socket.roomId).emit("stoppedTyping", data);
    });

    socket.on('disconnect', () => {
      console.log(`ID: ${socket.id} disconnected`);
    });
  });
};

module.exports = socketIO;