/**
 * 습도 점수 계산 함수
 * @param {number} humidity - 현재 습도 (0~100%)
 * @returns {number} - 0~100점 범위 점수
 */
function calculateHumidityScore(humidity) {
  const idealHumidity = 50; // 이상적인 습도 중심값
  const score = 100 - 2 * Math.abs(humidity - idealHumidity);
  return Math.max(0, Math.min(100, score)); // 0~100으로 제한
}

/**
 * 심박수 점수 계산 함수
 * @param {number} heartRate - 현재 심박수 (bpm)
 * @returns {number} - 0~100점 범위 점수
 */
function calculateHeartRateScore(heartRate) {
  const idealHeartRate = 65; // 이상적인 심박수 중심값
  const score = 100 - 3 * Math.abs(heartRate - idealHeartRate);
  return Math.max(0, Math.min(100, score)); // 0~100으로 제한
}

/**
 * 최종 수면 품질 점수 계산 함수
 * @param {number} humidity - 현재 습도
 * @param {number} heartRate - 현재 심박수
 * @returns {number} - 종합 수면 품질 점수 (0~100)
 */
function calculateSleepQualityScore(humidity, heartRate) {
  const humidityScore = calculateHumidityScore(humidity);
  const heartRateScore = calculateHeartRateScore(heartRate);

  // 가중치: 심박수 70%, 습도 30%
  const sleepQuality = 0.7 * heartRateScore + 0.3 * humidityScore;
  return Math.round(sleepQuality * 10) / 10; // 소수점 첫째 자리까지 반환
}

module.exports = {
  calculateSleepQualityScore,
};
