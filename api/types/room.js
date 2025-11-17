"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
class Room {
    constructor(roomId, maxParticipants, participants, createdAt, status) {
        this.roomId = roomId;
        this.maxParticipants = maxParticipants;
        this.participants = participants;
        this.createdAt = createdAt;
        this.status = status;
    }
    getParticipantNames() {
        return this.participants.map(p => p.name);
    }
}
exports.Room = Room;
