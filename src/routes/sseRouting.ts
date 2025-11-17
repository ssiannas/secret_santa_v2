import express from 'express';
import NotificationService from '../services/sseService';
export const sseRoute = express.Router();


// SSE for real-time updates
sseRoute.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // could use uuid
    const newClient = { id: req.sessionID, res };
    NotificationService.addClient(newClient);

    req.on('close', () => {
        NotificationService.removeClient(req.sessionID);
    });
});
