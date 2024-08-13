const {
  ProductModel,
  DiscountModel,
  ReviewModel,
} = require("../../models/index");
const logger = require("../../config/logger");
const { redisClient } = require("../../config/redisClient");
const { client } = require("../../config/elasticsearchClient");
const { searchProducts } = require("../../services/productSearch");

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
      const categoryNames = req.body.categories.map(
        (category) => category.name
      );
      const productData = {
        ...req.body,
        categories: categoryNames,
        upcoming_discounts: [],
        ongoing_discounts: [],
        expired_discounts: [],
      };

      await ProductModel.createProduct(productData, req.user._id.toString());
      // await ProductModel.syncProductToES(newProduct._id);
      return { message: "Create Product Successfully" };
    }),

  getProductById: (req, res) =>
    handleRequest(req, res, async (req) => {
      const product = await ProductModel.getProductByProdId(
        req.params.product_id
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const discounts = await Promise.all(
        product.ongoing_discounts.map(async (discountId) => {
          const discount = await DiscountModel.getDiscountById(discountId);
          switch (discount.type) {
            case "percentage":
              return `Discount ${discount.value}%`;
            case "fixed":
              return `Discount -${discount.value}$`;
            case "buy_x_get_y":
              return `Buy ${discount.value.buyQuantity} Get ${discount.value.getFreeQuantity}`;
            case "flash-sale":
              return `Flashsale ${discount.value}%`;
            default:
              return "";
          }
        })
      );

      const reviews = await ReviewModel.getAverageRatingForProduct(
        req.params.product_id
      );

      const {
        is_active,
        createdAt,
        updatedAt,
        expired_discounts,
        ongoing_discounts,
        upcoming_discounts,
        ...refinedProduct
      } = product;

      const response = {
        ...refinedProduct,
        discounts,
        reviews,
      };

      return response;
    }),

  getProductsBySellerId: (req, res) =>
    handleRequest(req, res, async (req) =>
      ProductModel.getListProductBySellerId(req.params.seller_id)
    ),

  getAllProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await ProductModel.getAllProduct(page, limit);

      const processedProducts = await Promise.all(
        result.products.map(async (product) => {
          const { averageRating, totalReviews } =
            await ReviewModel.getAverageRatingForProduct(product._id);

          return {
            ...product,
            averageRating: averageRating || 0,
            totalReviews: totalReviews || 0,
          };
        })
      );

      return {
        ...result,
        products: processedProducts,
      };
    }),

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

  filterProducts: async (req, res) =>
    handleRequest(req, res, async (req) => {
      try {
        const {
          name,
          price,
          sortByPrice,
          countryOfOrigin,
          brand,
          units_sold,
          sortByUnitsSold,
          attributes,
          categories,
        } = req.body;

        let query = {
          bool: {
            must: [],
            filter: [],
          },
        };

        // Filter by name
        if (name) {
          query.bool.must.push({
            match: {
              name: {
                query: name,
                fuzziness: "AUTO",
              },
            },
          });
        }

        // Filter by price
        if (price && (price.min !== undefined || price.max !== undefined)) {
          const priceRange = {};
          if (price.min !== undefined) priceRange.gte = price.min;
          if (price.max !== undefined) priceRange.lte = price.max;
          query.bool.filter.push({ range: { price: priceRange } });
        }

        // Filter by country of origin
        if (countryOfOrigin) {
          query.bool.filter.push({
            term: { countryOfOrigin: countryOfOrigin },
          });
        }

        // Filter by brand
        if (brand) {
          query.bool.filter.push({ term: { brand: brand } });
        }

        // Filter by units sold
        if (
          units_sold &&
          (units_sold.min !== undefined || units_sold.max !== undefined)
        ) {
          const unitsRange = {};
          if (units_sold.min !== undefined) unitsRange.gte = units_sold.min;
          if (units_sold.max !== undefined) unitsRange.lte = units_sold.max;
          query.bool.filter.push({ range: { units_sold: unitsRange } });
        }

        // Filter by attributes
        if (attributes) {
          if (Array.isArray(attributes)) {
            // Case: ["color"]
            attributes.forEach((attr) => {
              query.bool.filter.push({
                nested: {
                  path: "attributes",
                  query: {
                    bool: {
                      must: [{ exists: { field: `attributes.${attr}` } }],
                    },
                  },
                },
              });
            });
          } else if (typeof attributes === "object") {
            // Case: { "color": [{ "value": "red" }] }
            Object.entries(attributes).forEach(([key, values]) => {
              if (Array.isArray(values)) {
                values.forEach((value) => {
                  query.bool.filter.push({
                    nested: {
                      path: "attributes",
                      query: {
                        bool: {
                          must: [
                            { match: { [`attributes.${key}`]: value.value } },
                          ],
                        },
                      },
                    },
                  });
                });
              }
            });
          }
        }

        // Filter by categories
        if (categories && Array.isArray(categories)) {
          query.bool.filter.push({
            terms: { categories: categories },
          });
        }

        // Sorting
        let sort = [];
        if (sortByPrice) {
          sort.push({ price: { order: sortByPrice } });
        }
        if (sortByUnitsSold) {
          sort.push({ units_sold: { order: sortByUnitsSold } });
        }

        // Perform the search
        const result = await client.search({
          index: "products",
          body: {
            query: query,
            sort: sort,
          },
        });

        // Process and return the results
        const products = result.hits.hits.map((hit) => ({
          _id: hit._id,
          ...hit._source,
        }));

        res.json({
          total: result.hits.total.value,
          products: products,
        });
      } catch (error) {
        console.error("Error filtering products:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }),

  updateProduct: async (req, res) =>
    handleRequest(req, res, async (req) => {
      await checkUserOwnership(req.params.product_id, req.user._id.toString());
      const { _id, units_sold, discounts, reviews, seller_id, ...updateData } =
        req.body;
      console.log(updateData);
      await ProductModel.updateProduct(req.params.product_id, updateData);
      return { message: "Update product data successfully" };
    }),

  deleteProduct: async (req, res) => {
    try {
      await ProductModel.deleteProduct(req.params.product_id);
      await client.delete({
        index: "products",
        id: req.params.product_id,
      });
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

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
