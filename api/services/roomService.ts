import { Room } from '../types/room';
import { Participant } from '../types/participant';

class RoomService {
    private rooms: Map<string, Room> = new Map();

    createRoom(maxParticipants: number): Room {
        const roomId = this.generateRoomId();
        const room = new Room(
            roomId,
            maxParticipants,
            [],
            new Date(),
            "waiting");
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    addParticipant(roomId: string, participant: Participant): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        if (room.participants.length >= room.maxParticipants) return false;

        room.participants.push(participant);
        return true;
    }

    removeParticipant(roomId: string, sessionId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        const index = room.participants.findIndex(p => p.sessionId === sessionId);
        if (index === -1) return false;
        room.participants.splice(index, 1);
        if (room.participants.length === 0) {
            this.rooms.delete(roomId);
        }
        return true;
    }

    generateRoomId(length = 6): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid confusing characters
        let id: string;

        do {
            id = Array.from({ length }, () =>
                chars.charAt(Math.floor(Math.random() * chars.length))
            ).join('');
        } while (this.rooms.has(id)); // check if ID already exists

        return id;
    }
}

export default new RoomService();