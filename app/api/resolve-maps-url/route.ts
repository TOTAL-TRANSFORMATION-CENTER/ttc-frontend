import { NextRequest, NextResponse } from "next/server";

// In-memory cache for resolved shortlinks to eliminate redundant network lookups
const urlCache = new Map<string, { lat: string; lng: string; resolvedUrl: string }>();

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
 * Extracts validated coordinates from a URL string or text content
 */
export function extractFromUrlOrText(text: string): { lat: string; lng: string } | null {
  if (!text) return null;

  // 1. Protobuf format !3dLAT!4dLNG (standard in Google Maps URLs)
  const protoMatch = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (protoMatch && isValidCoordinate(protoMatch[1], protoMatch[2])) {
    return { lat: protoMatch[1], lng: protoMatch[2] };
  }

  // 2. /search/LAT,+LNG or /search/LAT,LNG
  const searchMatch = text.match(/\/search\/(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (searchMatch && isValidCoordinate(searchMatch[1], searchMatch[2])) {
    return { lat: searchMatch[1], lng: searchMatch[2] };
  }

  // 3. /place/LAT,+LNG or /place/LAT,LNG
  const placeMatch = text.match(/\/place\/(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (placeMatch && isValidCoordinate(placeMatch[1], placeMatch[2])) {
    return { lat: placeMatch[1], lng: placeMatch[2] };
  }

  // 4. @LAT,LNG format
  const atMatch = text.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (atMatch && isValidCoordinate(atMatch[1], atMatch[2])) {
    return { lat: atMatch[1], lng: atMatch[2] };
  }

  // 5. Query param q=LAT,LNG or query=LAT,LNG or loc:LAT,LNG
  const qMatch = text.match(/[?&](?:q|query|loc)=(?:loc:)?(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (qMatch && isValidCoordinate(qMatch[1], qMatch[2])) {
    return { lat: qMatch[1], lng: qMatch[2] };
  }

  // 6. Center or ll parameter
  const llMatch = text.match(/[?&](?:ll|center|sll)=(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (llMatch && isValidCoordinate(llMatch[1], llMatch[2])) {
    return { lat: llMatch[1], lng: llMatch[2] };
  }

  // 7. Destination daddr= or destination=
  const destMatch = text.match(/[?&](?:daddr|destination)=(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  if (destMatch && isValidCoordinate(destMatch[1], destMatch[2])) {
    return { lat: destMatch[1], lng: destMatch[2] };
  }

  // 8. Plain decimal coordinate pair
  const plainMatch = text.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
  if (plainMatch && isValidCoordinate(plainMatch[1], plainMatch[2])) {
    return { lat: plainMatch[1], lng: plainMatch[2] };
  }

  // 9. Scan for all valid coordinate pairs (rejecting invalid viewport metrics like 501268...)
  const allMatches = [...text.matchAll(/(-?\d+\.\d{4,})\s*,\s*(-?\d+\.\d{4,})/g)];
  for (const m of allMatches) {
    if (isValidCoordinate(m[1], m[2])) {
      return { lat: m[1], lng: m[2] };
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json(
      { success: false, message: "Missing url query parameter" },
      { status: 400 }
    );
  }

  const trimmed = urlParam.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return NextResponse.json(
      { success: false, message: "URL must start with http:// or https://" },
      { status: 400 }
    );
  }

  // Check cache first (only if cached coords are valid geographic coords)
  const cached = urlCache.get(trimmed);
  if (cached && isValidCoordinate(cached.lat, cached.lng)) {
    return NextResponse.json({
      success: true,
      originalUrl: trimmed,
      resolvedUrl: cached.resolvedUrl,
      lat: cached.lat,
      lng: cached.lng,
      fromCache: true,
    });
  }

  try {
    // Follow HTTP redirects automatically to find the final expanded Google Maps URL
    const res = await fetch(trimmed, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(7000),
    });

    const finalUrl = res.url || trimmed;
    let coords = extractFromUrlOrText(finalUrl);

    // If coordinates were not found in final URL, inspect the HTML body
    if (!coords && res.ok) {
      try {
        const bodyText = await res.text();
        coords = extractFromUrlOrText(bodyText);
      } catch {
        // Body reading failed
      }
    }

    if (coords && isValidCoordinate(coords.lat, coords.lng)) {
      urlCache.set(trimmed, {
        lat: coords.lat,
        lng: coords.lng,
        resolvedUrl: finalUrl,
      });

      return NextResponse.json({
        success: true,
        originalUrl: trimmed,
        resolvedUrl: finalUrl,
        lat: coords.lat,
        lng: coords.lng,
      });
    }

    return NextResponse.json({
      success: false,
      originalUrl: trimmed,
      resolvedUrl: finalUrl,
      message: "Could not extract valid geographic coordinates from resolved destination",
    });
  } catch (error) {
    console.error("Resolve maps URL error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to resolve maps link",
      },
      { status: 500 }
    );
  }
}
