import { BaseEvent } from "../BaseEvent";
import { Server } from "../../Server";
import { SocketClient } from "../../SocketClient";

export class Disconnect implements BaseEvent {

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
        this.event = "disconnecting";
        client.events.set(this.event, this);
    }

    /**
     * @param {string} reason Disconnect reason
     */
    public process(reason: string) {
        this.client.server.logger.warn(`Client (${this.client.id}) disconnected${reason ? `, reason: ${reason}` : ''}`);
        this.client.server.clients.delete(this.client.id);
    }
}