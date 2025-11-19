// src/middleware/authMiddleware.js

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "Admin") {
    return next();
  }
  res.status(403).json({ message: "Access denied. Admins only." });
};

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect("/login.html");
};

module.exports = { isAdmin, isAuthenticated };
