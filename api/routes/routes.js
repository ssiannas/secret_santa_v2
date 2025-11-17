"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveRoute = exports.sessionStatusRoute = exports.sseRoute = exports.getParticipantsRoute = exports.shuffleRoute = exports.joinRoute = exports.createRoomRoute = void 0;
const express_1 = __importDefault(require("express"));
const roomService_1 = __importDefault(require("../services/roomService"));
const sseService_1 = __importDefault(require("../services/sseService"));
const shuffle_1 = require("../services/shuffle");
const createRoomRoute = express_1.default.Router();
exports.createRoomRoute = createRoomRoute;
const joinRoute = express_1.default.Router();
exports.joinRoute = joinRoute;
const shuffleRoute = express_1.default.Router();
exports.shuffleRoute = shuffleRoute;
const getParticipantsRoute = express_1.default.Router();
exports.getParticipantsRoute = getParticipantsRoute;
const sseRoute = express_1.default.Router();
exports.sseRoute = sseRoute;
const sessionStatusRoute = express_1.default.Router();
exports.sessionStatusRoute = sessionStatusRoute;
const leaveRoute = express_1.default.Router();
exports.leaveRoute = leaveRoute;
createRoomRoute.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, maxParticipants } = req.body;
    if (!name || !email || !maxParticipants) {
        return res.status(400).json({ message: 'Name, email, and max participants are required!' });
    }
    const room = roomService_1.default.createRoom(maxParticipants);
    req.session.joined = false;
    req.session.name = name;
    req.session.email = email;
    req.session.roomId = room.roomId;
    res.status(200).json({ roomId: room.roomId, message: `Room created! Share this code to invite others: ${room.roomId}` });
}));
// Join Route
joinRoute.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, roomCode } = req.body;
    const room = roomService_1.default.getRoom(roomCode);
    if (!room) {
        return res.status(400).json({ message: `Room not found!` });
    }
    if (room.status === "shuffled") {
        return res.status(400).json({ message: `Cannot join. Room status is '${room.status}'.` });
    }
    // Check if participant with same credentians already exists
    const existingParticipant = room.participants.find(p => p.email === email);
    if (existingParticipant) {
        return res.status(201).json({ message: `A participant with this email has already joined the room.` });
    }
    const added = roomService_1.default.addParticipant(roomCode, { sessionId: req.sessionID, name, email });
    if (!added) {
        if (room.participants.length >= room.maxParticipants) {
            return res.status(400).json({ message: `Room is full.` });
        }
        return res.status(400).json({ message: `Could not join the room. Unknown error` });
    }
    req.session.joined = true;
    req.session.name = name;
    req.session.email = email;
    req.session.roomId = roomCode;
    // Check if we need to shuffle
    if (room.participants.length === room.maxParticipants) {
        const assignments = (0, shuffle_1.shuffleParticipantsInRoom)(room);
        const participants = room.participants;
        sseService_1.default.notifyResults(room.roomId, assignments, participants);
        room.status = "shuffled";
        return res.status(200).json({ message: `You will give a gift to: ${assignments[email].name} ❤️` });
    }
    sseService_1.default.notifyRoomJoin(req.sessionID, roomCode, name);
    return res.status(200).json({ message: `Joined room ${roomCode} successfully!` });
}));
leaveRoute.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.joined) {
        return res.status(400).json({ message: 'You are not in.' });
    }
    const participantRemoved = roomService_1.default.removeParticipant(req.session.roomId, req.sessionID);
    if (!participantRemoved) {
        return res.status(400).json({ message: 'Could not leave the room. Unknown error.' });
    }
    const name = req.session.name;
    const room = roomService_1.default.getRoom(req.session.roomId);
    // Clear session data
    req.session.joined = false;
    req.session.name = '';
    req.session.email = '';
    req.session.roomId = '';
    if (room && room.status === "shuffled") {
        return res.status(200).json({ message: `You have left the secret santa, ${name}. Note: The room has already been shuffled.` });
    }
    sseService_1.default.notifyRoomLeave(req.sessionID, req.session.roomId, name);
    res.status(200).json({ message: `You have left the secret santa, ${name}.` });
}));
// Session Status Route
sessionStatusRoute.get('/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const room = roomService_1.default.getRoom(roomId);
    if (!room) {
        return res.status(400).json({ message: 'Room not found!' });
    }
    // check if the user with the same session ID and emial is in the room
    const userJoined = room.participants.some(p => p.sessionId === req.sessionID && p.email === req.session.email);
    const maxParticipants = room.maxParticipants;
    const participants = room.participants.map(p => p.name);
    console.log(`User could be already joined: ${userJoined}`);
    if (room.status === "shuffled") {
        return res.status(200).json({ alreadyJoined: userJoined, name: req.session.name, participants: participants, maxParticipants: maxParticipants, roomStatus: room.status });
    }
    if (userJoined) {
        res.status(200).json({ alreadyJoined: true, name: req.session.name, participants: participants, maxParticipants: maxParticipants });
    }
    else {
        res.status(200).json({ alreadyJoined: false, name: req.session.name, participants: participants, maxParticipants: maxParticipants });
    }
});
