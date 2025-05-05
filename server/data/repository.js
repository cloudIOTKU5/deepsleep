const { calculateSleepQualityScore } = require("./analyzer");
const { saveToS3, getFromS3, listFromS3 } = require("./s3-config");

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
async function updateSensorData(data) {
  currentSensorData = {
    humidity: data.humidity,
    heartRate: data.heartRate,
    timestamp: new Date(),
  };
  sensorDataRecords.push(currentSensorData);

  // S3에 센서 데이터 저장
  try {
    const key = `sensor-data/${currentSensorData.timestamp.toISOString()}.json`;
    await saveToS3(key, currentSensorData);
  } catch (error) {
    console.error("S3에 센서 데이터 저장 실패:", error);
  }
}

function getSensorDataRecords() {
  return sensorDataRecords;
}

/**
 * S3에서 모든 센서 데이터 레코드 가져오기
 * @returns {Promise<Array>} - 센서 데이터 배열
 */
async function getSensorDataRecordsFromS3() {
  try {
    const keys = await listFromS3("sensor-data/");
    const dataPromises = keys.map((key) => getFromS3(key));
    return await Promise.all(dataPromises);
  } catch (error) {
    console.error("S3에서 센서 데이터 가져오기 실패:", error);
    return [];
  }
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
async function updateDeviceStatus(data) {
  currentDeviceStatus = { ...currentDeviceStatus, ...data };

  // S3에 장치 상태 저장
  try {
    const key = `device-status/latest.json`;
    await saveToS3(key, currentDeviceStatus);
  } catch (error) {
    console.error("S3에 장치 상태 저장 실패:", error);
  }
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

/**
 * S3에서 수면 데이터 레코드 가져오기
 * @returns {Promise<Array>} - 수면 데이터 배열
 */
async function getSleepDataRecordsFromS3() {
  try {
    const sensorDataList = await getSensorDataRecordsFromS3();
    return sensorDataList.map((sensorData) => ({
      date: new Date(sensorData.timestamp),
      averageHumidity: sensorData.humidity,
      averageHeartRate: sensorData.heartRate,
      sleepQualityScore: calculateSleepQualityScore(
        sensorData.humidity,
        sensorData.heartRate
      ),
    }));
  } catch (error) {
    console.error("S3에서 수면 데이터 계산 실패:", error);
    return [];
  }
}

module.exports = {
  getCurrentSensorData,
  updateSensorData,
  getSensorDataRecords,
  getSensorDataRecordsFromS3,
  getCurrentDeviceStatus,
  updateDeviceStatus,
  getDeviceStatus,
  getSleepDataRecords,
  getSleepDataRecordsFromS3,
};
