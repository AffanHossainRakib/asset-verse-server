const { findUserByEmail, updateUserByEmail } = require("../models/user.model");
const {
  findAssignedAssets,
  updateAssignedAssets,
} = require("../models/assignedAsset.model");
const { findAssetById, updateAssetById } = require("../models/asset.model");
const {
  findAffiliationsByCompany,
  deleteAffiliationById,
} = require("../models/employeeAffiliation.model");
const { updateRequests } = require("../models/request.model");

const getCurrentUserProfile = async (req) => {
  const email = req.firebaseUser?.email?.toLowerCase();
  if (!email) {
    return null;
  }

  return findUserByEmail(email);
};

const getCompanyEmployees = async (req, res) => {
  try {
    const userProfile = await getCurrentUserProfile(req);

    if (!userProfile || userProfile.role !== "hr") {
      return res.status(403).json({
        success: false,
        message: "HR access required.",
      });
    }

    if (!userProfile.companyName) {
      return res.status(400).json({
        success: false,
        message: "No company affiliation found for this HR account.",
      });
    }

    const searchTerm = req.query.search?.trim().toLowerCase();
    const affiliations = await findAffiliationsByCompany(
      userProfile.companyName,
    );

    const filteredAffiliations = searchTerm
      ? affiliations.filter((affiliation) => {
          const employeeName = affiliation.employeeName?.toLowerCase() || "";
          const employeeEmail = affiliation.employeeEmail?.toLowerCase() || "";

          return (
            employeeName.includes(searchTerm) ||
            employeeEmail.includes(searchTerm)
          );
        })
      : affiliations;

    const employeeRows = await Promise.all(
      filteredAffiliations.map(async (affiliation) => {
        const employeeProfile = await findUserByEmail(
          affiliation.employeeEmail,
        );
        const assignedAssets = await findAssignedAssets({
          companyName: affiliation.companyName,
          employeeEmail: affiliation.employeeEmail,
          status: "assigned",
        });

        return {
          affiliationId: affiliation._id,
          employeeEmail: affiliation.employeeEmail,
          employeeName:
            employeeProfile?.name || affiliation.employeeName || "Unknown",
          profileImage: employeeProfile?.profileImage || "",
          joinDate: affiliation.affiliationDate,
          status: affiliation.status,
          assetsCount: assignedAssets.length,
          companyName: affiliation.companyName,
          companyLogo:
            affiliation.companyLogo || employeeProfile?.companyLogo || "",
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: employeeRows,
      meta: {
        usedEmployees: userProfile.currentEmployees ?? employeeRows.length,
        packageLimit: userProfile.packageLimit ?? 0,
        companyName: userProfile.companyName,
        companyLogo: userProfile.companyLogo || "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch company employees.",
    });
  }
};

const removeEmployeeFromCompany = async (req, res) => {
  try {
    const userProfile = await getCurrentUserProfile(req);

    if (!userProfile || userProfile.role !== "hr") {
      return res.status(403).json({
        success: false,
        message: "HR access required.",
      });
    }

    if (!userProfile.companyName) {
      return res.status(400).json({
        success: false,
        message: "No company affiliation found for this HR account.",
      });
    }

    const { id } = req.params;
    const affiliations = await findAffiliationsByCompany(
      userProfile.companyName,
    );
    const targetAffiliation = affiliations.find(
      (affiliation) => affiliation._id.toString() === id,
    );

    if (!targetAffiliation) {
      return res.status(404).json({
        success: false,
        message: "Employee affiliation not found.",
      });
    }

    const now = new Date().toISOString();

    const assignedAssets = await findAssignedAssets({
      companyName: userProfile.companyName,
      employeeEmail: targetAffiliation.employeeEmail,
      status: "assigned",
    });

    if (assignedAssets.length > 0) {
      const returnCountByAssetId = assignedAssets.reduce((acc, assignment) => {
        const key =
          assignment.assetId?.toString?.() || String(assignment.assetId);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      for (const [assetId, incrementBy] of Object.entries(
        returnCountByAssetId,
      )) {
        const asset = await findAssetById(assetId);

        if (!asset) {
          continue;
        }

        await updateAssetById(assetId, {
          availableQuantity: (asset.availableQuantity || 0) + incrementBy,
          updatedAt: now,
        });
      }

      await updateAssignedAssets(
        {
          companyName: userProfile.companyName,
          employeeEmail: targetAffiliation.employeeEmail,
          status: "assigned",
        },
        {
          status: "returned",
          returnDate: now,
          updatedAt: now,
        },
      );
    }

    await deleteAffiliationById(id);

    await updateRequests(
      {
        requesterEmail: targetAffiliation.employeeEmail,
        companyName: userProfile.companyName,
        requestStatus: "approved",
      },
      {
        removedFromCompany: true,
        removedFromCompanyAt: now,
        removedFromCompanyBy: userProfile.email,
        updatedAt: now,
      },
    );

    await updateUserByEmail(userProfile.email, {
      currentEmployees: Math.max((userProfile.currentEmployees || 1) - 1, 0),
      updatedAt: now,
    });

    return res.status(200).json({
      success: true,
      message: "Employee removed from team successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to update employee affiliation.",
    });
  }
};

module.exports = {
  getCompanyEmployees,
  removeEmployeeFromCompany,
};
