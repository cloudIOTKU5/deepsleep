const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");
const path = require("path");
require("dotenv").config();

const apiRouter = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

// MQTT 클라이언트 설정
const mqttBroker = process.env.MQTT_BROKER || "mqtt://localhost:1883";
const mqttClient = mqtt.connect(mqttBroker);

// MQTT 연결 이벤트
mqttClient.on("connect", () => {
  console.log("MQTT 브로커에 연결되었습니다.");
  mqttClient.subscribe("sensors/sleep/+", (err) => {
    if (!err) {
      console.log("수면 센서 토픽 구독 완료");
    }
  });
});

// MQTT 메시지 수신 이벤트
mqttClient.on("message", (topic, message) => {
  console.log(`토픽 ${topic}에서 메시지 수신: ${message.toString()}`);
  // 수신한 메시지 처리 로직 (데이터베이스 저장, 가습기/스피커 제어 명령 등)
});

// 미들웨어 설정
app.use(cors());
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
module.exports = { app, mqttClient };
