const express = require("express");
const { getDB } = require("../config/mongoDB");
const router = express.Router();

const COLLECTION_NAME = "products";

async function cleanupExpiredDiscounts() {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const now = new Date();

  try {
    const result = await collection.updateMany(
      {
        "discount_time.end": { $lt: now.toISOString() },
        discount: { $ne: "" },
      },
      {
        $set: {
          discount: "",
          discount_type: "",
          discount_name: "",
          discount_time: { start: "", end: "" },
          updatedAt: now,
        },
      }
    );

    return {
      message: "Discount cleanup completed",
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error in cleanupExpiredDiscounts:", error);
    throw error;
  }
}

// API endpoint to manually trigger discount cleanup
router.post("/cleanup-discounts", async (req, res) => {
  try {
    const result = await cleanupExpiredDiscounts();
    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error during discount cleanup" });
  }
});

module.exports = { router, cleanupExpiredDiscounts };
