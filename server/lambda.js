const serverless = require('serverless-http');
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const apiRouter = require("./routes/api");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/v1", apiRouter);

app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Lambda function is running" });
});

app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});

module.exports.handler = serverless(app); 