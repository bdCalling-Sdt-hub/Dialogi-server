const { addChat, getChatByParticipants, getChatById, getChatByParticipantId } = require('../services/chatService');
const { addMessage, getMessageByChatId } = require('../services/messageService');
const logger = require('../helpers/logger');
const jwt = require('jsonwebtoken');
const { upgradeLike, getLikeCountByDiscussion } = require('../services/likeService');
const { upgradeDislike, getDislikeCountByDiscussion } = require('../services/dislikeService');
const { getDiscussionById, getReplyById } = require('../services/discussionService');
const { getMySubscriptionById, getMySubscriptionByUserId, addMySubscription, updateMySubscription, addDefaultSubscription } = require('../services/mySubscriptionService');
const { getUserById } = require('../services/userService');
const { getSubscriptionById } = require('../services/subscriptionService');
require('dotenv').config();

const socketIO = (io) => {

  // io.use((socket, next) => {
  //   const token = socket.handshake.headers.authorization;
  //   if (!token) {
  //     return next(new Error('Authentication error: Token not provided.'));
  //   }

  //   // Extract the token from the Authorization header
  //   const tokenParts = token.split(' ');
  //   const tokenValue = tokenParts[1];

  //   // Verify the token
  //   jwt.verify(tokenValue, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
  //     if (err) {
  //       console.error(err);
  //       return next(new Error('Authentication error: Invalid token.'));
  //     }
  //     // Attach the decoded token to the socket object for further use
  //     socket.decodedToken = decoded;
  //     next();
  //   });
  // });

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

    socket.on("dialogi-access-status", async (data, callback) => {
      try {
        if (data?.userId) {
          const mySubscription = await getMySubscriptionByUserId(data.userId);
          if (!mySubscription) {
            const mydefSub = await addDefaultSubscription(data.userId);
            return callback({ status: "Added", message: "Default subscription added to account", data: mydefSub });
          }

          if (mySubscription && mySubscription.type === 'default') {
            return callback({ status: "Default", message: "To access all activities, update subscription", data: mySubscription });
          }
          if (mySubscription && mySubscription.type !== 'default' && (new Date(new Date().setMonth(new Date().getMonth() + mySubscription.expiryTime)) > new Date())) {
            return callback({ status: "Success", message: "Subscription", data: mySubscription });
          }
          if (mySubscription && mySubscription.type !== 'default' && (new Date(new Date().setMonth(new Date().getMonth() + mySubscription.expiryTime)) < new Date())) {
            const mydefSub = await addDefaultSubscription(data.userId);
            return callback({ status: "Expired", message: "Your subscription expired", data: mydefSub });
          }
        }
        else {
          return callback({ status: "Error", message: "Must provide a valid user id", data: null });
        }
      }
      catch (error) {
        console.error("Error getting subscription:", error.message);
        logger.error(error.message, "socket -> access-status");
        callback({ status: "Error", message: error.message, data: null });
      }
    });

    socket.on("dialogi-content-access", async (data, callback) => {
      try {
        if (data.userId && data.type) {
          var mySubscription = await getMySubscriptionByUserId(data.userId);
          if (!mySubscription) {
            mySubscription = await addDefaultSubscription(data.userId);
          }
          if (data.type === "category") {
            if (mySubscription.isCategoryAccessUnlimited && (new Date(new Date().setMonth(new Date().getMonth() + mySubscription.expiryTime)) > new Date())) {
              return callback({ status: "Unlimited", message: "Category access granted", data: mySubscription });
            }
            else if (!mySubscription.isCategoryAccessUnlimited && mySubscription.categoryAccessNumber > 0 && (new Date(new Date().setMonth(new Date().getMonth() + mySubscription.expiryTime)) > new Date())) {
              mySubscription.categoryAccessNumber = mySubscription.categoryAccessNumber - 1;
              await updateMySubscription(mySubscription._id, mySubscription);
              return callback({ status: "Success", message: "Category access granted", data: mySubscription });
            }
            else{
              return callback({ status: "Expired", message: "Your subscription expired", data: mySubscription });
            }
          }
          if (data.type === "question") {
            if (mySubscription.isQuestionAccessUnlimited && (new Date(new Date().setMonth(new Date().getMonth() + mySubscription.expiryTime)) > new Date())) {
              return callback({ status: "Unlimited", message: "Category access granted", data: mySubscription });
            }
            else if (!mySubscription.isQuestionAccessUnlimited && mySubscription.questionAccessNumber > 0 && (new Date(new Date().setMonth(new Date().getMonth() + mySubscription.expiryTime)) > new Date())) {
              mySubscription.questionAccessNumber = mySubscription.questionAccessNumber - 1;
              await updateMySubscription(mySubscription._id, mySubscription);
              return callback({ status: "Success", message: "Category access granted", data: mySubscription });
            }
            else{
              return callback({ status: "Expired", message: "Your subscription expired", data: mySubscription });
            }
          }
          else{
            return callback({ status: "Error", message: "Invalid type", data: null });
          }
        }
        else {
          return callback({ status: "Error", message: "User Id and Type is required", data: null });
        }
      }
      catch(error) {
        console.error("Error getting subscription:", error.message);
        logger.error(error.message, "socket -> access-status");
        return callback({ status: "Error", message: error.message, data: null });
      }
    });

    socket.on("dialogi-like", async (data, callback) => {
      try {
        const like = await upgradeLike(data);
        const count = await getLikeCountByDiscussion(data.discussion);
        if (data.type === "discussion") {
          const discussion = await getDiscussionById(data.discussion);
          discussion.likes = count;
          await discussion.save();
        } if (data.type === "reply") {
          const reply = await getReplyById(data.reply);
          reply.likes = count;
          await reply.save();
        }
        callback({
          status: "OK",
          message: like.message,
          data: like.data
        });
      }
      catch (error) {
        console.error("Error liking:", error.message);
        callback({ status: "Error", message: error.message, data: null });
      }
    });

    socket.on("dialogi-dislike", async (data, callback) => {
      try {
        const dislike = await upgradeDislike(data);
        const count = await getLikeCountByDiscussion(data.discussion);
        if (data.type === "discussion") {
          const discussion = await getDiscussionById(data.discussion);
          discussion.dislikes = count;
          await discussion.save();
        } if (data.type === "reply") {
          const reply = await getReplyById(data.reply);
          reply.dislikes = count;
          await reply.save();
        }
        callback({
          status: "OK",
          message: dislike.message,
          data: dislike.data
        });
      }
      catch (error) {
        console.error("Error liking:", error.message);
        callback({ status: "Error", message: error.message, data: null });
      }
    });

    socket.on("add-new-chat", async (data, callback) => {
      if (socket.data.subscription === 'default') {
        return callback({
          status: "Error",
          message: "You must have premium plus subscription to enjoy chat feature",
          data: null
        });
      }
      try {
        var chat;
        if (data?.participants?.length >= 2) {
          if (data?.type === "group" && data?.subscription !== 'premium-plus') {
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
      if (socket.data.subscription === 'default') {
        return callback({
          status: "Error",
          message: "You must have premium plus subscription to enjoy chat feature",
          data: null
        });
      }
      try {
        const message = await addMessage(data);
        const eventName = 'new-message::' + data.chat.toString();
        socket.broadcast.emit(eventName, message);
        const chat = await getChatById(data.chat);
        if (chat && chat.type === "single") {
          const eventName1 = 'update-chatlist::' + chat.participants[0].toString();
          const eventName2 = 'update-chatlist::' + chat.participants[1].toString();
          const chatListforUser1 = await getChatByParticipantId({ participantId: chat.participants[0] }, { page: 1, limit: 10 });
          const chatListforUser2 = await getChatByParticipantId({ participantId: chat.participants[1] }, { page: 1, limit: 10 });
          socket.emit(eventName1, chatListforUser1);
          socket.emit(eventName2, chatListforUser2);
        }
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

    socket.on("get-messages", async (data, callback) => {
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