"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseRoute = void 0;
const express_1 = __importDefault(require("express"));
const sseService_1 = __importDefault(require("../services/sseService"));
exports.sseRoute = express_1.default.Router();
// SSE for real-time updates
exports.sseRoute.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // could use uuid
    const newClient = { id: req.sessionID, res };
    sseService_1.default.addClient(newClient);
    req.on('close', () => {
        sseService_1.default.removeClient(req.sessionID);
    });
});
