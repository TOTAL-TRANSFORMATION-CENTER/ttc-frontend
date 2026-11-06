import { prisma } from "@/lib/prisma";
import type { AttendancePortalMode, AttendancePortalStatus } from "@/types";

/**
 * Returns date and time breakdown in Indian Standard Time (Asia/Kolkata, UTC+5:30).
 * Edge and Node.js compatible via standard Intl.DateTimeFormat.
 */
export function getKolkataDateTime(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = parseInt(partMap["year"] || "1970", 10);
  const month = parseInt(partMap["month"] || "1", 10);
  const day = parseInt(partMap["day"] || "1", 10);
  const hours = parseInt(partMap["hour"] || "0", 10);
  const minutes = parseInt(partMap["minute"] || "0", 10);
  const seconds = parseInt(partMap["second"] || "0", 10);

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = dayMap[partMap["weekday"] || "Sun"] ?? 0;

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateString = `${year}-${pad(month)}-${pad(day)}`;
  const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    year,
    month,
    day,
    dayOfWeek,
    hours,
    minutes,
    seconds,
    dateString,
    timeString,
    isSunday: dayOfWeek === 0,
  };
}

/**
 * Checks whether current IST time falls within Sunday 07:00 AM to 12:00 AM Monday (midnight).
 */
export function isAutomaticWindowOpen(ist = getKolkataDateTime()): boolean {
  if (ist.dayOfWeek === 0) {
    // Sunday from 07:00:00 to 23:59:59 IST
    return ist.hours >= 7;
  }
  return false;
}

/**
 * Determines default church service based on Sunday time of day
 */
export function getDefaultServiceCode(hours: number): string {
  if (hours < 9) {
    return "SERVICE_1"; // 1st Service (07:00 AM - 09:00 AM)
  } else if (hours < 11) {
    return "SERVICE_2"; // 2nd Service (09:00 AM - 11:00 AM)
  } else {
    return "SERVICE_3"; // 3rd Service (11:00 AM - 01:00 PM)
  }
}

/**
 * Retrieves the live attendance portal status taking into account:
 * 1. Database system setting override ("AUTOMATIC", "FORCE_OPEN", "FORCE_CLOSED")
 * 2. Automatic Sunday window (7:00 AM to 12:00 AM Monday IST)
 * 3. Optional admin preview bypass
 */
export async function getAttendancePortalStatus(preview = false): Promise<AttendancePortalStatus> {
  const ist = getKolkataDateTime();

  let mode: AttendancePortalMode = "AUTOMATIC";
  try {
    const setting = await prisma.system_settings.findUnique({
      where: { key: "attendance_portal_mode" },
    });
    if (setting?.value) {
      mode = setting.value.toUpperCase() as AttendancePortalMode;
    }
  } catch (err) {
    console.warn("Could not read attendance_portal_mode, defaulting to AUTOMATIC:", err);
  }

  let isOpen = false;
  if (preview) {
    isOpen = true;
  } else if (mode === "FORCE_OPEN") {
    isOpen = true;
  } else if (mode === "FORCE_CLOSED") {
    isOpen = false;
  } else {
    // AUTOMATIC mode
    isOpen = isAutomaticWindowOpen(ist);
  }

  const defaultService = getDefaultServiceCode(ist.hours);

  const politeClosedMessage =
  "Total Transformation Center Attendance Portal is currently closed. Our self check-in service opens every Sunday. If you are attending a special fellowship or need assistance, please speak with our welcome desk team.";

  return {
    isOpen,
    mode,
    serviceDate: ist.dateString,
    currentTimeIST: `${ist.dateString} ${ist.timeString} IST`,
    defaultService,
    isSunday: ist.isSunday,
    politeMessage: isOpen ? undefined : politeClosedMessage,
  };
}

