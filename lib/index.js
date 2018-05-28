"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const route_1 = require("./route");
const Hapi = require("hapi");
const server = new Hapi.Server({
    host: 'localhost',
    port: 8080
});
server.route(route_1.default);
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield server.start();
        }
        catch (err) {
            console.log(err);
            process.exit(1);
        }
        console.log('Server running at:', server.info.uri);
    });
}
start();
// app
// 	.get('/setSheetID', (req, res) => {
// 		const {
// 			sheetID
// 		} = req.query
// 
// 	})
// 	.get('/execScraping', async (req, res) => {
// 		const queries: SearchObject = req.query,
// 			timestamp = uuidv1()
// 		try {
// 			const result = (await execScraping(queries))
// 			console.log(result)
// 			res.json(result)
// 		}
// 		catch (e) {
// 			console.error(e)
// 		}
// 	})
//# sourceMappingURL=index.js.map