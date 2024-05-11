import { Logger } from "../Utils/Logger";
import { Client } from "./Client";

export class ClientLogger extends Logger {
    /**
     * @type {Client}
     * @private
     */
    private client: Client;

    /**
     * Outputs the client logs
     * @param {Client} client 
     */
    constructor(header: string, client: Client) {
        super(header);
        this.client = client;
    }


}