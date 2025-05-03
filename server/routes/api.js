const express = require("express");
const router = express.Router();
const { mqttClient } = require("../mqtt");
const sleepData = require("../data/sleepData");
const automationController = require("../automation/controller");

// MQTT 메시지 처리 설정
mqttClient.on("message", (topic, message) => {
  if (topic === "sensors/sleep/humidity") {
    const humidity = parseInt(message.toString());
    automationController.processSensorData("humidity", humidity);
  }
});

// 현재 수면 데이터 상태 조회
router.get("/sleep/status", (req, res) => {
  res.json(sleepData.getCurrentSensorData());
});

// 수면 데이터 기록 가져오기
router.get("/sleep/records", (req, res) => {
  // 더미데이터
  res.json([
    {
      date: "2025-05-03",
      averageHumidity: 55,
      averageHeartRate: 64,
      sleepQualityScore: 85,
    },
    {
      date: "2025-05-02",
      averageHumidity: 62,
      averageHeartRate: 68,
      sleepQualityScore: 78,
    },
  ]);
});

// 가습기 제어
router.post("/device/humidifier", (req, res) => {
  const { status } = req.body;

  if (status !== "on" && status !== "off") {
    return res.status(400).json({ error: "상태는 on 또는 off여야 합니다." });
  }

  // MQTT를 통해 라즈베리 파이에 명령 전송
  mqttClient.publish("control/humidifier", JSON.stringify({ status }));

  // 상태 업데이트
  sleepData.updateDeviceStatus("humidifier", status);

  res.json({
    success: true,
    message: `가습기가 ${status === "on" ? "켜졌습니다" : "꺼졌습니다"}`,
  });
});

// 스피커 제어
router.post("/device/speaker", (req, res) => {
  const { status, volume } = req.body;

  if (status !== "on" && status !== "off") {
    return res.status(400).json({ error: "상태는 on 또는 off여야 합니다." });
  }

  if (status === "on" && (volume < 0 || volume > 100)) {
    return res.status(400).json({ error: "볼륨은 0에서 100 사이여야 합니다." });
  }

  // MQTT를 통해 라즈베리 파이에 명령 전송
  mqttClient.publish("control/speaker", JSON.stringify({ status, volume }));

  // 상태 업데이트
  sleepData.updateDeviceStatus("speaker", status);

  res.json({
    success: true,
    message:
      status === "on"
        ? `스피커가 켜졌습니다. 볼륨: ${volume}`
        : "스피커가 꺼졌습니다",
  });
});

// 자동화 설정
router.post("/settings/automation", (req, res) => {
  const { enabled, humidityThreshold, heartRateThreshold } = req.body;

  // 요청 검증
  if (typeof enabled !== "boolean") {
    return res
      .status(400)
      .json({ error: "enabled는 boolean 값이어야 합니다." });
  }

  if (humidityThreshold < 0 || humidityThreshold > 100) {
    return res
      .status(400)
      .json({ error: "습도 임계값은 0에서 100 사이여야 합니다." });
  }

  if (heartRateThreshold < 40 || heartRateThreshold > 200) {
    return res
      .status(400)
      .json({ error: "심박수 임계값은 40에서 200 사이여야 합니다." });
  }

  // 설정 업데이트
  sleepData.updateAutomationSettings({
    enabled,
    humidityThreshold,
    heartRateThreshold,
  });

  // MQTT를 통해 자동화 상태만 라즈베리 파이에 설정 전달
  mqttClient.publish("settings/automation", JSON.stringify({ enabled }));

  res.json({
    success: true,
    message: enabled
      ? "자동화가 활성화되었습니다."
      : "자동화가 비활성화되었습니다.",
  });
});

module.exports = router;
