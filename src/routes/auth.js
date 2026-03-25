import { Router } from "express";
import { validationResult } from "express-validator";
import { requireLogin, requireRole, requireStaffOrAdmin } from "../middleware/auth.js";
import { loginValidation, registerValidation } from "../middleware/validation/forms.js";
import {
  createUser,
  emailExists,
  findUserByEmail,
  verifyPassword,
} from "../models/userModel.js";

const router = Router();

/**
 * Display the login form.
 */
const showLoginForm = (req, res) => {
  if (req.session.user) {
    return res.redirect("/account");
  }
  res.render("auth/login", {
    title: "Sign in",
  });
};

/**
 * Process login form submission (flash + redirect)
 */
const processLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((error) => {
      req.flash("error", error.msg);
    });
    return res.redirect("/login");
  }

  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/login");
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/login");
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.flash("success", `Welcome back, ${user.name}!`);
    return res.redirect("/account");
  } catch (error) {
    console.error("Error processing login:", error);
    req.flash("error", "Unable to log in right now. Please try again.");
    return res.redirect("/login");
  }
};

/**
 * Handle user logout.
 * note to self: connect.sid is the default session cookie name.
 */
const processLogout = (req, res) => {
  if (!req.session) {
    return res.redirect("/");
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.clearCookie("connect.sid");
      return res.redirect("/");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};

const showRegisterForm = (req, res) => {
  if (req.session.user) {
    return res.redirect("/account");
  }
  res.render("auth/register", {
    title: "Create account",
  });
};

const processRegister = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((error) => {
      req.flash("error", error.msg);
    });
    return res.redirect("/register");
  }

  const { name, email, password } = req.body;

  try {
    if (await emailExists(email)) {
      req.flash("error", "An account with this email already exists.");
      return res.redirect("/register");
    }

    await createUser({ name, email, password, role: "user" });
    req.flash(
      "success",
      "Registration successful. Please sign in with your new account.",
    );
    return res.redirect("/login");
  } catch (error) {
    console.error("Error processing registration:", error);
    req.flash("error", "Unable to register right now. Please try again.");
    return res.redirect("/register");
  }
};

router.get("/login", showLoginForm);
router.post("/login", ...loginValidation, processLogin);

router.get("/register", showRegisterForm);
router.post("/register", ...registerValidation, processRegister);

router.get("/account", requireLogin, (req, res) => {
  const user = req.session.user;
  res.render("account/index", {
    title: "My account",
    user,
  });
});

router.get(
  "/staff-area",
  requireLogin,
  requireStaffOrAdmin,
  (req, res) => {
    res.render("account/staff-area", {
      title: "Staff area",
      user: req.session.user,
    });
  },
);

router.get("/admin-area", requireLogin, requireRole("admin"), (req, res) => {
  res.render("account/admin-area", {
    title: "Admin area",
    user: req.session.user,
  });
});

export default router;
export { processLogout };
