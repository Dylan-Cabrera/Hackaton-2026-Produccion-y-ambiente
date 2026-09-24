const express = require("express");
const router = express.Router();
const { searchProducts, getUnmetDemand, getDemandPoints } = require("../controllers/search.controller");

router.get("/search", searchProducts);
router.get("/unmet-demand", getUnmetDemand);
router.get("/demand-heatmap", getDemandPoints);

module.exports = router;
