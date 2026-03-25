import { Router } from "express";
import { validationResult } from "express-validator";
import { requireLogin, requireRole } from "../../middleware/auth.js";
import { adminUserRoleValidation } from "../../middleware/validation/forms.js";
import {
  countUsersWithRole,
  findUserById,
  listUsers,
  updateUserRole,
} from "../../models/userModel.js";

const router = Router();

router.use(requireLogin, requireRole("admin"));

/**
 * GET /admin/users — list accounts and change others’ roles.
 */
const listPage = async (req, res, next) => {
  try {
    const users = await listUsers();
    res.render("admin/users/list", {
      title: "Users",
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/users/:id/role — set role (not your own; keep ≥1 admin). IMPORTANT
 */
const updateRoleHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((e) => req.flash("error", e.msg));
    return res.redirect("/admin/users");
  }

  const targetId = Number(req.params.id);
  const { role: nextRole } = req.body;
  const selfId = req.session.user.id;

  if (String(targetId) === String(selfId)) {
    req.flash("error", "You cannot change your own role while signed in.");
    return res.redirect("/admin/users");
  }

  try {
    const existing = await findUserById(targetId);
    if (!existing) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    if (existing.role === "admin" && nextRole !== "admin") {
      const admins = await countUsersWithRole("admin");
      if (admins <= 1) {
        req.flash(
          "error",
          "Cannot remove the last admin. Promote another user first.",
        );
        return res.redirect("/admin/users");
      }
    }

    const row = await updateUserRole(targetId, nextRole);
    if (!row) {
      req.flash("error", "Could not update role.");
      return res.redirect("/admin/users");
    }

    req.flash("success", `Updated role for ${row.email} to ${row.role}.`);
    return res.redirect("/admin/users");
  } catch (error) {
    next(error);
  }
};

router.get("/", listPage);
router.post("/:id/role", ...adminUserRoleValidation, updateRoleHandler);

export default router;
