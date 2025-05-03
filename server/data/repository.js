const { calculateSleepQualityScore } = require("./analyzer");

let currentSensorData = {
  humidity: null,
  heartRate: null,
  timestamp: new Date(),
};

const sensorDataRecords = [];

let currentDeviceStatus = {
  humidifier: "off",
  speaker: "off",
  volume: 0,
};

function getCurrentSensorData() {
  return currentSensorData;
}

/**
 * 센서 데이터 업데이트
 * @param {Object} data - 센서 데이터
 * @param {number} data.humidity - 습도
 * @param {number} data.heartRate - 심박수
 */
function updateSensorData(data) {
  currentSensorData = {
    humidity: data.humidity,
    heartRate: data.heartRate,
    timestamp: new Date(),
  };
  sensorDataRecords.push(currentSensorData);
}

function getSensorDataRecords() {
  return sensorDataRecords;
}

function getCurrentDeviceStatus() {
  return currentDeviceStatus;
}

/**
 * 장치 상태 업데이트
 * @param {Object} data - 장치 상태 데이터
 * @param {string} data.humidifier - 가습기 상태
 * @param {string} data.speaker - 스피커 상태
 * @param {number} data.volume - 볼륨
 */
function updateDeviceStatus(data) {
  currentDeviceStatus = { ...currentDeviceStatus, ...data };
}

function getDeviceStatus() {
  return currentDeviceStatus;
}

function getSleepDataRecords() {
  const sleepDataRecords = [];
  for (let i = 0; i < sensorDataRecords.length; i++) {
    const sensorData = sensorDataRecords[i];
    const sleepData = {
      date: sensorData.timestamp,
      averageHumidity: sensorData.humidity,
      averageHeartRate: sensorData.heartRate,
      sleepQualityScore: calculateSleepQualityScore(
        sensorData.humidity,
        sensorData.heartRate
      ),
    };
    sleepDataRecords.push(sleepData);
  }
  return sleepDataRecords;
}

module.exports = {
  getCurrentSensorData,
  updateSensorData,
  getSensorDataRecords,
  getCurrentDeviceStatus,
  updateDeviceStatus,
  getDeviceStatus,
  getSleepDataRecords,
};
