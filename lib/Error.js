"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_custom_error_1 = require("ts-custom-error");
class BadRequestError extends ts_custom_error_1.CustomError {
    constructor(m = 'the query is not properly') {
        super(m);
    }
}
BadRequestError.NAME = 'BAD REQUEST';
exports.BadRequestError = BadRequestError;
class NotFoundError extends ts_custom_error_1.CustomError {
    constructor(m = `Not Found the result`) {
        super(m);
        this.name = NotFoundError.NAME;
    }
}
NotFoundError.NAME = 'NotFoundResultError';
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=Error.js.map