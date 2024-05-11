import { ServerLogger } from "./ServerLogger";
import { SocketClient } from "./SocketClient";
import { Collection } from "@discordjs/collection";
import { Server as SocketServer } from "socket.io";
import { DataPayload, ProjectFile, ServerConfigurations } from "../types/types";
import * as IOHandlers from "./Events/io/index";
import { BaseEvent } from "./Events/BaseEvent";
import chalk from "chalk";
import { existsSync, lstatSync, mkdir, readFileSync, readdirSync } from "fs";
import { join, sep } from "path";

/**
 * @example
 * import { Server } from "project-updater";
 * import packageJson from "./project/package.json";
 *
 * const server = new Server({
 *     package: packageJson,
 *     port: 8080,
 *     key: "your-super-secret-key",
 *     path: "/your-project-path/",
 *     ignore: ["node_modules", "logs", "package-lock.json"],
 * });
 *
 * server.start();
 */
export class Server {
    /**
     * @type {ServerConfigurations}
     * @public
     */
    public _configs: ServerConfigurations;

    /**
     * @type {SocketServer}
     * @private
     */
    private io: SocketServer;

    /**
     * Project Path
     * @type {string}
     * @private
     * @readonly
     */
    private readonly projectPath: string;

    /**
     * @type {Collection<string, SocketClient>}
     * @public
     */
    public clients: Collection<string, SocketClient>;

    /**
     * @type {Collection<string, BaseEvent>}
     * @public
     */
    public events: Collection<string, BaseEvent>;

    /**
     * Server Logger
     * @type {ServerLogger}
     * @public
     */
    public logger: ServerLogger;

    /**
     * Client Heartbeat Interval
     * @type {number}
     * @public
     */
    public heartbeat_interval: number;

    /**
     * @param {ServerConfigurations} configurations Server configurations
     * @param {string} [configurations.key] Server authentication key
     * @param {string} [configurations.host] Server host slug
     * @param {number} [configurations.port] Server port (default 8080)
     * @param {PackageJson} [configurations.package] Package file
     * @param {string[]} [configurations.ignore] Ignored files and directories
     * @param {Command[]} [configurations.commands] Shell commands to execute
     * @param {Package[]} [configurations.packages] NPM packages to install
     */
    constructor(configurations: ServerConfigurations) {
        configurations = {
            ignore: ["node_modules", "package-lock.json"],
            ...configurations,
        };

        this.io = new SocketServer({ serveClient: false });

        this._configs = configurations;

        this.projectPath = process.cwd() + sep + configurations.path;

        if (!existsSync(this.projectPath)) {
            mkdir(this.projectPath, (err) => {});
        }

        this.clients = new Collection<string, SocketClient>();

        this.events = new Collection<string, BaseEvent>();

        this.logger = new ServerLogger("[Updater-Server]", this);

        this.heartbeat_interval = 10000;

        this.loadEvents();

        setInterval(() => {
            this.clients.forEach((client) => {
                if (Date.now() - client.heartbeatTimestamp > this.heartbeat_interval + 2500) {
                    this.logger.warn(`Heartbeat Timeout: (${client.id})`);
                    client.disconnect();
                }
            });
        }, this.heartbeat_interval + 5000);

        // this.io.use((socket, next) => {
        //     let { key } = socket.handshake.auth;
        //     if (this._configs.key && (!key || key !== this._configs.key)) next(new Error("ServerException: Invalid key"));
        //     else next();
        // });
    }

    /**
     * Starts the server
     * @public
     */
    public start(): void {
        this.io.listen(this._configs.port || 8080);
        this.logger.info("Server started, listening on port " + chalk.green(this._configs.port));
        this.logger.info(`Project Version: ${this._configs.package.version}`);
    }

    /**
     * Unauthorizes the client
     * @param {SocketClient} client
     * @param {string} event
     * @public
     */
    public unAuthorize(client: SocketClient, event: string): void {
        client.send(
            {
                status: 401,
                message: "Unauthorized",
            },
            { event }
        );
        client.disconnect();
    }

    /**
     * Loads server events
     * @public
     */
    public loadEvents(): void {
        Object.values(IOHandlers).forEach((h) => {
            let handler: BaseEvent = new h(this);
            this.io.on(handler.event, (...args) => handler.process(...args));
        });
    }

    public sendProject(client: SocketClient, status: number) {
        this.logger.info(`Project Request: (${client.id})`);

        let updatePaths = new Array();
        let updateFiles: ProjectFile[] = new Array();

        let files = readdirSync(this.projectPath).filter((file) => !this._configs.ignore?.includes(file));
        files.forEach((file) => this.stat(this.projectPath, file, updatePaths));

        for (let file of updatePaths) {
            let lastPath = file.path.split(this._configs.path.replaceAll("/", "\\"))[1];

            if (file.dir) updateFiles.push({ name: file.name, path: lastPath, dir: file.dir });
            else {
                const content = readFileSync(file.path, { encoding: "utf-8", flag: "r" });
                updateFiles.push({ name: file.name, path: lastPath, content });
            }
        }

        let { name, description, version } = this._configs.package;

        let commands = this._configs.commands || [];
        let packages = this._configs.packages || [];

        if (status == 0) commands.push({ prefix: "npm", args: ["install"] });

        client.send(
            {
                status: 200,
                project: {
                    name,
                    description,
                    version,
                    files: updateFiles,
                    commands,
                    packages,
                },
            } as DataPayload,
            {
                event: "getProject",
            }
        );
    }

    private stat(path: string, file: string, arr: Array<object>): void {
        if (lstatSync(join(path, file)).isDirectory()) {
            arr.push({ name: file, path: join(path, file), dir: true });
            readdirSync(join(path, file))
                .filter((file) => !this._configs.ignore?.includes(file))
                .forEach((f) => this.stat(join(path, file) + "/", f, arr));
        } else if (lstatSync(join(path, file).replace("/", "")).isFile()) {
            arr.push({ name: file, path: join(path, file) });
        }
    }
}
