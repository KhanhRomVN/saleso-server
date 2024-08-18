const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");
const cron = require("node-cron");

const OTP_COLLECTION = "otps";

const OTPModel = {
  storeOTP: async (email, otp, role) => {
    const db = getDB();

    await db.collection(OTP_COLLECTION).deleteOne({ email, role });

    await db.collection(OTP_COLLECTION).insertOne({
      email,
      otp,
      role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
  },

  verifyOTP: async (email, otp, role) => {
    const db = getDB();
    const otpRecord = await db
      .collection(OTP_COLLECTION)
      .findOne({ email, otp, role });
    if (!otpRecord || new Date() > otpRecord.expiresAt) {
      if (otpRecord) {
        await db
          .collection(OTP_COLLECTION)
          .deleteOne({ _id: new ObjectId(otpRecord._id) });
      }
      return false;
    }
    await db
      .collection(OTP_COLLECTION)
      .deleteOne({ _id: new ObjectId(otpRecord._id) });
    return true;
  },

  cleanExpiredOTPs: async () => {
    const db = getDB();
    const result = await db.collection(OTP_COLLECTION).deleteMany({
      expiresAt: { $lt: new Date() },
    });
    // console.log(`Deleted ${result.deletedCount} expired OTPs`);
  },
};

// Cron job to clean expired OTPs every hour
cron.schedule("* * * * *", async () => {
  try {
    await OTPModel.cleanExpiredOTPs();
  } catch (error) {
    console.error("Error cleaning expired OTPs:", error);
  }
});

module.exports = OTPModel;
