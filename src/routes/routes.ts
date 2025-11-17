import express from 'express';
import { shuffleParticipants } from '../services/shuffle';
import { env } from 'process';
import RoomService from '../services/roomService';
import NotificationService from '../services/sseService';

let participants: string[] = [];
const MAX_PARTICIPANTS = Number(env.PARTICIPANTS);

const createRoomRoute = express.Router();
const joinRoute = express.Router();
const shuffleRoute = express.Router();
const getParticipantsRoute = express.Router();
const sseRoute = express.Router();
const sessionStatusRoute = express.Router();
const leaveRoute = express.Router();


let clients: { id: string; res: express.Response }[] = [];
let clientNames: { id: string; name: string }[] = [];
let results: { giver: string; receiver: string }[] = [];

createRoomRoute.post('/', async (req: any, res: any) => {
  const { name, email, maxParticipants } = req.body;

  if (!name || !email || !maxParticipants) {
    return res.status(400).json({ message: 'Name, email, and max participants are required!' });
  }

  const room = RoomService.createRoom(maxParticipants);
  console.log(`Room ${room.roomId} created by ${name} (${email})`);

  req.session.joined = false;
  req.session.name = name;
  req.session.email = email;
  req.session.roomId = room.roomId;

  res.status(200).json({ roomId: room.roomId, message: `Room created! Share this code to invite others: ${room.roomId}` });
});

// Join Route
joinRoute.post('/', async (req: any, res: any) => {
  const { name, email, roomCode } = req.body;
  console.log("Join request received:", name, email, roomCode);
  const room = RoomService.getRoom(roomCode);
  if (!room) {
    return res.status(400).json({ message: `Room not found!` });
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

  console.log(`${name} (${email}) joined room ${roomCode}`);

  req.session.joined = true;
  req.session.name = name;
  req.session.email = email;
  req.session.roomId = roomCode;

  NotificationService.notifyRoomJoin(req.sessionID, roomCode, name);
  res.status(200).json({ message: `Joined room ${roomCode} successfully!` });



  // req.session.joined = true;
  // req.session.name = name;
  // var message = `${name} has joined! Waiting for ` + (MAX_PARTICIPANTS - participants.length) + ' more.';

  // if (participants.length === MAX_PARTICIPANTS) {
  //   notifyResults();
  //   res.status(200).send({ message: 'You will give a gift to: ' + results.find(p => p.giver === name)?.receiver + '❤️' });
  // } else {
  //   notifyClients(message); // Notify clients of the new participant
  //   res.status(200).send(message);
  // }
});

// function notifyResults() {
//   results = shuffleParticipants<string>(participants);
//   clients.forEach(client => {
//     var giver = clientNames.find(c => c.id === client.id)?.name || "";
//     var result = results.find(p => p.giver === giver)?.receiver || "";
//     var data = getDataString(result);
//     client.res.write(data);
//   });
// }

leaveRoute.post('/', async (req: any, res: any) => {
  if (!req.session.joined) {
    return res.status(400).json({ message: 'You are not in.' });
  }

  console.log(`${req.session.name} is leaving room ${req.session.roomId}`);
  const participantRemoved = RoomService.removeParticipant(req.session.roomId, req.sessionID);
  if (!participantRemoved) {
    return res.status(400).json({ message: 'Could not leave the room. Unknown error.' });
  }

  const name = req.session.name;

  // Clear session data
  req.session.joined = false;
  req.session.name = '';
  req.session.email = '';

  NotificationService.notifyRoomLeave(req.sessionID, req.session.roomId, name);
  res.status(200).json({ message: `You have left the secret santa, ${name}.` });
});


// Session Status Route
sessionStatusRoute.get('/:roomId', (req: any, res: any) => {
  const roomId = req.params.roomId;
  console.log(roomId)

  const room = RoomService.getRoom(roomId);
  if (!room) {
    return res.status(400).json({ message: 'Room not found!' });
  }

  const userJoined = RoomService.getRoom(roomId)?.participants.some(p => p.sessionId === req.sessionID);
  const maxParticipants = room.maxParticipants;
  const participants = room.participants.map(p => p.name);

  if (userJoined) {
    res.status(200).json({ alreadyJoined: true, name: req.session.name, participants: participants, maxParticipants: maxParticipants });
  } else {
    res.status(200).json({ alreadyJoined: false, name: req.session.name, participants: participants, maxParticipants: maxParticipants });
  }
});

export { createRoomRoute, joinRoute, shuffleRoute, getParticipantsRoute, sseRoute, sessionStatusRoute, leaveRoute };
