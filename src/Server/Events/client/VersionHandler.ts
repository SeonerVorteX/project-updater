import { BaseEvent } from "../BaseEvent";
import { Server } from "../../Server";
import { SocketClient } from "../../SocketClient";

export class VersionHandler implements BaseEvent {

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
        this.event = "checkVersion";
        client.events.set(this.event, this);
    }

    public process() {
        let cli = this.client.server.clients.get(this.client.id) || new SocketClient(this.client.server, this.client.socket);

        if (cli.authenticate()) {
            cli.send({
                status: 200,
                message: this.client.server._configs.package.version,
            }, { event: this.event });
        } else {
            this.client.server.unAuthorize(cli, this.event);
        }
    }
}