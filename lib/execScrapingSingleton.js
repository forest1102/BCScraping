"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rx_1 = require("rx");
class ExecScraping {
    constructor() {
        this._subject = new rx_1.Subject();
    }
    set searchObj(obj) {
        this._subject.onNext(obj);
    }
    get subject() {
        return this._subject;
    }
    static get instance() {
        if (!this._instance) {
            this._instance = new ExecScraping();
        }
        return this._instance;
    }
}
exports.ExecScraping = ExecScraping;
//# sourceMappingURL=execScrapingSingleton.js.map