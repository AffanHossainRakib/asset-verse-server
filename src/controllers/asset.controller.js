const { findUserByEmail } = require("../models/user.model");
const {
  createAsset,
  findAssetsByCompany,
  findActiveAssets,
  findAssetById,
  updateAssetById,
} = require("../models/asset.model");

const getHrProfile = async (req) => {
  const email = req.firebaseUser?.email?.toLowerCase();
  if (!email) {
    return null;
  }

  const user = await findUserByEmail(email);
  if (!user || user.role !== "hr") {
    return null;
  }

  return user;
};

const getAssets = async (req, res) => {
  try {
    const email = req.firebaseUser?.email?.toLowerCase();

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user email is missing.",
      });
    }

    const profile = await findUserByEmail(email);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    if (profile.role === "hr") {
      const assets = await findAssetsByCompany(profile.companyName);

      return res.status(200).json({
        success: true,
        data: assets,
      });
    }

    const assets = await findActiveAssets();

    return res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch assets.",
    });
  }
};

const createNewAsset = async (req, res) => {
  try {
    const hrProfile = await getHrProfile(req);

    if (!hrProfile) {
      return res.status(403).json({
        success: false,
        message: "HR access required.",
      });
    }

    const { productName, productImage, productType, productQuantity } =
      req.body;

    if (!productName || !productType || !productQuantity || !productImage) {
      return res.status(400).json({
        success: false,
        message:
          "productName, productType, productQuantity, and productImage are required.",
      });
    }

    const quantity = Number(productQuantity);

    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "productQuantity must be a positive number.",
      });
    }

    const now = new Date().toISOString();
    const assetDocument = {
      productName: productName.trim(),
      productImage: productImage.trim(),
      productType,
      productQuantity: quantity,
      availableQuantity: quantity,
      hrEmail: hrProfile.email,
      companyName: hrProfile.companyName,
      dateAdded: new Date(now),
      createdAt: now,
      updatedAt: now,
    };

    const result = await createAsset(assetDocument);

    return res.status(201).json({
      success: true,
      message: "Asset created successfully.",
      data: {
        ...assetDocument,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to create asset.",
    });
  }
};

const updateAsset = async (req, res) => {
  try {
    const hrProfile = await getHrProfile(req);

    if (!hrProfile) {
      return res.status(403).json({
        success: false,
        message: "HR access required.",
      });
    }

    const { id } = req.params;
    const asset = await findAssetById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found.",
      });
    }

    if (asset.companyName !== hrProfile.companyName) {
      return res.status(403).json({
        success: false,
        message: "You can only edit assets from your company.",
      });
    }

    const updateDoc = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const result = await updateAssetById(id, updateDoc);

    return res.status(200).json({
      success: true,
      message: "Asset updated successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to update asset.",
    });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const hrProfile = await getHrProfile(req);

    if (!hrProfile) {
      return res.status(403).json({
        success: false,
        message: "HR access required.",
      });
    }

    const { id } = req.params;
    const asset = await findAssetById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found.",
      });
    }

    if (asset.companyName !== hrProfile.companyName) {
      return res.status(403).json({
        success: false,
        message: "You can only delete assets from your company.",
      });
    }

    const result = await updateAssetById(id, {
      status: "retired",
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Asset retired successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to retire asset.",
    });
  }
};

module.exports = {
  getAssets,
  createNewAsset,
  updateAsset,
  deleteAsset,
};
