const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

/**
 * Daily reset function - runs every day at 21:00 KST (12:00 UTC).
 * Resets: check-in status, fortune cookie, matching pool, staff code.
 * Does NOT reset: user accounts, MBTI/birthday, collection items, coupon history.
 */
exports.dailyReset = onSchedule(
  {
    schedule: "0 12 * * *", // 12:00 UTC = 21:00 KST
    timeZone: "Asia/Seoul",
    retryCount: 3,
  },
  async () => {
    const db = getFirestore();

    // Generate new 4-digit staff code
    const newStaffCode = String(Math.floor(1000 + Math.random() * 9000));

    // Update admin config with new staff code
    await db.doc("admin/config").update({
      daily_staff_code: newStaffCode,
      last_code_update: new Date(),
    });

    console.log(`Daily reset complete. New staff code: ${newStaffCode}`);
  }
);
