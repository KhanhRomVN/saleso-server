const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const cron = require("node-cron");

const COLLECTION_NAME = "gallery";
const COLLECTION_SCHEMA = Joi.object({
  image_uri: Joi.string().required(),
  // First, there will be 2 types of images: category and banner
  type: Joi.string().required(),
  // 16:9 | 19:6 | 1:2 | 4:12 | 8:1 | 1:1 | 16:5 | 4:3
  ratio: Joi.string().required(),
  path: Joi.string().required(),
  // startDate will start at 12AM (ex: 00:00 21/08/2024)
  startDate: Joi.date().required(),
  // endDate will start at 12AM (ex: 00:00 22/08/2024)
  endDate: Joi.date().required(),
  status: Joi.string().valid("upcoming", "ongoing", "expired").required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateData = (data) => {
  const { error } = COLLECTION_SCHEMA.validate(data);
  if (error) throw error;
};

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw error;
  }
};

const GalleryModel = {
  createImage: async (imageData) => {
    return handleDBOperation(async (collection) => {
      validateData(imageData);
      await collection.insertOne(imageData);
    });
  },

  deleteImage: async (image_id) => {
    return handleDBOperation(async (collection) => {
      await collection.deleteOne({
        _id: ObjectId(image_id),
      });
    });
  },

  getOngoingImages: async () => {
    return handleDBOperation(async (collection) => {
      const ongoingImages = await collection
        .find({
          status: "ongoing",
        })
        .toArray();
      return ongoingImages;
    });
  },

  getFilteredAndSortedImages: async (filters, sortOptions, pagination) => {
    return handleDBOperation(async (collection) => {
      let query = {};

      // Áp dụng các bộ lọc
      if (filters.type) query.type = filters.type;
      if (filters.ratio) query.ratio = filters.ratio;
      if (filters.status) query.status = filters.status;

      // Lọc theo ngày hiện tại
      if (filters.currentDate) {
        const now = new Date();
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
      }

      // Lọc theo khoảng thời gian
      if (filters.startDate || filters.endDate) {
        query.startDate = query.startDate || {};
        query.endDate = query.endDate || {};
        if (filters.startDate)
          query.startDate.$gte = new Date(filters.startDate);
        if (filters.endDate) query.endDate.$lte = new Date(filters.endDate);
      }

      // Tìm kiếm theo từ khóa trong path
      if (filters.keyword) {
        query.path = { $regex: filters.keyword, $options: "i" };
      }

      // Tạo tùy chọn sắp xếp
      let sort = {};
      if (sortOptions && sortOptions.field) {
        sort[sortOptions.field] = sortOptions.order === "desc" ? -1 : 1;
      }

      // Thực hiện truy vấn với phân trang
      const totalCount = await collection.countDocuments(query);
      const images = await collection
        .find(query)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .toArray();

      return {
        images,
        totalCount,
        currentPage: pagination.page,
        totalPages: Math.ceil(totalCount / pagination.limit),
      };
    });
  },

  changeStatusDaily: async () => {
    return handleDBOperation(async (collection) => {
      const now = new Date();
      await collection.updateMany(
        {
          status: "upcoming",
          startDate: { $lte: now },
        },
        { $set: { status: "ongoing", updated_at: now } }
      );

      await collection.updateMany(
        {
          status: "ongoing",
          endDate: { $lt: now },
        },
        { $set: { status: "expired", updated_at: now } }
      );

      console.log("Daily status update completed successfully.");
    });
  },
};

cron.schedule("0 0 * * *", () => {
  console.log("Running daily status update...");
  changeStatusDaily();
});

module.exports = GalleryModel;
