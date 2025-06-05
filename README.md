# 딥슬립 (DeepSleep) - 스마트 수면 관리 시스템

수면 중 습도와 심박수 데이터에 따라 가습기 및 스피커를 자동으로 조절하는 온프레미스 스마트 헬스케어 서비스입니다.

## 프로젝트 구조

```
deepsleep/
├── client/                      # 웹 클라이언트
│   ├── css/                     # CSS 파일
│   ├── js/                      # JavaScript 파일
│   └── index.html               # 메인 페이지
├── server/                      # Express.js 서버
│   ├── automation/              # 디바이스 자동 제어 모듈
│   │   ├── controller.js        # 자동화 로직 처리
│   │   └── setting.js           # 자동화 설정 관리
│   ├── data/                    # 데이터 처리 모듈
│   │   ├── repository.js        # 센서 및 기기 상태 관리
│   │   └── fitbit.js            # Fitbit API 연동 (심박수 조회)
│   ├── routes/                  # API 라우트
│   │   └── sleep.js             # 수면 관련 모든 엔드포인트 정의
│   ├── services/                # AI 및 외부 API 서비스 모듈
│   │   └── gemini-service.js    # Gemini API 연동 (AI 수면 분석)
│   ├── mqtt.js                  # MQTT 클라이언트 설정
│   └── server.js                # 서버 진입점
├── raspberry/                   # 라즈베리 파이 코드
│   └── sleep_monitor.py         # 수면 모니터링 및 기기 제어
├── mqtt/                        # MQTT 브로커 설정
│   └── config/                  # Mosquitto 설정 파일
├── docker-compose.yml           # Docker Compose 설정
└── package.json                 # Node.js 프로젝트 설정
```

## 기능

- 수면 중 습도와 심박수 실시간 모니터링
- 습도에 따른 가습기 자동 제어
- 심박수에 따른 백색소음 스피커 자동 제어
- 웹 인터페이스를 통한 수동 제어 및 자동화 설정
- RESTful API를 통한 서비스 인터페이스 제공
- MQTT를 이용한 서버와 라즈베리 파이 간 통신
- AI 기반 수면 환경 인사이트 분석
- 수면 품질 예측
- 수면 트렌드 분석

## 설치 방법

1. 필요한 패키지 설치:

```bash
pnpm install
```

2. MQTT 브로커 실행 (Docker 필요):

```bash
docker-compose up -d
```

3. 서버 실행:

```bash
pnpm start
```

4. 라즈베리 파이에서 모니터링 스크립트 실행:

```bash
cd raspberry
pip install -r requirements.txt
python sleep_monitor.py
```

## 하드웨어 구성
- 라즈베리 파이: 센서 데이터 수집 및 기기 제어
- 습도 센서: 습도 데이터 수집
- 가습기: GPIO 핀을 통한 제어
- 스피커: GPIO 핀을 통한 제어
- Fitbit 밴드: 심박수 데이터 수집 (Fitbit API 연동)

## API 엔드포인트

| 메소드 | 엔드포인트                     | 설명                                                                                     |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------------- |
| GET    | /api/sleep/status              | 현재 수면 환경 상태 조회                                                                  |
| GET    | /api/sleep/records             | 수면 데이터 기록 조회                                                                     |
| POST   | /api/device/humidifier         | 가습기 제어 (`{ status: "on" | "off" }`)                                                   |
| POST   | /api/device/speaker            | 스피커 제어 (`{ status: "on" | "off", volume: 0 ~ 100 }`)                                 |
| POST   | /api/settings/automation       | 자동화 설정 관리 (`{ enabled: boolean, humidityThreshold: 0 ~ 100, heartRateThreshold: 40 ~ 200 }`) |
| POST   | /api/sleep-analysis/insights   | AI 수면 인사이트 분석 요청 (환경 데이터 및 수면 기록 포함)                                 |
| POST   | /api/sleep-analysis/prediction | 수면 품질 예측 요청 (환경 데이터 및 수면 기록 포함)                                        |
| POST   | /api/sleep-analysis/trends     | 수면 트렌드 분석 요청 (여러 개월/주 단위 데이터 포함)                                      |


### 요청/응답 예시

