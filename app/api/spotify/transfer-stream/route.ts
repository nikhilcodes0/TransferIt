import { cookies } from "next/headers";
import { spotifyFetch } from "@/lib/spotify";
import { cleanSongTitle } from "@/lib/cleanTitle";

function normalize(text: string) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "") // Keep spaces for word matching
        .replace(/\s+/g, " ")
        .trim();
}

// YouTube Music auto-generated channels have " - Topic" suffix
function cleanChannelTitle(channel: string): string {
    return channel
        .replace(/\s*-\s*Topic$/i, "")
        .trim();
}

type YouTubeItem = {
    videoId: string;
    title: string;
    channelTitle: string;
};

type SSEMessage =
    | { type: "progress"; current: number; total: number; title: string; status: "matched" | "skipped"; spotifyTrack?: string; spotifyArtist?: string; skipReason?: string }
    | { type: "complete"; playlistUrl: string; added: number; skipped: number }
    | { type: "error"; message: string }
    | { type: "start"; playlistName: string; total: number };

function sendSSE(controller: ReadableStreamDefaultController, data: SSEMessage) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(message));
}

// Calculate similarity between two strings (Dice coefficient)
function similarity(s1: string, s2: string): number {
    const n1 = normalize(s1);
    const n2 = normalize(s2);

    if (n1 === n2) return 1;
    if (n1.length < 2 || n2.length < 2) return 0;

    const bigrams1 = new Set<string>();
    for (let i = 0; i < n1.length - 1; i++) {
        bigrams1.add(n1.substring(i, i + 2));
    }

    let matches = 0;
    for (let i = 0; i < n2.length - 1; i++) {
        if (bigrams1.has(n2.substring(i, i + 2))) {
            matches++;
        }
    }

    return (2 * matches) / (n1.length - 1 + n2.length - 1);
}

async function searchSpotify(query: string, token: string) {
    const result = await spotifyFetch(
        `/search?q=${encodeURIComponent(query)}&type=track&limit=15`,
        token
    );
    return result.tracks?.items || [];
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("spotify_access_token")?.value;

    if (!token) {
        return new Response(
            JSON.stringify({ error: "Not authenticated with Spotify" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }

    const { items, playlistName }: { items: YouTubeItem[]; playlistName: string } = await req.json();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Send start event
                sendSSE(controller, {
                    type: "start",
                    playlistName: playlistName || "YouTube Playlist",
                    total: items.length,
                });

                // 1. Get Spotify user
                const user = await spotifyFetch("/me", token);

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
                let skippedCount = 0;

                // 3. Search and match tracks
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const { artist, track } = cleanSongTitle(item.title);

                    console.log(`\n--- Processing: ${item.title}`);
                    console.log(`Parsed: artist="${artist}", track="${track}"`);

                    if (!track) {
                        skippedCount++;
                        sendSSE(controller, {
                            type: "progress",
                            current: i + 1,
                            total: items.length,
                            title: item.title,
                            status: "skipped",
                            skipReason: "Could not extract track name",
                        });
                        continue;
                    }

                    // Use channelTitle as artist fallback
                    const cleanedChannel = item.channelTitle ? cleanChannelTitle(item.channelTitle) : null;
                    const effectiveArtist = artist || cleanedChannel || null;
                    console.log(`Channel: "${item.channelTitle}" -> Effective artist: "${effectiveArtist}"`);

                    let matched = null;
                    let searchAttempts: string[] = [];

                    // Try multiple search strategies
                    const searches = [
                        // Strategy 1: Full query with artist
                        effectiveArtist ? `track:${track} artist:${effectiveArtist}` : null,
                        // Strategy 2: Just the track name with artist
                        effectiveArtist ? `${track} ${effectiveArtist}` : null,
                        // Strategy 3: Just the track name
                        track,
                        // Strategy 4: Original title (sometimes works better)
                        item.title,
                    ].filter(Boolean) as string[];

                    for (const searchQuery of searches) {
                        if (matched) break;

                        console.log(`Search: "${searchQuery}"`);
                        searchAttempts.push(searchQuery);

                        const tracks = await searchSpotify(searchQuery, token);
                        console.log(`Results: ${tracks.length}`);

                        if (tracks.length === 0) continue;

                        const normalizedTrack = normalize(track);
                        const normalizedArtist = effectiveArtist ? normalize(effectiveArtist) : null;

                        // Score each result
                        let bestMatch = null;
                        let bestScore = 0;

                        for (const t of tracks) {
                            const spotifyTrackName = normalize(t.name);
                            const spotifyArtists = t.artists.map((a: { name: string }) => normalize(a.name));

                            // Calculate title similarity
                            const titleSim = similarity(track, t.name);

                            // Calculate artist similarity (if we have an artist)
                            let artistSim = 0;
                            if (normalizedArtist) {
                                artistSim = Math.max(...spotifyArtists.map((a: string) => similarity(effectiveArtist!, a)));
                            }

                            // Check for exact/substring matches (high confidence)
                            const exactTitleMatch = spotifyTrackName === normalizedTrack;
                            const titleContains = spotifyTrackName.includes(normalizedTrack) || normalizedTrack.includes(spotifyTrackName);
                            const artistContains = normalizedArtist && spotifyArtists.some((a: string) =>
                                a.includes(normalizedArtist) || normalizedArtist.includes(a)
                            );

                            // Calculate overall score
                            let score = titleSim * 0.6;
                            if (normalizedArtist) {
                                score += artistSim * 0.4;
                            } else {
                                score = titleSim; // No artist, rely entirely on title
                            }

                            // Boost for exact matches
                            if (exactTitleMatch) score += 0.3;
                            if (titleContains) score += 0.15;
                            if (artistContains) score += 0.15;

                            console.log(`  "${t.name}" by ${t.artists[0]?.name}: score=${score.toFixed(2)}, titleSim=${titleSim.toFixed(2)}, artistSim=${artistSim.toFixed(2)}`);

                            if (score > bestScore && score >= 0.5) { // Minimum threshold
                                bestScore = score;
                                bestMatch = t;
                            }
                        }

                        if (bestMatch && bestScore >= 0.5) {
                            matched = bestMatch;
                            console.log(`MATCHED with score ${bestScore.toFixed(2)}: "${matched.name}" by ${matched.artists[0]?.name}`);
                        }
                    }

                    if (matched) {
                        trackUris.push(matched.uri);
                        sendSSE(controller, {
                            type: "progress",
                            current: i + 1,
                            total: items.length,
                            title: item.title,
                            status: "matched",
                            spotifyTrack: matched.name,
                            spotifyArtist: matched.artists[0]?.name,
                        });
                    } else {
                        skippedCount++;
                        console.log(`SKIPPED: No match found after ${searchAttempts.length} search attempts`);
                        sendSSE(controller, {
                            type: "progress",
                            current: i + 1,
                            total: items.length,
                            title: item.title,
                            status: "skipped",
                            skipReason: "No match found on Spotify",
                        });
                    }
                }

                // 4. Add tracks to playlist (batch of 100)
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

                // Send completion event
                sendSSE(controller, {
                    type: "complete",
                    playlistUrl: playlist.external_urls.spotify,
                    added: trackUris.length,
                    skipped: skippedCount,
                });

                controller.close();
            } catch (error) {
                console.error("Transfer error:", error);
                sendSSE(controller, {
                    type: "error",
                    message: error instanceof Error ? error.message : "Unknown error occurred",
                });
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
