const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedin } = require("../midlewares");
const aiController = require("../controllers/ai");

// Phase 6: Natural language search (public)
router.get("/search", wrapAsync(aiController.naturalSearch));

// Phase 7: Recommendations (personalized if logged in)
router.get("/recommendations", wrapAsync(aiController.recommendations));

// Phase 8: Review summary for a listing (public)
router.get("/listings/:id/review-summary", wrapAsync(aiController.reviewSummary));

// Phase 9: Compare listings (public)
router.get("/compare", wrapAsync(aiController.compare));

// Phase 10: StayFinder assistant (public)
router.get("/assistant", wrapAsync(aiController.assistant));

module.exports = router;