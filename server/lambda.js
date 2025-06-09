const serverless = require('serverless-http');
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const apiRouter = require("./routes/api");
const { connectToRDS } = require("./data/rds-config");

const app = express();

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

app.options('*', cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/v1", apiRouter);

app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Lambda function is running" });
});

app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});

// Lambda 핸들러에서 RDS 연결 초기화
let isConnected = false;

const handler = async (event, context) => {
    // Lambda 컨테이너 재사용을 위해 연결 상태 확인
    if (!isConnected) {
        try {
            await connectToRDS();
            isConnected = true;
            console.log("RDS 연결이 완료되었습니다.");
        } catch (error) {
            console.error("RDS 연결 실패:", error.message);
            console.log("RDS 없이 Lambda를 실행합니다. (메모리 기반 데이터 사용)");
        }
    }

    return serverless(app)(event, context);
};

module.exports.handler = handler; 