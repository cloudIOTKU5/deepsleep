# 딥슬립 (DeepSleep) - 스마트 수면 관리 시스템

수면 중 습도와 심박수 데이터에 따라 가습기 및 스피커를 자동으로 조절하는 온프레미스 스마트 헬스케어 서비스입니다.

## 프로젝트 구조

```
deepsleep/
├── client/              # 웹 클라이언트
│   ├── css/             # CSS 파일
│   ├── js/              # JavaScript 파일
│   └── index.html       # 메인 페이지
├── server/              # Express.js 서버
│   ├── routes/          # API 라우트
│   └── server.js        # 서버 메인 파일
├── raspberry/           # 라즈베리 파이 코드
│   └── sleep_monitor.py # 수면 모니터링 및 기기 제어
├── mqtt/                # MQTT 브로커 설정
│   └── config/          # Mosquitto 설정
├── docker-compose.yml   # Docker Compose 설정
└── package.json         # Node.js 프로젝트 설정
```

## 기능

- 수면 중 습도와 심박수 실시간 모니터링
- 습도에 따른 가습기 자동 제어
- 심박수에 따른 백색소음 스피커 자동 제어
- 웹 인터페이스를 통한 수동 제어 및 자동화 설정
- RESTful API를 통한 서비스 인터페이스 제공
- MQTT를 이용한 서버와 라즈베리 파이 간 통신

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

| 메소드 | 엔드포인트               | 설명                     |
| ------ | ------------------------ | ------------------------ |
| GET    | /api/sleep/status        | 현재 수면 환경 상태 조회 |
| GET    | /api/sleep/records       | 수면 데이터 기록 조회    |
| POST   | /api/device/humidifier   | 가습기 제어              |
| POST   | /api/device/speaker      | 스피커 제어              |
| POST   | /api/settings/automation | 자동화 설정 관리         |

## 환경 변수

`.env` 파일을 생성하여 다음 환경 변수를 설정할 수 있습니다:

```
PORT=3000
MQTT_BROKER=mqtt://localhost:1883
FITBIT_ACCESS_TOKEN=your_token_here
```
