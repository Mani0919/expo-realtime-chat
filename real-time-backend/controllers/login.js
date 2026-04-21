const { User } = require("../modals/user");

async function Login(req, res) {
    console.log("..");

    const { name, phoneNumber, expoPushToken } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number required" });
    }

    try {
        let user = await User.findOne({ phoneNumber });

        if (!user) {
            user = await User.create({ name, phoneNumber, expoPushToken });
        }

        return res.status(200).json({
            message: "Login success",
            user,
        });
    } catch (error) {
        return res.status(500).json({
            error: "Something went wrong",
            details: error.message,
        });
    }
}

module.exports = { Login };