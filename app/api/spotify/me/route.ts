import { cookies } from "next/headers";
import { spotifyFetch } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("spotify_access_token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const user = await spotifyFetch("/me", token);
        return NextResponse.json({
            connected: true,
            user: {
                id: user.id,
                display_name: user.display_name,
                email: user.email,
            },
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}
