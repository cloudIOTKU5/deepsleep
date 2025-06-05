// 클라이언트에서 Node.js 서버로 보낼 API 요청 타입들

export interface SleepAnalysisRequest {
  currentEnvironment: {
    humidity: number
    heartRate: number
    humidifierStatus: string
    speakerStatus: string
    volume: number
  }
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
      type: "positive" | "warning" | "suggestion"
      title: string
      description: string
      confidence: number
      priority: "high" | "medium" | "low"
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
      impact: "positive" | "negative" | "neutral"
      value: string
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
      trend: "improving" | "declining" | "stable"
      analysis: string
    }
    heartRateTrend: {
      current: number
      weeklyAverage: number
      trend: "improving" | "declining" | "stable"
      analysis: string
    }
    generatedAt: string
  }
  error?: string
}

// 임시 더미 데이터 (실제 서버 응답 형태)
const DUMMY_RESPONSES = {
  insights: {
    success: true,
    data: {
      insights: [
        {
          id: "humidity-analysis-001",
          type: "warning" as const,
          title: "습도 변동이 수면 품질에 영향을 줄 수 있습니다",
          description:
            "현재 습도 45%는 적정 범위이지만, 최근 3일간 38%~52% 사이에서 큰 변동을 보이고 있습니다. 일정한 습도 유지를 위해 가습기 자동화 설정을 더 세밀하게 조정하는 것을 권장합니다.",
          confidence: 87,
          priority: "medium" as const,
        },
        {
          id: "heartrate-analysis-001",
          type: "positive" as const,
          title: "심박수가 이상적인 수면 준비 상태를 보여줍니다",
          description:
            "현재 심박수 65bpm은 수면 전 최적 상태입니다. 지난 주 평균 68bpm에서 3bpm 감소하여 스트레스 관리와 이완 기법이 효과적으로 작용하고 있는 것으로 분석됩니다.",
          confidence: 92,
          priority: "low" as const,
        },
        {
          id: "device-optimization-001",
          type: "suggestion" as const,
          title: "스피커 볼륨 최적화로 더 나은 수면 효과를 기대할 수 있습니다",
          description:
            "현재 볼륨 30%는 적절하나, 수면 단계별 볼륨 조절을 통해 더 효과적인 수면 유도가 가능합니다. 입면 시 25%, 깊은 수면 단계에서는 15%로 점진적 감소를 제안합니다.",
          confidence: 78,
          priority: "medium" as const,
        },
        {
          id: "sleep-trend-analysis-001",
          type: "positive" as const,
          title: "수면 품질이 지속적으로 개선되는 긍정적 추세입니다",
          description:
            "최근 7일간 평균 수면 품질 점수 82점으로, 지난 주 대비 12% 향상되었습니다. 특히 습도 관리와 심박수 안정화가 주요 개선 요인으로 분석됩니다. 현재 환경 설정을 유지하시기 바랍니다.",
          confidence: 94,
          priority: "low" as const,
        },
      ],
      generatedAt: new Date().toISOString(),
    },
  },
  prediction: {
    success: true,
    data: {
      qualityScore: 84,
      reasoning:
        "현재 환경 조건과 최근 수면 패턴을 종합 분석한 결과, 오늘 밤 수면 품질은 84점으로 예상됩니다. 습도와 심박수가 모두 최적 범위에 있으며, 지난 3일간의 긍정적 트렌드가 지속될 것으로 보입니다. 특히 가습기와 스피커의 적절한 설정이 안정적인 수면 환경을 조성하고 있어 높은 품질의 수면이 기대됩니다.",
      factors: [
        {
          name: "습도 조건",
          impact: "positive" as const,
          value: "최적 범위 (45%)",
          explanation:
            "현재 습도는 수면에 이상적인 40-60% 범위 내에 있어 호흡기 편안함과 피부 건조 방지에 도움이 됩니다.",
        },
        {
          name: "심박수 안정성",
          impact: "positive" as const,
          value: "안정적 (65bpm)",
          explanation: "수면 전 심박수가 안정적이어서 빠른 수면 진입과 깊은 수면 단계 도달이 예상됩니다.",
        },
        {
          name: "환경 제어 시스템",
          impact: "positive" as const,
          value: "자동화 최적 설정",
          explanation: "가습기와 스피커가 적절히 설정되어 밤새 일관된 수면 환경을 유지할 것으로 예상됩니다.",
        },
        {
          name: "최근 수면 트렌드",
          impact: "positive" as const,
          value: "지속적 개선",
          explanation: "지난 주 대비 수면 품질이 꾸준히 향상되고 있어 오늘 밤도 좋은 결과가 기대됩니다.",
        },
      ],
      generatedAt: new Date().toISOString(),
    },
  },
  trends: {
    success: true,
    data: {
      weeklyAnalysis:
        "이번 주 수면 환경 분석 결과, 전반적으로 매우 긍정적인 변화를 보이고 있습니다. 습도 관리 시스템의 효율성이 크게 개선되어 변동폭이 15% 감소했으며, 심박수도 평균 3bpm 안정화되는 추세를 보입니다. 특히 주중에는 일정한 패턴을 유지하고 있으나, 주말에 약간의 불규칙성이 관찰되었습니다. 현재 설정된 자동화 시스템이 매우 효과적으로 작동하고 있어, 이 상태를 유지하시면 더욱 향상된 수면 품질을 기대할 수 있습니다. 다만 주말 수면 스케줄의 일관성 유지에 더 신경 쓰시기 바랍니다.",
      humidityTrend: {
        current: 45,
        weeklyAverage: 47,
        trend: "stable" as const,
        analysis:
          "습도가 매우 안정적으로 유지되고 있습니다. 가습기 자동화 설정의 효과로 최적 범위를 벗어나는 빈도가 지난 주 대비 60% 감소했습니다. 특히 야간 시간대의 습도 일관성이 크게 개선되어 수면 중 호흡기 불편함이 현저히 줄어들 것으로 예상됩니다.",
      },
      heartRateTrend: {
        current: 65,
        weeklyAverage: 68,
        trend: "improving" as const,
        analysis:
          "심박수가 지속적으로 개선되고 있는 매우 긍정적인 추세입니다. 스트레스 관리 기법과 이완 음악의 복합적 효과가 나타나고 있으며, 특히 수면 전 1시간 동안의 심박수 안정화가 뚜렷하게 관찰됩니다. 이는 더 빠른 수면 진입과 깊은 수면 단계 유지에 도움이 될 것입니다.",
      },
      generatedAt: new Date().toISOString(),
    },
  },
}

// Node.js 서버 API 호출 함수들
const API_BASE_URL = "/api/sleep-analysis"

export async function fetchInsights(request: SleepAnalysisRequest): Promise<InsightsResponse> {
  try {
    // 실제 서버 연결 시 사용할 코드
    /*
    const response = await fetch(`${API_BASE_URL}/insights`, {
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
    */

    // 임시 더미 데이터 (서버 응답 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))
    return DUMMY_RESPONSES.insights
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
    // 실제 서버 연결 시 사용할 코드
    /*
    const response = await fetch(`${API_BASE_URL}/prediction`, {
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
    */

    // 임시 더미 데이터 (서버 응답 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000))
    return DUMMY_RESPONSES.prediction
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
    // 실제 서버 연결 시 사용할 코드
    /*
    const response = await fetch(`${API_BASE_URL}/trends`, {
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
    */

    // 임시 더미 데이터 (서버 응답 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000))
    return DUMMY_RESPONSES.trends
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
