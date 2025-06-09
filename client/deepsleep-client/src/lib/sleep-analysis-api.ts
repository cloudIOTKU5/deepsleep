import { API_ENDPOINTS } from './api-config'

// 클라이언트에서 Node.js 서버로 보낼 API 요청 타입들

export interface SleepAnalysisRequest {
  humidity: number
  heartRate: number
  humidifierStatus: string
  speakerStatus: string
  volume: number
  sleepHistory: Array<{
    date: string
    averageHumidity: number
    averageHeartRate: number
    sleepQualityScore: number
  }>
}

// 서버에서 받을 응답 타입들
export interface InsightsResponse {
  success: boolean
  data: {
    insights: Array<{
      id: string
      type: 'info' | 'warning' | 'alert'
      priority: 'low' | 'medium' | 'high'
      title: string
      description: string
      confidence: number
    }>
    generatedAt: string
  }
  error?: string
}

export interface PredictionResponse {
  success: boolean
  data: {
    qualityScore: number
    reasoning: string
    factors: Array<{
      name: string
      value: string
      impact: 'positive' | 'negative' | 'neutral'
      explanation: string
    }>
    generatedAt: string
  }
  error?: string
}

export interface TrendsResponse {
  success: boolean
  data: {
    weeklyAnalysis: string
    humidityTrend: {
      current: number
      weeklyAverage: number
      trend: 'improving' | 'declining' | 'stable'
      analysis: string
    }
    heartRateTrend: {
      current: number
      weeklyAverage: number
      trend: 'improving' | 'declining' | 'stable'
      analysis: string
    }
    generatedAt: string
  }
  error?: string
}

// Node.js 서버 API 호출 함수들
export async function fetchInsights(request: SleepAnalysisRequest): Promise<InsightsResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.SLEEP_ANALYSIS.INSIGHTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    return {
      success: false,
      data: { insights: [], generatedAt: new Date().toISOString() },
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    }
  }
}

export async function fetchPrediction(request: SleepAnalysisRequest): Promise<PredictionResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.SLEEP_ANALYSIS.PREDICTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    return {
      success: false,
      data: {
        qualityScore: 0,
        reasoning: "",
        factors: [],
        generatedAt: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    }
  }
}

export async function fetchTrends(request: SleepAnalysisRequest): Promise<TrendsResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.SLEEP_ANALYSIS.TRENDS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    return {
      success: false,
      data: {
        weeklyAnalysis: "",
        humidityTrend: {
          current: 0,
          weeklyAverage: 0,
          trend: "stable" as const,
          analysis: "",
        },
        heartRateTrend: {
          current: 0,
          weeklyAverage: 0,
          trend: "stable" as const,
          analysis: "",
        },
        generatedAt: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    }
  }
}

/*
Node.js 서버에서 구현할 API 엔드포인트들:

POST /api/sleep-analysis/insights
POST /api/sleep-analysis/prediction  
POST /api/sleep-analysis/trends

각 엔드포인트는 SleepAnalysisRequest를 받아서
해당하는 Response 타입으로 응답해야 함.

서버에서는 이 요청을 받아서 LLM API (OpenAI, Claude 등)에 
적절한 프롬프트와 함께 전달하고, 응답을 파싱하여 
클라이언트에게 반환하는 구조.
*/
