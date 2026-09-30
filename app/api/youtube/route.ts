import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
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

// Channel identifier resolved from @TotalTransformationMinistries
const DEFAULT_CHANNEL_ID = "UC5PqpsjSxB_4AZoDA8y_PKg";

// Curated 7 real Sunday Live Service videos from the church channel
export const REAL_LIVE_SERVICES: YouTubeVideo[] = [
  {
    id: "XEq-pMrIsKg",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 27 Sep 2026",
    publishedAt: "2026-09-27T18:11:02+00:00",
    thumbnail: "https://i.ytimg.com/vi/XEq-pMrIsKg/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=XEq-pMrIsKg",
    isLive: true,
  },
  {
    id: "l3Aol_IIKTg",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 20 Sep 2026",
    publishedAt: "2026-09-20T05:33:09+00:00",
    thumbnail: "https://i.ytimg.com/vi/l3Aol_IIKTg/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=l3Aol_IIKTg",
    isLive: true,
  },
  {
    id: "Voto94n-0tA",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 13 Sep 2026",
    publishedAt: "2026-09-13T18:16:42+00:00",
    thumbnail: "https://i.ytimg.com/vi/Voto94n-0tA/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=Voto94n-0tA",
    isLive: true,
  },
  {
    id: "3rAup-5vPko",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 06 Sep 2026",
    publishedAt: "2026-09-06T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/3rAup-5vPko/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=3rAup-5vPko",
    isLive: true,
  },
  {
    id: "iDi0QA2dV5U",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 09 Aug 2026",
    publishedAt: "2026-08-09T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/iDi0QA2dV5U/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=iDi0QA2dV5U",
    isLive: true,
  },
  {
    id: "OSR48W9LtHQ",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 02 Aug 2026",
    publishedAt: "2026-08-02T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/OSR48W9LtHQ/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=OSR48W9LtHQ",
    isLive: true,
  },
  {
    id: "Olc3XVU9Gi4",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 26 July 2026",
    publishedAt: "2026-07-26T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/Olc3XVU9Gi4/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=Olc3XVU9Gi4",
    isLive: true,
  },
];

