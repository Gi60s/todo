"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env = process.env;
const { start } = app_1.AppFactory();
start()
    .then((port) => {
    console.log('Server listening on port: ' + port);
})
    .catch((err) => {
    console.error(err.stack);
});
//# sourceMappingURL=index.js.map