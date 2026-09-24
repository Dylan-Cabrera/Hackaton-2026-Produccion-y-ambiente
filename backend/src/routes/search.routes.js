const express = require("express");
const router = express.Router();
const { searchProducts, getUnmetDemand } = require("../controllers/search.controller");

router.get("/search", searchProducts);
router.get("/unmet-demand", getUnmetDemand);

module.exports = router;
