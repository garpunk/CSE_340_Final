import { Router } from "express";
import { validationResult } from "express-validator";
import { requireLogin, requireStaffOrAdmin } from "../../middleware/auth.js";
import {
  commentBodyValidation,
  ticketCommentIdValidation,
  ticketCommentValidation,
  ticketCreateValidation,
  ticketStatusValidation,
} from "../../middleware/validation/forms.js";
import { listCategories } from "../../models/categories/categories.js";
import {
  createComment,
  deleteComment,
  findCommentById,
  listCommentsForTicket,
  updateComment,
} from "../../models/tickets/comments.js";
import {
  createTicket,
  findTicketRowById,
  listAllTickets,
  listTicketsForUser,
  updateTicketAssignee,
  updateTicketStatus,
} from "../../models/tickets/tickets.js";

const router = Router();

const viewerCanAccessTicket = (ticket, user) => {
  if (!ticket || !user) return false;
  if (user.role === "admin" || user.role === "staff") return true;
  return String(ticket.user_id) === String(user.id);
};

const listPage = async (req, res, next) => {
  const user = req.session.user;
  try {
    const tickets =
      user.role === "admin" || user.role === "staff"
        ? await listAllTickets()
        : await listTicketsForUser(user.id);
    res.render("tickets/list", {
      title: "Support tickets",
      tickets,
      staffView: user.role === "admin" || user.role === "staff",
    });
  } catch (error) {
    next(error);
  }
};

const newForm = async (req, res, next) => {
  try {
    const categories = await listCategories();
    res.render("tickets/form", {
      title: "New ticket",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

const createHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((e) => req.flash("error", e.msg));
    return res.redirect("/tickets/new");
  }

  const { title, description, category_id } = req.body;
  const user = req.session.user;

  try {
    const id = await createTicket({
      title,
      description,
      category_id: Number(category_id),
      user_id: user.id,
    });
    if (!id) {
      req.flash("error", "Could not create ticket.");
      return res.redirect("/tickets/new");
    }
    req.flash("success", "Ticket submitted.");
    return res.redirect(`/tickets/${id}`);
  } catch (error) {
    console.error("createTicket:", error);
    req.flash("error", "Could not create ticket. Please try again.");
    return res.redirect("/tickets/new");
  }
};

const detailPage = async (req, res, next) => {
  const id = Number(req.params.id);
  const user = req.session.user;

  try {
    const ticket = await findTicketRowById(id);
    if (!viewerCanAccessTicket(ticket, user)) {
      const err = new Error("Page Not Found");
      err.status = 404;
      return next(err);
    }
    const comments = await listCommentsForTicket(id);
    const canManage = user.role === "admin" || user.role === "staff";
    res.render("tickets/detail", {
      title: ticket.title,
      ticket,
      comments,
      canManage,
    });
  } catch (error) {
    next(error);
  }
};

const statusHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((e) => req.flash("error", e.msg));
    return res.redirect(`/tickets/${req.params.id}`);
  }

  const id = Number(req.params.id);
  const { status } = req.body;

  try {
    const ticket = await findTicketRowById(id);
    if (!ticket) {
      req.flash("error", "Ticket not found.");
      return res.redirect("/tickets");
    }
    await updateTicketStatus(id, status);
    req.flash("success", "Status updated.");
    return res.redirect(`/tickets/${id}`);
  } catch (error) {
    next(error);
  }
};

const assignToMeHandler = async (req, res, next) => {
  const id = Number(req.params.id);
  const user = req.session.user;

  try {
    const ticket = await findTicketRowById(id);
    if (!ticket) {
      req.flash("error", "Ticket not found.");
      return res.redirect("/tickets");
    }
    await updateTicketAssignee(id, user.id);
    if (ticket.status === "open") {
      await updateTicketStatus(id, "assigned");
    }
    req.flash("success", "Ticket assigned to you.");
    return res.redirect(`/tickets/${id}`);
  } catch (error) {
    next(error);
  }
};

const addCommentHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((e) => req.flash("error", e.msg));
    return res.redirect(`/tickets/${req.params.id}`);
  }

  const id = Number(req.params.id);
  const { comment } = req.body;
  const user = req.session.user;

  try {
    const ticket = await findTicketRowById(id);
    if (!viewerCanAccessTicket(ticket, user)) {
      req.flash("error", "You cannot comment on this ticket.");
      return res.redirect("/tickets");
    }
    await createComment({
      ticket_id: id,
      user_id: user.id,
      comment,
    });
    req.flash("success", "Comment added.");
    return res.redirect(`/tickets/${id}`);
  } catch (error) {
    next(error);
  }
};

const editCommentForm = async (req, res, next) => {
  const ticketId = Number(req.params.id);
  const commentId = Number(req.params.commentId);
  const user = req.session.user;

  try {
    const ticket = await findTicketRowById(ticketId);
    if (!viewerCanAccessTicket(ticket, user)) {
      const err = new Error("Page Not Found");
      err.status = 404;
      return next(err);
    }
    const row = await findCommentById(commentId);
    if (!row || String(row.ticket_id) !== String(ticketId)) {
      const err = new Error("Page Not Found");
      err.status = 404;
      return next(err);
    }
    if (String(row.user_id) !== String(user.id)) {
      req.flash("error", "You can only edit your own comments.");
      return res.redirect(`/tickets/${ticketId}`);
    }
    res.render("tickets/comment-edit", {
      title: "Edit comment",
      ticket,
      comment: row,
    });
  } catch (error) {
    next(error);
  }
};

const updateCommentHandler = async (req, res, next) => {
  const errors = validationResult(req);
  const ticketId = Number(req.params.id);
  const commentId = Number(req.params.commentId);
  if (!errors.isEmpty()) {
    errors.array().forEach((e) => req.flash("error", e.msg));
    return res.redirect(`/tickets/${ticketId}/comments/${commentId}/edit`);
  }

  const { comment } = req.body;
  const user = req.session.user;

  try {
    const row = await findCommentById(commentId);
    if (!row || String(row.ticket_id) !== String(ticketId)) {
      req.flash("error", "Comment not found.");
      return res.redirect("/tickets");
    }
    if (String(row.user_id) !== String(user.id)) {
      req.flash("error", "You can only edit your own comments.");
      return res.redirect(`/tickets/${ticketId}`);
    }
    const ok = await updateComment(commentId, user.id, comment);
    if (!ok) {
      req.flash("error", "Could not update comment.");
      return res.redirect(`/tickets/${ticketId}/comments/${commentId}/edit`);
    }
    req.flash("success", "Comment updated.");
    return res.redirect(`/tickets/${ticketId}`);
  } catch (error) {
    next(error);
  }
};

const deleteCommentHandler = async (req, res, next) => {
  const ticketId = Number(req.params.id);
  const commentId = Number(req.params.commentId);
  const user = req.session.user;

  try {
    const row = await findCommentById(commentId);
    if (!row || String(row.ticket_id) !== String(ticketId)) {
      req.flash("error", "Comment not found.");
      return res.redirect("/tickets");
    }
    if (String(row.user_id) !== String(user.id)) {
      req.flash("error", "You can only delete your own comments.");
      return res.redirect(`/tickets/${ticketId}`);
    }
    await deleteComment(commentId, user.id);
    req.flash("success", "Comment removed.");
    return res.redirect(`/tickets/${ticketId}`);
  } catch (error) {
    next(error);
  }
};

router.get("/", requireLogin, listPage);
router.get("/new", requireLogin, newForm);
router.post("/", requireLogin, ...ticketCreateValidation, createHandler);

router.get(
  "/:id/comments/:commentId/edit",
  requireLogin,
  ...ticketCommentIdValidation,
  editCommentForm,
);
router.post(
  "/:id/comments/:commentId",
  requireLogin,
  ...ticketCommentIdValidation,
  ...commentBodyValidation,
  updateCommentHandler,
);
router.post(
  "/:id/comments/:commentId/delete",
  requireLogin,
  ...ticketCommentIdValidation,
  deleteCommentHandler,
);

router.post(
  "/:id/status",
  requireLogin,
  requireStaffOrAdmin,
  ...ticketStatusValidation,
  statusHandler,
);
router.post(
  "/:id/assign",
  requireLogin,
  requireStaffOrAdmin,
  assignToMeHandler,
);
router.post(
  "/:id/comments",
  requireLogin,
  ...ticketCommentValidation,
  addCommentHandler,
);

router.get("/:id", requireLogin, detailPage);

export default router;
