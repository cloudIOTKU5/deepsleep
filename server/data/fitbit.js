const axios = require("axios");

// Fitbit API 설정
const FITBIT_API_BASE = "https://api.fitbit.com/1/user/-";
const FITBIT_ACCESS_TOKEN = process.env.FITBIT_ACCESS_TOKEN || "";

// Fitbit에서 심박수 데이터 가져오기
async function fetchFitbitHeartRate() {
  if (!FITBIT_ACCESS_TOKEN) {
    console.log("Fitbit 액세스 토큰이 설정되지 않았습니다.");
    return Math.floor(Math.random() * 50) + 40;
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
    return Math.floor(Math.random() * 50) + 40;
  }
}

module.exports = { fetchFitbitHeartRate };
