export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    if (
      !Array.isArray(allowedRoles) ||
      allowedRoles.length === 0 ||
      !allowedRoles.includes(req.user.role)
    ) {
      return res.status(403).json({
        message:
          "Insufficient permissions",
      });
    }

    return next();
  };