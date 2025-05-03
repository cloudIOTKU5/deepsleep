// DOM 요소 참조
const currentHumidity = document.getElementById("current-humidity");
const currentHeartRate = document.getElementById("current-heartrate");
const humidifierStatus = document.getElementById("humidifier-status");
const speakerStatus = document.getElementById("speaker-status");
const humidifierToggle = document.getElementById("humidifier-toggle");
const speakerToggle = document.getElementById("speaker-toggle");
const volumeControl = document.getElementById("volume-control");
const volumeValue = document.getElementById("volume-value");
const automationToggle = document.getElementById("automation-toggle");
const humidityThreshold = document.getElementById("humidity-threshold");
const humidityThresholdValue = document.getElementById(
  "humidity-threshold-value"
);
const heartrateThreshold = document.getElementById("heartrate-threshold");
const heartrateThresholdValue = document.getElementById(
  "heartrate-threshold-value"
);
const saveSettingsBtn = document.getElementById("save-settings");
const sleepRecordsTable = document.getElementById("sleep-records");

// API URL (프로덕션에서는 실제 서버 주소로 변경)
const API_BASE_URL = "/api";

// 현재 값
let currentSpeakerVolume = 50;

// 설정 변경 시 UI 업데이트
volumeControl.addEventListener("input", () => {
  volumeValue.textContent = volumeControl.value;
  currentSpeakerVolume = parseInt(volumeControl.value);
});

humidityThreshold.addEventListener("input", () => {
  humidityThresholdValue.textContent = humidityThreshold.value;
});

heartrateThreshold.addEventListener("input", () => {
  heartrateThresholdValue.textContent = heartrateThreshold.value;
});

// 가습기 상태 변경
humidifierToggle.addEventListener("change", async () => {
  try {
    const status = humidifierToggle.checked ? "on" : "off";
    const response = await axios.post(`${API_BASE_URL}/device/humidifier`, {
      status,
    });

    if (response.data.success) {
      updateHumidifierStatus(status);
    }
  } catch (error) {
    console.error("가습기 제어 오류:", error);
    alert("가습기 제어에 실패했습니다.");
    humidifierToggle.checked = !humidifierToggle.checked; // 오류 시 토글 상태 되돌리기
  }
});

// 스피커 상태 변경
speakerToggle.addEventListener("change", async () => {
  try {
    const status = speakerToggle.checked ? "on" : "off";
    const response = await axios.post(`${API_BASE_URL}/device/speaker`, {
      status,
      volume: currentSpeakerVolume,
    });

    if (response.data.success) {
      updateSpeakerStatus(status);
    }
  } catch (error) {
    console.error("스피커 제어 오류:", error);
    alert("스피커 제어에 실패했습니다.");
    speakerToggle.checked = !speakerToggle.checked; // 오류 시 토글 상태 되돌리기
  }
});

// 자동화 설정 저장
saveSettingsBtn.addEventListener("click", async () => {
  try {
    const settings = {
      enabled: automationToggle.checked,
      humidityThreshold: parseInt(humidityThreshold.value),
      heartRateThreshold: parseInt(heartrateThreshold.value),
    };

    const response = await axios.post(
      `${API_BASE_URL}/settings/automation`,
      settings
    );

    if (response.data.success) {
      alert("설정이 저장되었습니다.");
    }
  } catch (error) {
    console.error("설정 저장 오류:", error);
    alert("설정 저장에 실패했습니다.");
  }
});

// 가습기 상태 UI 업데이트
function updateHumidifierStatus(status) {
  humidifierStatus.textContent = status === "on" ? "켜짐" : "꺼짐";
  humidifierStatus.className = `badge ${status === "on" ? "on" : "off"}`;
  humidifierToggle.checked = status === "on";
}

// 스피커 상태 UI 업데이트
function updateSpeakerStatus(status) {
  speakerStatus.textContent = status === "on" ? "켜짐" : "꺼짐";
  speakerStatus.className = `badge ${status === "on" ? "on" : "off"}`;
  speakerToggle.checked = status === "on";
}

// 현재 상태 가져오기
async function fetchCurrentStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/sleep/status`);
    const data = response.data;

    // 값 업데이트
    currentHumidity.textContent = data.humidity;
    currentHeartRate.textContent = data.heartRate;

    // 장치 상태 업데이트
    updateHumidifierStatus(data.humidifierStatus);
    updateSpeakerStatus(data.speakerStatus);
  } catch (error) {
    console.error("상태 조회 오류:", error);
  }
}

// 수면 기록 가져오기
async function fetchSleepRecords() {
  try {
    const response = await axios.get(`${API_BASE_URL}/sleep/records`);
    const records = response.data;

    // 테이블 비우기
    sleepRecordsTable.innerHTML = "";

    // 기록 표시
    records.forEach((record) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.averageHumidity}%</td>
                <td>${record.averageHeartRate} bpm</td>
                <td>${record.sleepQualityScore}</td>
            `;
      sleepRecordsTable.appendChild(row);
    });
  } catch (error) {
    console.error("기록 조회 오류:", error);
  }
}

// 페이지 로드 시 초기 데이터 불러오기
document.addEventListener("DOMContentLoaded", () => {
  fetchCurrentStatus();
  fetchSleepRecords();

  // 10초마다 상태 업데이트
  setInterval(fetchCurrentStatus, 10000);
});
