import { connectDB } from "@/src/lib/mongodb";
import { User } from "@/src/models/User";

export async function GET(req: Request) {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const users = await User.find({ _id: { $ne: id } });

    return Response.json(users);
}