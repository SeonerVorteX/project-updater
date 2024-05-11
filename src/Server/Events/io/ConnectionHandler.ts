import { Socket } from "socket.io";
import { BaseEvent } from "../BaseEvent";
import { Server } from "../../Server";
import { SocketClient } from "../../SocketClient";
import { DataPayload } from "../../../types/types";

export class ConnectionHandler implements BaseEvent {

    /**
     * Main server
     * @type {Server}
     * @private
     */
    private server: Server;
    /**
     * Event name
     * @type {string}
     * @public
     * @readonly
     */
    public readonly event: string;

    /**
     * @param {Server} server Main server
     */
    constructor(server: Server) {
        this.server = server;
        this.event = "connection";
        server.events.set(this.event, this);
    }

    /**
     * @param {Socket} socket Connected Socket
     */
    public process(socket: Socket) {
        let { key } = socket.handshake.auth;
        let client = new SocketClient(this.server, socket);
        this.server.logger.info(`Connection Request: Authenticating (${client.id})`)
        if (client.authenticate()) {
            this.server.clients.set(client.id, client);
            this.server.logger.info(`Connection Request: Client authenticated successfuly (${client.id})`);
            client.send({
                status: 200,
                message: "OK",
                heartbeat_interval: this.server.heartbeat_interval,
                project: {
                    name: this.server._configs.package.name,
                    description: this.server._configs.package.description,
                    version: this.server._configs.package.version
                }
            } as DataPayload, {
                event: this.event
            });
            
            client.loadEvents();
        } else {
            this.server.unAuthorize(client, this.event);
            this.server.logger.warn(`Connection Request: Client unauthenticated (401) (${client.id})`);
        }
    }
}