const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const COLLECTION_SCHEMA = Joi.object({
  username: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().optional(),
  register_at: Joi.date().required(),
  last_login: Joi.date().default(() => new Date()),
  update_at: Joi.date().default(() => new Date()),
  refreshToken: Joi.string().default(""),
  emailConfirmed: Joi.string().valid("true", "false").default("false"),
}).options({ abortEarly: false });

const UserModel = {
  validateUser: (userData) => {
    const validation = COLLECTION_SCHEMA.validate(userData);
    if (validation.error) {
      throw new Error(
        validation.error.details.map((detail) => detail.message).join(", ")
      );
    }
  },

  registerUser: async (email, role, userData) => {
    const db = getDB();
    try {
      await db
        .collection(role)
        .updateOne({ email: email }, { $set: userData }, { upsert: true });
    } catch (error) {
      throw new Error("Failed to register user: " + error.message);
    }
  },

  confirmEmail: async (email) => {
    const db = getDB();
    try {
      return db
        .collection("users")
        .updateOne({ email }, { $set: { emailConfirmed: "true" } });
    } catch (error) {
      throw new Error("Failed to confirm email: " + error.message);
    }
  },

  addGoogleUser: async (newUser) => {
    const db = getDB();
    try {
      return db.collection("users").insertOne(newUser);
    } catch (error) {
      throw new Error("Failed to add Google user: " + error.message);
    }
  },

  updateRefreshToken: async (user_id, refreshToken, role) => {
    const db = getDB();
    try {
      return db
        .collection(role)
        .updateOne(
          { _id: new ObjectId(user_id) },
          { $set: { refreshToken }, $currentDate: { last_login: true } }
        );
    } catch (error) {
      throw new Error("Failed to update refresh token: " + error.message);
    }
  },

  logoutUser: async (user_id, updateData) => {
    const db = getDB();
    try {
      return db
        .collection("users")
        .updateOne({ _id: new ObjectId(user_id) }, { $set: updateData });
    } catch (error) {
      throw new Error("Failed to logout user: " + error.message);
    }
  },

  getUserById: async (user_id, role) => {
    const db = getDB();
    try {
      return db.collection(role).findOne({ _id: new ObjectId(user_id) });
    } catch (error) {
      throw new Error("Failed to get user by ID: " + error.message);
    }
  },

  getUserByUsername: async (username, role) => {
    const db = getDB();
    try {
      return db.collection(role).findOne({ username });
    } catch (error) {
      throw new Error(
        `Failed to get ${role} account by username <${username}>`
      );
    }
  },

  getAllUsers: async () => {
    const db = getDB();
    try {
      return db.collection("users").find().toArray();
    } catch (error) {
      throw new Error("Failed to get all users: " + error.message);
    }
  },

  getUserByEmail: async (email, role) => {
    const db = getDB();
    try {
      return db.collection(role).findOne({ email });
    } catch (error) {
      throw new Error(`Failed to get ${role} user by email <${email}>`);
    }
  },

  getUserByGoogleId: async (googleId) => {
    const db = getDB();
    try {
      return db.collection("users").findOne({ "oauth.google.gg_id": googleId });
    } catch (error) {
      throw new Error("Failed to get user by Google ID: " + error.message);
    }
  },

  updateUsername: async (user_id, username, role) => {
    const db = getDB();
    try {
      return db
        .collection(role)
        .updateOne(
          { _id: new ObjectId(user_id) },
          { $set: { username }, $currentDate: { update_at: true } }
        );
    } catch (error) {
      throw new Error("Failed to update username: " + error.message);
    }
  },

  updatePassword: async (user_id, currentPassword, newPassword) => {
    const db = getDB();
    try {
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(user_id) });
      if (!user) {
        throw new Error("User not found");
      }
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        throw new Error("Incorrect current password");
      }
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(user_id) },
          { $set: { password: hashedNewPassword } }
        );
    } catch (error) {
      throw new Error("Failed to update password: " + error.message);
    }
  },

  updateForgetPassword: async (user_id, newPassword) => {
    const db = getDB();
    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(user_id) },
          { $set: { password: hashedNewPassword } }
        );
    } catch (error) {
      throw new Error("Failed to update forgotten password: " + error.message);
    }
  },

  updateUserField: async (user_id, updateData) => {
    const db = getDB();
    try {
      return db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(user_id) },
          { $set: updateData, $currentDate: { update_at: true } }
        );
    } catch (error) {
      throw new Error("Failed to update user field: " + error.message);
    }
  },
};

module.exports = UserModel;
