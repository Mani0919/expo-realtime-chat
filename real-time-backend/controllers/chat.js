const { User } = require("../modals/user");
const { Message } = require("../modals/message");

// GET /chat/users?id=currentUserId
async function getUsers(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "User ID required" });
    }

    try {
        const users = await User.find({ _id: { $ne: id } });
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({
            error: "Something went wrong",
            details: error.message,
        });
    }
}

// GET /chat/messages?roomId=xxx
async function getMessages(req, res) {
    const { roomId } = req.query;

    if (!roomId) {
        return res.status(400).json({ error: "Room ID required" });
    }

    try {
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
        return res.status(200).json({ messages });
    } catch (error) {
        return res.status(500).json({
            error: "Something went wrong",
            details: error.message,
        });
    }
}

module.exports = { getUsers, getMessages };
