import Config from "../Config/Config";
import Player from "../Player/Player";
import Server from "../main";
import Room from "./Room";

type RoomsType = {
    [key: string]: Room
}

export default class RoomManager {
    rooms: RoomsType;
    lastTs: number;
    accumulator: number; // Accumulator for time
    dtFixed: number; // Fixed delta time in milliseconds

    constructor() {
        this.rooms = {};
        this.lastTs = performance.now(); // Initialize with the current timestamp
        this.accumulator = 0;
        this.dtFixed = 1000 / Config.UPDATE_INTERVAL; // Fixed delta time based on the configured update interval
        setInterval(this.update.bind(this), 1000 / Config.UPDATE_INTERVAL); // Call update at regular intervals
    }

    initRoom(roomId: string, byPlayer: Player) {
        let room = this.rooms[roomId];

        if (room != null) {
            if (room === byPlayer.currentRoom) return;

            return room.onPlayerJoin(byPlayer);
        }

        Server.logger.sendLog("INFO", `Loading room ${roomId}.`);
        room = new Room({ id: roomId });
        this.rooms[room.id] = room;
        room.onPlayerJoin(byPlayer);
    }

    getRoom(roomId: string): Room | null {
        const room = this.rooms[roomId];

        if (room == null) return null;
        else return room;
    }

    destroyRoom(roomId: string): void {
        if (!this.rooms.hasOwnProperty(roomId)) return;

        const room = this.rooms[roomId];
        Server.logger.sendLog("INFO", `Unloading room ${roomId}.`);
        delete this.rooms[roomId];
    }

    update(): void {
        const nowTs = performance.now();
        const elapsed = nowTs - this.lastTs; // Time since the last update
        this.lastTs = nowTs; // Update the last timestamp
        this.accumulator += elapsed; // Add to the accumulator

        // Perform fixed time step updates
        while (this.accumulator >= this.dtFixed) {
            for (let i in this.rooms) {
                const room = this.rooms[i];
                room.update((this.dtFixed / 1000), elapsed / 1000); // Update with fixed delta time
            }
            this.accumulator -= this.dtFixed; // Subtract the fixed time step from the accumulator
        }
    }
}