1. 현재 수면 환경 조회
- 	요청
```
GET /api/sleep/status
```

- 	응답
```
{
  "humidity": 55,
  "heartRate": 68,
  "humidifierStatus": "on",
  "speakerStatus": "off",
  "volume": 0
}
```


⸻

2. 수면 인사이트 분석
- 	요청
```
POST /api/sleep-analysis/insights
Content-Type: application/json

{
  "humidity": 55,
  "heartRate": 68,
  "humidifierStatus": "on",
  "speakerStatus": "off",
  "volume": 0,
  "sleepHistory": [
    { "date": "2025-06-01", "averageHumidity": 50, "averageHeartRate": 65, "sleepQualityScore": 75 },
    { "date": "2025-06-02", "averageHumidity": 60, "averageHeartRate": 70, "sleepQualityScore": 80 }
  ]
}
```

- 	응답
```
{
  "success": true,
  "data": [
    {
      "id": "insight-001",
      "type": "warning",
      "title": "습도 낮음",
      "description": "현재 습도가 55%로 권장 범위(60~70%)보다 낮습니다. 코골이나 건조함을 방지하기 위해 가습기 사용을 권장합니다.",
      "confidence": 85,
      "priority": "high"
    },
    {
      "id": "insight-002",
      "type": "info",
      "title": "심박수 안정적",
      "description": "최근 심박수 평균이 68bpm으로 정상 범위 내에 있습니다. 현재 수면 상태는 양호한 것으로 판단됩니다.",
      "confidence": 90,
      "priority": "medium"
    }
  ]
}
```


⸻

3. 수면 품질 예측
- 	요청
```
POST /api/sleep-analysis/prediction
Content-Type: application/json

{
  "humidity": 55,
  "heartRate": 68,
  "humidifierStatus": "on",
  "speakerStatus": "off",
  "volume": 0,
  "sleepHistory": [
    { "date": "2025-06-01", "averageHumidity": 50, "averageHeartRate": 65, "sleepQualityScore": 75 },
    { "date": "2025-06-02", "averageHumidity": 60, "averageHeartRate": 70, "sleepQualityScore": 80 }
  ]
}
```

- 	응답
```
{
  "success": true,
  "data": {
    "predictedQualityScore": 82,
    "recommendation": "가습기를 약하게 켜두고, 스피커 볼륨을 20으로 설정하여 백색소음을 재생하시길 권장합니다."
  }
}
```


⸻

4. 수면 트렌드 분석
- 	요청
```
POST /api/sleep-analysis/trends
Content-Type: application/json

{
  "startDate": "2025-05-01",
  "endDate": "2025-06-05",
  "sleepHistory": [
    { "date": "2025-05-01", "averageHumidity": 52, "averageHeartRate": 66, "sleepQualityScore": 78 },
    { "date": "2025-05-02", "averageHumidity": 54, "averageHeartRate": 67, "sleepQualityScore": 79 },
    ...
    { "date": "2025-06-05", "averageHumidity": 55, "averageHeartRate": 68, "sleepQualityScore": 81 }
  ]
}
```

- 	응답
```
{
  "success": true,
  "data": {
    "humidityTrend": "상승",
    "heartRateTrend": "안정",
    "qualityScoreTrend": "소폭 상승",
    "comments": "5월 초부터 전체적으로 습도와 수면 품질이 개선되는 추세입니다."
  }
}
```


⸻

### 환경 변수

.env 파일을 생성하여 다음 환경 변수를 설정할 수 있습니다:
```
PORT=3000
MQTT_BROKER=mqtt://localhost:1883
FITBIT_ACCESS_TOKEN=your_fitbit_access_token_here
GEMINI_API_KEY=your_gemini_api_key_here
```

- PORT: Express 서버가 실행될 포트 (기본값: 3000)
- MQTT_BROKER: MQTT 브로커 주소 (예: mqtt://localhost:1883)
- FITBIT_ACCESS_TOKEN: Fitbit API를 통해 심박수를 조회하기 위한 엑세스 토큰
- GEMINI_API_KEY: Google Gemini API를 사용한 AI 수면 분석을 위한 API 키
  - 발급 경로 : https://aistudio.google.com/apikey
