/// <reference path="./package.d.ts" />

import { Collection } from "@discordjs/collection";
import { Socket } from "socket.io";

declare module "project-updater" {
    interface ServerConfigurations {
        /** Server key for authentication */
        key?: string;

        /** Project path */
        path: string;

        /** Port to listen */
        port: number | 8080;

        /** Package.json  */
        package: PackageJson;

        /**
         * Ignored files
         * @default ["node_modules","package-lock.json"]
         */
        ignore?: string[];

        /**
         * Commands to execute in client side
         * @example [{ prefix: "npm", args: ["install"] }]
         */
        commands?: Command[];

        /**
         * NPM packages to install in client side
         * @example [{ type: "install", name: "express", version: "latest" }]
         */
        packages?: NPMPackage[];
    }

    interface ClientConfigurations {
        /**
         * Host to connect
         * @example "ws://localhost:5000"
         */
        host: string;

        /** Authentication options */
        auth?: AuthOptions;

        /**
         * Project directory
         * @default "/project"
         */
        projectDir?: string;

        /**
         * Should we auto update the project?
         * @default true
         */
        autoUpdate?: boolean;

        /**
         * Should we auto connect to server?
         * @default true
         */
        autoConnect?: boolean;

        /**
         * Should we auto start the project?
         * @default true
         */
        autoStart?: boolean;

        /**
         * Should we auto restart the project?
         * @default true
         */
        autoRestart?: boolean;

        /**
         * Path of package.json
         * @default "/package.json"
         */
        packageJsonPath?: string;

        /**
         * Max delay between reconnection attempts
         * @default 10000
         */
        reconnectionDelayMax?: number;

        /**
         * Max number of reconnection attempts
         * @default 10
         */
        reconnectionAttempts?: number;

        /**
         * Ignored files
         * @default ["node_modules", "package-lock.json"]
         */
        ignore?: string[];

        /**
         * Start script for the project
         * @default "start" => "npm start"
         */
        startScript?: string;
    }

    interface PackageJson extends Omit<PackageJsonFile, "keywords" | "repository"> {
        keywords?: string | string[];
        repository?: {
            type?: string;
            url?: string;
            directory?: string;
        };
    }

    interface SocketOptions {
        event: string;
    }

    interface Command {
        /** Command prefix */
        prefix: string;

        /** Command arguments */
        args?: string[];
    }
    interface NPMPackage {
        /**
         * Type of the package
         * @default "install"
         */
        type?: "install" | "uninstall";

        /** Name of the package */
        name: string;

        /**
         * Version of the package
         * @default "latest"
         */
        version?: string | "latest";

        /**
         * Should we install it as dev dependency?
         * @default false
         */
        dev?: boolean;
    }

    interface AuthOptions {
        /** Authentication key */
        key?: string;
    }

    interface Project {
        name: string;
        description?: string;
        version: string;
        files?: ProjectFile[];
        commands?: Command[];
        packages?: NPMPackage[];
    }

    interface ProjectFile {
        name: string;
        path: string;
        basePath?: string;
        content?: string;
        dir?: boolean;
    }

    interface FileSturcture {
        name: string;
        path: string;
        basePath?: string;
        content?: string;
        children?: FileSturcture[];
        dir?: boolean;
    }

    interface DataPayload {
        status: number;
        message?: string;
        project?: Project;
        heartbeat_interval?: number;
    }

    type ProjectStatus = 0 | 1 | 2 | 3;

    interface Logger {
        header: string;

        constructor(header: string): void;
        info(message: string): void;
        warn(message: string): void;
        error(message: string): void;
    }

    interface ServerLogger extends Logger {
        server: Server;
    }

    interface ClientLogger extends Logger {
        client: Client;
    }

    interface SocketClient {
        id: string;
        socket: Socket;
        server: Server;
        authenticated: boolean;
        connectedTimestamp: number;
        heartbeatTimestamp: number;
        events: Collection<string, ServerBaseEvent>;
        state: number;

        constructor(server: Server, socket: Socket): void;
        authenticate(): boolean;
        send(data: any, options: SocketOptions): void;
        loadEvents(): void;
        disconnect(): void;
    }

    interface ServerBaseEvent {
        event: string;
        process: (...args: any[]) => void;
    }

    interface ClientBaseEvent {
        event: string;
        process: (...args: any[]) => void;
    }
}
