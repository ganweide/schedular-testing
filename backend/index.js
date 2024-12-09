const express = require('express');
const mongoose = require('mongoose');
const cron = require('cron').CronJob;
const moment = require('moment');
const cors = require('cors');
require('datejs');

// Initialize Express app
const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/testing-database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Booking schema
const bookingSchema = new mongoose.Schema({
  user: String,
  date: Date,
});

const Booking = mongoose.model('Booking', bookingSchema);

// Define Member schema
const memberSchema = new mongoose.Schema({
  user: String,
  birthDate: Date,
  birthdayVoucher: Boolean,   
});

const Member = mongoose.model('Member', memberSchema);

const logSchema = new mongoose.Schema({
  log: String,
});  

const Log = mongoose.model('Log', logSchema);

// API endpoint to create a new booking
app.post('/bookings', async (req, res) => {
    const { user, date } = req.body;

    try {
        // Adjust the time to GMT (subtract 8 hours from the local time)
        const adjustedDate = new Date(date).addHours(-8);

        const booking = new Booking({ user, date: adjustedDate });
        await booking.save();

        res.status(201).json({ message: 'Booking created successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error creating booking', error });
    }
});

// API endpoint to create a new member
app.post('/member', async (req, res) => {
  try {
      const member = new Member(req.body);
      await member.save();

      res.status(201).json({ message: 'Member created successfully' });
  } catch (error) {
      res.status(400).json({ message: 'Error creating member', error });
  }
});

// // Variable to store upcoming reminders
// let upcomingReminders = [];
// let reminderStatuses = {};

// // Schedule task to check for upcoming bookings every minute
// const reminderJob = new cron(
//   '0 * * * * *', // Run every minute
//   async () => {
//     console.log('Checking for upcoming bookings...');

//     const now = new Date();

//     try {
//       // Find all bookings
//       const bookings = await Booking.find();

//       if (bookings.length > 0) {
//         bookings.forEach((booking) => {
//           const bookingTime = new Date(booking.date);

//           // Time intervals for reminders
//           const intervals = [
//             { label: '24 hours', hours: 24 },
//             { label: '12 hours', hours: 12 },
//             { label: '2 hours', hours: 2 },
//           ];

//           // Check reminder status
//           if (!reminderStatuses[booking._id]) {
//             reminderStatuses[booking._id] = { '24h': false, '12h': false, '2h': false, stopped: false };
//           }

//           if (reminderStatuses[booking._id].stopped) return; 

//           // Iterate over intervals to check for reminders
//           intervals.forEach((interval) => {
//             const timeMark = bookingTime.addHours(-interval.hours);
//             const subtractInterval = new Date(timeMark).addMinutes(-5);
//             const additionInterval = new Date(timeMark).addMinutes(5);

//             const key = interval.label.replace(' ', '');

//             // Check if reminder has already been sent for this interval
//             if (reminderStatuses[booking._id][key]) return;

//             // Check if the current time is within the reminder window
//             if (now.between(subtractInterval, additionInterval)) {
//               const reminder = {
//                 id: booking._id,
//                 user: booking.user,
//                 bookingTime: bookingTime.toString('dd/MM/yyyy HH:mm'),
//                 message: `Reminder (${interval.label} before): ${booking.user} has a booking on ${bookingTime.format('DD/MM/YYYY HH:mm')}`,
//               };

//               upcomingReminders.push(reminder);
//               console.log(reminder.message);

//               // Mark the reminder as sent
//               reminderStatuses[booking._id][key] = true;
//             }
//           });
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching bookings:', error);
//     }
//   },
//   null,
//   true,
//   'Asia/Kuala_Lumpur'
// );
  

// // Start the cron job
// reminderJob.start();

// Schedule task to check for birthdays on the first day of every month
const birthdayVoucherJob = new cron(
  '0 * * * * *', // Run at midnight on the 1st day of each month
  async () => {
    console.log('Checking for members with birthdays this month...');

    const now = new Date();
    const currentMonth = now.getMonth();

    try {
      const members = await Member.find();

      if (members.length > 0) {
        members.forEach(async (member) => {
          const birthDate = new Date(member.birthDate);
          const birthMonth = birthDate.getMonth();

          if (birthMonth === currentMonth) {
            console.log(`Granting voucher to ${member.user} for their birthday on ${birthDate.toDateString()}`);
            member.birthdayVoucher = true;
            await member.save();

            const endOfMonth = new Date(now.getFullYear(), currentMonth + 1, 0);
            setTimeout(async () => {
              console.log(`Resetting birthday voucher for ${member.user}`);
              member.birthdayVoucher = false;
              await member.save();
            }, endOfMonth - now);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  },
  null,
  true,
  'Asia/Kuala_Lumpur'
);

// Start the cron job
birthdayVoucherJob.start();

// // API endpoint to fetch reminders
// app.get('/reminders', (req, res) => {
//   res.json(upcomingReminders); // Send upcoming reminders
// });

// API to handle user decision (Yes/No)
app.post('/reminder-action/:id', (req, res) => {
  const { action } = req.body;
  const { id } = req.params;

  if (!reminderStatuses[id]) {
    return res.status(400).json({ message: 'Invalid booking id' });
  }

  if (action === 'no') {
    reminderStatuses[id].stopped = true;
  }

  res.status(200).json({ message: `Action ${action} applied for booking ${id}` });
});

// Start the server
app.listen(3004, () => {
  console.log('Server running on http://localhost:3004');
});
