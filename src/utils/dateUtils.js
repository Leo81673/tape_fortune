/**
 * TAPE Seoul operates on a custom day cycle: 9PM KST to next 9PM KST.
 * This utility handles all date calculations based on this cycle.
 */

/**
 * Get the current cycle date key.
 * A "day" starts at 21:00 KST and ends at 20:59 KST the next day.
 * e.g., 2026-02-20 21:00 ~ 2026-02-21 20:59 → cycle date = "2026-02-20"
 */
export function getCycleDateKey(now = new Date()) {
  const kstOffset = 9 * 60; // KST is UTC+9
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const kstMinutes = utcMinutes + kstOffset;

  let kstDate = new Date(now);
  // Adjust for KST day boundary
  if (kstMinutes >= 24 * 60) {
    kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
  } else {
    kstDate.setTime(now.getTime() + kstOffset * 60 * 1000);
  }

  const kstHour = kstDate.getUTCHours();

  // If before 21:00 KST, the cycle belongs to the previous day
  let cycleDate = new Date(kstDate);
  if (kstHour < 21) {
    cycleDate.setUTCDate(cycleDate.getUTCDate() - 1);
  }

  const year = cycleDate.getUTCFullYear();
  const month = String(cycleDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(cycleDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate a random 4-digit staff code
 */
export function generateStaffCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
