const { client } = require("../config/elasticsearchClient");
const ProductModel = require("../models/ProductModel");

const syncProductsToElasticsearch = async () => {
  const products = await ProductModel.getAllProducts();

  const body = products.flatMap((doc) => [
    { index: { _index: "products" } },
    {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      price: doc.price,
      categories: doc.categories,
      brand: doc.brand,
      isHandmade: doc.isHandmade,
      countryOfOrigin: doc.countryOfOrigin,
    },
  ]);

  const { body: bulkResponse } = await client.bulk({ refresh: true, body });

  if (bulkResponse.errors) {
    const erroredDocuments = [];
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0];
      if (action[operation].error) {
        erroredDocuments.push({
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1],
        });
      }
    });
    console.error("Failed to index some documents", erroredDocuments);
  }

  console.log("Products synced to Elasticsearch");
};

module.exports = { syncProductsToElasticsearch };
