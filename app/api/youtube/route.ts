import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60; // Refresh live status every minute

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  url: string;
  isLive: boolean;
}

export interface LiveStreamStatus {
  isLiveNow: boolean;
  videoId?: string;
  title?: string;
  thumbnail?: string;
  embedUrl?: string;
  url?: string;
}

// Default channel ID resolved from @TotalTransformationMinistries
const DEFAULT_CHANNEL_ID = "UC5PqpsjSxB_4AZoDA8y_PKg";

export async function GET(req: NextRequest) {
  try {
    let channelId = process.env.YOUTUBE_CHANNEL_ID?.trim() || DEFAULT_CHANNEL_ID;

    // Normalize handle to the resolved channel ID if needed
    if (
      channelId === "TotalTransformationMinistries" ||
      channelId.startsWith("@") ||
      !channelId.startsWith("UC")
    ) {
      channelId = DEFAULT_CHANNEL_ID;
    }

    const testLive =
      req.nextUrl.searchParams.get("test_live") === "1" ||
      process.env.TEST_LIVE_STREAM === "true";

    // 1. Fetch channel RSS feed (for latest uploads)
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feedPromise = fetch(feedUrl, {
      next: { revalidate: 300 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
    }).catch(() => null);

    // 2. Check if the channel is currently live
    const liveCheckUrl = `https://www.youtube.com/channel/${channelId}/live`;
    const livePromise = fetch(liveCheckUrl, {
      next: { revalidate: 60 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }).catch(() => null);

    const [feedRes, liveRes] = await Promise.all([feedPromise, livePromise]);

    // Parse RSS feed videos
    const videos: YouTubeVideo[] = [];
    if (feedRes && feedRes.ok) {
      const xml = await feedRes.text();
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match: RegExpExecArray | null;

      while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];

        const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
        const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
        const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
        const thumbMatch = entry.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/);

        if (idMatch && titleMatch) {
          const id = idMatch[1].trim();
          const rawTitle = titleMatch[1].trim();
          const cleanTitle = rawTitle
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");

          const isLive =
            /live|🔴|service/i.test(cleanTitle) || cleanTitle.includes("🔴");

          videos.push({
            id,
            title: cleanTitle,
            publishedAt: publishedMatch ? publishedMatch[1].trim() : "",
            thumbnail:
              thumbMatch?.[1] || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${id}`,
            isLive,
          });
        }
      }
    }

    // Determine active live stream status
    let liveStream: LiveStreamStatus = { isLiveNow: false };

    if (liveRes && liveRes.ok) {
      const liveHtml = await liveRes.text();
      const isActuallyLive =
        liveHtml.includes('"isLiveNow":true') ||
        liveHtml.includes('"isLive":true') ||
        liveHtml.includes('LIVE_NOW') ||
        liveHtml.includes('"status":"LIVE"');

      if (isActuallyLive) {
        const videoMatch = liveHtml.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        const titleMatch = liveHtml.match(/<title>([^<]+)<\/title>/);
        const videoId = videoMatch ? videoMatch[1] : videos[0]?.id;
        const title = titleMatch
          ? titleMatch[1].replace(/ - YouTube$/, "").trim()
          : "Live Service - Total Transformation Ministries";

        if (videoId) {
          liveStream = {
            isLiveNow: true,
            videoId,
            title,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
          };
        }
      }
    }

    // Check if an unlisted or manual live stream ID/URL was provided via environment variable
    const customLive =
      process.env.CURRENT_LIVE_VIDEO_ID?.trim() ||
      process.env.LIVE_VIDEO_ID?.trim();

    if (customLive) {
      const extractedId =
        customLive.match(
          /(?:live\/|v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/
        )?.[1] || (customLive.length === 11 ? customLive : null);

      if (extractedId) {
        liveStream = {
          isLiveNow: true,
          videoId: extractedId,
          title: "🔴 Live Service - Total Transformation Ministries",
          thumbnail: `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${extractedId}?autoplay=1&mute=1&playsinline=1`,
          url: `https://www.youtube.com/watch?v=${extractedId}`,
        };
      }
    }

    // If test mode is enabled or channel is currently tested
    if (!liveStream.isLiveNow && testLive && videos.length > 0) {
      const testVideo = videos.find((v) => v.isLive) || videos[0];
      liveStream = {
        isLiveNow: true,
        videoId: testVideo.id,
        title: testVideo.title,
        thumbnail: testVideo.thumbnail,
        embedUrl: `https://www.youtube-nocookie.com/embed/${testVideo.id}?autoplay=1&mute=1&playsinline=1`,
        url: testVideo.url,
      };
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channelId,
        handle: "@TotalTransformationMinistries",
        url: "https://www.youtube.com/@TotalTransformationMinistries",
      },
      liveStream,
      videos,
    });
  } catch (error: unknown) {
    console.error("YouTube feed error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch YouTube data";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        liveStream: { isLiveNow: false },
        videos: [],
      },
      { status: 500 }
    );
  }
}
