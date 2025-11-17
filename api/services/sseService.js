"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// lets refactor the code from the routing file to a notification service class
const roomService_1 = __importDefault(require("./roomService"));
const emailService_1 = __importDefault(require("./emailService"));
// convert to enum
var NotificationType;
(function (NotificationType) {
    NotificationType["Joined"] = "joined";
    NotificationType["Left"] = "left";
    NotificationType["Shuffled"] = "shuffled";
})(NotificationType || (NotificationType = {}));
class NotificationService {
    constructor() {
        this.clients = new Map();
    }
    addClient(client) {
        this.clients.set(client.id, client.res);
    }
    removeClient(clientId) {
        this.clients.delete(clientId);
    }
    getDataString(result = "", name = "", type = NotificationType.Joined, roomCode = "") {
        const room = roomService_1.default.getRoom(roomCode);
        if (!room)
            return 'Room not found';
        return `data: ${JSON.stringify({
            participants: (room === null || room === void 0 ? void 0 : room.getParticipantNames()) || [],
            results: result,
            message: this.getMessageString(name, room, type),
            event: type
        })}\n\n`;
    }
    getMessageString(name, room, type) {
        switch (type) {
            case NotificationType.Joined:
                return this.getJoinMessageString(name, room);
            case NotificationType.Left:
                return this.getLeaveMessageString(name, room);
            case NotificationType.Shuffled:
                return this.getResultMessageString();
            default:
                return '';
        }
    }
    notifyOtherClients(excludeId, message = '', type = NotificationType.Joined, roomCode = '') {
        const room = roomService_1.default.getRoom(roomCode);
        if (!room)
            return;
        const roomClientSessions = room.participants.map(p => p.sessionId);
        setTimeout(() => {
            roomClientSessions.forEach(sessionId => {
                var _a;
                if (sessionId !== excludeId) {
                    var data = this.getDataString("", message, type, roomCode);
                    (_a = this.clients.get(sessionId)) === null || _a === void 0 ? void 0 : _a.write(data);
                }
            });
        }, 32);
    }
    notifySingleClient(clientId, message = '', type = NotificationType.Joined, roomCode = '', result = '') {
        setTimeout(() => {
            var _a;
            if (this.clients.has(clientId)) {
                var data = this.getDataString(result, message, type, roomCode);
                (_a = this.clients.get(clientId)) === null || _a === void 0 ? void 0 : _a.write(data);
            }
        }, 32);
    }
    notifyAllClients(message = '', type = NotificationType.Joined, roomCode = '') {
        const room = roomService_1.default.getRoom(roomCode);
        if (!room)
            return;
        const roomClientSessions = room.participants.map(p => p.sessionId);
        setTimeout(() => {
            roomClientSessions.forEach(sessionId => {
                var _a;
                var data = this.getDataString("", message, type, roomCode);
                (_a = this.clients.get(sessionId)) === null || _a === void 0 ? void 0 : _a.write(data);
            });
        }, 32);
    }
    notifyRoomJoin(excludeId, roomCode, name) {
        this.notifyOtherClients(excludeId, name, NotificationType.Joined, roomCode);
    }
    notifyRoomLeave(excludeId, roomCode, name) {
        this.notifyOtherClients(excludeId, name, NotificationType.Left, roomCode);
    }
    notifyResults(roomCode, assignments, participants) {
        let resultString = '';
        participants.forEach(participant => {
            const receiver = assignments[participant.email];
            resultString += `${participant.name} → ${receiver.name}\n`;
            this.notifySingleClient(participant.sessionId, "", NotificationType.Shuffled, roomCode, `You will give a gift to: ${receiver.name} ❤️`);
        });
        emailService_1.default.sendResultsEmail(assignments);
    }
    getJoinMessageString(name, room) {
        const maxParticipants = (room === null || room === void 0 ? void 0 : room.maxParticipants) || -1;
        const currentParticipants = (room === null || room === void 0 ? void 0 : room.participants.length) || -1;
        return `${name} has joined the room. Waiting for ${maxParticipants - currentParticipants} more.`;
    }
    getLeaveMessageString(name, room) {
        const maxParticipants = (room === null || room === void 0 ? void 0 : room.maxParticipants) || -1;
        const currentParticipants = (room === null || room === void 0 ? void 0 : room.participants.length) || -1;
        return `${name} has left the room. Waiting for ${maxParticipants - currentParticipants} more.`;
    }
    getResultsMessageString(assignments) {
        // check the session
        return `The participants have been shuffled!`;
    }
    getResultMessageString() {
        return `The participants have been shuffled!`;
    }
}
exports.default = new NotificationService();
