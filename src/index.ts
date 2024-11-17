import express from 'express';
import session from 'express-session';
import path from 'path';
var https = require('https');
var http = require('http');
var fs = require('fs');

import { joinRoute, shuffleRoute, getParticipantsRoute, sseRoute, sessionStatusRoute, leaveRoute } from './routes';

var options = {
  key: fs.readFileSync(path.join(__dirname,'../keys/client-key.pem')),
  cert: fs.readFileSync(path.join(__dirname,'../keys/client-cert.pem'))
};

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(session({
  secret: 'secret-santa-key',
  resave: false,
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

http.createServer(app).listen(80);
https.createServer(options, app).listen(443);
console.log(`Server running on http://localhost`);