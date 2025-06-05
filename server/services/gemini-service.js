const { GoogleGenerativeAI } = require("@google/generative-ai");

// Gemini API 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 프롬프트 템플릿
const PROMPT_TEMPLATES = {
  insights: `
당신은 수면 환경을 분석하고 개선 방안을 제시하는 AI 전문가입니다.
다음 데이터를 기반으로 수면 환경에 대한 인사이트를 제공해주세요:

현재 환경:
- 습도: {humidity}%
- 심박수: {heartRate}bpm
- 가습기 상태: {humidifierStatus}
- 스피커 상태: {speakerStatus}
- 볼륨: {volume}

최근 수면 기록:
{sleepHistory}

다음 형식으로 2-3개의 인사이트를 제공해주세요:
[
  {
    "id": "고유ID",
    "type": "warning/info/alert",
    "title": "간단한 제목",
    "description": "자세한 설명",
    "confidence": 신뢰도(0-100),
    "priority": "high/medium/low"
  }
]
`,

  prediction: `
당신은 수면 품질을 예측하고 분석하는 AI 전문가입니다.
다음 데이터를 기반으로 오늘 밤의 수면 품질을 예측해주세요:

현재 환경:
- 습도: {humidity}%
- 심박수: {heartRate}bpm
- 가습기 상태: {humidifierStatus}
- 스피커 상태: {speakerStatus}
- 볼륨: {volume}

최근 수면 기록:
{sleepHistory}

다음 형식으로 예측 결과를 제공해주세요:
{
  "qualityScore": 예상 수면 품질 점수(0-100),
  "reasoning": "예측 근거 설명",
  "factors": [
    {
      "name": "요인 이름",
      "impact": "positive/negative/neutral",
      "value": "현재 값",
      "explanation": "상세 설명"
    }
  ]
}
`,

  trends: `
당신은 수면 패턴을 분석하는 AI 전문가입니다.
다음 데이터를 기반으로 수면 환경 트렌드를 분석해주세요:

현재 환경:
- 습도: {humidity}%
- 심박수: {heartRate}bpm
- 가습기 상태: {humidifierStatus}
- 스피커 상태: {speakerStatus}
- 볼륨: {volume}

최근 수면 기록:
{sleepHistory}

다음 형식으로 트렌드 분석 결과를 제공해주세요:
{
  "weeklyAnalysis": "주간 종합 분석",
  "humidityTrend": {
    "current": 현재값,
    "weeklyAverage": 주간평균,
    "trend": "improving/declining/stable",
    "analysis": "습도 트렌드 분석"
  },
  "heartRateTrend": {
    "current": 현재값,
    "weeklyAverage": 주간평균,
    "trend": "improving/declining/stable",
    "analysis": "심박수 트렌드 분석"
  }
}
`
};

// 프롬프트 생성 함수
function createPrompt(template, data) {
  const { currentEnvironment, sleepHistory } = data;
  
  // 수면 기록 포맷팅
  const formattedHistory = sleepHistory
    .map(record => `${record.date}: 습도 ${record.averageHumidity}%, 심박수 ${record.averageHeartRate}bpm, 수면품질 ${record.sleepQualityScore}점`)
    .join("\n");

  // 템플릿의 플레이스홀더 치환
  return template
    .replace("{humidity}", currentEnvironment.humidity)
    .replace("{heartRate}", currentEnvironment.heartRate)
    .replace("{humidifierStatus}", currentEnvironment.humidifierStatus)
    .replace("{speakerStatus}", currentEnvironment.speakerStatus)
    .replace("{volume}", currentEnvironment.volume)
    .replace("{sleepHistory}", formattedHistory);
}

// Gemini API 호출 함수
async function getGeminiResponse(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini API 호출 실패:", error);
    throw error;
  }
}

// 수면 환경 인사이트 분석
async function analyzeSleepInsights(data) {
  const prompt = createPrompt(PROMPT_TEMPLATES.insights, data);
  return await getGeminiResponse(prompt);
}

// 수면 품질 예측
async function predictSleepQuality(data) {
  const prompt = createPrompt(PROMPT_TEMPLATES.prediction, data);
  return await getGeminiResponse(prompt);
}

// 수면 트렌드 분석
async function analyzeSleepTrends(data) {
  const prompt = createPrompt(PROMPT_TEMPLATES.trends, data);
  return await getGeminiResponse(prompt);
}

module.exports = {
  analyzeSleepInsights,
  predictSleepQuality,
  analyzeSleepTrends
}; 