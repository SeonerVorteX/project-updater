import { Socket } from "socket.io";
import { BaseEvent } from "../BaseEvent";
import { Client } from "../../Client";

export class Disconnect implements BaseEvent {
    /**
     * Client
     * @type {Client}
     * @private
     */
    private client: Client;
    /**
     * Event name
     * @type {string}
     * @public
     * @readonly
     */
    public readonly event: string;

    /**
     * @param {Client} client Client
     */
    constructor(client: Client) {
        this.client = client;
        this.event = "disconnect";
        this.client.events.set(this.event, this);
    }

    public process() {
        this.client.logger.error("Client disconnected!");
        this.client.ready = false;
        this.client.socketReady = false;
        clearInterval(this.client.heartbeatInterval);
    }
}
