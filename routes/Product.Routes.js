const express = require('express')
const productController = require('../controller/Product.Controller')
const Router = express.Router()


Router.get('/initialize-database',productController.initializeDatabase);
Router.get('/transactions',productController.listTransactions);
Router.get('/statistics',productController.getStatistics);
Router.get('/bar-chart', productController.getBarChartData);
Router.get('/pie-chart', productController.getPieChartData);
Router.get('/combined-data',productController.combinedData);


module.exports=Router