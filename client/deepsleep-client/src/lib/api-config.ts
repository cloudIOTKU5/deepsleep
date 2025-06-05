// API 기본 설정
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// API 엔드포인트
export const API_ENDPOINTS = {
  // 수면 환경 상태
  SLEEP_STATUS: `${API_BASE_URL}/sleep/status`,
  SLEEP_RECORDS: `${API_BASE_URL}/sleep/records`,
  
  // 디바이스 제어
  HUMIDIFIER_CONTROL: `${API_BASE_URL}/device/humidifier`,
  SPEAKER_CONTROL: `${API_BASE_URL}/device/speaker`,
  
  // 자동화 설정
  AUTOMATION_SETTINGS: `${API_BASE_URL}/settings/automation`,
  
  // AI 수면환경 분석
  SLEEP_ANALYSIS: {
    INSIGHTS: `${API_BASE_URL}/sleep-analysis/insights`,
    PREDICTION: `${API_BASE_URL}/sleep-analysis/prediction`,
    TRENDS: `${API_BASE_URL}/sleep-analysis/trends`,
  }
}; 