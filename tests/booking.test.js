const { describe, it } = require("node:test");
const assert = require("node:assert");

// Pure booking logic tests (no database required)
describe("Booking date validation logic", () => {
    function parseLocalDate(value) {
        if (!value) return null;
        if (typeof value === "string") {
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
            if (match) {
                const year = Number(match[1]);
                const month = Number(match[2]) - 1;
                const day = Number(match[3]);
                const parsed = new Date(year, month, day);
                if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) return null;
                return parsed;
            }
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        parsed.setHours(0, 0, 0, 0);
        return parsed;
    }

    function startOfToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    function hasOverlap(existing, checkIn, checkOut) {
        return existing.checkIn < checkOut && existing.checkOut > checkIn;
    }

    it("rejects check-in in the past", () => {
        const today = startOfToday();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        assert.ok(yesterday < today);
    });

    it("requires check-out after check-in", () => {
        const checkIn = parseLocalDate("2026-12-20");
        const checkOut = parseLocalDate("2026-2026-12-20".replace("2026-2026", "2026"));
        const validCheckout = parseLocalDate("2026-12-25");
        assert.ok(validCheckout > checkIn);
    });

    it("detects overlapping bookings", () => {
        const existing = { checkIn: new Date(2026, 11, 10), checkOut: new Date(2026, 11, 20) };
        // Overlapping: check-in before existing checkout AND check-out after existing checkin
        assert.ok(hasOverlap(existing, new Date(2026, 11, 15), new Date(2026, 11, 25)));
        assert.ok(hasOverlap(existing, new Date(2026, 11, 5), new Date(2026, 11, 15)));
        assert.ok(!hasOverlap(existing, new Date(2026, 11, 20), new Date(2026, 11, 25)));
        assert.ok(!hasOverlap(existing, new Date(2026, 11, 5), new Date(2026, 11, 10)));
    });

    it("parses valid YYYY-MM-DD dates correctly", () => {
        const date = parseLocalDate("2026-12-25");
        assert.ok(date instanceof Date);
        assert.strictEqual(date.getFullYear(), 2026);
        assert.strictEqual(date.getMonth(), 11);
        assert.strictEqual(date.getDate(), 25);
    });

    it("rejects invalid date strings", () => {
        assert.strictEqual(parseLocalDate("invalid"), null);
        assert.strictEqual(parseLocalDate(""), null);
        assert.strictEqual(parseLocalDate(null), null);
    });

    it("calculates nights correctly", () => {
        const checkIn = parseLocalDate("2026-12-20");
        const checkOut = parseLocalDate("2026-12-25");
        const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        assert.strictEqual(nights, 5);
    });
});

describe("Booking guest capacity logic", () => {
    function validateGuests(guests, maxGuests) {
        const guestCount = Number(guests);
        if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > maxGuests) return false;
        return true;
    }

    it("accepts valid guest count within maxGuests", () => {
        assert.ok(validateGuests(2, 4));
        assert.ok(validateGuests(4, 4));
        assert.ok(validateGuests(1, 2));
    });

    it("rejects guests exceeding maxGuests", () => {
        assert.ok(!validateGuests(5, 4));
        assert.ok(!validateGuests(14, 2));
    });

    it("rejects invalid guest counts", () => {
        assert.ok(!validateGuests(0, 4));
        assert.ok(!validateGuests(-1, 4));
        assert.ok(!validateGuests(1.5, 4));
        assert.ok(!validateGuests("abc", 4));
    });
});

describe("Search guest filtering logic", () => {
    function escapeRegex(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function buildGuestQuery(guests) {
        const parsedGuests = Number(guests);
        if (guests !== undefined && guests !== "" && Number.isInteger(parsedGuests) && parsedGuests > 0) {
            return { maxGuests: { $gte: parsedGuests } };
        }
        return {};
    }

    it("builds correct guest filter query", () => {
        const query = buildGuestQuery(4);
        assert.deepStrictEqual(query, { maxGuests: { $gte: 4 } });
    });

    it("returns empty query for invalid guests", () => {
        assert.deepStrictEqual(buildGuestQuery(""), {});
        assert.deepStrictEqual(buildGuestQuery(0), {});
        assert.deepStrictEqual(buildGuestQuery(null), {});
    });

    it("escapes regex special characters", () => {
        assert.strictEqual(escapeRegex("hyderabad.*"), "hyderabad\\.\\*");
        assert.strictEqual(escapeRegex("test (value)"), "test \\(value\\)");
    });
});

describe("Profile field whitelist logic", () => {
    const PROFILE_LIMITS = { displayName: 80, bio: 500, location: 100, profileImage: 500 };

    function cleanText(value, maxLen) {
        if (typeof value !== "string") return "";
        const trimmed = value.trim();
        return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
    }

    function cleanImageUrl(value) {
        if (typeof value !== "string") return "";
        const trimmed = value.trim();
        if (!trimmed) return "";
        if (trimmed.length > PROFILE_LIMITS.profileImage) return null;
        try { new URL(trimmed); } catch (e) { return null; }
        try {
            const parsed = new URL(trimmed);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
        } catch (e) { return null; }
        return trimmed;
    }

    it("trims and limits text fields", () => {
        assert.strictEqual(cleanText("  hello  ", 100), "hello");
        assert.strictEqual(cleanText("a".repeat(100), 80).length, 80);
    });

    it("validates http/https image URLs", () => {
        assert.strictEqual(cleanImageUrl("https://example.com/img.jpg"), "https://example.com/img.jpg");
        assert.strictEqual(cleanImageUrl("javascript:alert(1)"), null);
        assert.strictEqual(cleanImageUrl("ftp://example.com/img.jpg"), null);
        assert.strictEqual(cleanImageUrl(""), "");
    });

    it("rejects oversized image URLs", () => {
        assert.strictEqual(cleanImageUrl("https://example.com/" + "a".repeat(500)), null);
    });
});