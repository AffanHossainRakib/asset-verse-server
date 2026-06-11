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

    // NOTE: collection.distinct() is not allowed under serverApi strict mode,
    // so distinct company names are computed via aggregation instead.
    const [totalAssets, companyGroups, totalUsers, totalRequests, assetUnits] =
      await Promise.all([
        assetCollection.countDocuments({}),
        assetCollection
          .aggregate([{ $group: { _id: "$companyName" } }])
          .toArray(),
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

    const companyNames = companyGroups.map((group) => group._id);

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
