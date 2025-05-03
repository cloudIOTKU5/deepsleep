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

// 센서 데이터 업데이트
function updateSensorData(key, value) {
  if (key in currentSensorData) {
    currentSensorData[key] = value;
    currentSensorData.timestamp = new Date();
    return true;
  }
  return false;
}

// 디바이스 상태 업데이트
function updateDeviceStatus(device, status) {
  if (device === "humidifier") {
    currentSensorData.humidifierStatus = status;
    return true;
  } else if (device === "speaker") {
    currentSensorData.speakerStatus = status;
    return true;
  }
  return false;
}

// 자동화 설정 업데이트
function updateAutomationSettings(settings) {
  automationSettings = { ...automationSettings, ...settings };
  return automationSettings;
}

// 데이터 내보내기
module.exports = {
  getAutomationSettings: () => automationSettings,
  getCurrentSensorData: () => currentSensorData,
  fetchFitbitHeartRate,
  updateSensorData,
  updateDeviceStatus,
  updateAutomationSettings,
};
