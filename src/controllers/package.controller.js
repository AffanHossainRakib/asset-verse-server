const { findPackages, seedPackages } = require("../models/package.model");

const getPackages = async (req, res) => {
  try {
    const packages = await findPackages();

    if (packages.length === 0) {
      await seedPackages();
      const seededPackages = await findPackages();

      return res.status(200).json({
        success: true,
        data: seededPackages,
      });
    }

    return res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch packages.",
    });
  }
};

module.exports = {
  getPackages,
};
