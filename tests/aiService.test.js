const { describe, it } = require("node:test");
const assert = require("node:assert");
const aiService = require("../utils/aiService");

describe("aiService.parseNaturalLanguageQuery (fallback)", () => {
    it("extracts guest count from query", async () => {
        const result = await aiService.parseNaturalLanguageQuery("I need a place for 4 people");
        assert.strictEqual(result.guests, 4);
        assert.strictEqual(result.source, "fallback:rule-based-parser");
    });

    it("extracts location from query", async () => {
        const result = await aiService.parseNaturalLanguageQuery("cheap place in Hyderabad");
        assert.strictEqual(result.location, "hyderabad");
    });

    it("extracts price constraint from query", async () => {
        const result = await aiService.parseNaturalLanguageQuery("place under 2000");
        assert.strictEqual(result.maxPrice, 2000);
    });

    it("sets default maxPrice for 'cheap' keyword", async () => {
        const result = await aiService.parseNaturalLanguageQuery("cheap place");
        assert.strictEqual(result.maxPrice, 1500);
    });

    it("extracts keywords from query", async () => {
        const result = await aiService.parseNaturalLanguageQuery("beach house with pool");
        assert.ok(result.keywords.includes("beach"));
        assert.ok(result.keywords.includes("pool"));
    });

    it("returns zeros for empty query", async () => {
        const result = await aiService.parseNaturalLanguageQuery("");
        assert.strictEqual(result.guests, 0);
        assert.strictEqual(result.maxPrice, 0);
        assert.strictEqual(result.location, "");
    });
});

describe("aiService.summarizeReviews (fallback)", () => {
    it("returns not-enough-reviews for < 2 reviews", async () => {
        const result = await aiService.summarizeReviews("Test", [{ rating: 5, comment: "Great" }]);
        assert.strictEqual(result.source, "none");
        assert.ok(result.summary.includes("Not enough reviews"));
    });

    it("summarizes positive reviews correctly", async () => {
        const reviews = [
            { rating: 5, comment: "Clean and comfortable, amazing host" },
            { rating: 4, comment: "Great location, friendly staff" },
            { comment: "Beautiful view, peaceful stay", rating: 5 }
        ];
        const result = await aiService.summarizeReviews("Test Villa", reviews);
        assert.strictEqual(result.source, "fallback:keyword-analysis");
        assert.ok(result.positiveThemes.length > 0);
        assert.ok(result.summary.includes("love"));
    });

    it("summarizes negative reviews correctly", async () => {
        const reviews = [
            { rating: 2, comment: "Dirty and noisy, terrible experience" },
            { rating: 1, comment: "Bad service, uncomfortable bed, rude staff" }
        ];
        const result = await aiService.summarizeReviews("Bad Place", reviews);
        assert.ok(result.summary.includes("disappointed"));
        assert.ok(result.negativeThemes.length > 0);
    });
});

describe("aiService.compareListings (fallback)", () => {
    it("returns error for < 2 listings", async () => {
        const result = await aiService.compareListings([{ title: "A" }]);
        assert.ok(result.explanation.includes("at least 2"));
    });

    it("compares listings factually", async () => {
        const listings = [
            { title: "Cheap Stay", price: 1000, maxGuests: 2, location: "A", country: "X", avgRating: 3.5, reviewCount: 5 },
            { title: "Luxury Villa", price: 5000, maxGuests: 6, location: "B", country: "Y", avgRating: 4.8, reviewCount: 20 }
        ];
        const result = await aiService.compareListings(listings);
        assert.ok(result.explanation.includes("Cheap Stay"));
        assert.ok(result.explanation.includes("Luxury Villa"));
        assert.strictEqual(result.source, "fallback:comparison-summary");
    });
});

describe("aiService.explainRecommendations (fallback)", () => {
    it("returns message for empty listings", async () => {
        const result = await aiService.explainRecommendations([]);
        assert.ok(result.explanation.includes("No properties"));
    });

    it("explains recommendations", async () => {
        const listings = [
            { title: "A", price: 1000, maxGuests: 2, location: "X", country: "Y", avgRating: 4.5 },
            { title: "B", price: 2000, maxGuests: 4, location: "X", country: "Y", avgRating: 3.0 }
        ];
        const result = await aiService.explainRecommendations(listings);
        assert.ok(result.explanation.includes("2"));
        assert.ok(result.explanation.includes("highly-rated"));
    });
});

describe("aiService.getProviderInfo", () => {
    it("reports provider info structure", () => {
        const info = aiService.getProviderInfo();
        assert.ok(typeof info.configured === "boolean");
        assert.ok(typeof info.provider === "string");
        assert.ok(typeof info.model === "string");
    });
});
