import mongoose from "mongoose";

const MONGO_URI = process.env.EXPO_PUBLIC_MONGO_URI!;

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI).then((mongoose) => mongoose);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}