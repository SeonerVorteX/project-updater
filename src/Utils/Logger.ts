import chalk from "chalk";

export class Logger {
    /**
     * @type {string}
     * @private
     */
    private header: string;

    /**
     * @param {String} header Logger Header
     */
    constructor(header: string) {
        this.header = header;
    }

    /**
     * Logging Information Messages
     * @param {string} message Information Message
     * @public
     */
    public info(message: string): void {
        console.info(chalk.green('(Info)') + ` ${chalk.cyan(this.header)} ${message}`);
    }

    /**
     * Logging Warning Messages
     * @param {string} message Warning Message
     * @public
     */
    public warn(message: string): void {
        console.warn(chalk.yellow('(Warn)') + ` ${chalk.cyan(this.header)} ${message}`);
    }

    /**
     * Logging Error Messages
     * @param {string} message Error Message
     * @public
     */
    public error(message: string): void {
        console.warn(chalk.red('(Error)') + ` ${chalk.cyan(this.header)} ${message}`);
    }

}