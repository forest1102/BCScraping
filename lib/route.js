"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const subjects_1 = require("./subjects");
exports.default = [
    {
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Hello from Hapi';
        }
    },
    {
        method: 'GET',
        path: '/execScraping',
        handler: (request, h) => {
            const queries = request.query;
            console.log(`q:${queries.q}`);
            subjects_1.execScrapingSubject.onNext(queries);
            return queries;
        }
    },
];
//# sourceMappingURL=route.js.map