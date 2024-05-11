import { BaseEvent } from "../BaseEvent";
import { Server } from "../../Server";
import { SocketClient } from "../../SocketClient";

export class Heartbeat implements BaseEvent {
    /**
     * Socket Client
     * @type {SocketClient}
     * @private
     */
    private client: SocketClient;

    /**
     * Event name
     * @type {string}
     * @public
     * @readonly
     */
    public readonly event: string;

    /**
     * @param {SocketClient} client Socket Client
     */
    constructor(client: SocketClient) {
        this.client = client;
        this.event = "heartbeat";
        client.events.set(this.event, this);
    }

    /**
     * Process Heartbeat
     * @param {number} state Client State
     */
    public process(state: number) {
        if (state == this.client.state) {
            this.client.state++;
            this.client.send(this.client.state, { event: this.event });
        } else if (state < this.client.state) {
            this.client.send(this.client.state, { event: this.event });
        } else {
            // Client is out of sync
            this.client.state = state;
            this.client.send(this.client.state, { event: this.event });
        }

        this.client.heartbeatTimestamp = Date.now();
    }
}
