const cron = require("node-cron");
const { cleanupExpiredDiscounts } = require("../services/discountCleanup");

cron.schedule("0 0 * * *", async () => {
  console.log("Running scheduled discount cleanup task...");
  try {
    const result = await cleanupExpiredDiscounts();
    console.log("Scheduled discount cleanup completed:", result);
  } catch (error) {
    console.error("Error in scheduled discount cleanup:", error);
  }
});

console.log("Discount cleanup scheduled task has been set up.");

// Export the cron job if you need to manage it elsewhere in your application
module.exports = cron;
