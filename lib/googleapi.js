"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googlesheets = require("google-sheets-manager");
const rx_1 = require("rx");
const cred = require('../config/scrapingBigCamera-eb546c29942b.json');
class GoogleSheetWithObservable extends googlesheets.GoogleSheet {
    setDataObservable(data, options) {
        return rx_1.Observable.create(obs => {
            this.setData(data, (err, res) => {
                if (err)
                    return obs.onError(err);
                obs.onNext(res);
                obs.onCompleted();
            });
        });
    }
    getObservable(request) {
        return rx_1.Observable.create(obs => {
            this.api.get(request, (err, res) => {
                if (err)
                    return obs.onError(err);
                obs.onNext(res);
                obs.onCompleted();
            });
        });
    }
    batchUpdateObservable(request) {
        return rx_1.Observable.create(obs => {
            this.api.batchUpdate(request, (err, res) => {
                if (err)
                    return obs.onError(err);
                obs.onNext(res);
                obs.onCompleted();
            });
        });
    }
}
class GoogleAPI {
    constructor() {
        this.oAuth = new googlesheets.ServiceAccount(cred);
    }
    static get instance() {
        if (!this._instance) {
            this._instance = new GoogleAPI();
        }
        return this._instance;
    }
    set spreadsheetId(spreadsheetId) {
        this.spreadsheetId = spreadsheetId;
        this._sheets.spreadsheetId = spreadsheetId;
    }
    get sheets() {
        if (this._sheets) {
            return this._sheets;
        }
        if (!this.oAuth) {
            return null;
        }
        return (this._sheets = new GoogleSheetWithObservable(this.oAuth, this._spreadsheetId));
    }
}
exports.default = GoogleAPI;
//# sourceMappingURL=googleapi.js.map