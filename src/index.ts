import express from 'express';
import session from 'express-session';
import path from 'path';
import { joinRoute, shuffleRoute, getParticipantsRoute, sseRoute, sessionStatusRoute, leaveRoute } from './routes';

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
