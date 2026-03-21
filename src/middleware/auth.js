/**
 * Middleware to require authentication for protected routes.
 * Redirects to login page if user is not authenticated.
 * Sets res.locals.isLoggedIn = true for authenticated requests.
 */
const requireLogin = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.isLoggedIn = true;
    return next();
  }
  res.redirect("/login");
};

/**
 * Middleware factory to require a specific role (course practice pattern).
 * Uses flash messages and redirects — not HTTP 403.
 *
 * @param {string} roleName - Role required: 'admin', 'staff', or 'user'
 * @returns {Function} Express middleware
 */
const requireRole = (roleName) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash("error", "You must be logged in to access this page.");
      return res.redirect("/login");
    }

    if (req.session.user.role !== roleName) {
      req.flash("error", "You do not have permission to access this page.");
      return res.redirect("/");
    }

    next();
  };
};

/**
 * Staff or admin only (IT helpdesk). Same UX as requireRole: flash + redirect home.
 */
const requireStaffOrAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    req.flash("error", "You must be logged in to access this page.");
    return res.redirect("/login");
  }

  const r = req.session.user.role;
  if (r !== "staff" && r !== "admin") {
    req.flash("error", "You do not have permission to access this page.");
    return res.redirect("/");
  }

  next();
};

export { requireLogin, requireRole, requireStaffOrAdmin };
