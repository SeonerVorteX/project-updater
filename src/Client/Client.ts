import {
    ClientConfigurations,
    Command,
    DataPayload,
    FileSturcture,
    NPMPackage,
    PackageJson,
    Project,
    ProjectFile,
    ProjectStatus,
    SocketOptions,
} from "../types/types";
import { DefaultClientOptions } from "../Utils/Defaults";
import { ClientLogger } from "./ClientLogger";
import { io, Socket } from "socket.io-client";
import * as SocketHandlers from "./Events/socket/index";
import * as IOHandlers from "./Events/io/index";
import { BaseEvent, BaseIOEvent } from "./Events/BaseEvent";
import { Collection } from "@discordjs/collection";
import { join, sep, resolve as resolvePath } from "path";
import {
    existsSync,
    lstatSync,
    mkdir,
    mkdirSync,
    readFile,
    readFileSync,
    readdir,
    readdirSync,
    rm,
    rmSync,
    unlink,
    writeFileSync,
} from "fs";
import { ProgressBar } from "../Utils/ProgressBar";
import { EventEmitter } from "events";
import { spawn } from "child_process";
import chalk from "chalk";
import { ClientException } from "../Errors/ClientException";
const Jetty = require("jetty");

/**
 * @example
 * import { Client } from "project-updater";
 *
 * const client = new Client("start", {
 *     host: "http://localhost:5000",
 *     auth: { key: "your-super-secret-key" },
 *     projectDir: "./your-project-path/",
 *     reconnectionDelayMax: 5000,
 *     autoConnect: false,
 * });
 *
 * client.connect();
 */

export class Client extends EventEmitter {
    /**
     * Client ready state
     * @type {boolean}
     * @public
     */
    public ready: boolean;

    /**
     * Project updated state
     * @type {boolean}
     * @public
     */
    public updated: boolean;

    /**
     * Socket ready state
     * @type {boolean}
     * @private
     */
    public socketReady: boolean;

    /**
     * Jetty
     * @type {string}
     * @private
     */
    private jetty: typeof Jetty;

    /**
     * Socket connection options
     * @type {ClientConfigurations}
     * @private
     */
    private options: ClientConfigurations & { startScript: string };

    /**
     * Project Path
     * @type {string}
     * @private
     * @readonly
     */
    private readonly projectPath: string;

    /**
     * Project Package
     * @type {PackageJson}
     * @public
     */
    public package?: PackageJson;

    /**
     * PackageJson Path
     * @type {string}
     * @private
     * @readonly
     */
    private readonly packageJsonPath: string;

    /**
     * Project Status
     * @type {number}
     * @private
     */
    private projectStatus: ProjectStatus;

    /**
     * Client Socket
     * @type {Socket}
     * @private
     */
    public socket: Socket;

    /**
     * @type {string} Client ID
     * @public
     */
    public id: string;

    /**
     * Client Logger
     * @type {ClientLogger}
     * @public
     */
    public logger: ClientLogger;

    /**
     * @type {number}
     * @public
     */
    public connectedTimestamp: number;

    /**
     * @type {Collection<string, BaseEvent>}
     * @public
     */
    public events: Collection<string, BaseEvent>;

    /**
     * @type {boolean}
     * @public
     */
    public reconnecting: boolean;

    /**
     * @type {number}
     * @public
     */
    public attempts: number;

    /**
     * @type {number}
     * @public
     */
    public state: number;

    /**
     * Project
     * @type {Project}
     * @public
     */
    public project?: Project;

    /**
     * @type {NodeJS.Timeout}
     * @public
     */

    public heartbeatInterval?: NodeJS.Timeout;

