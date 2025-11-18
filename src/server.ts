import express from 'express';
import session from 'express-session';
import path from 'path';
var https = require('https');
var http = require('http');
var fs = require('fs');

import { createRoomRoute, joinRoute, shuffleRoute, getParticipantsRoute, sessionStatusRoute, leaveRoute } from './routes/routes';
import { sseRoute } from './routes/sseRouting';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(session({
  secret: 'secret-santa-key',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false } // Use `true` for HTTPS
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/join', joinRoute);
app.use('/shuffle', shuffleRoute);
app.use('/participants', getParticipantsRoute);
app.use('/events', sseRoute);
app.use('/session-status', sessionStatusRoute);
app.use('/leave', leaveRoute);
app.use('/create-room', createRoomRoute);

http.createServer(app).listen(80);
https.createServer(app).listen(443);
console.log(`Server running on http://localhost`);