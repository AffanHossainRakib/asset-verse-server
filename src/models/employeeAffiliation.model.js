const { ObjectId } = require("mongodb");
const { getEmployeeAffiliationCollection } = require("../config/db");

const createAffiliation = async (affiliationDocument) => {
  const collection = await getEmployeeAffiliationCollection();
  return collection.insertOne(affiliationDocument);
};

const findAffiliationByEmailAndCompany = async (employeeEmail, companyName) => {
  const collection = await getEmployeeAffiliationCollection();
  return collection.findOne({
    employeeEmail: employeeEmail.toLowerCase(),
    companyName,
  });
};

const findAffiliationsByEmployeeEmail = async (employeeEmail) => {
  const collection = await getEmployeeAffiliationCollection();
  return collection
    .find({ employeeEmail: employeeEmail.toLowerCase() })
    .sort({ affiliationDate: -1 })
    .toArray();
};

const findAffiliationsByCompany = async (companyName) => {
  const collection = await getEmployeeAffiliationCollection();
  return collection
    .find({ companyName, status: "active" })
    .sort({ affiliationDate: -1 })
    .toArray();
};

const updateAffiliationById = async (affiliationId, updateDoc) => {
  const collection = await getEmployeeAffiliationCollection();
  return collection.updateOne(
    { _id: new ObjectId(affiliationId) },
    { $set: updateDoc },
  );
};

const deleteAffiliationById = async (affiliationId) => {
  const collection = await getEmployeeAffiliationCollection();
  return collection.deleteOne({ _id: new ObjectId(affiliationId) });
};

module.exports = {
  createAffiliation,
  findAffiliationByEmailAndCompany,
  findAffiliationsByEmployeeEmail,
  findAffiliationsByCompany,
  updateAffiliationById,
  deleteAffiliationById,
};
