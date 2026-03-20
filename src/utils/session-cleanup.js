import db from "../models/db.js";

/**
 * Removes expired sessions from the database.
 * In production, this would typically be handled by a cron job.
 */
const cleanupExpiredSessions = async () => {
  try {
    const result = await db.query(`DELETE FROM session WHERE expire < NOW()`);
    if (result.rowCount > 0) {
      console.log(`Cleaned up ${result.rowCount} expired sessions`);
    }
  } catch (error) {
    if (error.code === "42P01") {
      console.log(
        "Session table does not exist yet:\n→ It will be created when the first session is initialized."
      );
      return;
    }
    console.error("Error cleaning up sessions:", error);
  }
};

/**
 * Starts automatic session cleanup. Runs immediately, then on an interval.
 */
const startSessionCleanup = () => {
  cleanupExpiredSessions();
  const twelveHours = 12 * 60 * 60 * 1000;
  setInterval(cleanupExpiredSessions, twelveHours);
  console.log("Session cleanup scheduled to run every 12 hours");
};

export { cleanupExpiredSessions, startSessionCleanup };
