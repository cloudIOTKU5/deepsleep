// 자동화 설정 기본값
let automationSettings = {
  enabled: true,
  humidityThreshold: 40, // 40% 이하면 가습기 켜기
  heartRateThreshold: 80, // 80bpm 이상이면 스피커로 백색소음 재생
};

// 자동화 설정 업데이트
function updateAutomationSettings(settings) {
  automationSettings = { ...automationSettings, ...settings };
  return automationSettings;
}

// 데이터 내보내기
module.exports = {
  getAutomationSettings: () => automationSettings,
  updateAutomationSettings,
};
