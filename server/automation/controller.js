const settings = require("./setting");
const repository = require("../data/repository");
const { controlHumidifier, controlSpeaker } = require("../mqtt-api");

/**
 * 자동화 제어 로직 처리
 * 습도와 심박수 데이터를 기반으로 디바이스를 제어합니다.
 */
async function processAutomation() {
  const automationSettings = settings.getAutomationSettings();
  if (!automationSettings.enabled) {
    return;
  }

  const currentSensorData = repository.getCurrentSensorData();
  const { humidity, heartRate } = currentSensorData;

  // 습도에 따른 가습기 제어
  if (humidity < automationSettings.humidityThreshold) {
    controlHumidifier("on");
    repository.updateDeviceStatus({ humidifier: "on" });
  } else {
    controlHumidifier("off");
    repository.updateDeviceStatus({ humidifier: "off" });
  }

  // 심박수에 따른 스피커 제어
  if (heartRate > automationSettings.heartRateThreshold) {
    const volume = repository.getCurrentDeviceStatus().volume;
    controlSpeaker("on", volume);
    repository.updateDeviceStatus({ speaker: "on", volume });
  } else {
    controlSpeaker("off");
    repository.updateDeviceStatus({ speaker: "off" });
  }
}

module.exports = {
  processAutomation,
};
