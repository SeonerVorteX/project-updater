import { Server } from "../Server";

export interface BaseEvent {
    event: string;
    process: (...args: any[]) => void;
}