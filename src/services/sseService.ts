// lets refactor the code from the routing file to a notification service class
import RoomService from "./roomService";
import express from "express";
import { Room } from "../types/room";

// convert to enum
enum NotificationType {
    Joined = "joined",
    Left = "left",
    Shuffled = "shuffled"
}

class NotificationService {
    private clients: { id: string; res: express.Response }[] = [];

    addClient(client: { id: string; res: express.Response }) {
        this.clients.push(client);
    }

    removeClient(clientId: string) {
        this.clients = this.clients.filter(client => client.id !== clientId);
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
            case "joined":
                return this.getJoinMessageString(name, room);
            case "left":
                return this.getLeaveMessageString(name, room);
            case "shuffled":
                return this.getResultMessageString();
            default:
                return '';
        }
    }

    notifyOtherClients(excludeId: string, message: string = '', type: NotificationType = NotificationType.Joined, roomCode: string = '') {
        setTimeout(() => {
            this.clients.forEach(client => {
                if (client.id !== excludeId) {
                    var data = this.getDataString("", message, type, roomCode);
                    client.res.write(data)
                }
            })
        }, 32);

    }

    notifyAllClients(message: string = '', type: NotificationType = NotificationType.Joined, roomCode: string = '') {
        setTimeout(() => {
            this.clients.forEach(client => {
                var data = this.getDataString("", message, type, roomCode);
                client.res.write(data);
            });
        }, 32);
    }

    notifyRoomJoin(excludeId: string, roomCode: string, name: string) {
        this.notifyOtherClients(excludeId, name, NotificationType.Joined, roomCode);
    }

    notifyRoomLeave(excludeId: string, roomCode: string, name: string) {
        this.notifyOtherClients(excludeId, name, NotificationType.Left, roomCode);
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

    getResultMessageString(): string {
        return `The participants have been shuffled!`;
    }
}

export default new NotificationService();