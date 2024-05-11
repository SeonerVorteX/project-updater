import { Socket } from "socket.io";
import { Server } from "./Server";
import { SocketOptions } from "../types/types";
import * as ClientHandlers from './Events/client/index'
import { BaseEvent } from "./Events/BaseEvent";
import { Collection } from "@discordjs/collection";

export class SocketClient {
    /**
     * @type {string} Client ID
     * @public
     */
    public id: string;

    /**
     * @type {Socket}
     * @public
     */
    public socket: Socket;

    /**
     * @type {Server}
     * @public
     */
    public server: Server;

    /**
     * @type {boolean} 
     * @public
     */
    public authenticated: boolean;

    /**
     * @type {number}
     * @public
     */
    public connectedTimestamp: number;

    /**
     * @type {number}
     * @public
     */
    public heartbeatTimestamp: number;

    /**
     * @type {Collection<string, BaseEvent>}
     * @public
     */
    public events: Collection<string, BaseEvent>;

    /**
     * @type {number}
     * @public
     */
    public state: number;

    /**
     * @param {Server} server Main Server
     * @param {Socket} socket WebSocket
     */
    constructor(server: Server, socket: Socket) {
        
        this.id = socket.id;

        this.socket = socket;

        this.server = server;

        this.authenticated = false;

        this.connectedTimestamp = Date.now();

        this.heartbeatTimestamp = Date.now();

        this.events = new Collection<string, BaseEvent>();

        this.state = 0;

    }

    /**
     * Send a message to Socket
     * @param {any} data Message data
     * @param {Object} options Message options
     */
    public send(data: any, options: SocketOptions): void {
        this.socket.emit(options.event, data);
    }

    /**
     * @returns {boolean} Authentication status of client
     */

    public authenticate(): boolean {
        let { key } = this.socket.handshake.auth;
        if (this.server._configs.key && (!key || key !== this.server._configs.key)) return false;
        else {
            this.authenticated = true;
            return true;
        }
    }

    
    /**
     * Loads Client events
     * @public
     */
    public loadEvents(): void {
        Object.values(ClientHandlers).forEach(h => {
            let handler: BaseEvent = new h(this);
            this.socket.on(handler.event, (...args) => handler.process(...args));
        });
    }

    /**
     * Disconnect socket from server
     */
    public disconnect(): void {
        this.server.clients.delete(this.id);
        this.socket.disconnect(true);
    }

}