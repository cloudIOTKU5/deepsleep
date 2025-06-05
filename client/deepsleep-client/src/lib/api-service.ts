import axios from 'axios';
import { API_ENDPOINTS } from './api-config';

// axios 기본 설정
axios.defaults.withCredentials = true;

// 수면 환경 상태 조회
export const getSleepStatus = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.SLEEP_STATUS);
    return response.data;
  } catch (error) {
    console.error('수면 환경 상태 조회 실패:', error);
    throw error;
  }
};

// 수면 데이터 기록 조회
export const getSleepRecords = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.SLEEP_RECORDS);
    return response.data;
  } catch (error) {
    console.error('수면 데이터 기록 조회 실패:', error);
    throw error;
  }
};

// 가습기 제어
export const controlHumidifier = async (status: 'on' | 'off') => {
  try {
    const response = await axios.post(API_ENDPOINTS.HUMIDIFIER_CONTROL, { status });
    return response.data;
  } catch (error) {
    console.error('가습기 제어 실패:', error);
    throw error;
  }
};

// 스피커 제어
export const controlSpeaker = async (status: 'on' | 'off', volume?: number) => {
  try {
    const response = await axios.post(API_ENDPOINTS.SPEAKER_CONTROL, { status, volume });
    return response.data;
  } catch (error) {
    console.error('스피커 제어 실패:', error);
    throw error;
  }
};

// 자동화 설정 저장
export interface AutomationSettings {
  enabled: boolean;
  humidityThreshold: number;
  heartRateThreshold: number;
}

export const saveAutomationSettings = async (settings: AutomationSettings) => {
  try {
    const response = await axios.post(API_ENDPOINTS.AUTOMATION_SETTINGS, settings);
    return response.data;
  } catch (error) {
    console.error('자동화 설정 저장 실패:', error);
    throw error;
  }
};

// AI 수면환경 분석 API
export const sleepAnalysisApi = {
  // 인사이트 조회
  getInsights: async (data: any) => {
    try {
      const response = await axios.post(API_ENDPOINTS.SLEEP_ANALYSIS.INSIGHTS, data);
      return response.data;
    } catch (error) {
      console.error('수면 인사이트 조회 실패:', error);
      throw error;
    }
  },

  // 예측 조회
  getPrediction: async (data: any) => {
    try {
      const response = await axios.post(API_ENDPOINTS.SLEEP_ANALYSIS.PREDICTION, data);
      return response.data;
    } catch (error) {
      console.error('수면 예측 조회 실패:', error);
      throw error;
    }
  },

  // 트렌드 조회
  getTrends: async (data: any) => {
    try {
      const response = await axios.post(API_ENDPOINTS.SLEEP_ANALYSIS.TRENDS, data);
      return response.data;
    } catch (error) {
      console.error('수면 트렌드 조회 실패:', error);
      throw error;
    }
  }
}; 