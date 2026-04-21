import mongoose from "mongoose";

let isConnected = false;

export async function GET() {
    console.log(process.env.EXPO_PUBLIC_MONGO_URI)
    if (!isConnected) {
        await mongoose.connect(process.env.EXPO_PUBLIC_MONGO_URI!);
        isConnected = true;
    }

    return Response.json({ message: "MongoDB connected 🚀" });
}