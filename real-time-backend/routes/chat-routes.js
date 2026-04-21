const express = require("express");
const { getUsers, getMessages } = require("../controllers/chat");

const router = express.Router();

// GET /chat/users?id=currentUserId — returns all users except current
router.get("/users", getUsers);

// GET /chat/messages?roomId=xxx — returns all messages in a room
router.get("/messages", getMessages);

module.exports = router;
