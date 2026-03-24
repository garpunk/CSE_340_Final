import { Router } from "express";
import authRoutes, { processLogout } from "../routes/auth.js";
import categoryAdminRoutes from "./admin/categories.js";
import userAdminRoutes from "./admin/users.js";
import {
  aboutPage,
  homePage,
  servicesPage,
  testErrorPage,
} from "./index.js";
import ticketRoutes from "./tickets/tickets.js";

const router = Router();

router.use("/tickets", (req, res, next) => {
  res.addStyle('<link rel="stylesheet" href="/css/tickets.css">');
  next();
});
router.use("/tickets", ticketRoutes);

router.use("/admin/categories", (req, res, next) => {
  res.addStyle('<link rel="stylesheet" href="/css/tickets.css">');
  next();
});
router.use("/admin/categories", categoryAdminRoutes);

router.use("/admin/users", (req, res, next) => {
  res.addStyle('<link rel="stylesheet" href="/css/tickets.css">');
  next();
});
router.use("/admin/users", userAdminRoutes);

router.get("/", homePage);
router.get("/about", aboutPage);
router.get("/services", servicesPage);

router.use(authRoutes);
router.get("/logout", processLogout);

router.get("/test-error", testErrorPage);

export default router;
