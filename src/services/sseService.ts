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
    private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

    addClient(client: { id: string; res: express.Response }) {
        const existingClient = this.clients.get(client.id);
        if (existingClient) {
            existingClient.end();
        }

        this.clients.set(client.id, client.res);

        // Handle client disconnect
        client.res.on('close', () => {
            this.removeClient(client.id);
        });

        client.res.on('error', (error) => {
            console.error(`Client ${client.id} error:`, error);
            this.removeClient(client.id);
        });

        // Send initial comment to establish connection
        client.res.write(':connected\n\n');
        this.startHeartbeat(client.id, client.res);
    }

    removeClient(clientId: string) {
        this.clients.delete(clientId);

        const interval = this.heartbeatIntervals.get(clientId);
        if (interval) {
            clearInterval(interval);
            this.heartbeatIntervals.delete(clientId);
        }
    }

    private writeToClient(clientId: string, data: string): boolean {
        try {
            const res = this.clients.get(clientId);
            if (!res) {
                return false;
            }
            res.write(data);
            return true;
        } catch (error) {
            console.error(`Failed to write to client ${clientId}:`, error);
            this.removeClient(clientId);
            return false;
        }
    }

    private startHeartbeat(clientId: string, res: express.Response) {
        const interval = setInterval(() => {
            try {
                res.write(':heartbeat\n\n');
            } catch (error) {
                console.error(`Failed to send heartbeat to ${clientId}:`, error);
                this.removeClient(clientId);
            }
        }, 10000); // Every 10 seconds

        this.heartbeatIntervals.set(clientId, interval);
    }

    getDataString(result: string = "", name: string = "", type: NotificationType = NotificationType.Joined, roomCode: string = ""): string {
        const room = RoomService.getRoom(roomCode);
        if (!room) return 'Room not found';
        const eventData = JSON.stringify({
            participants: room?.getParticipantNames() || [],
            results: result,
            message: this.getMessageString(name, room, type),
            event: type
        });
        return `event: ${type}\ndata: ${eventData}\n\n`;
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
        if (!room) return;

        const roomClientSessions = room.participants.map(p => p.sessionId);
        roomClientSessions.forEach(sessionId => {
            if (sessionId !== excludeId) {
                const data = this.getDataString("", message, type, roomCode);
                this.writeToClient(sessionId, data);
            }
        });
    }

    notifySingleClient(clientId: string, message: string = '', type: NotificationType = NotificationType.Joined, roomCode: string = '', result: string = '') {
        const data = this.getDataString(result, message, type, roomCode);
        this.writeToClient(clientId, data);
    }

    notifyAllClients(message: string = '', type: NotificationType = NotificationType.Joined, roomCode: string = '') {
        const room = RoomService.getRoom(roomCode);
        if (!room) return;

        const roomClientSessions = room.participants.map(p => p.sessionId);
        roomClientSessions.forEach(sessionId => {
            const data = this.getDataString("", message, type, roomCode);
            this.writeToClient(sessionId, data);
        });
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