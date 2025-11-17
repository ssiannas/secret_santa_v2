"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const room_1 = require("../types/room");
class RoomService {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(maxParticipants) {
        const roomId = this.generateRoomId();
        const room = new room_1.Room(roomId, maxParticipants, [], new Date(), "waiting");
        this.rooms.set(roomId, room);
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    addParticipant(roomId, participant) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        if (room.participants.length >= room.maxParticipants)
            return false;
        room.participants.push(participant);
        return true;
    }
    removeParticipant(roomId, sessionId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        const index = room.participants.findIndex(p => p.sessionId === sessionId);
        if (index === -1)
            return false;
        room.participants.splice(index, 1);
        if (room.participants.length === 0) {
            this.rooms.delete(roomId);
        }
        return true;
    }
    generateRoomId(length = 6) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid confusing characters
        let id;
        do {
            id = Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        } while (this.rooms.has(id)); // check if ID already exists
        return id;
    }
}
exports.default = new RoomService();