    /**
     * @param {string} startScript The npm script that will run after the project is updated.
     * @param {ClientConfigurations} options Client configurations
     */
    constructor(startScript: string = "", options: ClientConfigurations) {
        super();

        if (!startScript) throw new ClientException("startScript is required");
        if (!options) throw new ClientException("options is required");
        if (!options.host) throw new ClientException("options.host is required");

        Object.assign(options, DefaultClientOptions, options, { startScript });

        this.ready = false;
        this.socketReady = false;
        this.reconnecting = false;
        this.updated = false;
        this.jetty = new Jetty(process.stdout);
        this.options = options as ClientConfigurations & { startScript: string };
        this.projectPath = resolvePath(process.cwd() + sep + "project");
        this.projectStatus = 0;

        if (options?.projectDir) {
            this.projectPath = resolvePath(process.cwd() + sep + options.projectDir);
        }

        this.packageJsonPath = join(this.projectPath, "package.json");

        if (options?.packageJsonPath) {
            this.packageJsonPath = join(this.projectPath, options.packageJsonPath);
        }

        if (!existsSync(this.projectPath)) {
            mkdir(this.projectPath, (_) => {
                console.error(_);
            });
        }

        if (existsSync(this.packageJsonPath)) {
            this.projectStatus = 1;
            this.package = JSON.parse(readFileSync(this.packageJsonPath, { encoding: "utf-8" }));
        }

        const { host } = this.options;
        this.socket = io(host, this.options);

        this.id = this.socket.id;
        this.logger = new ClientLogger("[Updater-Client]", this);

        this.socket.once("connect", () => {
            this.socketReady = true;
            this.setId(this.socket.id);
            this.logger.info(`Connection Authenticating (${this.id})`);
            this.loadEvents();
        });

        this.socket.on("connect_error", () => {
            if (!this.socketReady) {
                this.logger.error("Connection Error: Server is not available");
                if (!this.reconnecting) {
                    if (this.options.autoStart) {
                        this.socket.disconnect();
                        this.emit("unready");
                        this.logger.warn(`Starting project without checking update`);
                        this.startProject();
                    } else {
                        this.socket.disconnect();
                        this.emit("unready");
                        this.emit("start");
                    }
                }

                const maxAttempts = this.options.reconnectionAttempts || 10;
                if (this.attempts >= maxAttempts) {
                    this.logger.error("Connection Error: Maximum attempts reached");
                    if (this.options.autoStart) {
                        this.logger.warn(`Starting project without checking update`);
                        this.startProject();
                    } else {
                        this.socket.disconnect();
                        this.emit("unready");
                        this.emit("start");
                    }
                }
            }
        });

        this.on("ready", () => {
            this.ready = true;
            if (this.options.autoUpdate) this.startProject();
        });

        this.connectedTimestamp = Date.now();

        this.events = new Collection<string, BaseEvent>();

        this.attempts = 0;

        this.state = 0;
    }

    /**
     * @param {string} id The id of the client
     * @public
     */
    public setId(id: string): void {
        this.id = id;
    }

    /**
     * Connect to the server
     * @public
     */
    public connect(): Promise<Client> {
        if (!this.options.autoConnect) this.socket.connect();
        return new Promise((resolve, reject) => {
            this.once("ready", () => {
                resolve(this);
            });
            this.once("unready", () => {
                resolve(this);
            });
        });
    }

    /**
     * Loads server events
     * @public
     */
    public loadEvents(): void {
        Object.values(IOHandlers).forEach((h) => {
            let handler: BaseIOEvent = new h(this);
            this.socket.io.on(handler.event, () => handler.process());
        });
        Object.values(SocketHandlers).forEach((h) => {
            let handler: BaseEvent = new h(this);
            this.socket.on(handler.event, (...args) => handler.process(...args));
        });
    }

    /**
     * Send a message to Socket
     * @param {any} data Message data
     * @param {Object} options Message options
     */
    public send(data: any, options: SocketOptions, callback?: (...args: any) => any | void): void {
        this.socket.emit(options.event, data);
        if (callback) this.socket.once(options.event, callback);
    }

    /**
     * Heartbeat ping
     * @param {number} interval Heartbeat interval
     */
    public heartbeat(interval: number = 60000) {
        this.heartbeatInterval = setInterval(() => {
            this.send(this.state, { event: "heartbeat" }, (state) => {
                this.state = state;
            });
        }, interval);
    }

