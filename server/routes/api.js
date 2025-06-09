const express = require("express");
const router = express.Router();
const { controlHumidifier, controlSpeaker, sendAutomationSettings, getDeviceStatus } = require("../mqtt-api");
const settings = require("../automation/setting");
const repository = require("../data/repository");
const automationController = require("../automation/controller");
const { fetchFitbitHeartRate } = require("../data/fitbit");
const { analyzeSleepInsights, predictSleepQuality, analyzeSleepTrends } = require('../services/gemini-service');
const { checkDatabaseStatus } = require("../data/rds-config");

// 현재 수면 데이터 상태 조회
router.get("/sleep/status", async (req, res) => {
  try {
    const currentSensorData = repository.getCurrentSensorData();

    // IoT Core에서 디바이스 상태 가져오기
    const deviceStatusResult = await getDeviceStatus();
    const currentDeviceStatus = deviceStatusResult.success
      ? deviceStatusResult.data
      : repository.getCurrentDeviceStatus();

    res.json({
      humidity: currentSensorData.humidity,
      heartRate: currentSensorData.heartRate,
      humidifierStatus: currentDeviceStatus.humidifier,
      speakerStatus: currentDeviceStatus.speaker,
      volume: currentDeviceStatus.volume,
    });
  } catch (error) {
    console.error('수면 상태 조회 오류:', error);
    // 폴백으로 로컬 데이터 사용
    const currentSensorData = repository.getCurrentSensorData();
    const currentDeviceStatus = repository.getCurrentDeviceStatus();

    res.json({
      humidity: currentSensorData.humidity,
      heartRate: currentSensorData.heartRate,
      humidifierStatus: currentDeviceStatus.humidifier,
      speakerStatus: currentDeviceStatus.speaker,
      volume: currentDeviceStatus.volume,
    });
  }
});

// 수면 데이터 기록 가져오기
router.get("/sleep/records", async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;
    const options = {};

    if (limit) options.limit = parseInt(limit);
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    // DocumentDB에서 데이터 가져오기 시도
    const records = await repository.getSleepDataRecordsFromDB(options);

    // DocumentDB에 데이터가 없으면 메모리 데이터 사용
    if (records.length === 0) {
      return res.json(repository.getSleepDataRecords());
    }

    res.json(records);
  } catch (error) {
    console.error('수면 데이터 조회 오류:', error);
    // 폴백으로 메모리 데이터 사용
    res.json(repository.getSleepDataRecords());
  }
});

// 수면 통계 데이터 가져오기
router.get("/sleep/statistics", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const options = {};

    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const statistics = await repository.getSleepStatistics(options);
    res.json(statistics);
  } catch (error) {
    console.error('수면 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: "수면 통계 조회 중 오류가 발생했습니다."
    });
  }
});

// 일별 수면 통계 데이터 가져오기
router.get("/sleep/daily-statistics", async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;
    const options = {};

    if (limit) options.limit = parseInt(limit);
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const dailyStatistics = await repository.getDailySleepStatistics(options);
    res.json(dailyStatistics);
  } catch (error) {
    console.error('일별 수면 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: "일별 수면 통계 조회 중 오류가 발생했습니다."
    });
  }
});

// 센서 데이터 기록 가져오기
router.get("/sensor/records", async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;
    const options = {};

    if (limit) options.limit = parseInt(limit);
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const records = await repository.getSensorDataRecordsFromDB(options);
    res.json(records);
  } catch (error) {
    console.error('센서 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: "센서 데이터 조회 중 오류가 발생했습니다."
    });
  }
});

// 장치 상태 조회
router.get("/device/status", async (req, res) => {
  try {
    const deviceStatus = await repository.getDeviceStatusFromDB();
    res.json(deviceStatus);
  } catch (error) {
    console.error('장치 상태 조회 오류:', error);
    // 폴백으로 메모리 데이터 사용
    res.json(repository.getCurrentDeviceStatus());
  }
});

