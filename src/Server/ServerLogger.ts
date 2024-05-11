import { Logger } from "../Utils/Logger";
import { Server } from "./Server";

export class ServerLogger extends Logger {
    /**
     * @type {Server}
     * @private
     */
    private server: Server;
    
    /**
     * Outputs the server logs
     * @param {Server} server 
     */
    constructor(header: string, server: Server) {
        super(header);
        this.server = server;
    }
}