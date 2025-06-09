const { calculateSleepQualityScore } = require("./analyzer");
const { executeQuery } = require("./rds-config");

let currentSensorData = {
  humidity: 0,
  heartRate: 0,
  timestamp: new Date(),
};

const sensorDataRecords = [];

let currentDeviceStatus = {
  humidifier: "off",
  speaker: "off",
  volume: 0,
};

async function getCurrentSensorData() {
  if (sensorDataRecords.length > 0) {
    return sensorDataRecords[sensorDataRecords.length - 1];
  }
  try {
    const rows = await executeQuery(
      `SELECT humidity, heart_rate, timestamp FROM sensor_data ORDER BY timestamp DESC LIMIT 1`
    );
    if (rows.length > 0) {
      currentSensorData = {
        humidity: rows[0].humidity,
        heartRate: rows[0].heart_rate,
        timestamp: new Date(rows[0].timestamp),
      };
      return currentSensorData;
    }
  } catch (error) {
    console.error("RDS에서 센서 데이터 가져오기 실패:", error);
    return currentSensorData;
  }
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

  // RDS에 센서 데이터 저장
  try {
    await executeQuery(
      `INSERT INTO sensor_data (humidity, heart_rate, timestamp) VALUES (?, ?, ?)`,
      [currentSensorData.humidity, currentSensorData.heartRate, currentSensorData.timestamp]
    );
    console.log("센서 데이터가 RDS에 성공적으로 저장되었습니다.");
  } catch (error) {
    console.error("RDS에 센서 데이터 저장 실패:", error);
  }
}

function getSensorDataRecords() {
  return sensorDataRecords;
}

/**
 * RDS에서 센서 데이터 레코드 가져오기
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 제한할 레코드 수
 * @param {Date} options.startDate - 시작 날짜
 * @param {Date} options.endDate - 종료 날짜
 * @returns {Promise<Array>} - 센서 데이터 배열
 */
