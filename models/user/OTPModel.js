const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");

const OTP_COLLECTION = "otps";

const OTPModel = {
  storeOTP: async (email, otp, role) => {
    const db = getDB();
    await db.collection(OTP_COLLECTION).insertOne({
      email,
      otp,
      role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Expires in 15 minutes
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
};

module.exports = OTPModel;