// 가습기 제어
router.post("/device/humidifier", async (req, res) => {
  const { status } = req.body;

  if (status !== "on" && status !== "off") {
    return res.status(400).json({ error: "상태는 on 또는 off여야 합니다." });
  }

  try {
    // AWS IoT Core를 통해 가습기 제어
    const result = await controlHumidifier(status);

    // 로컬 상태도 업데이트
    repository.updateDeviceStatus({ humidifier: status });

    res.json({
      success: true,
      message: `가습기가 ${status === "on" ? "켜졌습니다" : "꺼졌습니다"}`,
    });
  } catch (error) {
    console.error('가습기 제어 오류:', error);
    res.status(500).json({
      success: false,
      error: "가습기 제어 중 오류가 발생했습니다."
    });
  }
});

// 스피커 제어
router.post("/device/speaker", async (req, res) => {
  const { status, volume } = req.body;

  if (status !== "on" && status !== "off") {
    return res.status(400).json({ error: "상태는 on 또는 off여야 합니다." });
  }

  if (status === "on" && (volume < 0 || volume > 100)) {
    return res.status(400).json({ error: "볼륨은 0에서 100 사이여야 합니다." });
  }

  try {
    // AWS IoT Core를 통해 스피커 제어
    const result = await controlSpeaker(status, volume);

    // 로컬 상태도 업데이트
    repository.updateDeviceStatus({ speaker: status, volume });

    res.json({
      success: true,
      message:
        status === "on"
          ? `스피커가 켜졌습니다. 볼륨: ${volume}`
          : "스피커가 꺼졌습니다",
    });
  } catch (error) {
    console.error('스피커 제어 오류:', error);
    res.status(500).json({
      success: false,
      error: "스피커 제어 중 오류가 발생했습니다."
    });
  }
});

// 자동화 설정
router.post("/settings/automation", async (req, res) => {
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

  try {
    // 로컬 설정 업데이트
    settings.updateAutomationSettings({
      enabled,
      humidityThreshold,
      heartRateThreshold,
    });

    // AWS IoT Core를 통해 자동화 상태를 디바이스에 전달
    await sendAutomationSettings(enabled);

    res.json({
      success: true,
      message: enabled
        ? "자동화가 활성화되었습니다."
        : "자동화가 비활성화되었습니다.",
    });
  } catch (error) {
    console.error('자동화 설정 오류:', error);
    res.status(500).json({
      success: false,
      error: "자동화 설정 중 오류가 발생했습니다."
    });
  }
});

// AI 수면환경 분석 API
router.post('/sleep-analysis/insights', async (req, res) => {
  try {
    console.log('[INSIGHTS] 수면 인사이트 요청 수신:', req.body);

    const result = await analyzeSleepInsights(req.body);

    console.log('[INSIGHTS] 분석 완료');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[INSIGHTS] 분석 실패:', error);

    res.status(500).json({
      success: false,
      message: '수면 인사이트 분석 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류입니다.'
    });
  }
});

// 수면 품질 예측
router.post('/sleep-analysis/prediction', async (req, res) => {
  try {
    console.log('[PREDICTION] 수면 품질 예측 요청 수신:', req.body);

    const result = await predictSleepQuality(req.body);

    console.log('[PREDICTION] 예측 완료');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[PREDICTION] 예측 실패:', error);

    res.status(500).json({
      success: false,
      message: '수면 품질 예측 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류입니다.'
    });
  }
});

// 수면 트렌드 분석
router.post('/sleep-analysis/trends', async (req, res) => {
  try {
    console.log('[TRENDS] 수면 트렌드 요청 수신:', req.body);

    const result = await analyzeSleepTrends(req.body);

    console.log('[TRENDS] 분석 완료');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[TRENDS] 분석 실패:', error);

    res.status(500).json({
      success: false,
      message: '수면 트렌드 분석 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류입니다.'
    });
  }
});

// 데이터베이스 상태 확인 (새로운 엔드포인트)
router.get("/database/status", async (req, res) => {
  try {
    // 콘솔에 상태 출력
    const status = await checkDatabaseStatus();

    res.json(status);
  } catch (error) {
    console.error('데이터베이스 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: "데이터베이스 상태 확인 중 오류가 발생했습니다.",
      details: error.message
    });
  }
});

module.exports = router;
