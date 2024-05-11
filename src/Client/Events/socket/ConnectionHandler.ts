import { BaseEvent } from "../BaseEvent";
import { Client } from "../../Client";
import { DataPayload } from "../../../types/types";

export class ConnectionHandler implements BaseEvent {
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
        this.event = "connection";
        this.client.events.set(this.event, this);
    }

    public process(data: DataPayload) {
        if (data.status == 200) {
            this.client.logger.info(`Connection authenticated successfully`);
            this.client.project = data.project;
            this.client.heartbeat(data.heartbeat_interval);
            this.client.emit("ready");
        } else {
            this.client.logger.error(
                `Authentication failed. Status ${data.status}${
                    data.message ? `: ${data.message}` : ""
                }`
            );
        }

        this.client.reconnecting = false;
    }
}
