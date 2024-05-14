/// <reference path="./types.d.ts" />

import { Collection } from "@discordjs/collection";
import { Server as SocketServer } from "socket.io";
import { Socket } from "socket.io-client";
import Jetty from "jetty";

declare module "project-updater" {
    export class Server {
        private _configs: ServerConfigurations;
        private io: SocketServer;
        private readonly projectPath: string;

        /** Collection of connected clients */
        public clients: Collection<string, SocketClient>;
        public events: Collection<string, ServerBaseEvent>;
        public logger: ServerLogger;
        public heartbeat_interval: number;

        public constructor(config: ServerConfigurations);

        /** Start the server */
        public start(): void;
        public unAuthorize(client: SocketClient, event: string): void;
        public loadEvents(): void;
        public sendProject(client: SocketClient, status: number): void;
        private stat(path: string, file: string, arr: Array<object>): void;
    }

    export class Client {
        private jetty: typeof Jetty;
        private host: string;
        private options: ClientConfigurations & { startScript: string };
        private projectStatus: number;
        private readonly packageJsonPath: string;
        public ready: boolean;
        public updated: boolean;
        public socketReady: boolean;
        public package?: PackageJson;
        public socket: Socket;
        public id: string;
        public logger: ClientLogger;
        public connectedTimestamp: number;
        public events: Collection<string, ClientBaseEvent>;
        public reconnecting: boolean;
        public attempts: number;
        public state: number;
        public project?: Project;
        public heartbeatInterval?: NodeJS.Timeout;

        public constructor(startScript: string, options: ClientConfigurations);
        public setId(id: string): void;

        /** Connect to the server */
        public connect(): Promise<Client>;
        public loadEvents(): void;
        public send(data: any, options: SocketOptions, callback?: (...args: any) => any | void): void;
        public heartbeat(interval: number): void;
        private wait(ms: number): Promise<void>;

        /** Start the project */
        public startProject(): Promise<void>;

        /** Update the project */
        public Update(): Promise<void>;
        private _update(): Promise<{ commands?: Command[]; packages?: NPMPackage[] }>;
        private stat(path: string, file: string, arr: ProjectFile[]);
        private handlePackages(packages: NPMPackage[]): Promise<void>;
        private handleCommands(packages: Command[]): Promise<void>;
        private _startProject(force: true): Promise<void>;
    }
}
