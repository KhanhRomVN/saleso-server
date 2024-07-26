const { ImageModel } = require("../../models/index");

const addCategory = async (req, res) => {
  const { image_url, type, path, image_ratio } = req.body;
  try {
    console.log(image_url);
    const result = await ImageModel.addCategory({
      image_url,
      type,
      path: `category/${path}`,
      image_ratio,
    });
    res
      .status(201)
      .json({ message: "Category added successfully", data: result });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding category", error: error.message });
  }
};

const addBanner = async (req, res) => {
  const { image_url, type, path, image_ratio } = req.body;
  try {
    const result = await ImageModel.addBanner({
      image_url,
      type,
      path,
      image_ratio,
    });
    res
      .status(201)
      .json({ message: "Banner added successfully", data: result });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding banner", error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await ImageModel.getCategories();
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};

const getBanners = async (req, res) => {
  try {
    const banners = await ImageModel.getBanners();
    res.status(200).json(banners);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching banners", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await ImageModel.deleteCategory(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting category", error: error.message });
  }
};

const deleteBanner = async (req, res) => {
  const { id } = req.params;
  try {
    await ImageModel.deleteBanner(id);
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting banner", error: error.message });
  }
};

module.exports = {
  addCategory,
  addBanner,
  getCategories,
  getBanners,
  deleteCategory,
  deleteBanner,
};
