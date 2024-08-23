const { GalleryModel } = require("../../models/index");

const handleRequest = async (req, res, operation) => {
  try {
    const result = await operation(req);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const determineStatus = (startDate, endDate) => {
  const now = new Date();
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  if (now.getTime() < startDate.getTime()) return "upcoming";
  if (
    now.getTime() >= startDate.getTime() &&
    now.getTime() <= endDate.getTime()
  )
    return "ongoing";
  return "expired";
};

const GalleryController = {
  createImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_uri, type, ratio, path, startDate, endDate } = req.body;
      const status = determineStatus(startDate, endDate);
      const imageData = {
        image_uri,
        type,
        ratio,
        path,
        startDate,
        endDate,
        status,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await GalleryModel.createImage(imageData);
      return { success: "Create image/gallery success" };
    }),

  deleteImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_id } = req.params;
      await GalleryModel.deleteImage(image_id);
      return { success: "Delete image/gallery success" };
    }),

  getImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_id } = req.params;
      return await GalleryModel.getImageById(image_id);
    }),

  updatePath: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_id } = req.params;
      const { path } = req.body;
      const updatedImage = await GalleryModel.updateImagePath(image_id, path);
      return { success: "Image path updated successfully", updatedImage };
    }),

  getFilteredAndSortedImages: (req, res) =>
    handleRequest(req, res, async (req) => {
      const {
        type,
        ratio,
        status,
        currentDate,
        startDate,
        endDate,
        keyword,
        sortField,
        sortOrder,
        page = 1,
        limit = 10,
      } = req.body;

      const filters = {
        type,
        ratio,
        status,
        currentDate: currentDate === "true",
        startDate,
        endDate,
        keyword,
      };

      const sortOptions = sortField
        ? { field: sortField, order: sortOrder || "asc" }
        : null;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
      };

      return await GalleryModel.getFilteredAndSortedImages(
        filters,
        sortOptions,
        pagination
      );
    }),
};

module.exports = GalleryController;
