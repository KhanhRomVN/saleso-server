const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "images";

const COLLECTION_SCHEMA = Joi.object({
  image_url: Joi.string().required(),
  type: Joi.string().valid("category", "banner").required(),
  path: Joi.string().required(),
  image_ratio: Joi.string().required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateImage = (data) => {
  const { error, value } = COLLECTION_SCHEMA.validate(data);
  if (error) throw new Error(error.details.map((d) => d.message).join(", "));
  return value;
};

const ImageModel = {
  async addImage(imageData) {
    const db = await getDB();
    const validatedData = validateImage(imageData);
    const result = await db
      .collection(COLLECTION_NAME)
      .insertOne(validatedData);
    return result.insertedId;
  },

  async getImages(type) {
    const db = await getDB();
    const query = type ? { type } : {};
    return db.collection(COLLECTION_NAME).find(query).toArray();
  },

  async deleteImage(id) {
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) throw new Error("Image not found");
  },

  async updateImagePath(id, path) {
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { path, updated_at: new Date() } }
      );
    if (result.modifiedCount === 0)
      throw new Error("Image not found or path not modified");
  },

  async updateImageUrl(id, image_url) {
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { image_url, updated_at: new Date() } }
      );
    if (result.modifiedCount === 0)
      throw new Error("Image not found or URL not modified");
  },
};

module.exports = ImageModel;
