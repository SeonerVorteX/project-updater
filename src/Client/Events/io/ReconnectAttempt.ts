import { Socket } from "socket.io";
import { BaseIOEvent } from "../BaseEvent";
import { Client } from "../../Client";

export class ReconnectAttempt implements BaseIOEvent {
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
    public readonly event: "reconnect_attempt";

    /**
     * @param {Client} client Client
     */
    constructor(client: Client) {
        this.client = client;
        this.event = "reconnect_attempt";
        this.client.events.set(this.event, this);
    }

    public process() {
        this.client.reconnecting = true;
        this.client.attempts++;
        this.client.logger.warn(`Attempting to reconnect (${this.client.attempts})`);
    }
}
