const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/Dash-Board");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "error connecting to database"));
db.once("open", () => {
  console.log("Data Base is connected successfully");
});
module.exports = mongoose;