    /**
     * @param {number} ms Timeout in milliseconds
     * @returns {Promose<void>} Promise
     */
    private wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    public async startProject(): Promise<void> {
        // TODO: Disconnect socket when project is started
        const { autoUpdate, autoStart } = this.options;

        if (this.ready) {
            if (autoUpdate && !this.updated) {
                this.logger.info(`Project: ${this.project?.name}@${this.project?.version}`);
                this.logger.info(`Checking for updates...`);
                this.send(this.id, { event: "checkVersion" }, async (data: DataPayload) => {
                    if (data.status === 200) {
                        if (this.package?.version !== data.message) {
                            this.logger.warn(`New version available: ${data.message}`);
                            this.logger.info(`Updating project...`);
                            return await this.Update();
                        } else {
                            this.projectStatus = 3;
                            this.updated = true;
                            this.logger.info(`Project is up to date`);

                            if (autoStart) return await this._startProject();
                            else this.emit("start");
                        }
                    } else {
                        this.logger.error(`Failed to check for updates`);
                        this.updated = true;
                        if (autoStart) return await this._startProject(true);
                        else this.emit("start");
                    }
                });
            } else {
                return await this._startProject(true);
            }
        } else if (!this.socketReady) {
            if (this.projectStatus >= 1) {
                this.logger.info(`Project: ${this.package?.name}@${this.package?.version}`);
                if (autoUpdate) this.logger.warn(`Project updates are not available`);
                /* TODO: if (autoStart)*/ return await this._startProject(true);
            } else {
                this.logger.error(
                    'There is no identified project. Please check if "package.json" exists in the project directory'
                );
            }
        }
    }

    /**
     * Update Project
     * @public
     */
    async Update(): Promise<void> {
        if (this.ready) {
            await this.wait(2000);
            this._update().then(async ({ commands, packages }) => {
                if (packages) await this.handlePackages(packages);
                if (commands) await this.handleCommands(commands);

                this.updated = true;
                if (this.options.autoStart) return this._startProject().catch(() => {});
                else this.emit("start");
            });
        } else {
            this.once("ready", () => {
                this._update().then(async ({ commands, packages }) => {
                    if (packages) await this.handlePackages(packages);
                    if (commands) await this.handleCommands(commands);

                    this.updated = true;

                    if (this.options.autoStart) return this._startProject().catch(() => {});
                    else this.emit("start");
                });
            });
        }
    }

