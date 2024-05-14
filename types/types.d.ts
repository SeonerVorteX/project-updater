/// <reference path="./package.d.ts" />

import { Collection } from "@discordjs/collection";
import { Socket } from "socket.io";

declare module "project-updater" {
    interface ServerConfigurations {
        /** The secret key to protect your project. */
        key?: string;

        /** The path to your project directory.  */
        path: string;

        /**
         * The port to listen on.
         * @default 8080
         */
        port?: number;

        /** The project package.json file.  */
        package: PackageJson;

        /**
         * The files and directories that will be ignored when updating the project.
         * @default ["node_modules","package-lock.json"]
         */
        ignore?: string[];

        /**
         *  The commands that will run on the client side after the client updates the project.
         * @example [{ prefix: "npm", args: ["install"] }]
         */
        commands?: Command[];

        /**
         * The npm packages that will be installed on the client side after the client updates the project.
         * @example [{ type: "install", name: "express", version: "latest" }]
         */
        packages?: NPMPackage[];
    }

    interface ClientConfigurations {
        /**
         * The host server URL.
         * @example "http://localhost:8080"
         */
        host: string;

        /** Authentication options */
        auth?: AuthOptions;

        /**
         * The project directory
         * @default "/project"
         */
        projectDir?: string;

        /**
         * Should we automatically update the project when a new version is available?
         * @default true
         */
        autoUpdate?: boolean;

        /**
         * Should we automatically connect to the host server?
         * @default true
         */
        autoConnect?: boolean;

        /**
         * Should we automatically start the project after updating?
         * @default true
         */
        autoStart?: boolean;

        /**
         * Should we automatically restart the project when it crashes?
         * @default true
         */
        autoRestart?: boolean;

        /**
         * The path to the project package.json file.
         * @default "/package.json"
         */
        packageJsonPath?: string;

        /**
         * The maximum reconnection delay between reconnection attempts in milliseconds.
         * @default 10000
         */
        reconnectionDelayMax?: number;

        /**
         * The maximum reconnection attempts.
         * @default 10
         */
        reconnectionAttempts?: number;

        /**
         * The files that will be ignored when updating the project (Only files can be ignored for now, not directories).
         * @default ["package-lock.json"]
         */
        ignore?: string[];
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
        /** The secret key to connect to the host server. */
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
