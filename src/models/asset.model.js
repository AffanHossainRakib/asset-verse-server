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
  const {
    companyName,
    search,
    productType,
    sort,
    skip = 0,
    limit = 0,
    includeUnavailable = false,
  } = options;
  const assetCollection = await getAssetCollection();

  const filter = includeUnavailable ? {} : { availableQuantity: { $gt: 0 } };

  if (companyName) {
    filter.companyName = companyName;
  }

  if (productType) {
    filter.productType = productType;
  }

  if (search) {
    const q = new RegExp(String(search).trim(), "i");
    filter.$or = [{ productName: q }, { productType: q }, { companyName: q }];
  }

  const total = await assetCollection.countDocuments(filter);

  const sortSpec =
    (sort && PUBLIC_SORT_FIELDS[sort]) || { createdAt: -1 };

  let cursor = assetCollection.find(filter).sort(sortSpec);

  if (skip && skip > 0) cursor = cursor.skip(skip);
  if (limit && limit > 0) cursor = cursor.limit(limit);

  const data = await cursor.toArray();

  return { data, total };
};

const PUBLIC_SORT_FIELDS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "name-asc": { productName: 1 },
  "name-desc": { productName: -1 },
  "quantity-desc": { availableQuantity: -1 },
  "quantity-asc": { availableQuantity: 1 },
};

const findPublicAssets = async (options = {}) => {
  const {
    search,
    productType,
    availability,
    sort = "newest",
    skip = 0,
    limit = 12,
  } = options;
  const assetCollection = await getAssetCollection();

  const filter = { status: { $ne: "archived" } };

  if (productType) {
    filter.productType = productType;
  }

  if (availability === "available") {
    filter.availableQuantity = { $gt: 0 };
  } else if (availability === "unavailable") {
    filter.availableQuantity = { $lte: 0 };
  }

  if (search) {
    const q = new RegExp(String(search).trim(), "i");
    filter.$or = [{ productName: q }, { productType: q }, { companyName: q }];
  }

  const total = await assetCollection.countDocuments(filter);
  const sortSpec = PUBLIC_SORT_FIELDS[sort] || PUBLIC_SORT_FIELDS.newest;

  const data = await assetCollection
    .find(filter)
    .sort(sortSpec)
    .skip(skip > 0 ? skip : 0)
    .limit(limit > 0 ? limit : 12)
    .toArray();

  return { data, total };
};

const findRelatedAssets = async (asset, limit = 4) => {
  const assetCollection = await getAssetCollection();

  return assetCollection
    .find({
      _id: { $ne: asset._id },
      $or: [
        { productType: asset.productType },
        { companyName: asset.companyName },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

const getDistinctProductTypes = async () => {
  const assetCollection = await getAssetCollection();
  return assetCollection.distinct("productType");
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
  findPublicAssets,
  findRelatedAssets,
  getDistinctProductTypes,
  findAssetById,
  findAssetsByIds,
  updateAssetById,
  deleteAssetById,
};
