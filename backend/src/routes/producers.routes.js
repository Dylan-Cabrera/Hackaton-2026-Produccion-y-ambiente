const express = require("express");
const router = express.Router();
const { getAllProducers } = require("../controllers/producers.controller");

router.get("/", getAllProducers);

module.exports = router;
