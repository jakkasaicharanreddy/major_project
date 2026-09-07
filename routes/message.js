const express = require("express");
const router = express.Router();
const { isLoggedin } = require("../midlewares");
const messageController = require("../controllers/message");

// All messaging routes require authentication.
// GET /messages                 -> inbox (conversations for the logged-in user)
// GET /messages/:listingId      -> conversation with that listing's owner
// POST /messages/:listingId     -> send a message about that listing
router.get("/", isLoggedin, messageController.index);
router.get("/:listingId", isLoggedin, messageController.showConversation);
router.post("/:listingId", isLoggedin, messageController.sendMessage);

module.exports = router;