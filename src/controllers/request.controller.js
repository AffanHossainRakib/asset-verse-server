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
  deleteAssignedAssets,
  findAssignedAssets,
} = require("../models/assignedAsset.model");
const {
  createAffiliation,
  findAffiliationByEmailAndCompany,
  updateAffiliationById,
} = require("../models/employeeAffiliation.model");

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
      (asset) => asset.availableQuantity <= 0,
    );

    if (unavailableAsset) {
      return res.status(400).json({
        success: false,
        message: `${unavailableAsset.productName} is not available right now.`,
      });
    }

    const now = new Date().toISOString();
    // Create a separate request document for each requested asset
    const created = [];

    for (const asset of assets) {
      const requestDocument = {
        assetId: asset._id,
        assetName: asset.productName,
        assetType: asset.productType,
        requesterName: userProfile.name,
        requesterEmail: userProfile.email,
        hrEmail: asset.hrEmail,
        companyName,
        requestDate: now,
        approvalDate: null,
        requestStatus: "pending",
        note: reason || "",
        processedBy: null,
        createdAt: now,
        updatedAt: now,
      };

      const result = await createRequest(requestDocument);
      created.push({ ...requestDocument, _id: result.insertedId });
    }

    return res.status(201).json({
      success: true,
      message: "Asset request(s) submitted successfully.",
      data: created,
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

    // Support both legacy requests (with `assets` array) and new single-asset shape
    const items = request.assets
      ? request.assets.map((a) => ({
          assetId: a.assetId,
          productName: a.productName,
          productType: a.productType,
        }))
      : [
          {
            assetId: request.assetId,
            productName: request.assetName,
            productType: request.assetType,
          },
        ];

    const now = new Date().toISOString();
    const existingAffiliation = await findAffiliationByEmailAndCompany(
      request.requesterEmail,
      request.companyName,
    );

    if (!existingAffiliation) {
      await createAffiliation({
        employeeEmail: request.requesterEmail,
        employeeName: request.requesterName,
        hrEmail: userProfile.email,
        companyName: request.companyName,
        companyLogo: userProfile.companyLogo || "",
        affiliationDate: now,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    } else if (existingAffiliation.status !== "active") {
      await updateAffiliationById(existingAffiliation._id.toString(), {
        employeeEmail: request.requesterEmail,
        employeeName: request.requesterName,
        hrEmail: userProfile.email,
        companyName: request.companyName,
        companyLogo:
          userProfile.companyLogo || existingAffiliation.companyLogo || "",
        affiliationDate: now,
        status: "active",
        updatedAt: now,
      });
    }

    for (const item of items) {
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
        requestId: id,
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

const undoRequest = async (req, res) => {
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
        message: "You can only undo requests from your company.",
      });
    }

    if (request.requestStatus === "pending") {
      return res.status(400).json({
        success: false,
        message: "Pending requests do not need to be undone.",
      });
    }

    const items = request.assets
      ? request.assets.map((a) => ({
          assetId: a.assetId,
          productName: a.productName,
          productType: a.productType,
        }))
      : [
          {
            assetId: request.assetId,
            productName: request.assetName,
            productType: request.assetType,
          },
        ];

    if (request.requestStatus === "approved") {
      const deleteResult = await deleteAssignedAssets({
        requestId: request._id.toString(),
      });

      const deletedCount = deleteResult.deletedCount || 0;

      if (!deletedCount) {
        // Fallback for older approvals that were created before requestId was stored.
        const fallbackDeletes = [];

        for (const item of items) {
          const fallbackQuery = {
            assetId: item.assetId,
            employeeEmail: request.requesterEmail,
            hrEmail: request.hrEmail,
            companyName: request.companyName,
            status: "assigned",
          };

          fallbackDeletes.push(await deleteAssignedAssets(fallbackQuery));
        }

        const fallbackDeletedCount = fallbackDeletes.reduce(
          (total, result) => total + (result.deletedCount || 0),
          0,
        );

        if (!fallbackDeletedCount) {
          return res.status(400).json({
            success: false,
            message:
              "Unable to locate assigned assets for this approved request.",
          });
        }

        for (const item of items) {
          const asset = await findAssetById(item.assetId);

          if (asset) {
            await updateAssetById(item.assetId, {
              availableQuantity: (asset.availableQuantity || 0) + 1,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } else {
        for (const item of items) {
          const asset = await findAssetById(item.assetId);

          if (asset) {
            await updateAssetById(item.assetId, {
              availableQuantity: (asset.availableQuantity || 0) + 1,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    await updateRequestById(id, {
      requestStatus: "pending",
      approvalDate: null,
      processedBy: null,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Request undone successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to undo request.",
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
      approvalDate: null,
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
  undoRequest,
  getAssignedAssetsForCurrentUser,
};
