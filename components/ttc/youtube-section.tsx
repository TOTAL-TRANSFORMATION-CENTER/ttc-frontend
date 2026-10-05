"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Play,
  Radio,
  ExternalLink,
  Calendar,
  X,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "@/components/ttc/theme-provider";
import {
  motion,
  fadeUp,
  stagger,
  staggerFast,
  viewportOnce,
} from "@/components/ttc/motion";
import {
  REAL_LIVE_SERVICES,
  REAL_ALL_UPLOADS,
  YouTubeVideo,
} from "@/app/api/youtube/route";

export function YouTubeIcon({
  className = "h-5 w-5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// Resilient video thumbnail component that never leaves a blank space
function VideoThumbnail({
  src,
  alt,
  videoId,
}: {
  src: string;
  alt: string;
  videoId: string;
}) {
  const [imgSrc, setImgSrc] = useState(
    src || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  );
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
      {!hasError ? (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => {
            if (imgSrc.includes("hqdefault")) {
              setImgSrc(`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`);
            } else if (imgSrc.includes("mqdefault")) {
              setImgSrc(`https://i.ytimg.com/vi/${videoId}/default.jpg`);
            } else {
              setHasError(true);
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-zinc-900 to-black flex flex-col items-center justify-center p-4 text-center">
          <div className="h-10 w-10 rounded-full bg-red-600/90 text-white flex items-center justify-center mb-2 shadow-lg">
            <Play className="h-5 w-5 fill-white translate-x-0.5" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-300 line-clamp-2 px-2">
            {alt}
          </span>
        </div>
      )}
    </div>
  );
}

export default function YouTubeSection() {
  const { theme } = useTheme();
  // Pre-seed with real curated videos so there is never a blank screen during SSR or hydration
  const [liveVideos, setLiveVideos] = useState<YouTubeVideo[]>(REAL_LIVE_SERVICES);
  const [allVideos, setAllVideos] = useState<YouTubeVideo[]>(REAL_ALL_UPLOADS);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [filter, setFilter] = useState<"live" | "all">("live");

  const t = (light: string, solarised: string, dark: string) =>
    theme === "light" ? light : theme === "solarised" ? solarised : dark;

  useEffect(() => { 
    let mounted = true;

    async function loadVideos() {
      try {
        const res = await fetch("/api/youtube");
        const data = await res.json();
        if (mounted && data.success) {
          if (Array.isArray(data.liveVideos) && data.liveVideos.length > 0) {
            setLiveVideos(data.liveVideos.slice(0, 7));
          }
          if (Array.isArray(data.videos) && data.videos.length > 0) {
            setAllVideos(data.videos.slice(0, 15));
          }
        }
      } catch (err) {
        console.warn("Using real embedded fallback videos:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadVideos();
    return () => {
      mounted = false;
    };
  }, []);

  // Live sunday service: 7 videos total
  // Latest 1 is big (latestLive)
  // Remaining 6 aligned below that
  const latestLive = liveVideos[0];
  const remainingLive = liveVideos.slice(1, 7);

  // All uploads: 15 videos total
  const displayedAll = allVideos.slice(0, 15);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const channelStreamsUrl =
    "https://www.youtube.com/@TotalTransformationMinistries/streams";
  const channelVideosUrl =
    "https://www.youtube.com/@TotalTransformationMinistries/videos";

  return (
    <section
      id="live-services"
      className={`py-20 sm:py-24 px-4 transition-colors duration-500 border-t ${t(
        "bg-white border-zinc-200/80",
        "bg-slate-900 border-slate-800",
        "bg-zinc-950 border-zinc-800"
      )}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <motion.div variants={fadeUp} className="inline-block mb-3">
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${t(
                "bg-red-50 text-red-700 border border-red-200",
                "bg-red-950/60 text-red-300 border border-red-800/60",
                "bg-red-950/40 text-red-300 border border-red-800/40"
              )}`}
            >
              <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
              Live Worship &amp; Messages
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className={`text-3xl sm:text-4xl md:text-5xl font-serif font-bold mt-1 tracking-tight ${t(
              "text-indigo-950",
              "text-slate-100",
              "text-zinc-50"
            )}`}
          >
            Latest Live Videos &amp; Sermons
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className={`mt-3 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed ${t(
              "text-zinc-600",
              "text-slate-400",
              "text-zinc-400"
            )}`}
          >
            Watch our full Sunday worship services, ministry songs, and uplifting
            messages directly from Total Transformation Ministries.
          </motion.p>

          {/* Filter Tabs & YouTube Link */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center gap-3 mt-8 flex-wrap"
          >
            <button
              type="button"
              onClick={() => setFilter("live")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${filter === "live"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : t(
                    "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80 border border-zinc-200",
                    "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700",
                    "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
                  )
                }`}
            >
              <Radio className="h-3.5 w-3.5" />
              🔴 Live Sunday Services ({liveVideos.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${filter === "all"
                  ? t(
                    "bg-indigo-900 text-white shadow-md",
                    "bg-indigo-600 text-white shadow-md",
                    "bg-zinc-100 text-zinc-900 shadow-md"
                  )
                  : t(
                    "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80 border border-zinc-200",
                    "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700",
                    "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
                  )
                }`}
            >
              All Uploads ({allVideos.length})
            </button>

            <a
              href="https://www.youtube.com/@TotalTransformationMinistries?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 hover:scale-105 ${t(
                "bg-white text-zinc-800 border-zinc-200 hover:border-red-300 shadow-xs",
                "bg-slate-800/90 text-slate-200 border-slate-700 hover:border-red-500",
                "bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-red-500"
              )}`}
            >
              <YouTubeIcon className="h-4 w-4 text-red-600" />
              <span>Subscribe on YouTube</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </motion.div>
        </motion.div>

        {/* ─── LIVE SUNDAY SERVICE TAB (1 big + 6 aligned below = 7 total) ─── */}
        {filter === "live" && (
          <div>
            {/* Featured Latest Live Video Hero Banner (Big Card) */}
            {latestLive && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className={`mb-10 p-6 sm:p-8 rounded-3xl border ${t(
                  "bg-gradient-to-br from-red-50/60 via-white to-indigo-50/40 border-red-100 shadow-xl",
                  "bg-gradient-to-br from-slate-800/90 via-slate-900 to-red-950/30 border-slate-700/80 shadow-2xl",
                  "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-zinc-800 shadow-2xl"
                )}`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Thumbnail with big play overlay */}
                  <div
                    onClick={() => setSelectedVideo(latestLive)}
                    className="lg:col-span-7 relative group cursor-pointer aspect-video rounded-2xl overflow-hidden border border-black/10 shadow-lg"
                  >
                    <VideoThumbnail
                      src={latestLive.thumbnail}
                      alt={latestLive.title}
                      videoId={latestLive.id}
                    />
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-white translate-x-0.5" />
                      </div>
                    </div>

                    <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      Latest Live Stream
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="lg:col-span-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(latestLive.publishedAt)}</span>
                      </div>

                      <h3
                        className={`text-xl sm:text-2xl font-serif font-bold mb-4 leading-snug line-clamp-3 ${t(
                          "text-indigo-950",
                          "text-white",
                          "text-zinc-50"
                        )}`}
                      >
                        {latestLive.title}
                      </h3>

                      <p
                        className={`text-xs sm:text-sm leading-relaxed mb-6 ${t(
                          "text-zinc-600",
                          "text-slate-300",
                          "text-zinc-400"
                        )}`}
                      >
                        Join our congregation for worship, the anointed Word of
                        God, and prayers of deliverance and blessing.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedVideo(latestLive)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/30 hover:scale-105 cursor-pointer"
                      >
                        <Play className="h-4 w-4 fill-white" />
                        <span>Watch Now</span>
                      </button>

                      <a
                        href={latestLive.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border transition-colors ${t(
                          "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50",
                          "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700",
                          "bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800"
                        )}`}
                      >
                        <span>Watch on YouTube</span>
                        <ExternalLink className="h-4 w-4 opacity-60" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Remaining 6 Live Videos Aligned Below */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className={`h-72 rounded-2xl animate-pulse ${t(
                      "bg-zinc-100",
                      "bg-slate-800",
                      "bg-zinc-900"
                    )}`}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerFast}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {remainingLive.map((video) => (
                  <motion.div
                    key={video.id}
                    variants={fadeUp}
                    onClick={() => setSelectedVideo(video)}
                    className={`group cursor-pointer flex flex-col justify-between rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${t(
                      "bg-white border-zinc-200/80 hover:shadow-xl hover:shadow-zinc-200/50",
                      "bg-slate-800/80 border-slate-700/60 hover:shadow-xl hover:shadow-slate-900/50",
                      "bg-zinc-900/80 border-zinc-800/70 hover:shadow-xl hover:shadow-zinc-950/50"
                    )}`}
                  >
                    <div>
                      {/* Thumbnail */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/10">
                        <VideoThumbnail
                          src={video.thumbnail}
                          alt={video.title}
                          videoId={video.id}
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center pointer-events-none">
                          <div className="h-12 w-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5 fill-white translate-x-0.5" />
                          </div>
                        </div>

                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          Live Service
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(video.publishedAt)}</span>
                        </div>

                        <h4
                          className={`text-sm font-bold line-clamp-2 leading-snug group-hover:text-red-600 transition-colors ${t(
                            "text-zinc-900",
                            "text-slate-100",
                            "text-zinc-100"
                          )}`}
                        >
                          {video.title}
                        </h4>
                      </div>
                    </div>

                    <div
                      className={`p-4 pt-0 border-t ${t(
                        "border-zinc-100",
                        "border-slate-700/60",
                        "border-zinc-800/60"
                      )}`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-red-600 pt-3">
                        <span className="inline-flex items-center gap-1">
                          <Play className="h-3 w-3 fill-current" />
                          Watch Service
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* ─── ALL UPLOADS TAB (15 Videos) ─── */}
        {filter === "all" && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className={`h-72 rounded-2xl animate-pulse ${t(
                      "bg-zinc-100",
                      "bg-slate-800",
                      "bg-zinc-900"
                    )}`}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerFast}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {displayedAll.map((video) => (
                  <motion.div
                    key={video.id}
                    variants={fadeUp}
                    onClick={() => setSelectedVideo(video)}
                    className={`group cursor-pointer flex flex-col justify-between rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${t(
                      "bg-white border-zinc-200/80 hover:shadow-xl hover:shadow-zinc-200/50",
                      "bg-slate-800/80 border-slate-700/60 hover:shadow-xl hover:shadow-slate-900/50",
                      "bg-zinc-900/80 border-zinc-800/70 hover:shadow-xl hover:shadow-zinc-950/50"
                    )}`}
                  >
                    <div>
                      {/* Thumbnail */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/10">
                        <VideoThumbnail
                          src={video.thumbnail}
                          alt={video.title}
                          videoId={video.id}
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center pointer-events-none">
                          <div className="h-12 w-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5 fill-white translate-x-0.5" />
                          </div>
                        </div>

                        {video.isLive && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            Live Service
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(video.publishedAt)}</span>
                        </div>

                        <h4
                          className={`text-sm font-bold line-clamp-2 leading-snug group-hover:text-red-600 transition-colors ${t(
                            "text-zinc-900",
                            "text-slate-100",
                            "text-zinc-100"
                          )}`}
                        >
                          {video.title}
                        </h4>
                      </div>
                    </div>

                    <div
                      className={`p-4 pt-0 border-t ${t(
                        "border-zinc-100",
                        "border-slate-700/60",
                        "border-zinc-800/60"
                      )}`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-red-600 pt-3">
                        <span className="inline-flex items-center gap-1">
                          <Play className="h-3 w-3 fill-current" />
                          Watch Video
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* ─── SHOW MORE ON YOUTUBE BUTTON ─── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-12 sm:mt-16 text-center"
        >
          <a
            href={filter === "live" ? channelStreamsUrl : channelVideosUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm sm:text-base font-bold bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/25 transition-all duration-300 hover:scale-105 group"
          >
            <YouTubeIcon className="h-5 w-5 text-white" />
            <span>
              {filter === "live"
                ? "Show More Live Streams on YouTube"
                : "Show More Uploads on YouTube"}
            </span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>

      {/* Video Modal Player */}
      {selectedVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 text-white border-b border-zinc-800">
              <div className="flex items-center gap-2 line-clamp-1 pr-4">
                <YouTubeIcon className="h-5 w-5 text-red-600 shrink-0" />
                <span className="text-sm font-bold truncate">
                  {selectedVideo.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Close video player"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Embed Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                title={selectedVideo.title}
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
