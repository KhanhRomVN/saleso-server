const {
  ProductModel,
  DiscountModel,
  FeedbackModel,
  ProductAnalyticModel,
  ProductLogModel,
} = require("../../../models");
const logger = require("../../../config/logger");
const { client } = require("../../../config/elasticsearchClient");

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
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
  const product = await ProductModel.getProductById(product_id);
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
  createProduct: async (req, res) =>
    handleRequest(req, res, async (req) => {
      const productData = req.body;
      const seller_id = req.user._id.toString();
      // create slug
      const baseSlug = slugify(productData.name);
      const uniqueSlug = await ProductModel.getUniqueSlug(baseSlug);
      productData.slug = uniqueSlug;
      // create product
      const product = await ProductModel.createProduct(productData, seller_id);
      // create product analytic
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const productAnalyticData = {
        product_id: product.product_id,
        year,
        month,
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
      // create product log
      const productLogData = {
        product_id: product.product_id,
        title: "Create new product",
        content: `Seller with id-[${seller_id}] has successfully created a product with id-[${product.product_id}]`,
        created_at: new Date(),
      };
      await ProductLogModel.createLog(productLogData);
      return { message: "Create product successfully" };
    }),

  getProductById: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await ProductModel.getProductById(req.params.product_id);
    }),

  getProductsBySellerId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const products = await ProductModel.getListProductBySellerId(
        req.user._id.toString()
      );
      return products.map((product) => {
        // Calculate price
        let price;
        if (product.variants.length > 1) {
          const prices = product.variants.map((variant) => variant.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          price = `${minPrice}$ - ${maxPrice}$`;
        } else if (product.variants.length === 1) {
          price = product.variants[0].price;
        } else {
          price = null;
        }

        // Calculate total stock
        const stock = product.variants.reduce(
          (total, variant) => total + variant.stock,
          0
        );

        const applied_discounts = [
          ...product.upcoming_discounts,
          ...product.ongoing_discounts,
          ...product.expired_discounts,
        ];

        return {
          _id: product._id,
          name: product.name,
          image: product.images[0] || null,
          origin: product.origin,
          is_active: product.is_active,
          seller_id: product.seller_id,
          price: price,
          stock: stock,
          applied_discounts,
        };
      });
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
      const { product_id } = req.params;
      const { keys, values } = req.body;
      const seller_id = req.user._id.toString();

      // Check if the user owns the product
      await checkUserOwnership(product_id, seller_id);

      const result = await ProductModel.updateProduct(product_id, keys, values);
      return {
        message: "Product updated successfully",
        modifiedCount: result.modifiedCount,
      };
    }),

  toggleActive: async (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id } = req.params;
      const seller_id = req.user._id.toString();
      await checkUserOwnership(product_id, seller_id);
      await ProductModel.toggleActive(product_id);
      // create product log
      const productLogData = {
        product_id: product_id,
        title: "The seller has changed the active product",
        created_at: new Date(),
      };
      await ProductLogModel.createLog(productLogData);
      return { message: "Update active successfully" };
    }),

  addStock: async (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id } = req.params;
      const { sku, stockValue } = req.body;
      const seller_id = req.user._id.toString();
      await checkUserOwnership(product_id, seller_id);
      if (!Number.isInteger(stockValue) || stockValue <= 0) {
        throw new Error("Stock value must be a positive integer");
      }
      const result = await ProductModel.updateStock(
        product_id,
        stockValue,
        sku
      );
      // create product log
      const productLogData = {
        product_id,
        title: "The seller has added the product to the stock",
        content: `The seller added ${stockValue} product with an SKU of ${sku} to the stock`,
        created_at: new Date(),
      };
      await ProductLogModel.createLog(productLogData);
      return {
        message: "Stock added successfully",
        modifiedCount: result.modifiedCount,
      };
    }),

  delStock: async (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id } = req.params;
      const { sku, stockValue } = req.body;
      const seller_id = req.user._id.toString();

      // Check if the user owns the product
      await checkUserOwnership(product_id, seller_id);

      if (!Number.isInteger(stockValue) || stockValue <= 0) {
        throw new Error("Stock value must be a positive integer");
      }

      const product = await ProductModel.getProductById(product_id);
      const variant = product.variants.find((v) => v.sku === sku);

      if (!variant) {
        throw new Error("SKU not found for this product");
      }

      if (variant.stock < stockValue) {
        throw new Error("Insufficient stock to remove");
      }

      const result = await ProductModel.updateStock(
        product_id,
        -stockValue,
        sku
      );
      // create product log
      const productLogData = {
        product_id,
        title: "The seller has removed the product to the stock",
        content: `The seller removed ${stockValue} product with an SKU of ${sku} to the stock`,
        created_at: new Date(),
      };
      await ProductLogModel.createLog(productLogData);
      return {
        message: "Stock removed successfully",
        modifiedCount: result.modifiedCount,
      };
    }),

  deleteProduct: async (req, res) => {
    handleRequest(req, res, async (req) => {
      await ProductModel.deleteProduct(req.params.product_id);
      return { message: "Product deleted successfully" };
    });
  },

  refreshProduct: async (req, res) =>
    handleRequest(req, res, async (req) => {
      const result = await ProductModel.refreshProduct();
      return result;
    }),
};

module.exports = ProductController;
