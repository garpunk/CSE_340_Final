import { body, param } from "express-validator";

/**
 * Login validation (matches course practice project rules).
 */
const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email address is too long"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),
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
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email address is too long"),
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

const TICKET_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
];

const ticketCreateValidation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title is required (max 200 characters)"),
  body("description")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Description is required (max 5000 characters)"),
  body("category_id")
    .trim()
    .isInt({ min: 1 })
    .withMessage("Please choose a category"),
];

const ticketStatusValidation = [
  param("id").trim().isInt({ min: 1 }).withMessage("Invalid ticket"),
  body("status")
    .trim()
    .isIn(TICKET_STATUSES)
    .withMessage("Invalid status"),
];

const ticketCommentValidation = [
  param("id").trim().isInt({ min: 1 }).withMessage("Invalid ticket"),
  body("comment")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment is required (max 2000 characters)"),
];

const ticketCommentIdValidation = [
  param("id").trim().isInt({ min: 1 }).withMessage("Invalid ticket"),
  param("commentId")
    .trim()
    .isInt({ min: 1 })
    .withMessage("Invalid comment"),
];

const commentBodyValidation = [
  body("comment")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment is required (max 2000 characters)"),
];

const categoryValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name is required (max 100 characters)"),
  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description is too long"),
];

const categoryIdParam = [
  param("id").trim().isInt({ min: 1 }).withMessage("Invalid category"),
];

const USER_ROLES = ["admin", "staff", "user"];

const adminUserRoleValidation = [
  param("id").trim().isInt({ min: 1 }).withMessage("Invalid user"),
  body("role")
    .trim()
    .isIn(USER_ROLES)
    .withMessage("Invalid role"),
];

export {
  loginValidation,
  registerValidation,
  ticketCreateValidation,
  ticketStatusValidation,
  ticketCommentValidation,
  ticketCommentIdValidation,
  commentBodyValidation,
  categoryValidation,
  categoryIdParam,
  adminUserRoleValidation,
  USER_ROLES,
  TICKET_STATUSES,
};
