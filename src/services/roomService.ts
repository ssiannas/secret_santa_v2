import { Room } from '../types/room';
import { Participant } from '../types/participant';

class RoomService {
    private rooms: Map<string, Room> = new Map();

    createRoom(maxParticipants: number): Room {
        const roomId = this.generateRoomId();
        const room: Room = {
            roomId,
            maxParticipants,
            participants: [],
            createdAt: new Date(),
            status: "waiting"
        };
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

    generateRoomId(length = 6): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid confusing letters
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