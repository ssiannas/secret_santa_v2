import { Participant } from './participant';

type RoomStatus = "waiting" | "shuffled" | "completed";

export interface Room {
    roomId: string;             // unique code for joining
    maxParticipants: number;
    participants: Participant[];
    createdAt: Date;
    status: RoomStatus;
}
