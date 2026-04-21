// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const userAuthRoute = require("./routes/user-routes");
const chatRoute = require("./routes/chat-routes");
const { Message } = require("./modals/message");
const { User } = require("./modals/user");
const app = express();
app.use(cors());
app.use(express.json());


const { Expo } = require("expo-server-sdk");
const expo = new Expo();

// 👇 HERE (top-level)
async function sendNotification(receiverId, message, senderId, roomId) {
    try {
        const user = await User.findById(receiverId);
        const sender = await User.findById(senderId);

        if (!user?.expoPushToken) {
            console.log("⚠️ No token for user:", receiverId);
            return;
        }

        if (!Expo.isExpoPushToken(user.expoPushToken)) {
            console.log("❌ Invalid Expo token");
            return;
        }

        const messages = [
            {
                to: user.expoPushToken,
                sound: "default",
                title: sender?.name || "New Message 💬",
                body: message.text,
                data: {
                    roomId: message.roomId,
                    senderId: message.senderId,
                    senderName: sender?.name,
                    userName: user?.name,
                    userId: user?._id,
                },
            },
        ];

        const tickets = await expo.sendPushNotificationsAsync(messages);
        console.log("📲 Notification sent:", tickets);

    } catch (err) {
        console.error("❌ Push error:", err.message);
    }
}

const server = http.createServer(app);

// Track which userIds are active in each room
// { roomId: Set(userId1, userId2) }
const activeUsersInRoom = {};

// Map socketId → { roomId, userId } for cleanup on disconnect
const socketToUser = {};

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// 🔗 MongoDB connect
mongoose.connect("mongodb+srv://real-time-chat:Chat123@cluster1.dvz4crq.mongodb.net/chatapp?retryWrites=true&w=majority")
    .then(() => {
        console.log("MongoDB connected ✅");

        server.listen(3001, () => {
            console.log("Server running on port 3001");
        });

    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

// Routes
app.use("/user", userAuthRoute);
app.use("/chat", chatRoute);


// 🔌 Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // Join a chat room (roomId = sorted combination of two user IDs)
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`📌 Socket ${socket.id} joined room: ${roomId}`);
    });

    // User is actively viewing the chat screen
    socket.on("inChat", ({ roomId, userId }) => {
        // Track userId (not socket.id!) in the room
        if (!activeUsersInRoom[roomId]) {
            activeUsersInRoom[roomId] = new Set();
        }
        activeUsersInRoom[roomId].add(userId);

        // Map this socket to the user info for disconnect cleanup
        socketToUser[socket.id] = { roomId, userId };

        console.log(`👀 User ${userId} is IN chat room ${roomId} | Active: [${[...activeUsersInRoom[roomId]]}]`);

        socket.to(roomId).emit("userInChat", userId);
    });

    // User leaves the chat screen
    socket.on("leaveChat", ({ roomId, userId }) => {
        if (activeUsersInRoom[roomId]) {
            activeUsersInRoom[roomId].delete(userId);
        }

        // Clean up socket mapping
        delete socketToUser[socket.id];

        console.log(`🚪 User ${userId} LEFT chat room ${roomId} | Active: [${[...(activeUsersInRoom[roomId] || [])]}]`);

        socket.to(roomId).emit("userLeaveChat");
        socket.leave(roomId);
    });

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
        const { roomId, senderId, receiverId, text } = data;

        // Check if the RECEIVER's userId is in the active set
        const isReceiverInChat = activeUsersInRoom[roomId]?.has(receiverId);

        console.log(`🔍 Checking receiver ${receiverId} in room ${roomId}: ${isReceiverInChat} | Active: [${[...(activeUsersInRoom[roomId] || [])]}]`);

        try {
            // Save message to DB
            const message = await Message.create({
                roomId,
                senderId,
                receiverId,
                text,
            });

            // Emit the message to everyone in the room
            io.to(roomId).emit("receiveMessage", message);
            console.log(`💬 Message in room ${roomId}: ${text}`);

            if (!isReceiverInChat) {
                console.log("📩 Send push notification here", receiverId);

                await sendNotification(receiverId, message, senderId, roomId);
                // call FCM / Expo push notification
            }
        } catch (error) {
            console.error("Error saving message:", error.message);
        }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
        socket.to(data.roomId).emit("userTyping", data);
    });

    socket.on("stopTyping", (data) => {
        socket.to(data.roomId).emit("userStopTyping", data);
    });

    // Clean up on disconnect (handles app kill / network loss)
    socket.on("disconnect", () => {
        const userInfo = socketToUser[socket.id];
        if (userInfo) {
            const { roomId, userId } = userInfo;
            if (activeUsersInRoom[roomId]) {
                activeUsersInRoom[roomId].delete(userId);
            }
            delete socketToUser[socket.id];
            console.log(`❌ User ${userId} disconnected & removed from room ${roomId}`);
        } else {
            console.log("❌ User disconnected:", socket.id);
        }
    });
});

