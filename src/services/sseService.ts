// lets refactor the code from the routing file to a notification service class
import RoomService from "./roomService";
import express from "express";
import { Room } from "../types/room";
import { Participant } from "../types/participant";
import EmailService from "./emailService";


// convert to enum
enum NotificationType {
    Joined = "joined",
    Left = "left",
    Shuffled = "shuffled"
}

class NotificationService {
    private clients: Map<string, express.Response> = new Map();

    addClient(client: { id: string; res: express.Response }) {
        this.clients.set(client.id, client.res);
    }

    removeClient(clientId: string) {
        this.clients.delete(clientId);
    }

    getDataString(result: string = "", name: string = "", type: NotificationType = NotificationType.Joined, roomCode: string = ""): string {
        const room = RoomService.getRoom(roomCode);
        if (!room) return 'Room not found';
        return `data: ${JSON.stringify({
            participants: room?.getParticipantNames() || [],
            results: result,
            message: this.getMessageString(name, room, type),
            event: type
        })}\n\n`;
    }

    getMessageString(name: string, room: Room, type: NotificationType): string {
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

    notifyOtherClients(excludeId: string, message: string = '', type: NotificationType = NotificationType.Joined, roomCode: string = '') {
        const room = RoomService.getRoom(roomCode);
        if (!room) {
            return;
        }
        const roomClientSessions = room.participants.map(p => p.sessionId);

        setTimeout(() => {
            roomClientSessions.forEach(sessionId => {
                if (sessionId !== excludeId) {
                    var data = this.getDataString("", message, type, roomCode);
                    this.clients.get(sessionId)?.write(data)
                }
            })
        }, 32);

    }

    notifySingleClient(clientId: string, message: string = '', type: NotificationType = NotificationType.Joined, roomCode: string = '', result: string = '') {
        setTimeout(() => {
            if (this.clients.has(clientId)) {
                var data = this.getDataString(result, message, type, roomCode);
                this.clients.get(clientId)?.write(data);
            }
        }, 32);
    }

    notifyAllClients(message: string = '', type: NotificationType = NotificationType.Joined, roomCode: string = '') {
        const room = RoomService.getRoom(roomCode);
        if (!room) return;

        const roomClientSessions = room.participants.map(p => p.sessionId);
        setTimeout(() => {
            roomClientSessions.forEach(sessionId => {
                var data = this.getDataString("", message, type, roomCode);
                this.clients.get(sessionId)?.write(data);
            });
        }, 32);
    }

    notifyRoomJoin(excludeId: string, roomCode: string, name: string) {
        this.notifyOtherClients(excludeId, name, NotificationType.Joined, roomCode);
    }

    notifyRoomLeave(excludeId: string, roomCode: string, name: string) {
        this.notifyOtherClients(excludeId, name, NotificationType.Left, roomCode);
    }

    notifyResults(roomCode: string, assignments: Record<string, Participant>, participants: Participant[]) {
        let resultString = '';
        participants.forEach(participant => {
            const receiver = assignments[participant.email];
            resultString += `${participant.name} → ${receiver.name}\n`;
            this.notifySingleClient(
                participant.sessionId,
                "",
                NotificationType.Shuffled,
                roomCode,
                `You will give a gift to: ${receiver.name} ❤️`
            );
        });
        EmailService.sendResultsEmail(assignments);
    }


    getJoinMessageString(name: string, room: Room): string {
        const maxParticipants = room?.maxParticipants || -1;
        const currentParticipants = room?.participants.length || -1;
        return `${name} has joined the room. Waiting for ${maxParticipants - currentParticipants} more.`;
    }

    getLeaveMessageString(name: string, room: Room): string {
        const maxParticipants = room?.maxParticipants || -1;
        const currentParticipants = room?.participants.length || -1;
        return `${name} has left the room. Waiting for ${maxParticipants - currentParticipants} more.`;
    }

    getResultsMessageString(assignments: Record<string, any>): string {
        // check the session
        return `The participants have been shuffled!`;
    }

    getResultMessageString(): string {
        return `The participants have been shuffled!`;
    }
}

export default new NotificationService();