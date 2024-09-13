const {
  ProductModel,
  DiscountModel,
  FeedbackModel,
  ProductAnalyticModel,
} = require("../../../models");
const logger = require("../../../config/logger");
const { client } = require("../../../config/elasticsearchClient");

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

const ProductController = {
  createProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const result = await ProductModel.createProduct(
        req.body,
        req.user._id.toString()
      );

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const productAnalyticData = {
        product_id: result.product_id.toString(),
        year: currentYear,
        month: currentMonth,
        revenue: 0,
        visitor: 0,
        wishlist_additions: 0,
        cart_additions: 0,
        orders_placed: 0,
        orders_cancelled: 0,
        orders_successful: 0,
        reversal: 0,
        discount_applications: 0,
      };

      await ProductAnalyticModel.newProductAnalytic(productAnalyticData);
      return {
        message: "Create product successfully",
        product_id: result.product_id,
      };
    }),

  getProductById: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await ProductModel.getProductById(req.params.product_id);
    }),

  getProductsBySellerId: (req, res) =>
    handleRequest(req, res, async (req) => {
      return ProductModel.getListProductBySellerId(req.user._id.toString());
    }),

  getFlashSaleProducts: (req, res) =>
    handleRequest(req, res, async (req) => {
      const flashSaleProducts = await ProductModel.getFlashSaleProduct();

      const refinedProducts = flashSaleProducts.map((product) => ({
        _id: product._id,
        name: product.name,
        image: product.images[0],
        price:
          product.price ||
          (product.attributes
            ? Math.min(
                ...product.attributes.map((attr) =>
                  parseFloat(attr.attributes_price)
                )
              )
            : null),
        seller_id: product.seller_id,
        discount_value: product.discount_value,
        rating: product.rating,
      }));

      return refinedProducts;
    }),

  getTopSellingProducts: (req, res) =>
    handleRequest(req, res, async (req) => {
      const limit = parseInt(req.query.limit) || 20;
      const topSellingProducts = await ProductModel.getTopSellProduct(limit);

      const refinedProducts = topSellingProducts.map((product) => ({
        _id: product._id,
        name: product.name,
        image: product.images[0],
        price:
          product.price ||
          (product.attributes
            ? Math.min(
                ...product.attributes.map((attr) =>
                  parseFloat(attr.attributes_price)
                )
              )
            : null),
        seller_id: product.seller_id,
        rating: product.rating,
      }));

      return refinedProducts;
    }),

  getProductsByListProductId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const listProduct = await ProductModel.getProductsByListProductId(
        req.body.productIds
      );
      // const refinedProducts = listProduct.map((product) => ({
      //   _id: product._id,
      //   seller_id: product.seller_id,
      //   name: product.name,
      //   image: product.images[0],
      //   price:
      //     product.price ||
      //     (product.attributes
      //       ? Math.min(
      //           ...product.attributes.map((attr) =>
      //             parseFloat(attr.attributes_price)
      //           )
      //         )
      //       : null),
      // }));

      return listProduct;
    }),

  searchProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { value } = req.body;
      const { page = 1, limit = 10 } = req.query;

      let query = {
        bool: {
          should: [],
        },
      };

      if (value) {
        query.bool.should.push(
          {
            match: {
              name: {
                query: value,
                fuzziness: "AUTO",
              },
            },
          },
          {
            match: {
              tags: {
                query: value,
                fuzziness: "AUTO",
              },
            },
          }
        );
      }

      const result = await client.search({
        index: "products",
        body: {
          query: query,
          from: (page - 1) * limit,
          size: limit,
        },
      });

      const products = result.hits.hits.map((hit) => ({
        _id: hit._id,
        ...hit._source,
      }));

      return {
        total: result.hits.total.value,
        page: parseInt(page),
        limit: parseInt(limit),
        products: products,
      };
    }),

  filterProducts: (req, res) =>
    handleRequest(req, res, async (req) => {
      const {
        value,
        countryOfOrigin,
        brand,
        priceMin,
        priceMax,
        rating,
        page = 1,
        limit = 12,
        sortBy = "relevance",
        sortOrder = "desc",
      } = req.body;

      const query = {
        bool: {
          must: [],
          should: [],
          filter: [],
        },
      };

      if (value) {
        query.bool.should.push({
          multi_match: {
            query: value,
            fields: ["name^2", "description", "tags"],
            fuzziness: "AUTO",
            operator: "and",
          },
        });
        query.bool.minimum_should_match = 1;
      }

      if (countryOfOrigin) {
        query.bool.filter.push({
          term: { countryOfOrigin: countryOfOrigin.toLowerCase() },
        });
      }

      if (brand) {
        query.bool.filter.push({ term: { brand: brand.toLowerCase() } });
      }

      if (priceMin !== undefined || priceMax !== undefined) {
        const priceRange = {};
        if (priceMin !== undefined) priceRange.gte = parseFloat(priceMin);
        if (priceMax !== undefined) priceRange.lte = parseFloat(priceMax);
        query.bool.filter.push({ range: { price: priceRange } });
      }

      if (rating) {
        const ratingRange = {
          gte: parseFloat(rating) - 0.5,
          lt: parseFloat(rating) + 0.5,
        };
        query.bool.filter.push({ range: { rating: ratingRange } });
      }

      const sortOptions = {
        relevance: "_score",
        price: "price",
        rating: "rating",
        date: "createdAt",
      };

      const sort = [
        { [sortOptions[sortBy] || "_score"]: { order: sortOrder } },
      ];

      const result = await client.search({
        index: "products",
        body: {
          query,
          sort,
          from: (page - 1) * limit,
          size: limit,
          _source: [
            "id",
            "name",
            "images",
            "attributes",
            "seller_id",
            "price",
            "rating",
            "createdAt",
          ],
        },
      });

      const products = result.hits.hits.map((hit) => {
        const { _id, _source } = hit;
        const { name, images, attributes, seller_id, price, rating } = _source;

        return {
          id: _id,
          name,
          image: images && images.length > 0 ? images[0] : null,
          price:
            attributes && attributes.length > 0
              ? Math.min(
                  ...attributes.map((attr) => parseFloat(attr.attributes_price))
                )
              : parseFloat(price),
          rating: parseFloat(rating),
          seller_id,
        };
      });

      return {
        total: result.hits.total.value,
        page: parseInt(page),
        limit: parseInt(limit),
        products,
      };
    }),

  categoryFilterProducts: (req, res) =>
    handleRequest(req, res, async (req) => {
      const {
        listCategory,
        listAttribute,
        priceMin,
        priceMax,
        rating,
        page = 1,
        limit = 12,
        sortBy = "relevance",
        sortOrder = "desc",
      } = req.body;

      const query = {
        bool: {
          must: [],
          should: [],
          filter: [],
        },
      };

      // Handle category filtering
      if (listCategory && listCategory.length > 0) {
        query.bool.must.push({
          bool: {
            must: listCategory.map((category) => ({
              match: { "categories.category_name": category },
            })),
          },
        });
      }

      // Handle attribute filtering
      if (listAttribute && listAttribute.length > 0) {
        query.bool.should.push({
          bool: {
            should: listAttribute.map((attr) => ({
              match: { "attributes.attributes_value": attr },
            })),
          },
        });
        query.bool.minimum_should_match = 1;
      }

      // Handle price range filtering
      if (priceMin !== undefined || priceMax !== undefined) {
        const priceRange = {};
        if (priceMin !== undefined) priceRange.gte = parseFloat(priceMin);
        if (priceMax !== undefined) priceRange.lte = parseFloat(priceMax);
        query.bool.filter.push({ range: { price: priceRange } });
      }

      // Handle rating filtering
      if (rating) {
        const ratingRange = {
          gte: parseFloat(rating),
        };
        query.bool.filter.push({ range: { rating: ratingRange } });
      }

      const sortOptions = {
        relevance: "_score",
        price: "price",
        rating: "rating",
        date: "createdAt",
      };

      const sort = [
        { [sortOptions[sortBy] || "_score"]: { order: sortOrder } },
      ];

      const result = await client.search({
        index: "products",
        body: {
          query,
          sort,
          from: (page - 1) * limit,
          size: limit,
          _source: [
            "id",
            "name",
            "images",
            "attributes",
            "seller_id",
            "price",
            "rating",
            "createdAt",
          ],
        },
      });

      const products = result.hits.hits.map((hit) => {
        const { _id, _source } = hit;
        const { name, images, attributes, seller_id, price, rating } = _source;

        return {
          id: _id,
          name,
          image: images && images.length > 0 ? images[0] : null,
          price:
            attributes && attributes.length > 0
              ? Math.min(
                  ...attributes.map((attr) => parseFloat(attr.attributes_price))
                )
              : parseFloat(price),
          rating: parseFloat(rating),
          seller_id,
        };
      });

      return {
        total: result.hits.total.value,
        page: parseInt(page),
        limit: parseInt(limit),
        products,
      };
    }),

  updateProduct: async (req, res) =>
    handleRequest(req, res, async (req) => {
      await checkUserOwnership(req.params.product_id, req.user._id.toString());
      const { _id, units_sold, discounts, reviews, seller_id, ...updateData } =
        req.body;
      const updatedProduct = await ProductModel.updateProduct(
        req.params.product_id,
        updateData
      );
      return {
        message: "Update product data successfully",
        product: updatedProduct,
      };
    }),

  deleteProduct: async (req, res) => {
    try {
      await ProductModel.deleteProduct(req.params.product_id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  refreshProduct: async (req, res) =>
    handleRequest(req, res, async (req) => {
      const result = await ProductModel.refreshProduct();
      return result;
    }),
};

module.exports = ProductController;
