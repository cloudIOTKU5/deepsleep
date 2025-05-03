const sleepData = require("../data/sleepData");
const { controlDevice } = require("../mqtt");

/**
 * 자동화 제어 로직 처리
 * 습도와 심박수 데이터를 기반으로 디바이스를 제어합니다.
 */
async function processAutomation() {
  const automationSettings = sleepData.getAutomationSettings();
  if (!automationSettings.enabled) {
    return;
  }

  const currentSensorData = sleepData.getCurrentSensorData();
  const { humidity } = currentSensorData;

  // Fitbit에서 심박수 가져오기
  const heartRate =
    (await sleepData.fetchFitbitHeartRate()) || currentSensorData.heartRate;

  console.log(`현재 측정값: 습도 ${humidity}%, 심박수 ${heartRate}bpm`);

  // 현재 데이터 업데이트
  sleepData.updateSensorData("heartRate", heartRate);

  // 습도에 따른 가습기 제어
  if (humidity < automationSettings.humidityThreshold) {
    controlDevice("humidifier", "on");
    sleepData.updateDeviceStatus("humidifier", "on");
  } else {
    controlDevice("humidifier", "off");
    sleepData.updateDeviceStatus("humidifier", "off");
  }

  // 심박수에 따른 스피커 제어
  if (heartRate > automationSettings.heartRateThreshold) {
    controlDevice("speaker", "on", { volume: 30 });
    sleepData.updateDeviceStatus("speaker", "on");
  } else {
    controlDevice("speaker", "off");
    sleepData.updateDeviceStatus("speaker", "off");
  }
}

/**
 * 센서 데이터 처리 및 자동화 로직 실행
 * @param {string} sensorType - 센서 유형 ('humidity', 'heartRate' 등)
 * @param {number} value - 센서 측정값
 */
function processSensorData(sensorType, value) {
  if (sensorType && value !== undefined) {
    sleepData.updateSensorData(sensorType, value);

    const automationSettings = sleepData.getAutomationSettings();
    if (automationSettings.enabled) {
      processAutomation();
    }
  }
}

module.exports = {
  processAutomation,
  processSensorData,
};
