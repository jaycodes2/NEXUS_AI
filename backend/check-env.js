"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
dotenv.config();
console.log("HOST:", process.env.MYSQL_HOST);
