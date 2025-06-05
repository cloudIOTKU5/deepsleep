const express = require("express");
const router = express.Router();
const { mqttClient } = require("../mqtt");
const settings = require("../automation/setting");
const repository = require("../data/repository");
const automationController = require("../automation/controller");
const { fetchFitbitHeartRate } = require("../data/fitbit");

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
// 인사이트 분석
router.post("/sleep-analysis/insights", (req, res) => {
  const { currentEnvironment, sleepHistory } = req.body;

  // 더미 응답 데이터 -> Gemini API 한테 프롬프팅으로 받을 예정
  const insights = [
    {
      id: "humidity-analysis-001",
      type: "warning",
      title: "습도 변동이 수면 품질에 영향을 줄 수 있습니다",
      description:
        "현재 습도 45%는 적정 범위이지만, 최근 3일간 38%~52% 사이에서 큰 변동을 보이고 있습니다. 일정한 습도 유지를 위해 가습기 자동화 설정을 더 세밀하게 조정하는 것을 권장합니다.",
      confidence: 87,
      priority: "medium",
    },
    {
      id: "heartrate-analysis-001",
      type: "info",
      title: "심박수가 이상적인 수면 준비 상태를 보여줍니다",
      description:
        "현재 심박수 65bpm은 수면 전 최적 상태입니다. 지난 주 평균 68bpm에서 3bpm 감소하여 스트레스 관리와 이완 기법이 효과적으로 작용하고 있는 것으로 분석됩니다.",
      confidence: 92,
      priority: "low",
    },
  ];

  res.json({
    success: true,
    data: {
      insights,
      generatedAt: new Date().toISOString(),
    },
  });
});

// 수면 품질 예측
router.post("/sleep-analysis/prediction", (req, res) => {
  const { currentEnvironment, sleepHistory } = req.body;

  // 더미 응답 데이터
  const prediction = {
    qualityScore: 84,
    reasoning:
      "현재 환경 조건과 최근 수면 패턴을 종합 분석한 결과, 오늘 밤 수면 품질은 84점으로 예상됩니다. 습도와 심박수가 모두 최적 범위에 있으며, 지난 3일간의 긍정적 트렌드가 지속될 것으로 보입니다.",
    factors: [
      {
        name: "습도 조건",
        impact: "positive",
        value: "최적 범위 (45%)",
        explanation:
          "현재 습도는 수면에 이상적인 40-60% 범위 내에 있어 호흡기 편안함과 피부 건조 방지에 도움이 됩니다.",
      },
      {
        name: "심박수 안정성",
        impact: "positive",
        value: "안정적 (65bpm)",
        explanation: "수면 전 심박수가 안정적이어서 빠른 수면 진입과 깊은 수면 단계 도달이 예상됩니다.",
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: prediction,
  });
});

// 수면 트렌드 분석
router.post("/sleep-analysis/trends", (req, res) => {
  const { currentEnvironment, sleepHistory } = req.body;

  // 더미 응답 데이터
  const trends = {
    weeklyAnalysis:
      "이번 주 수면 환경 분석 결과, 전반적으로 매우 긍정적인 변화를 보이고 있습니다. 습도 관리 시스템의 효율성이 크게 개선되어 변동폭이 15% 감소했으며, 심박수도 평균 3bpm 안정화되는 추세를 보입니다.",
    humidityTrend: {
      current: 45,
      weeklyAverage: 47,
      trend: "stable",
      analysis:
        "습도가 매우 안정적으로 유지되고 있습니다. 가습기 자동화 설정의 효과로 최적 범위를 벗어나는 빈도가 지난 주 대비 60% 감소했습니다.",
    },
    heartRateTrend: {
      current: 65,
      weeklyAverage: 68,
      trend: "improving",
      analysis:
        "심박수가 지속적으로 개선되고 있는 매우 긍정적인 추세입니다. 스트레스 관리 기법과 이완 음악의 복합적 효과가 나타나고 있습니다.",
    },
    generatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: trends,
  });
});

module.exports = router;
