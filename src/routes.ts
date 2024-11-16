import express from 'express';

let participants: string[] = [];
const MAX_PARTICIPANTS = 8;

const joinRoute = express.Router();
const shuffleRoute = express.Router();
const getParticipantsRoute = express.Router();
const sseRoute = express.Router();
const sessionStatusRoute = express.Router();
const leaveRoute = express.Router();

let clients: { id: number; res: express.Response }[] = [];
let clientId = 0;

// SSE for real-time updates
sseRoute.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const newClient = { id: clientId++, res };
  clients.push(newClient);
  res.write(`data: ${JSON.stringify(participants)}\n\n`);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== newClient.id);
  });
});

function notifyClients() {
  const data = `data: ${JSON.stringify(participants)}\n\n`;
  clients.forEach(client => client.res.write(data));
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
  req.session.joined = true;
  req.session.name = name;
  
  notifyClients();
  res.status(200).send({ message: `${name} has joined!` });
});

leaveRoute.post('/', (req: any, res: any) => {
  if (!req.session.joined) {
    return res.status(400).json({ message: 'You are not in the game.' });
  }

  const name = req.session.name;
  participants = participants.filter((participant) => participant !== name);

  // Clear session data
  req.session.joined = false;
  req.session.name = '';

  notifyClients(); // Notify clients of the participant leaving
  res.status(200).json({ message: `You have left the game, ${name}.` });
});


// Session Status Route
sessionStatusRoute.get('/', (req: any, res: any) => {
  if (req.session.joined) {
    res.status(200).send({ alreadyJoined: true, name: req.session.name });
  } else {
    res.status(200).send({ alreadyJoined: false });
  }
});

// Get Participants
getParticipantsRoute.get('/', (req, res) => {
  res.status(200).send(participants);
});

export { joinRoute, shuffleRoute, getParticipantsRoute, sseRoute, sessionStatusRoute, leaveRoute };