    private async _update(): Promise<{ commands?: Command[]; packages?: NPMPackage[] }> {
        return new Promise<{ commands?: Command[]; packages?: NPMPackage[] }>((resolve, reject) => {
            if (this.projectStatus == 0) {
                readdir(this.projectPath, (err, files) => {
                    if (err) {
                        this.logger.error(err.message);
                        reject(err);
                    }

                    if (files.length > 0) {
                        files.forEach((file) => {
                            const filePath = join(this.projectPath, file);
                            rmSync(filePath, {
                                recursive: true,
                                force: true,
                            });
                        });
                    }
                });

                this.send(0, { event: "getProject" }, async (res: DataPayload) => {
                    if (res.status == 200 && res.project && res.project.files && res.project.files.length) {
                        const { name, description, version, files, commands, packages } = res.project;

                        this.project = { name, description, version };
                        let progressBar = new ProgressBar(this, this.jetty);

                        this.jetty.clear();
                        this.jetty.moveTo([0, 0]);
                        this.logger.info(`Version ${version} is available`);
                        this.logger.info("Completing last stuffs...");

                        let addedFile = 0,
                            addedDir = 0,
                            removed = 0,
                            updated = 0,
                            total = 0;

                        for (let file of files) {
                            let filePath = join(this.projectPath, file.path);

                            if (file.dir) {
                                if (!existsSync(filePath)) addedDir++;
                            } else {
                                addedFile++;
                            }
                        }

                        let current = 0;
                        total = addedFile + addedDir;
                        this.logger.info(`Updating files...\n`);
                        progressBar.bar(current, total, 50, {
                            start: chalk.white("Loading..."),
                            line: 4,
                        });
                        await this.wait(2000);

                        for (let i = 0; i < files.length; i++) {
                            let file = files[i];
                            // let fileName = file.name;
                            let filePath = join(this.projectPath, file.path);
                            let fileContent = file.content;

                            if (!file.dir) {
                                current++;
                                if (fileContent) writeFileSync(filePath, fileContent);
                                else writeFileSync(filePath, "");
                                progressBar.bar(current, total, 50, {
                                    start: `File Added: ${file.path.replaceAll("\\", "/")}\n`,
                                    line: 4,
                                });
                            } else {
                                current++;
                                mkdirSync(filePath);
                                progressBar.bar(current, total, 50, {
                                    start: `Directory Added: ${file.path.replaceAll("\\", "/")}\n`,
                                    line: 4,
                                });
                            }
                            await this.wait(100);
                        }

                        console.log("\n\n");
                        this.logger.info(`Project updated to version ${version}`);
                        this.logger.info(
                            `${addedFile} file added, ${addedDir} directory added ${removed} file removed, ${updated} file updated`
                        );

                        this.projectStatus = 3;

                        resolve({ packages, commands });
                    } else {
                        reject(this.logger.error("Something went wrong"));
                    }
                });
            } else if (this.projectStatus == 1) {
                readFile(this.packageJsonPath, "utf-8", (err, data) => {
                    if (err) {
                        this.logger.error(err.message);
                        reject(err);
                    }

                    try {
                        const json = JSON.parse(data);
                        let version = json.version;

                        if (this.project?.version == version) {
                            this.projectStatus = 3;
                            this.logger.info(`Project is up to date (version ${this.project?.version})`);
                        } else {
                            this.projectStatus = 3;
                            this.logger.info(`New version found: ${version} => ${this.project?.version}`);
                            this.logger.info(`Updating project...`);

                            this.send(1, { event: "getProject" }, async (res: DataPayload) => {
                                if (res.status == 200 && res.project && res.project.files && res.project.files.length) {
                                    const { name, description, version, files, packages, commands } = res.project;

                                    this.project = {
                                        name,
                                        description,
                                        version,
                                    };
                                    let progressBar = new ProgressBar(this, this.jetty);

                                    this.jetty.clear();
                                    this.jetty.moveTo([0, 0]);
                                    this.logger.info(`Version ${version} is available`);
                                    this.logger.info("Completing last stuffs...");

                                    let addedFiles: ProjectFile[] = [],
                                        removedFiles: FileSturcture[] = [],
                                        updatedFiles: ProjectFile[] = [],
                                        ignoredFiles: ProjectFile[] = [],
                                        currentFiles: ProjectFile[] = [];

                                    readdirSync(this.projectPath)
                                        .filter((file) => file !== "node_modules" && file !== "package-lock.json")
                                        .forEach((file) => this.stat(this.projectPath, file, currentFiles));

                                    for (let file of files) {
                                        let filePath = file.path,
                                            fileName = file.name,
                                            fileContent = file.content;
                                        if (file.dir) {
                                            if (currentFiles.every((f) => f.path !== filePath)) {
                                                addedFiles.push(file);
                                            }
                                        } else {
                                            if (currentFiles.every((f) => f.path !== filePath)) {
                                                addedFiles.push(file);
                                            } else {
                                                let currentFile = currentFiles.find((f) => f.path === filePath);
                                                if (currentFile?.content !== fileContent) {
                                                    if (this.options.ignore?.includes(fileName))
                                                        ignoredFiles.push(file);
                                                    else updatedFiles.push(file);
                                                }
                                            }
                                        }
                                    }

                                    for (let file of currentFiles) {
                                        let filePath = file.path;
                                        if (files.every((f) => f.path !== filePath)) {
                                            if (file.dir) {
                                                let children: FileSturcture[] = [];
                                                // TODO: Check if the child is ignored
                                                readdirSync(file.basePath!).forEach((f) =>
                                                    this.stat(file.basePath!, f, children)
                                                );
                                                removedFiles.push({
                                                    name: file.name,
                                                    path: file.path,
                                                    basePath: file.basePath,
                                                    dir: file.dir,
                                                    children,
                                                });
                                            } else {
                                                if (this.options.ignore?.includes(file.name)) ignoredFiles.push(file);
                                                else {
                                                    removedFiles.push({
                                                        name: file.name,
                                                        path: file.path,
                                                        basePath: file.basePath,
                                                        content: file.content,
                                                    });
                                                }
                                            }
                                        }
                                    }

                                    removedFiles = removedFiles.filter(
                                        (f) => !removedFiles.some((r) => r.children?.some((c) => c.name === f.name))
                                    );

                                    let current = 1,
                                        total = addedFiles.length + updatedFiles.length + removedFiles.length;
                                    this.logger.info(`Updating files...\n`);
                                    progressBar.bar(0, total, 50, {
                                        start: chalk.white("Loading..."),
                                        line: 4,
                                    });
                                    await this.wait(2500);

                                    for (let file of addedFiles) {
                                        let filePath = join(this.projectPath, file.path);
                                        if (file.dir) {
                                            mkdirSync(filePath);
                                            progressBar.bar(
                                                current++,
                                                total,
                                                50,
                                                {
                                                    start: `Directory Added: ${file.path.replaceAll("\\", "/")}\n`,
                                                    line: 4,
                                                },
                                                file.name
                                            );
                                        } else {
                                            writeFileSync(filePath, file.content || "");
                                            progressBar.bar(
                                                current++,
                                                total,
                                                50,
                                                {
                                                    start: `File Added: ${file.path.replaceAll("\\", "/")}\n`,
                                                    line: 4,
                                                },
                                                file.name
                                            );
                                        }
                                        await this.wait(100);
                                    }

                                    for (let file of updatedFiles) {
                                        // TODO: Update directory name
                                        let filePath = join(this.projectPath, file.path);
                                        writeFileSync(filePath, file.content || "");
                                        progressBar.bar(
                                            current++,
                                            total,
                                            50,
                                            {
                                                start: `File Added: ${file.path.replaceAll("\\", "/")}\n`,
                                                line: 4,
                                            },
                                            file.name
                                        );
                                        await this.wait(100);
                                    }

                                    for (let file of removedFiles) {
                                        let filePath = join(this.projectPath, file.path);
                                        if (file.dir) {
                                            rmSync(filePath, {
                                                recursive: true,
                                                force: true,
                                            });
                                            progressBar.bar(
                                                current++,
                                                total,
                                                50,
                                                {
                                                    start: `Directory Removed: ${file.path.replaceAll("\\", "/")}\n`,
                                                    line: 4,
                                                },
                                                file.name
                                            );
                                        } else {
                                            unlink(filePath, (_) => {});
                                            progressBar.bar(
                                                current++,
                                                total,
                                                50,
                                                {
                                                    start: `File Removed: ${file.path.replaceAll("\\", "/")}\n`,
                                                    line: 4,
                                                },
                                                file.name
                                            );
                                        }
                                        await this.wait(100);
                                    }

                                    console.log("\n\n");
                                    this.logger.info(`Project updated to version ${version}`);
                                    this.logger.info(
                                        // FIXME: Removed files length
                                        `${addedFiles.length} file added, ${removedFiles.length} file removed, ${updatedFiles.length} file updated` +
                                            (ignoredFiles.length ? `, ${ignoredFiles.length} file ignored` : "")
                                    );

                                    this.projectStatus = 3;
                                    resolve({ packages, commands });
                                } else {
                                    reject(this.logger.error("Something went wrong"));
                                }
                            });
                        }
                    } catch (parseErr: any) {
                        this.logger.error(parseErr.message);
                        reject(parseErr);
                    }
                });
            }
        });
    }

