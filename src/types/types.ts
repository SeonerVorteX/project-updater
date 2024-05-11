import { Socket } from "socket.io";
import { Handshake } from "socket.io/dist/socket";
import { PackageJson as PackageType } from "types-package-json";

export interface ServerConfigurations {
    key?: string;
    path: string;
    port: number | 8080;
    package: PackageJson;
    ignore?: string[];
    commands?: Command[];
    packages?: NPMPackage[];
}

export interface ClientConfigurations {
    host: string;
    auth?: AuthOptions;
    projectDir?: string;
    autoUpdate?: boolean;
    autoConnect?: boolean;
    autoStart?: boolean;
    autoRestart?: boolean;
    packageJsonPath?: string;
    reconnectionDelayMax?: number;
    reconnectionAttempts?: number;
    ignore?: string[];
    startScript?: string;
}

export interface PackageJson extends Omit<PackageType, "keywords" | "repository"> {
    keywords?: string | string[];
    repository?: {
        type?: string;
        url?: string;
        directory?: string;
    };
}

export interface SocketOptions {
    event: string;
}

export interface Command {
    prefix: string;
    args?: string[];
}
export interface NPMPackage {
    type?: "install" | "uninstall";
    name: string;
    version?: string | "@latest";
    dev?: boolean;
}

export interface AuthOptions {
    key?: string;
}

export interface Project {
    name: string;
    description?: string;
    version: string;
    files?: ProjectFile[];
    commands?: Command[];
    packages?: NPMPackage[];
}

export interface ProjectFile {
    name: string;
    path: string;
    basePath?: string;
    content?: string;
    dir?: boolean;
}

export interface FileSturcture {
    name: string;
    path: string;
    basePath?: string;
    content?: string;
    children?: FileSturcture[];
    dir?: boolean;
}

export interface DataPayload {
    status: number;
    message?: string;
    project?: Project;
    heartbeat_interval?: number;
}

export type ProjectStatus = 0 | 1 | 2 | 3;

export const ProjectStatuses = {
    0: "EMPTY",
    1: "UNKNOWN",
    2: "OUT_OF_DATE",
    3: "UPDATED",
};
