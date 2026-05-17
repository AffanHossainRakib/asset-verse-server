const { findUserByEmail } = require("../models/user.model");
const {
  findAffiliationsByEmployeeEmail,
  findAffiliationsByCompany,
} = require("../models/employeeAffiliation.model");

const getMyTeam = async (req, res) => {
  try {
    const email = req.firebaseUser?.email?.toLowerCase();

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Missing authenticated user information.",
      });
    }

    const userProfile = await findUserByEmail(email);

    if (!userProfile) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const affiliations = await findAffiliationsByEmployeeEmail(email);
    const activeCompanies = Array.from(
      new Set(
        affiliations
          .filter((affiliation) => affiliation.status === "active")
          .map((affiliation) => affiliation.companyName)
          .filter(Boolean),
      ),
    );

    if (activeCompanies.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const companyTeams = await Promise.all(
      activeCompanies.map(async (companyName) => {
        const companyAffiliations =
          await findAffiliationsByCompany(companyName);

        const members = await Promise.all(
          companyAffiliations.map(async (affiliation) => {
            const profile = await findUserByEmail(affiliation.employeeEmail);

            return {
              _id: affiliation._id,
              affiliationId: affiliation._id,
              companyName: affiliation.companyName,
              companyLogo:
                affiliation.companyLogo ||
                profile?.companyLogo ||
                userProfile.companyLogo ||
                "",
              name:
                profile?.name || affiliation.employeeName || "Unknown employee",
              employeeName:
                profile?.name || affiliation.employeeName || "Unknown employee",
              email: profile?.email || affiliation.employeeEmail || "",
              employeeEmail: profile?.email || affiliation.employeeEmail || "",
              profileImage: profile?.profileImage || "",
              dateOfBirth: profile?.dateOfBirth || "",
              role: profile?.role || "employee",
              joinDate:
                affiliation.affiliationDate || affiliation.createdAt || "",
              status: affiliation.status || "active",
            };
          }),
        );

        return members;
      }),
    );

    const seen = new Set();
    const teamMembers = companyTeams.flat().filter((member) => {
      const key =
        `${member.companyName}::${member.employeeEmail}`.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

    return res.status(200).json({
      success: true,
      data: teamMembers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to load team information right now.",
    });
  }
};

module.exports = {
  getMyTeam,
};
