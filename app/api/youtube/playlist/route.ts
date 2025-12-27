import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

type YouTubeItem = {
  videoId: string;
  title: string;
  channelTitle: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playlistId = searchParams.get("playlistId");

  if (!playlistId) {
    return NextResponse.json(
      { error: "Missing playlistId" },
      { status: 400 }
    );
  }

  let items: YouTubeItem[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const url = new URL(
      "https://www.googleapis.com/youtube/v3/playlistItems"
    );

    url.searchParams.set("part", "snippet");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", YOUTUBE_API_KEY);

    if (nextPageToken) {
      url.searchParams.set("pageToken", nextPageToken);
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!data.items) break;

    for (const item of data.items) {
      const snippet = item.snippet;
      if (!snippet?.resourceId?.videoId) continue;

      items.push({
        videoId: snippet.resourceId.videoId,
        title: snippet.title,
        channelTitle: snippet.videoOwnerChannelTitle || "",
      });
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return NextResponse.json({ items });
}
