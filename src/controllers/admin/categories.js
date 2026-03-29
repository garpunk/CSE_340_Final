import { Router } from "express";
import { validationResult } from "express-validator";
import { requireLogin, requireRole } from "../../middleware/auth.js";
import {
  categoryIdParam,
  categoryValidation,
} from "../../middleware/validation/forms.js";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
  countTicketsInCategory,
  reassignTicketsFromCategory,
} from "../../models/categories/categories.js";

const router = Router();

router.use(requireLogin, requireRole("admin"));

const listPage = async (req, res, next) => {
  try {
    const categories = await listCategories();
    res.render("admin/categories/list", {
      title: "Ticket categories",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

const newForm = (req, res) => {
  res.render("admin/categories/form", {
    title: "New category",
    category: null,
  });
};

const createHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((e) => req.flash("error", e.msg));
    return res.redirect("/admin/categories/new");
  }
  const { name, description } = req.body;
  try {
    await createCategory(name, description || "");
    req.flash("success", "Category created.");
    return res.redirect("/admin/categories");
  } catch (error) {
    if (error.code === "23505") {
      req.flash("error", "A category with that name already exists.");
      return res.redirect("/admin/categories/new");
    }
    console.error("createCategory:", error);
    req.flash("error", "Could not create category.");
    return res.redirect("/admin/categories/new");
  }
};

const editForm = async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const category = await getCategoryById(id);
    if (!category) {
      const err = new Error("Page Not Found");
      err.status = 404;
      return next(err);
    }
    res.render("admin/categories/form", {
      title: "Edit category",
      category,
    });
  } catch (error) {
    next(error);
  }
};

const updateHandler = async (req, res, next) => {
  const errors = validationResult(req);
  const id = Number(req.params.id);
  if (!errors.isEmpty()) {
    errors.array().forEach((e) => req.flash("error", e.msg));
    return res.redirect(`/admin/categories/${id}/edit`);
  }
  const { name, description } = req.body;
  try {
    const row = await updateCategory(id, name, description || "");
    if (!row) {
      req.flash("error", "Category not found.");
      return res.redirect("/admin/categories");
    }
    req.flash("success", "Category updated.");
    return res.redirect("/admin/categories");
  } catch (error) {
    if (error.code === "23505") {
      req.flash("error", "A category with that name already exists.");
      return res.redirect(`/admin/categories/${id}/edit`);
    }
    next(error);
  }
};

// Logic for ticket reassignment

const deleteHandler = async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const n = await countTicketsInCategory(id);
    if (n > 0) {
      const raw = req.body.reassign_to;
      const toId =
        raw !== undefined && raw !== null && String(raw).trim() !== ""
          ? Number(raw)
          : NaN;
      if (!Number.isInteger(toId) || toId < 1) {
        req.flash(
          "error",
          "Choose a category to move existing tickets into before deleting.",
        );
        return res.redirect("/admin/categories");
      }
      if (toId === id) {
        req.flash(
          "error",
          "Choose a different category than the one you are deleting.",
        );
        return res.redirect("/admin/categories");
      }
      const target = await getCategoryById(toId);
      if (!target) {
        req.flash("error", "That category does not exist.");
        return res.redirect("/admin/categories");
      }
      await reassignTicketsFromCategory(id, toId);
    }
    const ok = await deleteCategory(id);
    if (!ok) {
      req.flash("error", "Category not found.");
      return res.redirect("/admin/categories");
    }
    req.flash("success", "Category deleted.");
    return res.redirect("/admin/categories");
  } catch (error) {
    if (error.code === "23503") {
      req.flash(
        "error",
        "Cannot delete this category while tickets reference it.",
      );
      return res.redirect("/admin/categories");
    }
    next(error);
  }
};

router.get("/", listPage);
router.get("/new", newForm);
router.post("/", ...categoryValidation, createHandler);
router.get("/:id/edit", ...categoryIdParam, editForm);
router.post("/:id/delete", ...categoryIdParam, deleteHandler);
router.post("/:id", ...categoryIdParam, ...categoryValidation, updateHandler);

export default router;