// Curated 15 real uploads from the church channel
export const REAL_ALL_UPLOADS: YouTubeVideo[] = [
  {
    id: "Aan0RMgtWWg",
    title: "Vaathai Unthan Koodaarathai | Original song - Father S.J Berchmans | TOTAL TRANSFORMATION CENTRE",
    publishedAt: "2026-09-28T14:35:35+00:00",
    thumbnail: "https://i.ytimg.com/vi/Aan0RMgtWWg/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=Aan0RMgtWWg",
    isLive: false,
  },
  {
    id: "XEq-pMrIsKg",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 27 Sep 2026",
    publishedAt: "2026-09-27T18:11:02+00:00",
    thumbnail: "https://i.ytimg.com/vi/XEq-pMrIsKg/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=XEq-pMrIsKg",
    isLive: true,
  },
  {
    id: "qfAiaraxSYs",
    title: "Ratha kotaikullae | Original song - Father S. J Berchmans | TOTAL TRANSFORMATION CENTRE CHURCH",
    publishedAt: "2026-09-21T16:33:04+00:00",
    thumbnail: "https://i.ytimg.com/vi/qfAiaraxSYs/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=qfAiaraxSYs",
    isLive: false,
  },
  {
    id: "l3Aol_IIKTg",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 20 Sep 2026",
    publishedAt: "2026-09-20T05:33:09+00:00",
    thumbnail: "https://i.ytimg.com/vi/l3Aol_IIKTg/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=l3Aol_IIKTg",
    isLive: true,
  },
  {
    id: "Voto94n-0tA",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 13 Sep 2026",
    publishedAt: "2026-09-13T18:16:42+00:00",
    thumbnail: "https://i.ytimg.com/vi/Voto94n-0tA/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=Voto94n-0tA",
    isLive: true,
  },
  {
    id: "3rAup-5vPko",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 06 Sep 2026",
    publishedAt: "2026-09-06T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/3rAup-5vPko/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=3rAup-5vPko",
    isLive: true,
  },
  {
    id: "iDi0QA2dV5U",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 09 Aug 2026",
    publishedAt: "2026-08-09T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/iDi0QA2dV5U/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=iDi0QA2dV5U",
    isLive: true,
  },
  {
    id: "OSR48W9LtHQ",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 02 Aug 2026",
    publishedAt: "2026-08-02T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/OSR48W9LtHQ/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=OSR48W9LtHQ",
    isLive: true,
  },
  {
    id: "Olc3XVU9Gi4",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 26 July 2026",
    publishedAt: "2026-07-26T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/Olc3XVU9Gi4/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=Olc3XVU9Gi4",
    isLive: true,
  },
  {
    id: "-4m2dQn_7iQ",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 19 July 2026",
    publishedAt: "2026-07-19T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/-4m2dQn_7iQ/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=4m2dQn_7iQ",
    isLive: true,
  },
  {
    id: "Myidsuft_v8",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 12 July 2026",
    publishedAt: "2026-07-12T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/Myidsuft_v8/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=Myidsuft_v8",
    isLive: true,
  },
  {
    id: "-kIzKem6ja8",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 07 June 2026",
    publishedAt: "2026-06-07T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/-kIzKem6ja8/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=-kIzKem6ja8",
    isLive: true,
  },
  {
    id: "Ktz0K3ZR_k8",
    title: "🔴 Live - Sunday Service | Total Transformation Ministries | 31 May 2026",
    publishedAt: "2026-05-31T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/Ktz0K3ZR_k8/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=Ktz0K3ZR_k8",
    isLive: true,
  },
  {
    id: "nz7apFGE51E",
    title: "Sunday Service , 24 May 2026",
    publishedAt: "2026-05-24T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/nz7apFGE51E/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=nz7apFGE51E",
    isLive: true,
  },
  {
    id: "1tGjw7j2NcY",
    title: "Sunday Service , 17 May 2026",
    publishedAt: "2026-05-17T18:00:00+00:00",
    thumbnail: "https://i.ytimg.com/vi/1tGjw7j2NcY/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=1tGjw7j2NcY",
    isLive: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    let channelId = process.env.YOUTUBE_CHANNEL_ID?.trim() || DEFAULT_CHANNEL_ID;

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

    // 1. Fetch channel RSS feed (for real-time uploads)
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feedPromise = fetch(feedUrl, {
      next: { revalidate: 300 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

    // Parse RSS feed videos if successful
    const fetchedVideos: YouTubeVideo[] = [];
    if (feedRes && feedRes.ok) {
      try {
        const xml = await feedRes.text();
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match: RegExpExecArray | null;

        while ((match = entryRegex.exec(xml)) !== null) {
          const entry = match[1];
          const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
          const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

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

            fetchedVideos.push({
              id,
              title: cleanTitle,
              publishedAt: publishedMatch ? publishedMatch[1].trim() : "",
              thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${id}`,
              isLive,
            });
          }
        }
      } catch (xmlErr) {
        console.warn("RSS parse warning:", xmlErr);
      }
    }

    // Determine the final list of 15 uploads
    // If RSS returns results, combine or use them; otherwise use real curated uploads
    let allVideos: YouTubeVideo[] = [...REAL_ALL_UPLOADS];
    if (fetchedVideos.length > 0) {
      // Merge unique by ID
      const seen = new Set<string>();
      const combined: YouTubeVideo[] = [];
      for (const v of [...fetchedVideos, ...REAL_ALL_UPLOADS]) {
        if (!seen.has(v.id)) {
          seen.add(v.id);
          combined.push(v);
        }
      }
      allVideos = combined.slice(0, 15);
    }

    // Determine the 7 Live Sunday services
    const liveFromFetched = fetchedVideos.filter((v) => v.isLive);
    const seenLive = new Set<string>();
    const combinedLive: YouTubeVideo[] = [];
    for (const v of [...liveFromFetched, ...REAL_LIVE_SERVICES]) {
      if (!seenLive.has(v.id)) {
        seenLive.add(v.id);
        combinedLive.push(v);
      }
    }
    const liveVideos = combinedLive.slice(0, 7);

    // Determine active live stream status
    let liveStream: LiveStreamStatus = { isLiveNow: false };

    if (liveRes && liveRes.ok) {
      try {
        const liveHtml = await liveRes.text();
        const isActuallyLive =
          liveHtml.includes('"isLiveNow":true') ||
          liveHtml.includes('"isLive":true') ||
          liveHtml.includes("LIVE_NOW") ||
          liveHtml.includes('"status":"LIVE"');

        if (isActuallyLive) {
          const videoMatch = liveHtml.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          const titleMatch = liveHtml.match(/<title>([^<]+)<\/title>/);
          const videoId = videoMatch ? videoMatch[1] : liveVideos[0]?.id;
          const title = titleMatch
            ? titleMatch[1].replace(/ - YouTube$/, "").trim()
            : "Live Service - Total Transformation Ministries";

          if (videoId) {
            liveStream = {
              isLiveNow: true,
              videoId,
              title,
              thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`,
              url: `https://www.youtube.com/watch?v=${videoId}`,
            };
          }
        }
      } catch (liveErr) {
        console.warn("Live status parse warning:", liveErr);
      }
    }

    // Unlisted or manual live stream override
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

    // Test mode
    if (!liveStream.isLiveNow && testLive && liveVideos.length > 0) {
      const testVideo = liveVideos[0];
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
      liveVideos,
      videos: allVideos,
    });
  } catch (error: unknown) {
    console.error("YouTube feed error:", error);
    // Return curated real videos on error so production is never blank
    return NextResponse.json({
      success: true,
      channel: {
        id: DEFAULT_CHANNEL_ID,
        handle: "@TotalTransformationMinistries",
        url: "https://www.youtube.com/@TotalTransformationMinistries",
      },
      liveStream: { isLiveNow: false },
      liveVideos: REAL_LIVE_SERVICES,
      videos: REAL_ALL_UPLOADS,
    });
  }
}
