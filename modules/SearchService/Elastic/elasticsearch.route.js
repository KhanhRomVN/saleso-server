const express = require("express");
const router = express.Router();
const { client } = require("../../../config/elasticsearchClient");

router.post("/index", async (req, res) => {
  try {
    const dataset = req.body.dataset;

    const body = dataset.flatMap((doc) => [
      { index: { _index: "products", _id: doc._id } },
      // Remove _id from the document body
      {
        ...doc,
        _id: undefined,
      },
    ]);

    const bulkResponse = await client.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      const errors = bulkResponse.items
        .filter((item) => item.index && item.index.error)
        .map((item) => item.index.error);
      res.status(400).json({ message: "Bulk operation had errors", errors });
    } else {
      res.json({ message: `Successfully indexed ${dataset.length} documents` });
    }
  } catch (error) {
    console.error("Elasticsearch indexing error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { name } = req.query;
    console.log(name);

    const searchResponse = await client.search({
      index: "products",
      body: {
        query: {
          match: { name },
        },
      },
    });

    res.json(searchResponse.hits.hits);
  } catch (error) {
    console.error("Elasticsearch search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
