const { getAssignedAssetCollection } = require("../config/db");

const createAssignedAsset = async (assignmentDocument) => {
  const assignedAssetCollection = await getAssignedAssetCollection();
  return assignedAssetCollection.insertOne(assignmentDocument);
};

const deleteAssignedAssets = async (query = {}) => {
  const assignedAssetCollection = await getAssignedAssetCollection();
  return assignedAssetCollection.deleteMany(query);
};

const findAssignedAssets = async (query = {}) => {
  const assignedAssetCollection = await getAssignedAssetCollection();
  return assignedAssetCollection
    .find(query)
    .sort({ assignmentDate: -1 })
    .toArray();
};

module.exports = {
  createAssignedAsset,
  deleteAssignedAssets,
  findAssignedAssets,
};
