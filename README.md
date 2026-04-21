# Expo Realtime Chat 🚀

A full-stack real-time chat application built using Expo (React Native), Node.js, Socket.IO, and MongoDB. This app enables instant messaging with real-time updates, push notifications, and user presence tracking.

## ✨ Features

- 💬 Real-time messaging using Socket.IO
- 🔔 Push notifications with Expo Notifications
- 👀 User presence tracking (online / in-chat detection)
- ⌨️ Typing indicators
- 📥 Message persistence with MongoDB
- 📱 Cross-platform mobile app (Android & iOS with Expo)
- 🔗 Deep linking to specific chat rooms via notifications

## 🧱 Tech Stack

### Frontend
- Expo (React Native)
- Expo Router
- AsyncStorage
- Expo Notifications

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB (Mongoose)

## 🔄 How It Works

1. Users connect via Socket.IO
2. Messages are sent and broadcast in real-time
3. Messages are stored in MongoDB
4. If the receiver is not active in chat, a push notification is triggered
5. Tapping the notification opens the correct chat room

## 🚀 Getting Started

### Backend

```bash
cd backend
npm install
npm start
