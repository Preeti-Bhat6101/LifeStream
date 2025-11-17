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

const isAuthenticated = (req, res, next) => {
  // Check if a user session exists
  if (req.session.user) {
    // If logged in, proceed to the requested page
    return next();
  }
  // If not logged in, redirect them to the login page
  res.redirect("/login.html");
};

module.exports = { isAdmin, isAuthenticated };
