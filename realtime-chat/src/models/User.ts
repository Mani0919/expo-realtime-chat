import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true, // 🔥 important (no duplicate users)
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

export const User =
    mongoose.models.User || mongoose.model("User", UserSchema);