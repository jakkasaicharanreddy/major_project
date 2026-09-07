const mongoose = require("mongoose");
const { Schema } = mongoose;

// ---- Step 12: Host <-> Renter messaging ----
// A conversation is derived from messages: (two users + one listing).
// No separate Conversation model is created.
const messageSchema = new mongoose.Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "listing",
        required: true
    },
    booking: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        default: null
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes for efficient conversation retrieval and unread counts
messageSchema.index({ listing: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ sender: 1, recipient: 1, listing: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;