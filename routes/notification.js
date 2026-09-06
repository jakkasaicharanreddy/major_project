const express = require("express");
const router = express.Router();
const { isLoggedin } = require("../midlewares");
const notificationController = require("../controllers/notification");

router.get("/", isLoggedin, notificationController.index);
router.post("/:notificationId/read", isLoggedin, notificationController.markAsRead);
router.post("/read-all", isLoggedin, notificationController.markAllAsRead);

module.exports = router;