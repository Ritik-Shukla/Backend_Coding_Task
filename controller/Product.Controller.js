const Products = require("../model/index");
const axios = require("axios");

module.exports.initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const seedData = response.data;
    await Products.insertMany(seedData);
    res.json({ message: "Database initialized with seed data" });
  } catch (error) {
    console.error("Error initializing database:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports.listTransactions = async (req, res) => {
  try {
    const { month, search = "", page = 1, perPage = 10 } = req.query;
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(
      new Date(startDate).setMonth(startDate.getMonth() + 1)
    );
    const queryConditions = {
      dateOfSale: {
        $gte: startDate,
        $lt: endDate,
      },
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { price: search },
      ],
    };
    const transactions = await Products.find(queryConditions)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getStatistics = async (req, res) => {
  const { month } = req.query;
  try {
    const startOfMonth = new Date(month);
    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0
    );
    const totalSaleAmount = await Products.aggregate([
      {
        $match: { dateOfSale: { $gte: startOfMonth, $lte: endOfMonth } },
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: { $sum: "$price" },
        },
      },
    ]);
    const totalSoldItems = await Products.countDocuments({
      dateOfSale: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const totalNotSoldItems = await Products.countDocuments({
      dateOfSale: { $gte: startOfMonth, $lte: endOfMonth, $eq: null },
    });
    res.json({
      totalSaleAmount: totalSaleAmount[0]?.totalSaleAmount || 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.getBarChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1); 
    const endDate = new Date(year, monthNum, 0); 
    const barChartData = await Products.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ["$price", 100] }, then: "0 - 100" },
                { case: { $lte: ["$price", 200] }, then: "101 - 200" },
                { case: { $lte: ["$price", 300] }, then: "201 - 300" },
                { case: { $lte: ["$price", 400] }, then: "301 - 400" },
                { case: { $lte: ["$price", 500] }, then: "401 - 500" },
                { case: { $lte: ["$price", 600] }, then: "501 - 600" },
                { case: { $lte: ["$price", 700] }, then: "601 - 700" },
                { case: { $lte: ["$price", 800] }, then: "701 - 800" },
                { case: { $lte: ["$price", 900] }, then: "801 - 900" },
                { case: { $gte: ["$price", 901] }, then: "901-above" },
              ],
              default: "Unknown",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(barChartData);
  } catch (error) {
    console.error("Error fetching bar chart data:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.getPieChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const [year, monthValue] = month.split("-");
    const transactions = await Products.find({
      dateOfSale: {
        $gte: new Date(year, monthValue - 1, 1),
        $lt: new Date(year, monthValue, 1), 
      },
    });
    const categoryCounts = {};
    transactions.forEach((transaction) => {
      const category = transaction.category;
      if (category in categoryCounts) {
        categoryCounts[category]++;
      } else {
        categoryCounts[category] = 1;
      }
    });
    res.json(categoryCounts);
  } catch (error) {
    console.error("Error fetching pie chart data:", error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports.combinedData = async (req, res) => {
  try {
    const { month } = req.query;
    const response1 = await axios.get(
      `http://localhost:8000/api/statistics?month=${month}`
    );
    const seedData1 = response1.data;
    const response2 = await axios.get(
      `http://localhost:8000/api/bar-chart?month=${month}`
    );
    const seedData2 = response2.data;
    const response3 = await axios.get(
      `http://localhost:8000/api/pie-chart?month=${month}`
    );
    const seedData3 = response3.data;
    const combinedData = {
      statistics: seedData1,
      barChart: seedData2,
      pieChart: seedData3,
    };
    res.json(combinedData);
  } catch (error) {
    console.error("Error fetching combined data:", error);
    res.status(500).send("Internal Server Error");
  }
};
