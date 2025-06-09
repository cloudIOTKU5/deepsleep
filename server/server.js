const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const apiRouter = require("./routes/api");
const { connectToRDS, disconnectFromRDS } = require("./data/rds-config");

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

// RDS 연결 초기화 및 서버 시작
async function startServer() {
  try {
    // RDS 연결 시도
    await connectToRDS();
    console.log("RDS 연결이 완료되었습니다.");

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error("RDS 연결 실패:", error.message);
    console.log("RDS 없이 서버를 시작합니다. (메모리 기반 데이터 사용)");

    // RDS 연결 실패 시에도 서버는 시작
    app.listen(PORT, () => {
      console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
  }
}

// 서버 종료 시 정리 작업
process.on('SIGINT', async () => {
  console.log('\n서버 종료 중...');
  try {
    await disconnectFromRDS();
    console.log('RDS 연결이 종료되었습니다.');
  } catch (error) {
    console.error('RDS 연결 종료 오류:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n서버 종료 중...');
  try {
    await disconnectFromRDS();
    console.log('RDS 연결이 종료되었습니다.');
  } catch (error) {
    console.error('RDS 연결 종료 오류:', error.message);
  }
  process.exit(0);
});

// 서버 시작
startServer();

// MQTT 클라이언트 내보내기 (다른 모듈에서 사용할 수 있도록)
module.exports = { app };
