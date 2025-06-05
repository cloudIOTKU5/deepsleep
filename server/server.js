const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const apiRouter = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS 설정
app.use(cors({
  origin: 'http://localhost:3000', // Next.js 클라이언트 주소
  credentials: true
}));

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, "../client")));

// API 라우트
app.use("/api", apiRouter);

// 프론트엔드 서빙 (SPA 대응)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

// MQTT 클라이언트 내보내기 (다른 모듈에서 사용할 수 있도록)
module.exports = { app };
