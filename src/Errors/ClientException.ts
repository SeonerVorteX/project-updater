import { BaseException } from "./BaseException";

/**
 * @type {ClientException}
 */
export class ClientException extends BaseException {
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
        super(message);
        this.name = "ClientError";
    }
}
