const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    booking: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        default: null
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "listing",
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;