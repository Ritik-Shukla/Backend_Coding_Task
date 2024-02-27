const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  dateOfSale: {
    type: Date,
    required: true,
  },
});
const Products = mongoose.model("Products", productSchema);
module.exports = Products;
