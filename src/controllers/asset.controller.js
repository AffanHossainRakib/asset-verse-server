const { ObjectId } = require("mongodb");
const { findUserByEmail } = require("../models/user.model");
const {
  createAsset,
  findAssetsByCompany,
  findAvailableAssets,
  findPublicAssets,
  findRelatedAssets,
  getDistinctProductTypes,
  findAssetById,
  updateAssetById,
  deleteAssetById,
} = require("../models/asset.model");

const MAX_PUBLIC_PAGE_SIZE = 48;

// Public catalog: search + filters + sorting + pagination (no auth required)
const getPublicAssets = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const requestedLimit = Number(req.query.limit) || 12;
    const limit = Math.min(Math.max(1, requestedLimit), MAX_PUBLIC_PAGE_SIZE);
    const search = String(req.query.search || "").trim();
    const productType = String(req.query.productType || "").trim();
    const availability = String(req.query.availability || "").trim();
    const sort = String(req.query.sort || "newest").trim();

    const { data, total } = await findPublicAssets({
      search,
      productType,
      availability,
      sort,
      skip: (page - 1) * limit,
      limit,
    });

    return res.status(200).json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch assets.",
    });
  }
};

// Public filter metadata (distinct product types)
const getPublicAssetTypes = async (req, res) => {
  try {
    const types = await getDistinctProductTypes();
    return res.status(200).json({
      success: true,
      data: types.filter(Boolean).sort(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch asset types.",
    });
  }
};

// Public details page data (asset + related assets)
const getPublicAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset id.",
      });
    }

    const asset = await findAssetById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found.",
      });
    }

    const related = await findRelatedAssets(asset, 4);

    return res.status(200).json({
      success: true,
      data: { asset, related },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch asset details.",
    });
  }
};

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

    // Parse query params for pagination and search
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 0; // 0 means no limit
    const search = req.query.search || "";
    const productType = req.query.productType || "";
    const companyQuery = req.query.companyName || null;

    // If HR and no paging/search params provided, return full company assets
    const noPaging = !req.query.page && !req.query.limit && !req.query.search;
    if (profile.role === "hr" && noPaging) {
      const assets = await findAssetsByCompany(profile.companyName);

      return res.status(200).json({
        success: true,
        data: assets,
      });
    }

    // For employees (and when paging/search requested), return paginated available assets
    const pageSize = limit > 0 ? limit : profile.role === "hr" ? 0 : 10;
    const skip = pageSize > 0 ? (page - 1) * pageSize : 0;

    const filterCompany =
      companyQuery || (profile.role !== "hr" ? profile.companyName : null);

    const { data, total } = await findAvailableAssets({
      companyName: filterCompany,
      search: search || productType,
      skip,
      limit: pageSize,
    });

    return res.status(200).json({
      success: true,
      data,
      total,
      page: pageSize > 0 ? page : 1,
      limit: pageSize,
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
      status: "active",
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

    const hasProductQuantityUpdate = req.body.productQuantity !== undefined;
    const nextProductQuantity = hasProductQuantityUpdate
      ? Number(req.body.productQuantity)
      : asset.productQuantity;

    if (
      hasProductQuantityUpdate &&
      (!Number.isFinite(nextProductQuantity) || nextProductQuantity < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "productQuantity must be a positive number.",
      });
    }

    const assignedQuantity =
      (asset.productQuantity ?? 0) - (asset.availableQuantity ?? 0);
    const nextAvailableQuantity = hasProductQuantityUpdate
      ? nextProductQuantity - assignedQuantity
      : asset.availableQuantity;

    if (nextAvailableQuantity < 0) {
      return res.status(400).json({
        success: false,
        message:
          "productQuantity cannot be less than the number of already assigned assets.",
      });
    }

    const updateDoc = {
      ...req.body,
      ...(hasProductQuantityUpdate
        ? {
            productQuantity: nextProductQuantity,
            availableQuantity: nextAvailableQuantity,
          }
        : {}),
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

    const result = await deleteAssetById(id);

    if (!result.deletedCount) {
      return res.status(500).json({
        success: false,
        message: "Unable to delete asset.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Asset deleted successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to delete asset.",
    });
  }
};

module.exports = {
  getPublicAssets,
  getPublicAssetTypes,
  getPublicAssetById,
  getAssets,
  createNewAsset,
  updateAsset,
  deleteAsset,
};
