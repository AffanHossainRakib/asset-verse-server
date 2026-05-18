const { ObjectId } = require("mongodb");
const { getRequestCollection } = require("../config/db");

const createRequest = async (requestDocument) => {
  const requestCollection = await getRequestCollection();
  return requestCollection.insertOne(requestDocument);
};

const findRequests = async (query = {}) => {
  const requestCollection = await getRequestCollection();
  return requestCollection.find(query).sort({ requestDate: -1 }).toArray();
};

const findRequestById = async (requestId) => {
  const requestCollection = await getRequestCollection();
  return requestCollection.findOne({ _id: new ObjectId(requestId) });
};

const updateRequestById = async (requestId, updateDoc) => {
  const requestCollection = await getRequestCollection();
  return requestCollection.updateOne(
    { _id: new ObjectId(requestId) },
    { $set: updateDoc },
  );
};

const updateRequests = async (query = {}, updateDoc = {}) => {
  const requestCollection = await getRequestCollection();
  return requestCollection.updateMany(query, { $set: updateDoc });
};

module.exports = {
  createRequest,
  findRequests,
  findRequestById,
  updateRequestById,
  updateRequests,
};
