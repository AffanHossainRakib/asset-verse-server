require("dotenv").config();
const app = require("./src/app");

// Don't use app.listen() - export for Vercel instead
module.exports = app;

// Only listen locally when running directly
if (process.env.NODE_ENV !== "production" && require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
