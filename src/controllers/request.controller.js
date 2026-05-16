const { findUserByEmail } = require("../models/user.model");
const {
  findAssetsByIds,
  findAssetById,
  updateAssetById,
} = require("../models/asset.model");
const {
  createRequest,
  findRequests,
  findRequestById,
  updateRequestById,
} = require("../models/request.model");
const {
  createAssignedAsset,
  findAssignedAssets,
} = require("../models/assignedAsset.model");

const getUserProfile = async (req) => {
  const email = req.firebaseUser?.email?.toLowerCase();
  if (!email) {
    return null;
  }

  return findUserByEmail(email);
};

const getRequestsForCurrentUser = async (req, res) => {
  try {
    const userProfile = await getUserProfile(req);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const query =
      userProfile.role === "hr"
        ? { hrEmail: userProfile.email }
        : { requesterEmail: userProfile.email };

    const requests = await findRequests(query);

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch requests.",
    });
  }
};

const createAssetRequest = async (req, res) => {
  try {
    const userProfile = await getUserProfile(req);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const { companyName, assetIds, reason } = req.body;
    const normalizedAssetIds = Array.isArray(assetIds)
      ? assetIds
      : String(assetIds || "")
          .split(",")
          .map((assetId) => assetId.trim())
          .filter(Boolean);

    if (!companyName || normalizedAssetIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "companyName and at least one assetId are required.",
      });
    }

    const assets = await findAssetsByIds(normalizedAssetIds);

    if (assets.length !== normalizedAssetIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more requested assets were not found.",
      });
    }

    const companyMismatch = assets.some(
      (asset) => asset.companyName !== companyName,
    );

    if (companyMismatch) {
      return res.status(400).json({
        success: false,
        message: "All selected assets must belong to the chosen company.",
      });
    }

    const unavailableAsset = assets.find(
      (asset) => asset.status !== "active" || asset.availableQuantity <= 0,
    );

    if (unavailableAsset) {
      return res.status(400).json({
        success: false,
        message: `${unavailableAsset.productName} is not available right now.`,
      });
    }

    const now = new Date().toISOString();
    const requestDocument = {
      companyName,
      hrEmail: assets[0].hrEmail,
      requesterEmail: userProfile.email,
      requesterName: userProfile.name,
      reason: reason || "",
      assets: assets.map((asset) => ({
        assetId: asset._id,
        productName: asset.productName,
        productType: asset.productType,
        companyName: asset.companyName,
        hrEmail: asset.hrEmail,
      })),
      requestStatus: "pending",
      requestDate: now,
      createdAt: now,
      updatedAt: now,
    };

    const result = await createRequest(requestDocument);

    return res.status(201).json({
      success: true,
      message: "Asset request submitted successfully.",
      data: {
        ...requestDocument,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to submit asset request.",
    });
  }
};

const approveRequest = async (req, res) => {
  try {
    const userProfile = await getUserProfile(req);

    if (!userProfile || userProfile.role !== "hr") {
      return res.status(403).json({
        success: false,
        message: "HR access required.",
      });
    }

    const { id } = req.params;
    const request = await findRequestById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    if (request.hrEmail !== userProfile.email) {
      return res.status(403).json({
        success: false,
        message: "You can only approve requests from your company.",
      });
    }

    if (request.requestStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be approved.",
      });
    }

    for (const item of request.assets) {
      const asset = await findAssetById(item.assetId);

      if (!asset || asset.availableQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `${item.productName} is no longer available.`,
        });
      }

      await updateAssetById(item.assetId, {
        availableQuantity: asset.availableQuantity - 1,
        updatedAt: new Date().toISOString(),
      });

      await createAssignedAsset({
        assetId: item.assetId,
        assetName: item.productName,
        assetType: item.productType,
        employeeEmail: request.requesterEmail,
        employeeName: request.requesterName,
        hrEmail: request.hrEmail,
        companyName: request.companyName,
        assignmentDate: new Date().toISOString(),
        status: "assigned",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await updateRequestById(id, {
      requestStatus: "approved",
      approvalDate: new Date().toISOString(),
      processedBy: userProfile.email,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Request approved successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to approve request.",
    });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const userProfile = await getUserProfile(req);

    if (!userProfile || userProfile.role !== "hr") {
      return res.status(403).json({
        success: false,
        message: "HR access required.",
      });
    }

    const { id } = req.params;
    const request = await findRequestById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    if (request.hrEmail !== userProfile.email) {
      return res.status(403).json({
        success: false,
        message: "You can only reject requests from your company.",
      });
    }

    const { reason = "" } = req.body;

    await updateRequestById(id, {
      requestStatus: "rejected",
      rejectionReason: reason,
      processedBy: userProfile.email,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Request rejected successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to reject request.",
    });
  }
};

const getAssignedAssetsForCurrentUser = async (req, res) => {
  try {
    const userProfile = await getUserProfile(req);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const query =
      userProfile.role === "hr"
        ? { companyName: userProfile.companyName }
        : { employeeEmail: userProfile.email };

    const assignedAssets = await findAssignedAssets(query);

    return res.status(200).json({
      success: true,
      data: assignedAssets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch assigned assets.",
    });
  }
};

module.exports = {
  getRequestsForCurrentUser,
  createAssetRequest,
  approveRequest,
  rejectRequest,
  getAssignedAssetsForCurrentUser,
};
