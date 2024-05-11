import { BaseEvent } from "../BaseEvent";
import { SocketClient } from "../../SocketClient";

export class GetProject implements BaseEvent {
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
        this.event = "getProject";
        client.events.set(this.event, this);
    }

    /**
     * @param {string} version Project version
     */
    public process(status: number) {
        this.client.server.sendProject(this.client, status);
    }
}
