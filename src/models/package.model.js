const { getPackageCollection } = require("../config/db");

const findPackages = async () => {
  const packageCollection = await getPackageCollection();
  return packageCollection.find({}).sort({ price: 1 }).toArray();
};

const seedPackages = async (packages = []) => {
  const packageCollection = await getPackageCollection();

  if (packages.length === 0) {
    await packageCollection.insertMany([
      {
        name: "Basic",
        price: 5,
        employeeLimit: 5,
        features: ["asset-tracking", "basic-reporting"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Standard",
        price: 8,
        employeeLimit: 10,
        features: ["asset-tracking", "basic-reporting", "team-view"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Premium",
        price: 15,
        employeeLimit: 20,
        features: [
          "asset-tracking",
          "basic-reporting",
          "team-view",
          "priority-support",
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }
};

module.exports = {
  findPackages,
  seedPackages,
};
