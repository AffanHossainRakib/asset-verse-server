const { ObjectId } = require("mongodb");
const { getAssetCollection } = require("../config/db");

const createAsset = async (assetDocument) => {
  const assetCollection = await getAssetCollection();
  return assetCollection.insertOne(assetDocument);
};

const findAssetsByCompany = async (companyName) => {
  const assetCollection = await getAssetCollection();
  return assetCollection
    .find({ companyName })
    .sort({ createdAt: -1 })
    .toArray();
};

const findActiveAssets = async () => {
  const assetCollection = await getAssetCollection();
  return assetCollection
    .find({ status: "active" })
    .sort({ createdAt: -1 })
    .toArray();
};

const findAssetById = async (assetId) => {
  const assetCollection = await getAssetCollection();
  return assetCollection.findOne({ _id: new ObjectId(assetId) });
};

const findAssetsByIds = async (assetIds = []) => {
  const assetCollection = await getAssetCollection();
  const objectIds = assetIds.map((assetId) => new ObjectId(assetId));

  if (objectIds.length === 0) {
    return [];
  }

  return assetCollection.find({ _id: { $in: objectIds } }).toArray();
};

const updateAssetById = async (assetId, updateDoc) => {
  const assetCollection = await getAssetCollection();
  return assetCollection.updateOne(
    { _id: new ObjectId(assetId) },
    { $set: updateDoc },
  );
};

module.exports = {
  createAsset,
  findAssetsByCompany,
  findActiveAssets,
  findAssetById,
  findAssetsByIds,
  updateAssetById,
};
