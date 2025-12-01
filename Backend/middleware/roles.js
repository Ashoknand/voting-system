// Restrict access based on user role(s)
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: "Forbidden: No user found" });
    }
    
    const userRole = req.user.role;
    
    if (!userRole || !roles.includes(userRole)) {
      console.error("Role check failed:", {
        userRole,
        allowedRoles: roles,
        userId: req.user._id,
        user: req.user
      });
      return res.status(403).json({ 
        message: "Forbidden: Insufficient permissions",
        required: roles,
        provided: userRole 
      });
    }
    next();
  };
};

module.exports = { allowRoles };


