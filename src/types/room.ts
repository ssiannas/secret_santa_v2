import { Participant } from './participant';

type RoomStatus = "waiting" | "shuffled" | "completed";

interface IRoom {
    roomId: string;             // unique code for joining
    maxParticipants: number;
    participants: Participant[];
    createdAt: Date;
    status: RoomStatus;
}

export class Room implements IRoom {
    constructor(
        public roomId: string,
        public maxParticipants: number,
        public participants: Participant[],
        public createdAt: Date,
        public status: RoomStatus
    ) { }

    getParticipantNames(): string[] {
        return this.participants.map(p => p.name);
    }
}