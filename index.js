const { execSync } = require("child_process");

/**
 * Status endpoint middleware for all microservices
 * @param {string} serviceName - Name of the service (e.g., 'server_auth')
 * @returns {Function} Express middleware function
 */
module.exports = serviceName => {
  return async (_req, res, next) => {
    try {
      const commitHash = execSync("git rev-parse HEAD").toString().trim();

      res.status(200).json({
        status: "all good",
        service: serviceName,
        commitHash,
      });
    } catch (error) {
      console.log(
        `[ERROR] ${serviceName} - Couldn't respond to /status request`
      );
      next(error);
    }
  };
};
