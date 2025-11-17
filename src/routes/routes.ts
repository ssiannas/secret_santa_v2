import express from 'express';
import RoomService from '../services/roomService';
import NotificationService from '../services/sseService';
import { shuffleParticipantsInRoom } from '../services/shuffle';

const createRoomRoute = express.Router();
const joinRoute = express.Router();
const shuffleRoute = express.Router();
const getParticipantsRoute = express.Router();
const sseRoute = express.Router();
const sessionStatusRoute = express.Router();
const leaveRoute = express.Router();

createRoomRoute.post('/', async (req: any, res: any) => {
  const { name, email, maxParticipants } = req.body;

  if (!name || !email || !maxParticipants) {
    return res.status(400).json({ message: 'Name, email, and max participants are required!' });
  }

  const room = RoomService.createRoom(maxParticipants);

  req.session.joined = false;
  req.session.name = name;
  req.session.email = email;
  req.session.roomId = room.roomId;

  res.status(200).json({ roomId: room.roomId, message: `Room created! Share this code to invite others: ${room.roomId}` });
});

// Join Route
joinRoute.post('/', async (req: any, res: any) => {
  const { name, email, roomCode } = req.body;
  const room = RoomService.getRoom(roomCode);
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

  const added = RoomService.addParticipant(roomCode, { sessionId: req.sessionID, name, email });
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
    const assignments = shuffleParticipantsInRoom(room);

    const participants = room.participants;
    NotificationService.notifyResults(room.roomId, assignments, participants);
    room.status = "shuffled";
    return res.status(200).json({ message: `You will give a gift to: ${assignments[email].name} ❤️` });
  }

  NotificationService.notifyRoomJoin(req.sessionID, roomCode, name);
  return res.status(200).json({ message: `Joined room ${roomCode} successfully!` });
});

leaveRoute.post('/', async (req: any, res: any) => {
  if (!req.session.joined) {
    return res.status(400).json({ message: 'You are not in.' });
  }

  const participantRemoved = RoomService.removeParticipant(req.session.roomId, req.sessionID);
  if (!participantRemoved) {
    return res.status(400).json({ message: 'Could not leave the room. Unknown error.' });
  }

  const name = req.session.name;

  const room = RoomService.getRoom(req.session.roomId);
  // Clear session data
  req.session.joined = false;
  req.session.name = '';
  req.session.email = '';
  req.session.roomId = '';

  if (room && room.status === "shuffled") {
    return res.status(200).json({ message: `You have left the secret santa, ${name}. Note: The room has already been shuffled.` });
  }

  NotificationService.notifyRoomLeave(req.sessionID, req.session.roomId, name);
  res.status(200).json({ message: `You have left the secret santa, ${name}.` });
});

// Session Status Route
sessionStatusRoute.get('/:roomId', (req: any, res: any) => {
  const roomId = req.params.roomId;

  const room = RoomService.getRoom(roomId);
  if (!room) {
    return res.status(400).json({ message: 'Room not found!' });
  }


  // check if the user with the same session ID and emial is in the room
  const userJoined = room.participants.some(p => p.sessionId === req.sessionID && p.email === req.session.email);
  const maxParticipants = room.maxParticipants;
  const participants = room.participants.map(p => p.name);

  if (room.status === "shuffled") {
    return res.status(200).json({ alreadyJoined: userJoined, name: req.session.name, participants: participants, maxParticipants: maxParticipants, roomStatus: room.status });

  }

  if (userJoined) {
    res.status(200).json({ alreadyJoined: true, name: req.session.name, participants: participants, maxParticipants: maxParticipants });
  } else {
    res.status(200).json({ alreadyJoined: false, name: req.session.name, participants: participants, maxParticipants: maxParticipants });
  }
});

export { createRoomRoute, joinRoute, shuffleRoute, getParticipantsRoute, sseRoute, sessionStatusRoute, leaveRoute };
