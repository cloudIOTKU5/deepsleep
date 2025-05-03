const mqtt = require("mqtt");
require("dotenv").config();

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

module.exports = { mqttClient };
