export interface BaseEvent {
    event: string;
    process: (...args: any[]) => void;
}

export interface BaseIOEvent {
    event: "reconnect" | "reconnect_attempt";
    process: (...args: any[]) => void;
}
