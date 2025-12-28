const SPOTIFY_API = "https://api.spotify.com/v1";

export async function spotifyFetch(
    endpoint: string,
    token: string,
    options: RequestInit = {}
) {
    const res = await fetch(`${SPOTIFY_API}/${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Spotify API error: ${text}`);
    }

    return res.json();
}