const { getAssignedAssetCollection } = require("../config/db");
const { ObjectId } = require("mongodb");

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

const findAssignedAssetById = async (id) => {
  const assignedAssetCollection = await getAssignedAssetCollection();
  return assignedAssetCollection.findOne({ _id: new ObjectId(id) });
};

const updateAssignedAssetById = async (id, updateDoc) => {
  const assignedAssetCollection = await getAssignedAssetCollection();
  return assignedAssetCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateDoc },
  );
};

const updateAssignedAssets = async (query = {}, updateDoc = {}) => {
  const assignedAssetCollection = await getAssignedAssetCollection();
  return assignedAssetCollection.updateMany(query, { $set: updateDoc });
};

module.exports = {
  createAssignedAsset,
  deleteAssignedAssets,
  findAssignedAssets,
  findAssignedAssetById,
  updateAssignedAssetById,
  updateAssignedAssets,
};
