"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
var https = require('https');
var http = require('http');
var fs = require('fs');
const routes_1 = require("./routes/routes");
const sseRouting_1 = require("./routes/sseRouting");
var options = {
    key: fs.readFileSync(path_1.default.join(__dirname, '../keys/client-key.pem')),
    cert: fs.readFileSync(path_1.default.join(__dirname, '../keys/client-cert.pem'))
};
const app = (0, express_1.default)();
const PORT = 3000;
// Middleware
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: 'secret-santa-key',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false } // Use `true` for HTTPS
}));
// Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Routes
app.use('/join', routes_1.joinRoute);
app.use('/shuffle', routes_1.shuffleRoute);
app.use('/participants', routes_1.getParticipantsRoute);
app.use('/events', sseRouting_1.sseRoute);
app.use('/session-status', routes_1.sessionStatusRoute);
app.use('/leave', routes_1.leaveRoute);
app.use('/create-room', routes_1.createRoomRoute);
http.createServer(app).listen(80);
https.createServer(options, app).listen(443);
console.log(`Server running on http://localhost`);
