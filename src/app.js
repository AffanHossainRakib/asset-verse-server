const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user.route");
const assetRoutes = require("./routes/asset.route");
const requestRoutes = require("./routes/request.route");
const assignedAssetRoutes = require("./routes/assignedAsset.route");
const packageRoutes = require("./routes/package.route");
const subscriptionRoutes = require("./routes/subscription.route");
const employeeAffiliationRoutes = require("./routes/employeeAffiliation.route");
const paymentRoutes = require("./routes/payment.route");
const myTeamRoutes = require("./routes/myTeam.route");
const contactRoutes = require("./routes/contact.route");
const statsRoutes = require("./routes/stats.route");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

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
app.use("/api/employee-affiliations", employeeAffiliationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/my-team", myTeamRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/stats", statsRoutes);

// Centralized 404 + error handling (must stay last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
