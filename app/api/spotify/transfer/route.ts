import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { spotifyFetch } from "@/lib/spotify";
import { cleanSongTitle } from "@/lib/cleanTitle";

function normalize(text: string) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

// YouTube Music auto-generated channels have " - Topic" suffix
function cleanChannelTitle(channel: string): string {
    return channel
        .replace(/\s*-\s*Topic$/i, "")
        .trim();
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("spotify_access_token")?.value;

    if (!token) {
        return NextResponse.json(
            { error: "Not authenticated with Spotify" },
            { status: 401 }
        );
    }



    const { items, playlistName } = await req.json();

    // 1. Get Spotify user
    const user = await spotifyFetch("me", token);

    // 2. Create playlist
    const playlist = await spotifyFetch(
        `/users/${user.id}/playlists`,
        token,
        {
            method: "POST",
            body: JSON.stringify({
                name: playlistName || "YouTube Playlist",
                public: false,
            }),
        }
    );

    const trackUris: string[] = [];
    const skipped: string[] = [];

    // 3. Search tracks
    for (const item of items) {
        const { artist, track } = cleanSongTitle(item.title);

        if (!track) {
            skipped.push(item.title);
            continue;
        }

        // Use channelTitle as artist fallback if not extracted from title
        const cleanedChannel = item.channelTitle ? cleanChannelTitle(item.channelTitle) : null;
        const effectiveArtist = artist || cleanedChannel || null;

        const q = effectiveArtist
            ? `track:${track} artist:${effectiveArtist}`
            : `track:${track}`;

        const result = await spotifyFetch(
            `/search?q=${encodeURIComponent(q)}&type=track&limit=10`,
            token
        );

        const tracks = result.tracks.items;

        let matched = null;

        const normalizedArtist = effectiveArtist ? normalize(effectiveArtist) : null;
        const normalizedTrack = normalize(track);

        for (const t of tracks) {
            const spotifyTrack = normalize(t.name);
            const spotifyArtists = t.artists.map((a: { name: string }) => normalize(a.name));

            // Title matching: check if one contains the other
            const titleMatch =
                spotifyTrack === normalizedTrack ||
                spotifyTrack.includes(normalizedTrack) ||
                normalizedTrack.includes(spotifyTrack);

            // If we have an artist, require it to match
            if (normalizedArtist) {
                const artistMatch = spotifyArtists.some((a: string) =>
                    a === normalizedArtist ||
                    a.includes(normalizedArtist) ||
                    normalizedArtist.includes(a)
                );

                if (artistMatch && titleMatch) {
                    matched = t;
                    break;
                }
            } else {
                // No artist at all - match on title only (rare case)
                if (titleMatch) {
                    matched = t;
                    break;
                }
            }
        }

        if (!matched) {
            skipped.push(item.title);
            continue;
        }
        trackUris.push(matched.uri);

    }

    // 4. Add tracks (batch of 100)
    for (let i = 0; i < trackUris.length; i += 100) {
        await spotifyFetch(
            `/playlists/${playlist.id}/tracks`,
            token,
            {
                method: "POST",
                body: JSON.stringify({
                    uris: trackUris.slice(i, i + 100),
                }),
            }
        );
    }

    return NextResponse.json({
        playlistUrl: playlist.external_urls.spotify,
        added: trackUris.length,
        skipped,
    });
}
