import chalk from "chalk";

/**
 * @type {BaseException}
 */
export class BaseException extends Error {
    /**
     * @type {string}
     * @public
     * @readonly
     */
    public readonly name: string;

    /**
     * @param {string} message 
     * @constructor
     */
    constructor(message: string) {
        super(
            chalk.red(message),
        )
        this.name = "UpdaterException";
    }
}