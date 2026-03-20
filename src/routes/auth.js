import { Router } from "express";
import { body, validationResult } from "express-validator";
import { requireLogin, requireRoles } from "../middleware/auth.js";
import {
  createUser,
  emailExists,
  findUserByEmail,
  verifyPassword,
} from "../models/userModel.js";

const router = Router();

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name is required (max 100 characters)"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/account");
  }
  res.render("auth/login", {
    title: "Sign in",
    errors: [],
    form: { email: "" },
    registered: Boolean(req.query.registered),
  });
});

router.post("/login", ...loginValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      title: "Sign in",
      errors: errors.array().map((e) => e.msg),
      form: { email: req.body.email || "" },
      registered: false,
    });
  }

  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    const ok =
      user && (await verifyPassword(password, user.password_hash));

    if (!ok) {
      return res.status(422).render("auth/login", {
        title: "Sign in",
        errors: ["Invalid email or password."],
        form: { email: req.body.email || "" },
        registered: false,
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.redirect("/account");
  } catch (err) {
    return next(err);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

router.get("/register", (req, res) => {
  if (req.session.user) {
    return res.redirect("/account");
  }
  res.render("auth/register", {
    title: "Create account",
    errors: [],
    form: { name: "", email: "" },
  });
});

router.post("/register", ...registerValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/register", {
      title: "Create account",
      errors: errors.array().map((e) => e.msg),
      form: {
        name: req.body.name || "",
        email: req.body.email || "",
      },
    });
  }

  const { name, email, password } = req.body;

  try {
    if (await emailExists(email)) {
      return res.status(422).render("auth/register", {
        title: "Create account",
        errors: ["An account with this email already exists."],
        form: { name, email },
      });
    }

    await createUser({ name, email, password, role: "user" });
    res.redirect("/login?registered=1");
  } catch (err) {
    return next(err);
  }
});

router.get("/account", requireLogin, (req, res) => {
  res.render("account/index", {
    title: "My account",
    user: req.session.user,
  });
});

router.get(
  "/staff-area",
  requireLogin,
  requireRoles("admin", "staff"),
  (req, res) => {
    res.render("account/staff-area", {
      title: "Staff area",
      user: req.session.user,
    });
  }
);

router.get(
  "/admin-area",
  requireLogin,
  requireRoles("admin"),
  (req, res) => {
    res.render("account/admin-area", {
      title: "Admin area",
      user: req.session.user,
    });
  }
);

export default router;
