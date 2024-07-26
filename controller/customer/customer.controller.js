const { ProductModel } = require("../../models/index");

const getProductCategory = async (req, res) => {
  const { category_name } = req.params;
  try {
    const listProduct =
      await ProductModel.getListProductByCategory(category_name);
    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: listProduct,
    });
  } catch (error) {
    console.error("Error in getProductCategory:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving products",
      error: error.message,
    });
  }
};

module.exports = {
  getProductCategory,
};
