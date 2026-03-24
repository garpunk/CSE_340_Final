import { Router } from "express";
import { requireLogin, requireRole } from "../../middleware/auth.js";
import { listUsers } from "../../models/userModel.js";

const router = Router();

router.use(requireLogin, requireRole("admin"));

/**
 * GET /admin/users — list accounts (read-only; role editing in a follow-up step).
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

router.get("/", listPage);

export default router;
