import { BaseException } from "./BaseException";

/**
 * @type {ServerException}
 */
export class ServerException extends BaseException {
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
        this.name = "ServerError";
    }
}
