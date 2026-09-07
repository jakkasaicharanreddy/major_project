/*
 * AI Service abstraction for StayFinder.
 *
 * This module provides a clean provider interface so the application can use:
 *   A) A real LLM provider when configured (via AI_PROVIDER + AI_API_KEY)
 *   B) Deterministic fallback logic when no provider exists
 *
 * IMPORTANT:
 * - AI must NOT invent properties, reviews, or factual values.
 * - All facts MUST come from the real MongoDB data passed in.
 * - The fallback is NOT generative AI — it is transparent rule-based logic.
 * - The AI API key is NEVER exposed to the frontend.
 */

const AI_PROVIDER = (process.env.AI_PROVIDER || "").toLowerCase().trim();
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

function isProviderConfigured() {
    return !!(AI_PROVIDER && AI_API_KEY && AI_PROVIDER !== "none");
}

// Call a real LLM provider (OpenAI-compatible). Returns plain text.
async function callProvider(systemPrompt, userPrompt) {
    if (AI_PROVIDER === "openai") {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 800
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI API error ${response.status}: ${errText}`);
        }
        const data = await response.json();
        return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "";
    }
    // Extend here for other providers (e.g. "anthropic", "groq")
    throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
}

/*
 * Summarize a listing's reviews.
 * reviews: array of { rating, comment } from the database.
 * Returns { summary, positiveThemes, negativeThemes, source }.
 */
async function summarizeReviews(listingTitle, reviews) {
    const MIN_REVIEWS = 2;
    if (!reviews || reviews.length < MIN_REVIEWS) {
        return {
            summary: `Not enough reviews yet for "${listingTitle}" (need at least ${MIN_REVIEWS}).`,
            positiveThemes: [],
            negativeThemes: [],
            source: "none"
        };
    }

    const avgRating = (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1);
    const reviewTexts = reviews.map((r, i) => `[${i + 1}] (${r.rating}/5) ${r.comment}`).join("\n");

    if (isProviderConfigured()) {
        try {
            const system = "You are a helpful travel assistant. Summarize the following property reviews. Extract positive themes, negative themes, and a short overall impression. Be factual — do not invent details. Respond in plain text with sections: POSITIVE:, NEGATIVE:, SUMMARY:.";
            const user = `Property: ${listingTitle}\nAverage rating: ${avgRating}/5\nReviews:\n${reviewTexts}`;
            const raw = await callProvider(system, user);
            return {
                summary: raw,
                positiveThemes: extractSection(raw, "POSITIVE"),
                negativeThemes: extractSection(raw, "NEGATIVE"),
                source: `llm:${AI_PROVIDER}`
            };
        } catch (err) {
            console.error("AI summarizeReviews failed, falling back:", err.message);
            // fall through to deterministic fallback
        }
    }

    // Deterministic fallback: keyword/frequency analysis
    return fallbackSummarize(listingTitle, reviews, avgRating);
}

function fallbackSummarize(listingTitle, reviews, avgRating) {
    const positiveWords = ["clean", "great", "excellent", "amazing", "wonderful", "beautiful", "comfortable", "friendly", "helpful", "perfect", "lovely", "nice", "good", "best", "enjoyed", "recommend", "spacious", "cozy", "peaceful", "convenient"];
    const negativeWords = ["dirty", "bad", "terrible", "awful", "poor", "noisy", "uncomfortable", "rude", "broken", "disappointing", "worst", "avoid", "problem", "issue", "small", "expensive", "overpriced"];

    const positiveThemes = [];
    const negativeThemes = [];

    for (const word of positiveWords) {
        const count = reviews.filter(r => r.comment && r.comment.toLowerCase().includes(word)).length;
        if (count > 0) positiveThemes.push({ theme: word, mentions: count });
    }
    for (const word of negativeWords) {
        const count = reviews.filter(r => r.comment && r.comment.toLowerCase().includes(word)).length;
        if (count > 0) negativeThemes.push({ theme: word, mentions: count });
    }

    positiveThemes.sort((a, b) => b.mentions - a.mentions);
    negativeThemes.sort((a, b) => b.mentions - a.mentions);

    const topPositive = positiveThemes.slice(0, 3).map(t => t.theme);
    const topNegative = negativeThemes.slice(0, 3).map(t => t.theme);

    let summary;
    if (avgRating >= 4) {
        summary = `Guests generally love "${listingTitle}" (avg ${avgRating}/5).`;
    } else if (avgRating >= 3) {
        summary = `Guests have mixed feelings about "${listingTitle}" (avg ${avgRating}/5).`;
    } else {
        summary = `Guests have been disappointed with "${listingTitle}" (avg ${avgRating}/5).`;
    }
    if (topPositive.length) summary += ` Praised for: ${topPositive.join(", ")}.`;
    if (topNegative.length) summary += ` Criticized for: ${topNegative.join(", ")}.`;

    return { summary, positiveThemes: topPositive, negativeThemes: topNegative, source: "fallback:keyword-analysis" };
}

/*
 * Generate property recommendations explanation.
 * listings: array of real listing objects from the database.
 */
async function explainRecommendations(listings, context = "") {
    if (!listings || listings.length === 0) {
        return { explanation: "No properties available to recommend right now.", source: "none" };
    }

    const listingSummaries = listings.map(l =>
        `- ${l.title} (${l.location}, ${l.country}): ₹${l.price}/night, up to ${l.maxGuests} guests, rating ${l.avgRating || "N/A"}/5`
    ).join("\n");

    if (isProviderConfigured()) {
        try {
            const system = "You are a travel assistant. Given a list of real properties, explain why they are recommended. Be factual — use only the data provided. Do not invent properties or features. Keep it concise (2-3 sentences).";
            const user = `${context ? context + "\n\n" : ""}Recommended properties:\n${listingSummaries}`;
            const raw = await callProvider(system, user);
            return { explanation: raw.trim(), source: `llm:${AI_PROVIDER}` };
        } catch (err) {
            console.error("AI explainRecommendations failed, falling back:", err.message);
        }
    }

    const topRated = listings.filter(l => l.avgRating >= 4).length;
    const explanation = `We found ${listings.length} properties for you${topRated > 0 ? `, including ${topRated} highly-rated option(s)` : ""}. They are ranked by rating, review count, and relevance to your preferences.`;
    return { explanation, source: "fallback:scoring-summary" };
}

/*
 * Compare listings with optional AI explanation.
 * listings: array of real listing objects.
 */
async function compareListings(listings) {
    if (!listings || listings.length < 2) {
        return { explanation: "Select at least 2 properties to compare.", source: "none" };
    }

    const comparison = listings.map(l =>
        `${l.title}: ₹${l.price}/night, ${l.maxGuests} guests max, ${l.location}, ${l.country}, rating ${l.avgRating || "N/A"}/5, ${l.reviewCount || 0} reviews`
    ).join("\n");

    if (isProviderConfigured()) {
        try {
            const system = "You are a travel assistant. Compare the following real properties factually. Highlight key differences in price, location, capacity, and rating. Do not invent features. Be concise.";
            const user = `Compare these properties:\n${comparison}`;
            const raw = await callProvider(system, user);
            return { explanation: raw.trim(), source: `llm:${AI_PROVIDER}` };
        } catch (err) {
            console.error("AI compareListings failed, falling back:", err.message);
        }
    }

    const cheapest = listings.reduce((a, b) => (a.price <= b.price ? a : b));
    const bestRated = listings.reduce((a, b) => ((a.avgRating || 0) >= (b.avgRating || 0) ? a : b));
    const explanation = `Among the selected properties, "${cheapest.title}" is the most affordable (₹${cheapest.price}/night), while "${bestRated.title}" has the highest rating (${bestRated.avgRating || "N/A"}/5). All facts are from real listing data.`;
    return { explanation, source: "fallback:comparison-summary" };
}

/*
 * Parse a natural language query into structured search params.
 * Returns { location, guests, maxPrice, keywords, source }.
 */
async function parseNaturalLanguageQuery(query) {
    if (!query || typeof query !== "string") {
        return { location: "", guests: 0, maxPrice: 0, keywords: [], source: "none" };
    }

    if (isProviderConfigured()) {
        try {
            const system = `You are a search parser for a property rental site. Extract search parameters from the user's natural language query. Respond ONLY with a JSON object: { "location": string, "guests": number, "maxPrice": number, "keywords": string[] }. Use 0 for unknown numbers, empty string/location for unknown text. Do not invent — only extract what the user wrote.`;
            const raw = await callProvider(system, query);
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    location: parsed.location || "",
                    guests: Number(parsed.guests) || 0,
                    maxPrice: Number(parsed.maxPrice) || 0,
                    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
                    source: `llm:${AI_PROVIDER}`
                };
            }
        } catch (err) {
            console.error("AI parseNaturalLanguageQuery failed, falling back:", err.message);
        }
    }

    // Deterministic fallback parser
    return fallbackParseQuery(query);
}

