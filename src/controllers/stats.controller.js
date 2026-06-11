const {
  getAssetCollection,
  getUserCollection,
  getRequestCollection,
} = require("../config/db");

// Public platform statistics for the landing page (dynamic data requirement)
const getPublicStats = async (req, res) => {
  try {
    const [assetCollection, userCollection, requestCollection] =
      await Promise.all([
        getAssetCollection(),
        getUserCollection(),
        getRequestCollection(),
      ]);

    const [totalAssets, companyNames, totalUsers, totalRequests, assetUnits] =
      await Promise.all([
        assetCollection.countDocuments({}),
        assetCollection.distinct("companyName"),
        userCollection.countDocuments({}),
        requestCollection.countDocuments({}),
        assetCollection
          .aggregate([
            {
              $group: {
                _id: null,
                units: { $sum: { $ifNull: ["$productQuantity", 0] } },
              },
            },
          ])
          .toArray(),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalAssets,
        totalAssetUnits: assetUnits[0]?.units ?? 0,
        totalCompanies: companyNames.filter(Boolean).length,
        totalUsers,
        totalRequests,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch statistics.",
    });
  }
};

module.exports = {
  getPublicStats,
};
