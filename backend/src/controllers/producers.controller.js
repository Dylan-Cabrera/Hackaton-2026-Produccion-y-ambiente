const mockProducers = require("../data/mockProducers");

function getAllProducers(req, res) {
  res.json(mockProducers);
}

module.exports = { getAllProducers };
