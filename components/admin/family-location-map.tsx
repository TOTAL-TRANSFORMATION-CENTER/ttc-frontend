"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link as LinkIcon, Loader2, MapPin, Navigation } from "lucide-react";

interface FamilyLocationMapProps {
  location?: string | null;
  address?: string | null;
  familyName?: string | null;
  className?: string;
}

/**
 * Parses Degrees-Minutes-Seconds (DMS) coordinates e.g. "11°10'18.7"N 76°57'05.3"E"
 */
function parseDms(dmsStr: string): { lat: string; lng: string } | null {
  const dmsRegex = /(\d+)[°\s]+(\d+)['′\s]+([\d.]+)?["″\s]*([NSEW])/gi;
  const matches = [...dmsStr.matchAll(dmsRegex)];
  if (matches.length >= 2) {
    const toDecimal = (deg: string, min: string, sec: string | undefined, dir: string) => {
      let dec = parseFloat(deg) + parseFloat(min) / 60 + (sec ? parseFloat(sec) / 3600 : 0);
      if (dir.toUpperCase() === "S" || dir.toUpperCase() === "W") {
        dec = -dec;
      }
      return dec;
    };
    const lat = toDecimal(matches[0][1], matches[0][2], matches[0][3], matches[0][4]);
    const lng = toDecimal(matches[1][1], matches[1][2], matches[1][3], matches[1][4]);
    return { lat: lat.toFixed(7), lng: lng.toFixed(7) };
  }
  return null;
}

/**
 * Validates that latitude and longitude are valid decimal geographic coordinates.
 * Latitude must be between -90 and 90.
 * Longitude must be between -180 and 180.
 */
export function isValidCoordinate(latStr?: string | null, lngStr?: string | null): boolean {
  if (!latStr || !lngStr) return false;
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * Extracts exact coordinates (lat, lng) from any Google Maps link, coordinates, or string
 */
export function extractCoordinates(input?: string | null): { lat: string; lng: string } | null {
  if (!input || !input.trim()) return null;
  const raw = input.trim();

  // 1. Degrees Minutes Seconds (DMS) coordinates
  const dms = parseDms(raw);
  if (dms && isValidCoordinate(dms.lat, dms.lng)) return dms;

  // 2. Protobuf !3dLAT!4dLNG (standard in Google Maps URLs)
  const proto = raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (proto && isValidCoordinate(proto[1], proto[2])) {
    return { lat: proto[1], lng: proto[2] };
  }

  // 3. /search/LAT,+LNG or /search/LAT,LNG (common when mobile shortlink expands)
  const searchMatch = raw.match(/\/search\/(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (searchMatch && isValidCoordinate(searchMatch[1], searchMatch[2])) {
    return { lat: searchMatch[1], lng: searchMatch[2] };
  }

  // 4. /place/LAT,+LNG or /place/LAT,LNG
  const placeMatch = raw.match(/\/place\/(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (placeMatch && isValidCoordinate(placeMatch[1], placeMatch[2])) {
    return { lat: placeMatch[1], lng: placeMatch[2] };
  }

  // 5. Coordinates with @ (e.g. ".../@11.1718617,76.9514835,17z...")
  const atMatch = raw.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (atMatch && isValidCoordinate(atMatch[1], atMatch[2])) {
    return { lat: atMatch[1], lng: atMatch[2] };
  }

  // 6. loc:LAT,LNG or q=LAT,LNG or query=LAT,LNG
  const qLocMatch = raw.match(/[?&](?:q|query|loc)=(?:loc:)?(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (qLocMatch && isValidCoordinate(qLocMatch[1], qLocMatch[2])) {
    return { lat: qLocMatch[1], lng: qLocMatch[2] };
  }

  // 7. ll= or center= or sll=
  const llMatch = raw.match(/[?&](?:ll|center|sll)=(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (llMatch && isValidCoordinate(llMatch[1], llMatch[2])) {
    return { lat: llMatch[1], lng: llMatch[2] };
  }

  // 8. daddr= or destination=
  const destMatch = raw.match(/[?&](?:daddr|destination)=(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (destMatch && isValidCoordinate(destMatch[1], destMatch[2])) {
    return { lat: destMatch[1], lng: destMatch[2] };
  }

  // 9. Plain LAT, LNG e.g. "11.1718617, 76.9514835"
  const plain = raw.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
  if (plain && isValidCoordinate(plain[1], plain[2])) {
    return { lat: plain[1], lng: plain[2] };
  }

  // 10. Scan for any valid coordinate pair in string
  const allMatches = [...raw.matchAll(/(-?\d+\.\d{3,})\s*,\s*(-?\d+\.\d{3,})/g)];
  for (const m of allMatches) {
    if (isValidCoordinate(m[1], m[2])) {
      return { lat: m[1], lng: m[2] };
    }
  }

  return null;
}

/**
 * Constructs an embeddable Google Maps iframe URL that explicitly drops a pinned marker.
 * Matches the landing page church map format:
 * q=LAT,LNG+(Label)&t=&z=17&ie=UTF8&iwloc=B&output=embed
 */
export function buildPinnedEmbedUrl(
  input?: string | null,
  label: string = "Family Location",
  resolvedCoords?: { lat: string; lng: string } | null,
  fallbackAddress?: string | null
): string | null {
  if (!input || !input.trim()) return null;
  const raw = input.trim();
  const safeLabel = encodeURIComponent(label.replace(/[()]/g, "").trim() || "Family Residence");

  // 1. If an entire <iframe> code was pasted, extract the src URL
  const iframeMatch = raw.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1];
  }

  // 2. If already an embed URL with pinned coordinates/query
  if (raw.includes("output=embed") && (raw.includes("?q=") || raw.includes("&q="))) {
    return raw;
  }

  // 3. Exact validated coordinates (from link parsing or shortlink resolution)
  const coords =
    resolvedCoords && isValidCoordinate(resolvedCoords.lat, resolvedCoords.lng)
      ? resolvedCoords
      : extractCoordinates(raw);

  if (coords && isValidCoordinate(coords.lat, coords.lng)) {
    // Explicit q=LAT,LNG+(Label) drops the red pin marker labeled with the family's name
    return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}+(${safeLabel})&t=&z=17&ie=UTF8&iwloc=B&output=embed`;
  }

  // 4. If it's a URL but no coordinates could be parsed yet
  const isUrl = raw.startsWith("http://") || raw.startsWith("https://");
  if (isUrl) {
    // Check if URL has place name in path (/place/Place+Name)
    try {
      const url = new URL(raw);
      const placeMatch = url.pathname.match(/\/place\/([^/@?]+)/);
      if (placeMatch && placeMatch[1]) {
        const place = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
        return `https://maps.google.com/maps?q=${encodeURIComponent(place)}+(${safeLabel})&t=&z=16&ie=UTF8&iwloc=B&output=embed`;
      }
    } catch {
      // Ignore URL parse error
    }

    // If fallback address is available, pin to the address
    if (fallbackAddress && fallbackAddress.trim()) {
      const cleanAddress = encodeURIComponent(fallbackAddress.replace(/[()]/g, "").trim());
      return `https://maps.google.com/maps?q=${cleanAddress}+(${safeLabel})&t=&z=16&ie=UTF8&iwloc=B&output=embed`;
    }

    // Do NOT pass a raw URL string into Google Maps q= parameter as that displays no pin
    return null;
  }

  // 5. Plain address or landmark string
  const cleanQuery = encodeURIComponent(raw.replace(/[()]/g, "").trim());
  return `https://maps.google.com/maps?q=${cleanQuery}+(${safeLabel})&t=&z=16&ie=UTF8&iwloc=B&output=embed`;
}

/**
 * Returns a direct link to open the location in Google Maps app or browser
 */
export function getGoogleMapsDirectUrl(
  input?: string | null,
  resolvedCoords?: { lat: string; lng: string } | null
): string {
  if (!input || !input.trim()) return "#";
  const raw = input.trim();

  // Valid coordinates available
  const coords =
    resolvedCoords && isValidCoordinate(resolvedCoords.lat, resolvedCoords.lng)
      ? resolvedCoords
      : extractCoordinates(raw);

  if (coords && isValidCoordinate(coords.lat, coords.lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  }

  // If already an HTTP(S) link and not an iframe tag
  if ((raw.startsWith("http://") || raw.startsWith("https://")) && !raw.includes("<iframe")) {
    return raw;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
}

export default function FamilyLocationMap({
  location,
  address,
  familyName,
  className = "",
}: FamilyLocationMapProps) {
  const [copied, setCopied] = useState(false);
  const [resolvedShortlink, setResolvedShortlink] = useState<{
    url: string;
    coords: { lat: string; lng: string };
  } | null>(null);

  const trimmedLocation = (location || "").trim();
  const label = familyName ? `${familyName}` : "Family Residence";

  // Immediate synchronous extraction from input (coordinates, @lat,lng, etc.)
  const immediateCoords = useMemo(
    () => extractCoordinates(trimmedLocation),
    [trimmedLocation]
  );

  const isUrl =
    trimmedLocation.startsWith("http://") || trimmedLocation.startsWith("https://");

  // Derive resolving state: actively resolving if it's a URL without immediate coords and not yet resolved
  const isResolving = Boolean(
    trimmedLocation && isUrl && !immediateCoords && resolvedShortlink?.url !== trimmedLocation
  );

  // If a shortlink or external Google Maps link is entered without inline coords, resolve it asynchronously
  useEffect(() => {
    if (!trimmedLocation || !isUrl || immediateCoords) {
      return;
    }

    let isMounted = true;

    fetch(`/api/resolve-maps-url?url=${encodeURIComponent(trimmedLocation)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.lat && data.lng && isValidCoordinate(data.lat, data.lng)) {
          setResolvedShortlink({
            url: trimmedLocation,
            coords: { lat: data.lat, lng: data.lng },
          });
        }
      })
      .catch(() => {
        // Keep existing or address fallback
      });

    return () => {
      isMounted = false;
    };
  }, [trimmedLocation, isUrl, immediateCoords]);

  const activeCoords =
    (immediateCoords && isValidCoordinate(immediateCoords.lat, immediateCoords.lng)
      ? immediateCoords
      : null) ||
    (resolvedShortlink?.url === trimmedLocation &&
    isValidCoordinate(resolvedShortlink.coords.lat, resolvedShortlink.coords.lng)
      ? resolvedShortlink.coords
      : null);

  // If no location value is provided, completely hide the map
  const embedUrl = useMemo(
    () => buildPinnedEmbedUrl(trimmedLocation, label, activeCoords, address),
    [trimmedLocation, label, activeCoords, address]
  );

  const directUrl = useMemo(
    () => getGoogleMapsDirectUrl(trimmedLocation, activeCoords),
    [trimmedLocation, activeCoords]
  );

  if (!trimmedLocation) {
    return null;
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const pinDisplay = activeCoords
    ? `${activeCoords.lat}, ${activeCoords.lng}`
    : address?.trim() || label;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 transition-all animate-in fade-in duration-300 border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 shadow-xs ${className}`}
    >
      {/* ─── Header: Title, Live Pinned Badge & Quick Directions Button ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold leading-tight truncate text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{familyName ? `${familyName} • Location` : "Family Google Maps Location"}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Pinned Marker
              </span>
            </h4>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate block mt-0.5">
              Live pinned location for pastoral visits and fellowship navigation
            </span>
          </div>
        </div>

        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-xs hover:scale-105 shrink-0 self-start sm:self-center"
          title="Open in Google Maps"
        >
          <Navigation className="h-3.5 w-3.5 fill-current" />
          <span>Directions</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      </div>

      {/* ─── Entered Location Link Bar (Displays the exact entered link with copy & open actions) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 px-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 text-xs shadow-2xs">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <LinkIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
            Entered Link:
          </span>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline truncate font-mono text-[11px] min-w-0"
            title={trimmedLocation}
          >
            {trimmedLocation}
          </a>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300 cursor-pointer"
            title="Copy location link to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 transition-colors"
            title="Open link in new tab"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Open</span>
          </a>
        </div>
      </div>

      {/* ─── Embedded Interactive Google Maps Iframe with Pin Overlay ─── */}
      <div className="relative w-full h-[270px] sm:h-[320px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner bg-zinc-100 dark:bg-zinc-950">
        {/* Floating Pin Indicator Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md text-white text-[11px] font-bold shadow-md border border-white/10 select-none pointer-events-none">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-[280px]">📍 Pinned: {pinDisplay}</span>
        </div>

        {isResolving && !embedUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-zinc-500 dark:text-zinc-400">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <MapPin className="h-4 w-4 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Pinning Entered Location...
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-xs">
                Extracting exact geographical coordinates from Google Maps link
              </p>
            </div>
          </div>
        ) : embedUrl ? (
          <iframe
            title={familyName ? `${familyName} Google Maps Location` : "Family Google Maps Location"}
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center text-zinc-500 dark:text-zinc-400">
            <MapPin className="h-6 w-6 text-zinc-400" />
            <p className="text-xs font-medium">Please enter a valid Google Maps location or coordinates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
