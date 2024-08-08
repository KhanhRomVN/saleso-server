const { client } = require("../config/elasticsearchClient");

const dataset = [
  {
    name: "Snow Crash",
    author: "Neal Stephenson",
    release_date: "1992-06-01",
    page_count: 470,
    _extract_binary_content: true,
    _reduce_whitespace: true,
    _run_ml_inference: true,
  },
];

async function testElasticsearch() {
  try {
    // Indexing dữ liệu
    const body = dataset.flatMap((doc) => [
      { index: { _index: "books" } },
      doc,
    ]);

    const bulkResponse = await client.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      console.log("Bulk operation had errors");
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          console.log(`${operation} ${i} error`, action[operation].error);
        }
      });
    } else {
      console.log(`Successfully indexed ${dataset.length} documents`);
    }

    // Thực hiện một tìm kiếm đơn giản
    const searchResponse = await client.search({
      index: "books",
      body: {
        query: {
          match: { name: "Snow" },
        },
      },
    });

    console.log("Search results:", searchResponse.hits.hits);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

testElasticsearch();
