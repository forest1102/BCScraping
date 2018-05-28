"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = [
    {
        method: 'GET',
        path: '/',
        handler: (request, reply) => {
            return 'Hello from Hapi';
        }
    },
    {
        method: 'GET',
        path: '/execScraping',
        handler: (request, h) => {
            return 'Hello world';
        }
    }
];
//# sourceMappingURL=app.js.map