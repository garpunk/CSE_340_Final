/**
 * Require a logged-in user. Redirects to /login if not authenticated.
 */
const requireLogin = (req, res, next) => {
  if (req.session?.user) {
    res.locals.isLoggedIn = true;
    return next();
  }
  res.redirect("/login");
};

/**
 * Require one of the given roles (e.g. requireRoles("admin", "staff")).
 * Must run after session is available; typically after requireLogin.
 */
const requireRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    const role = req.session?.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      const err = new Error("You do not have permission to view this page.");
      err.status = 403;
      return next(err);
    }
    next();
  };

export { requireLogin, requireRoles };
