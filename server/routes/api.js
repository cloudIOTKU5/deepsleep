const express = require("express");
const router = express.Router();
const { mqttClient } = require("../mqtt");
const settings = require("../automation/setting");
const repository = require("../data/repository");
const automationController = require("../automation/controller");
const { fetchFitbitHeartRate } = require("../data/fitbit");
const { analyzeSleepInsights, predictSleepQuality, analyzeSleepTrends } = require('../services/gemini-service');

// MQTT 메시지 처리 설정
mqttClient.on("message", async (topic, message) => {
  if (topic === "sensors/sleep/humidity") {
    const humidity = parseInt(message.toString());
    const heartRate = await fetchFitbitHeartRate();
    repository.updateSensorData({ humidity, heartRate });
    automationController.processAutomation();
  }
});

// 현재 수면 데이터 상태 조회
router.get("/sleep/status", (req, res) => {
  const currentSensorData = repository.getCurrentSensorData();
  const currentDeviceStatus = repository.getCurrentDeviceStatus();
  res.json({
    humidity: currentSensorData.humidity,
    heartRate: currentSensorData.heartRate,
    humidifierStatus: currentDeviceStatus.humidifier,
    speakerStatus: currentDeviceStatus.speaker,
    volume: currentDeviceStatus.volume,
  });
});

// 수면 데이터 기록 가져오기
router.get("/sleep/records", (req, res) => {
  res.json(repository.getSleepDataRecords());
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
  repository.updateDeviceStatus({ humidifier: status });

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
  repository.updateDeviceStatus({ speaker: status, volume });

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

  console.log("자동화 설정 요청:", {
    enabled,
    humidityThreshold,
    heartRateThreshold,
  });

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
  settings.updateAutomationSettings({
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

// AI 수면환경 분석 API
router.post('/analyze-sleep', async (req, res) => {
  try {
    const data = {
      currentEnvironment: {
        humidity: req.body.humidity,
        heartRate: req.body.heartRate,
        humidifierStatus: req.body.humidifierStatus,
        speakerStatus: req.body.speakerStatus,
        volume: req.body.volume
      },
      sleepHistory: req.body.sleepRecords || []
    };

    // 각 분석 결과 병렬로 가져오기
    const [insights, prediction, trends] = await Promise.all([
      analyzeSleepInsights(data),
      predictSleepQuality(data),
      analyzeSleepTrends(data)
    ]);

    res.json({
      success: true,
      data: {
        insights,
        prediction,
        trends
      }
    });
  } catch (error) {
    console.error('AI 분석 실패:', error);
    res.status(500).json({
      success: false,
      message: 'AI 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
