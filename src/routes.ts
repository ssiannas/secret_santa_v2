import express from 'express';
import { shuffleParticipants } from './services/shuffle';
import { env } from 'process';

let participants: string[] = [];
const MAX_PARTICIPANTS = Number(env.PARTICIPANTS);

const joinRoute = express.Router();
const shuffleRoute = express.Router();
const getParticipantsRoute = express.Router();
const sseRoute = express.Router();
const sessionStatusRoute = express.Router();
const leaveRoute = express.Router();
const createRoomRoute = express.Router();

let clients: { id: string; res: express.Response }[] = [];
let clientNames: { id: string; name: string }[] = [];
let results: { giver: string; receiver: string }[] = [];

// SSE for real-time updates
sseRoute.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // could use uuid
  const newClient = { id: req.sessionID, res };
  clients.push(newClient);
  res.write(getDataString()); // Send initial data to the client

  req.on('close', () => {
    clients = clients.filter(client => client.id !== newClient.id);
  });
});

function getDataString(result: string = "", message: string = "") {
  return `data: ${JSON.stringify({
    participants: participants,
    shuffled: result !== "",
    results: result,
    message: message
  })}\n\n`;
}

function notifyClients(message: string = '') {
  setTimeout(() => {
    clients.forEach(client => { 
        var data = getDataString("", message);
        client.res.write(data)
      })
    }, 33);
}

// Join Route
joinRoute.post('/', (req: any, res: any) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required!' });
  }
  if (req.session.joined) {
    return res.status(400).json({ message: 'You have already joined!' });
  }
  if (participants.length >= MAX_PARTICIPANTS) {
    return res.status(400).json({ message: 'All slots are full!' });
  }
  if (participants.includes(name)) {
    return res.status(400).json({ message: 'Name already exists!' });
  }

  participants.push(name);
  clientNames.push({ id: req.sessionID, name: name });
  req.session.joined = true;
  req.session.name = name;
  var message = `${name} has joined! Waiting for `+ (MAX_PARTICIPANTS - participants.length) + ' more.';

  if (participants.length === MAX_PARTICIPANTS) {
    notifyResults();
    res.status(200).send({ message: 'You will give a gift to: ' + results.find(p => p.giver === name)?.receiver  + '❤️'});
  } else {
    notifyClients(message); // Notify clients of the new participant
    res.status(200).send(message);
  }
});

function notifyResults() {
  results = shuffleParticipants<string>(participants);
  clients.forEach(client => {
    var giver = clientNames.find(c => c.id === client.id)?.name || "";
    var result = results.find(p => p.giver === giver)?.receiver || "";
    var data = getDataString(result);
    client.res.write(data);
  });
}

leaveRoute.post('/', (req: any, res: any) => {
  if (!req.session.joined) {
    return res.status(400).json({ message: 'You are not in.' });
  }

  const name = req.session.name;
  participants = participants.filter((participant) => participant !== name);

  // Clear session data
  req.session.joined = false;
  req.session.name = '';

  notifyClients(); // Notify clients of the participant leaving
  res.status(200).json({ message: `You have left the secret santa, ${name}.` });
});


// Session Status Route
sessionStatusRoute.get('/', (req: any, res: any) => {
  if (req.session.joined) {
    res.status(200).json({ alreadyJoined: true, name: req.session.name, participants: participants, maxParticipants : MAX_PARTICIPANTS });
  } else {
    res.status(200).send({ alreadyJoined: false });
  }
});

// Get Participants
getParticipantsRoute.get('/', (req, res) => {
  res.status(200).send(participants);
});

export { joinRoute, shuffleRoute, getParticipantsRoute, sseRoute, sessionStatusRoute, leaveRoute };