function fallbackParseQuery(query) {
    const lower = query.toLowerCase();
    const result = { location: "", guests: 0, maxPrice: 0, keywords: [], source: "fallback:rule-based-parser" };

    // Extract guest count: "4 people", "for 4", "4 guests"
    const guestMatch = lower.match(/(\d+)\s*(people|person|guest|guests|travelers|travellers)/);
    if (guestMatch) result.guests = Number(guestMatch[1]);

    // Extract price: "under 2000", "cheap", "below 1500", "max 3000"
    const priceMatch = lower.match(/(?:under|below|less than|max|maximum|budget|cheap)\s*[:\s]?\s*(\d+)/);
    if (priceMatch) result.maxPrice = Number(priceMatch[1]);
    if (/cheap|budget|affordable|low cost/i.test(lower)) result.maxPrice = result.maxPrice || 1500;

    // Extract location: "in Hyderabad", "near Goa", "at Mumbai"
    const locationMatch = lower.match(/(?:in|near|at|around|close to)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/);
    if (locationMatch) result.location = locationMatch[1].trim();

    // Extract descriptive keywords
    const keywordPool = ["beach", "mountain", "city", "quiet", "luxury", "pool", "garden", "modern", "cozy", "spacious", "family", "romantic", "pet", "wifi", "parking", "kitchen", "lake", "forest", "cottage", "villa", "apartment"];
    for (const kw of keywordPool) {
        if (lower.includes(kw)) result.keywords.push(kw);
    }

    return result;
}

// Helper: extract a labeled section from LLM output
function extractSection(text, label) {
    const regex = new RegExp(`${label}\\s*:\\s*([\\s\\S]*?)(?=\\n[A-Z]+\\s*:|$)`, "i");
    const match = text.match(regex);
    if (!match) return [];
    return match[1].split("\n").map(l => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
}

module.exports = {
    summarizeReviews,
    explainRecommendations,
    compareListings,
    parseNaturalLanguageQuery,
    isProviderConfigured,
    getProviderInfo: () => ({
        configured: isProviderConfigured(),
        provider: AI_PROVIDER || "none",
        model: AI_MODEL
    })
};