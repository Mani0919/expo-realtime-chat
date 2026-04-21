import { connectDB } from "@/src/lib/mongodb";
import { User } from "@/src/models/User";

export async function POST(req: Request) {
    await connectDB();

    const body = await req.json();

    const { name, phoneNumber } = body;


    if (!phoneNumber) {
        return Response.json({ error: "Phone number required" }, { status: 400 });
    }

    // 🔍 check if user exists
    let user = await User.findOne({ phoneNumber });

    if (!user) {
        // ➕ create new user
        user = await User.create({ name, phoneNumber });
    }

    return Response.json({
        message: "Login success",
        user,
    });
}