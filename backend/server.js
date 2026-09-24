const express = require("express");
const cors = require("cors");
const producersRoutes = require("./src/routes/producers.routes");
const searchRoutes = require("./src/routes/search.routes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/producers", producersRoutes);
app.use("/api/products", searchRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});