import { Socket } from "socket.io";
import { BaseIOEvent } from "../BaseEvent";
import { Client } from "../../Client";

export class Reconnect implements BaseIOEvent {
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
    public readonly event: "reconnect";

    /**
     * @param {Client} client Client
     */
    constructor(client: Client) {
        this.client = client;
        this.event = "reconnect";
        this.client.events.set(this.event, this);
    }

    public process() {
        this.client.logger.info(`Reconnected to server, total attempt: ${this.client.attempts}`);
        this.client.reconnecting = false;
        this.client.attempts = 0;
    }
}
