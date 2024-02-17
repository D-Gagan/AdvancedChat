
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();
const winston = require('winston');

// Configure winston (adjust as needed)
winston.configure({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Use winston for logging
// Example: winston.info('This is an informational message');


const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// MongoDB and Mongoose setup
mongoose.connect('mongodb://localhost:27017/chatApp', { useNewUrlParser: true, useUnifiedTopology: true});



const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define a schema for chat messages
const messageSchema = new mongoose.Schema({
  user: String,
  room: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// Middleware setup
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth configuration
passport.use(new GoogleStrategy({
  clientID: '888153648277-6al662vpm8h771vtoiqnul5brhc68jg3.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:3000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  // Save user information in the session
  return done(null, profile);
}));


passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/chat');
  }
);

app.get('/chat', ensureAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/public/landing.html');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Socket.IO setup
io.on('connection', (socket) => {
  // Handle joining a room
  socket.on('join room', (room) => {
    socket.join(room);
    io.emit('room list', Array.from(socket.adapter.rooms));
    socket.room = room;
    // Fetch previous messages for the room and send to the user
    Message.find({ room: room }).sort({ timestamp: 1 }).exec((err, messages) => {
      if (err) throw err;
      socket.emit('chat history', messages);
    });
  });

  // Handle chat messages in a specific room
  socket.on('chat message', (data) => {
    const message = new Message({
      user: socket.request.user.displayName,
      room: socket.room,
      message: data.message,
    });

    message.save((err) => {
      if (err) throw err;
      io.to(socket.room).emit('chat message', {
        user: socket.request.user.displayName,
        message: data.message,
      });
    });
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Server setup
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Google OAuth configuration
/*passport.use(new GoogleStrategy({
  clientID: '888153648277-6al662vpm8h771vtoiqnul5brhc68jg3.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:3000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  // Save user information in the session
  return done(null, profile);
}));
mongodb://localhost:27017/
*/