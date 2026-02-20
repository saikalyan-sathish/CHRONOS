const Event = require('../models/Event');
const Todo = require('../models/Todo');
const Notification = require('../models/Notification');
const User = require('../models/User');

const mongoose = require('mongoose');

// Check for upcoming events and send notifications
const checkUpcomingEvents = async (io) => {
  try {
    // If mongoose isn't connected yet, don't try to query
    if (mongoose.connection.readyState !== 1) {
      console.log('Skipping notification check: MongoDB not connected');
      return;
    }

    const now = new Date();

    // Find events with unsent reminders
    const events = await Event.find({
      start: { $gt: now },
      'reminders.sent': false
    }).populate('user', 'preferences pushSubscription');

    for (const event of events) {
      for (let i = 0; i < event.reminders.length; i++) {
        const reminder = event.reminders[i];

        if (reminder.sent) continue;

        const reminderTime = new Date(event.start.getTime() - reminder.time * 60 * 1000);

        if (now >= reminderTime) {
          // Create notification
          const notification = await Notification.create({
            user: event.user._id,
            type: 'event_reminder',
            title: 'Event Reminder',
            message: `"${event.title}" starts in ${reminder.time} minutes`,
            relatedEvent: event._id,
            actionUrl: `/calendar?event=${event._id}`
          });

          // Send real-time notification via socket
          if (io) {
            io.to(event.user._id.toString()).emit('notification', {
              type: 'event_reminder',
              notification,
              event: {
                id: event._id,
                title: event.title,
                start: event.start,
                location: event.location
              }
            });
          }

          // Mark reminder as sent
          event.reminders[i].sent = true;
          await event.save();
        }
      }
    }

    // Check for todos due soon
    const soon = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    const todos = await Todo.find({
      status: { $ne: 'completed' },
      dueDate: { $gte: now, $lte: soon },
      'reminder.enabled': true,
      'reminder.sent': { $ne: true }
    });

    for (const todo of todos) {
      const notification = await Notification.create({
        user: todo.user,
        type: 'todo_reminder',
        title: 'Task Due Soon',
        message: `"${todo.title}" is due in less than an hour`,
        relatedTodo: todo._id,
        actionUrl: `/todos?id=${todo._id}`
      });

      // Send real-time notification
      if (io) {
        io.to(todo.user.toString()).emit('notification', {
          type: 'todo_reminder',
          notification,
          todo: {
            id: todo._id,
            title: todo.title,
            dueDate: todo.dueDate
          }
        });
      }

      // Mark reminder as sent
      todo.reminder.sent = true;
      await todo.save();
    }

  } catch (error) {
    console.error('Check upcoming events error:', error);
  }
};

// Send push notification
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);

    if (!user?.pushSubscription) {
      return false;
    }

    const webpush = require('web-push');

    webpush.setVapidDetails(
      'mailto:admin@chronos-calendar.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify({
        title,
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data
      })
    );

    return true;
  } catch (error) {
    console.error('Send push notification error:', error);
    return false;
  }
};

// Create and send notification
const createNotification = async (userId, type, title, message, metadata = {}, io = null) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      ...metadata
    });

    // Send real-time notification
    if (io) {
      io.to(userId.toString()).emit('notification', {
        type,
        notification
      });
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

module.exports = {
  checkUpcomingEvents,
  sendPushNotification,
  createNotification
};
