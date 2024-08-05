const {
  ProductModel,
  DiscountModel,
  ReviewModel,
} = require("../../models/index");
const logger = require("../../config/logger");
const { redisClient } = require("../../config/redisClient");

const createDescriptionDiscount = (discount) => {
  if (!discount) return null;

  switch (discount.type) {
    case "percentage":
      return `Discount ${discount.value}%`;
    case "fixed":
      return `Discount $${discount.value}`;
    case "buy_x_get_y":
      return `Buy ${discount.value.buyQuantity} Get ${discount.value.getFreeQuantity} Free`;
    case "flash-sale":
      return `Flash Sale ${discount.value}%`;
    default:
      return "Invalid discount type";
  }
};

const processFlashSaleProducts = async (products) => {
  const processedProducts = await Promise.all(
    products.map(async (product) => {
      const rating = await ReviewModel.getAverageRatingForProduct(product._id);
      return {
        _id: product._id,
        name: product.name,
        price:
          product.price ||
          (product.attributes
            ? Math.min(
                ...Object.values(product.attributes).flatMap((attr) =>
                  attr.map((item) => parseFloat(item.price))
                )
              )
            : null),
        images: product.images,
        flashSaleDiscount: product.flashSaleDiscount
          ? product.flashSaleDiscount.value
          : null,
        averageRating: rating ? rating.averageRating : null,
        totalReviews: rating ? rating.totalReviews : null,
      };
    })
  );

  return processedProducts;
};

const handleRequest = async (req, res, operation) => {
  try {
    const result = await operation(req);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error in ${operation.name}: ${error}`);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

const checkUserOwnership = async (product_id, seller_id) => {
  const product = await ProductModel.getProductByProdId(product_id);
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }
  if (product.seller_id.toString() !== seller_id.toString()) {
    const error = new Error("Unauthorized: You don't own this product");
    error.status = 403;
    throw error;
  }
  return product;
};

const clearProductCache = async (productId) => {
  const keys = await redisClient.keys(`product:*${productId}*`);
  if (keys.length > 0) await redisClient.del(keys);
};

const ProductController = {
  createProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const productData = {
        ...req.body,
        seller_id: req.user._id.toString(),
        upcoming_discounts: [],
        ongoing_discounts: [],
        expired_discounts: [],
      };
      const newProduct = await ProductModel.createProduct(productData);
      await clearProductCache(newProduct._id);
      return { message: "Product added successfully", product: newProduct };
    }),

  getProductById: (req, res) =>
    handleRequest(req, res, async (req) =>
      ProductModel.getProductByProdId(req.params.product_id)
    ),

  getProductsBySellerId: (req, res) =>
    handleRequest(req, res, async (req) =>
      ProductModel.getListProductBySellerId(req.params.seller_id)
    ),

  getProductsWithDiscountBySellerId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const products = await ProductModel.getListProductBySellerId(
        req.params.seller_id
      );

      const productsWithDiscounts = await Promise.all(
        products.map(async (product) => {
          const discountArrays = [
            "upcoming_discounts",
            "ongoing_discounts",
            "expired_discounts",
          ];
          const discountsWithDescription = {};

          for (const arrayName of discountArrays) {
            discountsWithDescription[arrayName] = await Promise.all(
              product[arrayName].map(async (discountId) => {
                const discount =
                  await DiscountModel.getDiscountById(discountId);
                if (discount) {
                  discount.description = createDescriptionDiscount(discount);
                }
                return discount;
              })
            );
          }

          return {
            ...product,
            ...discountsWithDescription,
          };
        })
      );

      return productsWithDiscounts;
    }),

  getProductsByCategory: (req, res) =>
    handleRequest(req, res, async (req) =>
      ProductModel.getListProductByCategory(req.params.category)
    ),

  getFlashSaleProducts: (req, res) =>
    handleRequest(req, res, async (req) => {
      const products = await ProductModel.getFlashSaleProduct();
      return processFlashSaleProducts(products);
    }),

  getTopSellingProducts: (req, res) =>
    handleRequest(req, res, async (req) => {
      const limit = parseInt(req.query.limit) || 10;
      const products = await ProductModel.getTopSellProduct(limit);

      const processedProducts = await Promise.all(
        products.map(async (product) => {
          const { averageRating, totalReviews } =
            await ReviewModel.getAverageRatingForProduct(product._id);

          return {
            _id: product._id,
            name: product.name,
            images: product.images,
            price:
              product.price ||
              (product.attributes
                ? Math.min(
                    ...Object.values(product.attributes).flatMap((attr) =>
                      attr.map((item) => parseFloat(item.price))
                    )
                  )
                : null),
            averageRating,
            totalReviews,
          };
        })
      );

      return processedProducts;
    }),

  getProductsByCategories: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { categories } = req.body;
      if (!Array.isArray(categories) || categories.length === 0) {
        throw new Error("Invalid categories input");
      }

      const productsByCategory = await Promise.all(
        categories.map(async (category) => {
          const products =
            await ProductModel.getListProductByCategory(category);

          const processedProducts = await Promise.all(
            products.map(async (product) => {
              const { averageRating, totalReviews } =
                await ReviewModel.getAverageRatingForProduct(product._id);

              return {
                _id: product._id,
                name: product.name,
                price:
                  product.price ||
                  (product.attributes
                    ? Math.min(
                        ...Object.values(product.attributes).flatMap((attr) =>
                          attr.map((item) => parseFloat(item.price))
                        )
                      )
                    : null),
                images: product.images,
                averageRating,
                totalReviews,
              };
            })
          );

          return processedProducts;
        })
      );

      return productsByCategory;
    }),

  searchProducts: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { query, limit, skip, sort, minPrice, maxPrice, categories } =
        req.body;
      return ProductModel.searchProducts(query, {
        limit,
        skip,
        sort,
        minPrice,
        maxPrice,
        categories,
      });
    }),

  updateProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const product = await checkUserOwnership(
        req.params.product_id,
        req.user._id.toString()
      );
      const updatedProduct = await ProductModel.updateProduct(
        req.params.product_id,
        req.body
      );
      await clearProductCache(req.params.product_id);
      return {
        message: "Product updated successfully",
        product: updatedProduct,
      };
    }),

  deleteProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      await checkUserOwnership(req.params.product_id, req.user._id.toString());
      await ProductModel.deleteProduct(req.params.product_id);
      await clearProductCache(req.params.product_id);
      return { message: "Product deleted successfully" };
    }),

  updateProductStock: (req, res) =>
    handleRequest(req, res, async (req) => {
      await checkUserOwnership(req.params.product_id, req.user._id.toString());
      const { quantity } = req.body;
      const updatedProduct = await ProductModel.updateStock(
        req.params.product_id,
        quantity
      );
      return {
        message: "Product stock updated successfully",
        product: updatedProduct,
      };
    }),
};

module.exports = ProductController;
