const { client } = require("../config/elasticsearchClient");

const searchProducts = async (searchParams) => {
  const {
    name,
    categories,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
    sortBy,
    sortOrder,
  } = searchParams;

  const from = (page - 1) * limit;

  let must = [];
  let should = [];
  let filter = [];

  if (name) {
    should.push(
      { match: { name: { query: name, boost: 2 } } },
      { match_phrase: { name: { query: name, boost: 3 } } },
      { fuzzy: { name: { value: name, fuzziness: "AUTO" } } }
    );
  }

  // Lọc theo danh mục
  if (categories && categories.length > 0) {
    filter.push({ terms: { "categories.keyword": categories } });
  }

  // Lọc theo giá
  if (minPrice !== undefined || maxPrice !== undefined) {
    let range = { price: {} };
    if (minPrice !== undefined) range.price.gte = minPrice;
    if (maxPrice !== undefined) range.price.lte = maxPrice;
    filter.push({ range });
  }

  // Xây dựng truy vấn
  const body = {
    query: {
      bool: {
        must,
        should,
        filter,
        minimum_should_match: should.length > 0 ? 1 : 0,
      },
    },
    from,
    size: limit,
  };

  // Sắp xếp
  if (sortBy) {
    body.sort = [{ [sortBy]: { order: sortOrder || "asc" } }];
  }

  try {
    const result = await client.search({
      index: "products",
      body,
    });

    const products = result.hits.hits.map((hit) => ({
      ...hit._source,
      _id: hit._id,
      score: hit._score,
    }));

    const total = result.hits.total.value;

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Elasticsearch search error:", error);
    throw error;
  }
};

module.exports = { searchProducts };