    private stat(path: string, file: string, arr: ProjectFile[]) {
        if (lstatSync(join(path, file)).isDirectory()) {
            arr.push({
                name: file,
                basePath: join(path, file),
                path: join(path, file).replace(this.projectPath + "\\", ""),
                dir: true,
            });
            readdirSync(join(path, file))
                // TODO: .filter((file) => !this.options.ignore?.includes(file))
                .forEach((f) => this.stat(join(path, file) + "/", f, arr));
        } else if (lstatSync(join(path, file).replace("/", "")).isFile()) {
            const content = readFileSync(join(path, file), { flag: "r", encoding: "utf-8" });
            arr.push({
                name: file,
                basePath: join(path, file),
                path: join(path, file).replace(this.projectPath + "\\", ""),
                content,
            });
        }
    }

    private async handlePackages(packages: NPMPackage[]): Promise<void> {
        if (packages && packages.length) {
            this.logger.info(`Installing packages...\n`);
            // TODO: if packages.length > 1 => download all packages at once
            for (let pkg of packages) {
                await new Promise<void>((resolve, reject) => {
                    let pkgName = pkg.name;
                    let pkgVersion = pkg.version || "latest";
                    let isDev = pkg.dev;
                    let operationType = pkg.type || "install";

                    this.logger.info(`Installing ${pkgName}...\n`);
                    try {
                        let child = spawn(
                            /^win/.test(process.platform) ? "npm.cmd" : "npm",
                            [operationType, `${pkgName}@${pkgVersion}`, isDev ? "--save-dev" : ""],
                            {
                                cwd: this.projectPath,
                                shell: true,
                            }
                        );

                        child.stdout.on("data", (data) => {
                            this.logger.info(data.toString());
                        });

                        child.stderr.on("data", (data) => {
                            this.logger.error(data.toString());
                        });

                        child.on("close", (code) => {
                            if (code === 0) {
                                this.logger.info(`Package ${pkgName} installed successfully`);
                                resolve();
                            } else {
                                this.logger.error(`Failed to install package ${pkgName}`);
                                reject();
                            }
                        });
                    } catch (_) {
                        this.logger.error("Something went wrong");
                        reject();
                    }
                });
            }
        }
    }