async function getSensorDataRecordsFromDB(options = {}) {
  try {
    let query = `SELECT id, humidity, heart_rate, timestamp, created_at FROM sensor_data`;
    let params = [];
    let conditions = [];

    // 날짜 범위 필터링
    if (options.startDate) {
      conditions.push(`timestamp >= ?`);
      params.push(options.startDate);
    }
    if (options.endDate) {
      conditions.push(`timestamp <= ?`);
      params.push(options.endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY timestamp DESC`;

    if (options.limit) {
      query += ` LIMIT ${parseInt(options.limit)}`;
    }

    const rows = await executeQuery(query, params);
    return rows.map(row => ({
      id: row.id,
      humidity: parseFloat(row.humidity),
      heartRate: row.heart_rate,
      timestamp: row.timestamp,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error("RDS에서 센서 데이터 가져오기 실패:", error);
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

  // RDS에 장치 상태 저장
  try {
    const timestamp = new Date();
    await executeQuery(
      `INSERT INTO device_status (type, humidifier, speaker, volume, timestamp) 
       VALUES ('latest', ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       humidifier = VALUES(humidifier), 
       speaker = VALUES(speaker), 
       volume = VALUES(volume), 
       timestamp = VALUES(timestamp)`,
      [currentDeviceStatus.humidifier, currentDeviceStatus.speaker, currentDeviceStatus.volume, timestamp]
    );
    console.log("장치 상태가 RDS에 성공적으로 저장되었습니다.");
  } catch (error) {
    console.error("RDS에 장치 상태 저장 실패:", error);
  }
}

/**
 * RDS에서 최신 장치 상태 가져오기
 * @returns {Promise<Object>} - 장치 상태 객체
 */
async function getDeviceStatusFromDB() {
  try {
    const rows = await executeQuery(
      `SELECT humidifier, speaker, volume, timestamp, updated_at 
       FROM device_status 
       WHERE type = 'latest' 
       ORDER BY updated_at DESC 
       LIMIT 1`
    );

    if (rows.length > 0) {
      const row = rows[0];
      return {
        humidifier: row.humidifier,
        speaker: row.speaker,
        volume: row.volume,
        timestamp: row.timestamp,
        updatedAt: row.updated_at,
      };
    }
    return currentDeviceStatus;
  } catch (error) {
    console.error("RDS에서 장치 상태 가져오기 실패:", error);
    return currentDeviceStatus;
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
 * RDS에서 수면 데이터 레코드 가져오기
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 제한할 레코드 수
 * @param {Date} options.startDate - 시작 날짜
 * @param {Date} options.endDate - 종료 날짜
 * @returns {Promise<Array>} - 수면 데이터 배열
 */
async function getSleepDataRecordsFromDB(options = {}) {
  try {
    const sensorDataList = await getSensorDataRecordsFromDB(options);
    return sensorDataList.map((sensorData) => ({
      id: sensorData.id,
      date: new Date(sensorData.timestamp),
      averageHumidity: sensorData.humidity,
      averageHeartRate: sensorData.heartRate,
      sleepQualityScore: calculateSleepQualityScore(
        sensorData.humidity,
        sensorData.heartRate
      ),
    }));
  } catch (error) {
    console.error("RDS에서 수면 데이터 계산 실패:", error);
    return [];
  }
}

/**
 * 수면 데이터 통계 가져오기
 * @param {Object} options - 조회 옵션
 * @returns {Promise<Object>} - 통계 데이터
 */
async function getSleepStatistics(options = {}) {
  try {
    let query = `
      SELECT 
        AVG(humidity) as avgHumidity,
        AVG(heart_rate) as avgHeartRate,
        MIN(humidity) as minHumidity,
        MAX(humidity) as maxHumidity,
        MIN(heart_rate) as minHeartRate,
        MAX(heart_rate) as maxHeartRate,
        COUNT(*) as count
      FROM sensor_data
    `;
    let params = [];
    let conditions = [];

    if (options.startDate) {
      conditions.push(`timestamp >= ?`);
      params.push(options.startDate);
    }
    if (options.endDate) {
      conditions.push(`timestamp <= ?`);
      params.push(options.endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const rows = await executeQuery(query, params);

    if (rows.length > 0) {
      const row = rows[0];
      return {
        avgHumidity: parseFloat(row.avgHumidity) || 0,
        avgHeartRate: parseFloat(row.avgHeartRate) || 0,
        minHumidity: parseFloat(row.minHumidity) || 0,
        maxHumidity: parseFloat(row.maxHumidity) || 0,
        minHeartRate: row.minHeartRate || 0,
        maxHeartRate: row.maxHeartRate || 0,
        count: row.count || 0,
      };
    }
    return {};
  } catch (error) {
    console.error("RDS에서 수면 통계 가져오기 실패:", error);
    return {};
  }
}

/**
 * 일별 수면 통계 가져오기
 * @param {Object} options - 조회 옵션
 * @returns {Promise<Array>} - 일별 통계 배열
 */
async function getDailySleepStatistics(options = {}) {
  try {
    let query = `
      SELECT 
        DATE(timestamp) as date,
        AVG(humidity) as avgHumidity,
        AVG(heart_rate) as avgHeartRate,
        MIN(humidity) as minHumidity,
        MAX(humidity) as maxHumidity,
        MIN(heart_rate) as minHeartRate,
        MAX(heart_rate) as maxHeartRate,
        COUNT(*) as count
      FROM sensor_data
    `;
    let params = [];
    let conditions = [];

    if (options.startDate) {
      conditions.push(`timestamp >= ?`);
      params.push(options.startDate);
    }
    if (options.endDate) {
      conditions.push(`timestamp <= ?`);
      params.push(options.endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY DATE(timestamp) ORDER BY date DESC`;

    if (options.limit) {
      query += ` LIMIT ${parseInt(options.limit)}`;
    }

    const rows = await executeQuery(query, params);
    return rows.map(row => ({
      date: row.date,
      avgHumidity: parseFloat(row.avgHumidity) || 0,
      avgHeartRate: parseFloat(row.avgHeartRate) || 0,
      minHumidity: parseFloat(row.minHumidity) || 0,
      maxHumidity: parseFloat(row.maxHumidity) || 0,
      minHeartRate: row.minHeartRate || 0,
      maxHeartRate: row.maxHeartRate || 0,
      count: row.count || 0,
      avgSleepQuality: calculateSleepQualityScore(
        parseFloat(row.avgHumidity) || 0,
        parseFloat(row.avgHeartRate) || 0
      ),
    }));
  } catch (error) {
    console.error("RDS에서 일별 수면 통계 가져오기 실패:", error);
    return [];
  }
}

module.exports = {
  getCurrentSensorData,
  updateSensorData,
  getSensorDataRecords,
  getSensorDataRecordsFromDB,
  getCurrentDeviceStatus,
  updateDeviceStatus,
  getDeviceStatus,
  getDeviceStatusFromDB,
  getSleepDataRecords,
  getSleepDataRecordsFromDB,
  getSleepStatistics,
  getDailySleepStatistics,
};
