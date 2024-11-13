export default class extends Error {
    constructor(name, message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = name;
    }
}
