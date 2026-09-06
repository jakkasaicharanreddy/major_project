const Notification = require("../models/notification");

module.exports.index = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate("listing")
            .populate("booking")
            .sort({ createdAt: -1 });

        const unreadCount = notifications.filter((notification) => !notification.isRead).length;

        res.render("notifications/index", {
            notifications,
            unreadCount,
            pageTitle: "Notifications"
        });
    } catch (err) {
        console.error("Error loading notifications:", err);
        req.flash("error", "Error loading notifications");
        res.redirect("/dashboard");
    }
};

module.exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.notificationId);

        if (!notification) {
            req.flash("error", "Notification not found");
            return res.redirect("/notifications");
        }

        if (!notification.recipient.equals(req.user._id)) {
            req.flash("error", "You are not allowed to do this action");
            return res.redirect("/notifications");
        }

        notification.isRead = true;
        await notification.save();
        res.redirect("/notifications");
    } catch (err) {
        console.error("Error marking notification as read:", err);
        req.flash("error", "Failed to mark notification as read");
        res.redirect("/notifications");
    }
};

module.exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.redirect("/notifications");
    } catch (err) {
        console.error("Error marking all notifications as read:", err);
        req.flash("error", "Failed to mark notifications as read");
        res.redirect("/notifications");
    }
};