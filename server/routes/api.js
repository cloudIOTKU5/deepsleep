const express = require("express");
const router = express.Router();
const { mqttClient, controlDevice } = require("../mqtt");
const axios = require("axios");
require("dotenv").config();

// Fitbit API 설정
const FITBIT_API_BASE = "https://api.fitbit.com/1/user/-";
const FITBIT_ACCESS_TOKEN = process.env.FITBIT_ACCESS_TOKEN || "";

// 자동화 설정 기본값
let automationSettings = {
  enabled: true,
  humidityThreshold: 40, // 40% 이하면 가습기 켜기
  heartRateThreshold: 80, // 80bpm 이상이면 스피커로 백색소음 재생
};

// 현재 센서 데이터 저장
let currentSensorData = {
  humidity: 60,
  heartRate: 68,
  timestamp: new Date(),
  humidifierStatus: "off",
  speakerStatus: "off",
};

// Fitbit에서 심박수 데이터 가져오기
async function fetchFitbitHeartRate() {
  if (!FITBIT_ACCESS_TOKEN) {
    console.log("Fitbit 액세스 토큰이 설정되지 않았습니다.");
    return null;
  }

  try {
    const headers = { Authorization: `Bearer ${FITBIT_ACCESS_TOKEN}` };
    const response = await axios.get(
      `${FITBIT_API_BASE}/activities/heart/date/today/1d.json`,
      { headers }
    );
    return response.data["activities-heart"][0].value.restingHeartRate;
  } catch (error) {
    console.error("Fitbit API 호출 오류:", error.message);
    return null;
  }
}

// 자동화 제어 로직
async function processAutomation() {
  if (!automationSettings.enabled) {
    return;
  }

  const { humidity } = currentSensorData;
  // Fitbit에서 심박수 가져오기
  const heartRate =
    (await fetchFitbitHeartRate()) || currentSensorData.heartRate;

  console.log(`현재 측정값: 습도 ${humidity}%, 심박수 ${heartRate}bpm`);

  // 현재 데이터 업데이트
  currentSensorData.heartRate = heartRate;
  currentSensorData.timestamp = new Date();

  // 습도에 따른 가습기 제어
  if (humidity < automationSettings.humidityThreshold) {
    controlDevice("humidifier", "on");
    currentSensorData.humidifierStatus = "on";
  } else {
    controlDevice("humidifier", "off");
    currentSensorData.humidifierStatus = "off";
  }

  // 심박수에 따른 스피커 제어
  if (heartRate > automationSettings.heartRateThreshold) {
    controlDevice("speaker", "on", { volume: 30 });
    currentSensorData.speakerStatus = "on";
  } else {
    controlDevice("speaker", "off");
    currentSensorData.speakerStatus = "off";
  }
}

// MQTT 메시지 처리 설정
mqttClient.on("message", (topic, message) => {
  if (topic === "sensors/sleep/humidity") {
    currentSensorData.humidity = parseInt(message.toString());
    // 자동화 로직 실행
    if (automationSettings.enabled) {
      processAutomation();
    }
  }
});

// 현재 수면 데이터 상태 조회
router.get("/sleep/status", (req, res) => {
  res.json(currentSensorData);
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
  currentSensorData.humidifierStatus = status;

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
  currentSensorData.speakerStatus = status;

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
  automationSettings = {
    ...automationSettings,
    enabled,
    humidityThreshold,
    heartRateThreshold,
  };

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
