"use client";

import { useState, useEffect } from "react";
import {
  X,
  Minimize2,
  Maximize2,
  ExternalLink,
  Volume2,
} from "lucide-react";
import { YouTubeIcon } from "./youtube-section";

interface LiveStreamData {
  isLiveNow: boolean;
  videoId?: string;
  title?: string;
  embedUrl?: string;
  url?: string;
}

export default function LiveStreamModal() {
  const [liveStream, setLiveStream] = useState<LiveStreamData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkLive() {
      try {
        // Query YouTube API (respects active live stream & check for test mode if URL contains ?test_live=1)
        const urlParams = new URLSearchParams(window.location.search);
        const testParam = urlParams.get("test_live") === "1" ? "?test_live=1" : "";
        const res = await fetch(`/api/youtube${testParam}`);
        const data = await res.json();

        if (mounted && data.success && data.liveStream?.isLiveNow && data.liveStream.videoId) {
          const videoId = data.liveStream.videoId;
          const dismissedKey = `ttc_live_dismissed_${videoId}`;
          const isDismissed = sessionStorage.getItem(dismissedKey);

          setLiveStream(data.liveStream);

          // If user hasn't explicitly dismissed this session, pop up automatically!
          if (!isDismissed) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error("Error checking live stream:", err);
      }
    }

    checkLive();

    // Check periodically every 2 minutes while page is open in case pastor goes live while user is browsing
    const interval = setInterval(checkLive, 120000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!liveStream || !liveStream.isLiveNow || !liveStream.videoId) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    if (liveStream?.videoId) {
      sessionStorage.setItem(`ttc_live_dismissed_${liveStream.videoId}`, "true");
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setIsOpen(true);
  };

  // 1. Minimized floating Picture-in-Picture card at bottom right
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex flex-col w-72 sm:w-80 rounded-2xl overflow-hidden shadow-2xl border border-red-500/40 bg-zinc-950 text-white">
          <div className="flex items-center justify-between px-3 py-2 bg-red-600/90 text-white">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>Live Service Playing</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRestore}
                className="p-1 hover:bg-black/20 rounded-md transition-colors cursor-pointer"
                title="Expand Live Player"
                aria-label="Expand Live Player"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 hover:bg-black/20 rounded-md transition-colors cursor-pointer"
                title="Close Player"
                aria-label="Close Player"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="relative aspect-video w-full bg-black">
            <iframe
              title="Total Transformation Ministries Live Stream (Mini Player)"
              src={`https://www.youtube-nocookie.com/embed/${liveStream.videoId}?autoplay=1&mute=1&playsinline=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          <div className="p-2.5 bg-zinc-900 flex items-center justify-between text-xs">
            <span className="line-clamp-1 text-zinc-300 font-medium text-[11px] pr-2">
              {liveStream.title}
            </span>
            <button
              type="button"
              onClick={handleRestore}
              className="text-red-400 font-bold hover:underline shrink-0 cursor-pointer text-[11px]"
            >
              Expand
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Full Auto-Popup Modal
  if (!isOpen) {
    // If not open but stream is live, show a compact floating notification pill to re-open anytime
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={handleRestore}
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xl shadow-red-600/30 transition-all hover:scale-105 cursor-pointer animate-bounce"
        >
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span>🔴 Watch Live Sunday Service</span>
        </button>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleMinimize}
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl border border-red-500/30 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-red-600 via-red-700 to-rose-800 text-white">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white text-red-700 shadow-xs shrink-0">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              LIVE NOW
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold truncate">
                Total Transformation Ministries is Live!
              </span>
              <span className="text-[10px] text-red-100 hidden sm:inline truncate opacity-90">
                {liveStream.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMinimize}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
              title="Minimize to Picture-in-Picture"
              aria-label="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
              title="Close Live Stream"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            title={liveStream.title || "Live Stream Player"}
            src={`https://www.youtube-nocookie.com/embed/${liveStream.videoId}?autoplay=1&mute=1&playsinline=1&enablejsapi=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Notice & Controls Bar */}
        <div className="p-4 sm:p-5 bg-zinc-900 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Volume2 className="h-4 w-4 text-red-400 shrink-0 animate-pulse" />
            <span>
              Playing automatically.{" "}
              <strong className="text-white">
                Tap anywhere on video to unmute sound.
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleMinimize}
              className="px-4 py-2 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-medium text-xs cursor-pointer"
            >
              Continue to Website
            </button>

            <a
              href={liveStream.url || `https://www.youtube.com/watch?v=${liveStream.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all hover:scale-105"
            >
              <YouTubeIcon className="h-3.5 w-3.5" />
              <span>Live Chat on YouTube</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
