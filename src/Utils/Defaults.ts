import { ClientConfigurations, ServerConfigurations } from "../types/types";

export const DefaultServerOptions = {
    port: 8080,
    ignore: ["node_modules", "package-lock.json"],
} as ServerConfigurations;

export const DefaultClientOptions = {
    host: "http://localhost:8080",
    autoUpdate: true,
    autoConnect: true,
    autoStart: true,
    autoRestart: true,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 10,
    ignore: ["package-lock.json"],
} as ClientConfigurations;

export const HeartbeatInterval = 60000;
