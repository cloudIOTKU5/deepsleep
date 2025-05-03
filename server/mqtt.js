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
});

// 기기 제어 함수 (다른 모듈에서 사용 가능)
function controlDevice(deviceType, status, options = {}) {
  const topic = `control/${deviceType}`;
  const payload = { status, ...options };

  mqttClient.publish(topic, JSON.stringify(payload));
  console.log(`${deviceType} 제어 명령 전송: ${JSON.stringify(payload)}`);

  return true;
}

module.exports = { mqttClient, controlDevice };
