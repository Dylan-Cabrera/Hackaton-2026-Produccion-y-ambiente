const express = require("express");
const cors = require("cors");
const producersRoutes = require("./src/routes/producers.routes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/producers", producersRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});