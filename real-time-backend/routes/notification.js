// routes/notification.js

const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const { User } = require("../modals/user");

router.post("/send-notification", async (req, res) => {
    try {
        const { receiverId, message, roomId } = req.body;

        // 🔍 find user
        const user = await User.findById(receiverId);

        if (!user || !user.expoPushToken) {
            return res.status(400).json({ error: "User or token not found" });
        }

        // 📩 notification payload
        const notification = {
            to: user.expoPushToken,
            sound: "default",
            title: "New Message 💬",
            body: message,
            data: { message, roomId, senderId, userName: user?.name, userId: user?._id },
        };

        // 🚀 send to Expo push service
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(notification),
        });

        const data = await response.json();

        return res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Notification failed" });
    }
});

module.exports = router;