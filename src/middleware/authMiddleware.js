// src/middleware/authMiddleware.js

const isAdmin = (req, res, next) => {
  // Check if a user is logged in and if their role is 'Admin'
  if (req.session.user && req.session.user.role === "Admin") {
    // If they are an Admin, proceed to the next function (the route handler)
    return next();
  }

  // If not an Admin, send a 'Forbidden' error
  res.status(403).json({ message: "Access denied. Admins only." });
};

module.exports = { isAdmin };
