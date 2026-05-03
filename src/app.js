const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user.route");

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || true }));

app.get("/", (req, res) => {
  res.send("Asset Verse is fine.");
});

app.use("/api/users", userRoutes);

module.exports = app;
