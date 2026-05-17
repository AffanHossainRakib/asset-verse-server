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

const findAvailableAssets = async (options = {}) => {
  const { companyName, search, skip = 0, limit = 0 } = options;
  const assetCollection = await getAssetCollection();

  const filter = { availableQuantity: { $gt: 0 } };

  if (companyName) {
    filter.companyName = companyName;
  }

  if (search) {
    const q = new RegExp(String(search).trim(), "i");
    filter.$or = [{ productName: q }, { productType: q }, { companyName: q }];
  }

  const total = await assetCollection.countDocuments(filter);

  let cursor = assetCollection.find(filter).sort({ createdAt: -1 });

  if (skip && skip > 0) cursor = cursor.skip(skip);
  if (limit && limit > 0) cursor = cursor.limit(limit);

  const data = await cursor.toArray();

  return { data, total };
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

const deleteAssetById = async (assetId) => {
  const assetCollection = await getAssetCollection();
  return assetCollection.deleteOne({ _id: new ObjectId(assetId) });
};

module.exports = {
  createAsset,
  findAssetsByCompany,
  findAvailableAssets,
  findAssetById,
  findAssetsByIds,
  updateAssetById,
  deleteAssetById,
};
