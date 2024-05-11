import { Client } from "../Client/Client";
import chalk from "chalk";
const Jetty = require("jetty");

export class ProgressBar {
    /**
     * Client instance
     * @type {Client}
     * @private
     */
    private client: Client;

    /**
     * Jetty instance
     * @type {typeof Jetty}
     * @private
     */
    private jetty: typeof Jetty;

    /**
     * Last Output Message
     * @type {string}
     * @private
     */
    private last_output: string;

    /**
     * @param {Client} client Client instance
     * @param {typeof Jetty} jetty Jetty instance
     */
    constructor(client: Client, jetty: typeof Jetty) {
        this.client = client;
        this.jetty = jetty;
        this.last_output = "";
    }

    public bar(
        current: number,
        total: number,
        width = 50,
        { start = "", end: End = "", complete = chalk.green("Completed!"), line = 0 } = {},
        file?: string
    ) {
        let fraction = current / total;
        let bar = Math.round(fraction * width > 1 ? fraction * width - 1 : 0);
        let spaces = Math.round(width - bar - 1);
        let end = fraction == 1 ? End : "";

        if (fraction == 1) {
            let length = this.last_output.length - complete.length;
            if (length > 0) {
                this.jetty.moveTo([line, 0]);
                this.jetty.text(`${complete}${" ".repeat(this.last_output.length)}`);
                this.jetty.moveTo([line + 1, 0]);
            } else {
                this.jetty.moveTo([line, 0]);
                this.jetty.text(complete);
                this.jetty.moveTo([line + 1, 0]);
            }
            this.jetty.text(
                `${chalk.yellow("Progress:")} ${chalk.blue(`[`)}${chalk.white(
                    `${bar ? "█".repeat(bar) : ""}${" ".repeat(spaces)}`
                )}${chalk.blue(`]`)} ${chalk.green(`${Math.round(fraction * 100)}%`)}${end}`
            );
        } else if (start) {
            if (this.last_output) {
                let length = this.last_output.length - start.length;
                if (length > 0) {
                    this.jetty.moveTo([line, 0]);
                    this.jetty.text(start.trim());
                    this.jetty.moveTo([line, start.trim().length]);
                    this.jetty.text("    ".repeat(length));
                } else {
                    this.jetty.moveTo([line, 0]);
                    this.jetty.text(start.trim());
                }
                this.last_output = start.trim();
            } else {
                this.jetty.text(start.trim());
                this.last_output = start.trim();
            }
            this.jetty.moveTo([line + 1, 0]);
            this.jetty.text(
                `${chalk.yellow("Progress:")}  ${chalk.blue(`[`)}${chalk.white(
                    `${bar ? "█".repeat(bar) : ""}${" ".repeat(spaces)}`
                )}${chalk.blue(`]`)} ${chalk.green(`${Math.round(fraction * 100)}%`)}${end}`
            );
        } else {
            this.jetty.moveTo([line, 0]);
            this.jetty.text(
                `${chalk.yellow("Progress:")} ${chalk.blue(`[`)}${chalk.white(
                    `${bar ? "█".repeat(bar) : ""}${" ".repeat(spaces)}`
                )}${chalk.blue(`]`)} ${chalk.green(`${Math.round(fraction * 100)}%`)}${end}`
            );
        }
    }
}
