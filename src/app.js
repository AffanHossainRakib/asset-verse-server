const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user.route");
const assetRoutes = require("./routes/asset.route");
const requestRoutes = require("./routes/request.route");
const assignedAssetRoutes = require("./routes/assignedAsset.route");
const packageRoutes = require("./routes/package.route");
const subscriptionRoutes = require("./routes/subscription.route");

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || true }));

app.get("/", (req, res) => {
  res.send("Asset Verse is fine.");
});

app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/assigned-assets", assignedAssetRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

module.exports = app;