    private async handleCommands(commands: Command[]): Promise<void> {
        if (commands && commands.length) {
            this.logger.info(`Running commands...\n`);
            for (let cmd of commands) {
                await new Promise<void>((resolve, reject) => {
                    let prefix = cmd.prefix;
                    let args = cmd.args || [];

                    this.logger.info(`Running command: ${prefix} ${args.join(" ")}\n`);
                    try {
                        let child = spawn(prefix, args, {
                            cwd: this.projectPath,
                            shell: true,
                        });

                        child.stdout.on("data", (data) => {
                            console.log(data.toString());
                        });

                        child.stderr.on("data", (data) => {
                            console.log(data.toString());
                        });

                        child.on("close", (code) => {
                            if (code === 0) {
                                this.logger.info(`Command ${prefix} ${args.join(" ")} executed successfully`);
                                resolve();
                            } else {
                                this.logger.error(`Failed to execute command ${prefix} ${args.join(" ")}`);
                                reject();
                            }
                        });
                    } catch (_) {
                        this.logger.error("Something went wrong");
                        reject();
                    }
                });
            }
        }
    }

    /**
     * Start Project
     * @param {boolean} force Force start project
     * @private
     */
    private _startProject(force?: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.projectStatus >= 2 || force) {
                let startScript = this.options.startScript || "start";
                this.logger.info(`Starting project with script: npm run ${startScript}\n`);

                if (this.package?.scripts && !this.package.scripts[startScript]) {
                    this.logger.error(`Script ${startScript} not found in package.json`);
                    return reject();
                }

                let child = spawn(/^win/.test(process.platform) ? "npm.cmd" : "npm", ["run", startScript], {
                    cwd: this.projectPath,
                    shell: true,
                });

                child.stdout.on("data", (data) => {
                    console.log(data.toString());
                });

                child.stderr.on("data", (data) => {
                    console.error(data.toString());
                });

                child.on("close", (code) => {
                    if (code === 0) {
                        this.logger.info(`Project closed with no errors`);
                        if (this.options.autoRestart) {
                            this.logger.info(`Restarting project...`);
                            this._startProject(force);
                        } else resolve();
                    } else {
                        this.logger.error(`Project occured an error`);
                        if (this.options.autoRestart) {
                            this.logger.info(`Restarting project...`);
                            this._startProject(force);
                        } else reject();
                    }
                });
            } else {
                this.logger.error("Project is not ready to start");
                reject();
            }
        });
    }
}
