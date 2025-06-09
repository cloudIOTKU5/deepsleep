require("dotenv").config();
const { connectToRDS, disconnectFromRDS, executeQuery } = require("./rds-config");
const repository = require("./repository");
const { calculateSleepQualityScore } = require("./analyzer");

/**
 * 로컬 테스트용 샘플 데이터 생성
 */
function generateSampleData(count = 50) {
    const sampleData = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        // 지난 7일간의 데이터 생성
        const timestamp = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)); // 2시간 간격

        // 시간대별로 다른 패턴의 데이터 생성
        const hour = timestamp.getHours();
        let baseHumidity, baseHeartRate;

        if (hour >= 22 || hour <= 6) {
            // 수면 시간 (22시-6시): 낮은 심박수, 적절한 습도
            baseHumidity = 45 + Math.random() * 10; // 45-55%
            baseHeartRate = 55 + Math.random() * 15; // 55-70 bpm
        } else if (hour >= 7 && hour <= 9) {
            // 기상 시간 (7-9시): 심박수 상승
            baseHumidity = 40 + Math.random() * 15; // 40-55%
            baseHeartRate = 70 + Math.random() * 20; // 70-90 bpm
        } else {
            // 일반 시간: 보통 수준
            baseHumidity = 35 + Math.random() * 20; // 35-55%
            baseHeartRate = 65 + Math.random() * 25; // 65-90 bpm
        }

        sampleData.push({
            humidity: Math.round(baseHumidity * 100) / 100,
            heartRate: Math.round(baseHeartRate),
            timestamp: timestamp,
            sleepQuality: calculateSleepQualityScore(baseHumidity, baseHeartRate)
        });
    }

    return sampleData.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * 샘플 데이터를 데이터베이스에 삽입
 */
async function insertSampleData() {
    console.log("=== 샘플 데이터 삽입 ===");

    try {
        const sampleData = generateSampleData(100);
        console.log(`${sampleData.length}개의 샘플 데이터를 생성했습니다.`);

        let insertCount = 0;
        for (const data of sampleData) {
            await repository.updateSensorData({
                humidity: data.humidity,
                heartRate: data.heartRate
            });
            insertCount++;

            if (insertCount % 20 === 0) {
                console.log(`${insertCount}개 데이터 삽입 완료...`);
            }
        }

        console.log(`✅ 총 ${insertCount}개의 샘플 데이터가 삽입되었습니다.`);

        // 장치 상태도 업데이트
        await repository.updateDeviceStatus({
            humidifier: "off",
            speaker: "off",
            volume: 0
        });

        console.log("✅ 초기 장치 상태가 설정되었습니다.");

    } catch (error) {
        console.error("❌ 샘플 데이터 삽입 실패:", error.message);
        throw error;
    }
}

/**
 * 데이터 조회 테스트
 */
async function testDataRetrieval() {
    console.log("\n=== 데이터 조회 테스트 ===");

    try {
        // 최근 센서 데이터 조회
        console.log("1. 최근 센서 데이터 조회 (10개)");
        const recentSensorData = await repository.getSensorDataRecordsFromDB({ limit: 10 });
        console.log(`✅ ${recentSensorData.length}개 센서 데이터 조회 성공`);
        if (recentSensorData.length > 0) {
            const latest = recentSensorData[0];
            console.log(`   최신 데이터: 습도 ${latest.humidity}%, 심박수 ${latest.heartRate}bpm`);
        }

        // 수면 데이터 조회
        console.log("\n2. 수면 데이터 조회 (10개)");
        const sleepData = await repository.getSleepDataRecordsFromDB({ limit: 10 });
        console.log(`✅ ${sleepData.length}개 수면 데이터 조회 성공`);
        if (sleepData.length > 0) {
            const latest = sleepData[0];
            console.log(`   최신 수면 품질: ${latest.sleepQualityScore}점`);
        }

        // 전체 통계
        console.log("\n3. 전체 통계 조회");
        const statistics = await repository.getSleepStatistics();
        console.log(`✅ 통계 조회 성공`);
        console.log(`   평균 습도: ${statistics.avgHumidity?.toFixed(1)}%`);
        console.log(`   평균 심박수: ${statistics.avgHeartRate?.toFixed(1)}bpm`);
        console.log(`   총 레코드 수: ${statistics.count}`);

        // 일별 통계
        console.log("\n4. 일별 통계 조회 (최근 7일)");
        const dailyStats = await repository.getDailySleepStatistics({ limit: 7 });
        console.log(`✅ ${dailyStats.length}일간의 일별 통계 조회 성공`);
        dailyStats.forEach((day, index) => {
            console.log(`   ${day.date}: 평균 수면 품질 ${day.avgSleepQuality?.toFixed(1)}점 (${day.count}개 레코드)`);
        });

        // 장치 상태 조회
        console.log("\n5. 장치 상태 조회");
        const deviceStatus = await repository.getDeviceStatusFromDB();
        console.log(`✅ 장치 상태 조회 성공`);
        console.log(`   가습기: ${deviceStatus.humidifier}, 스피커: ${deviceStatus.speaker}, 볼륨: ${deviceStatus.volume}`);

    } catch (error) {
        console.error("❌ 데이터 조회 테스트 실패:", error.message);
        throw error;
    }
}

/**
 * 날짜 범위 필터링 테스트
 */
async function testDateFiltering() {
    console.log("\n=== 날짜 범위 필터링 테스트 ===");

    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        // 최근 24시간 데이터
        console.log("1. 최근 24시간 데이터");
        const last24h = await repository.getSensorDataRecordsFromDB({
            startDate: yesterday,
            endDate: now
        });
        console.log(`✅ 최근 24시간: ${last24h.length}개 레코드`);

        // 최근 3일간 데이터
        console.log("\n2. 최근 3일간 데이터");
        const last3days = await repository.getSensorDataRecordsFromDB({
            startDate: threeDaysAgo,
            endDate: now
        });
        console.log(`✅ 최근 3일간: ${last3days.length}개 레코드`);

        // 최근 3일간 통계
        console.log("\n3. 최근 3일간 통계");
        const stats3days = await repository.getSleepStatistics({
            startDate: threeDaysAgo,
            endDate: now
        });
        console.log(`✅ 3일간 평균 습도: ${stats3days.avgHumidity?.toFixed(1)}%`);
        console.log(`   3일간 평균 심박수: ${stats3days.avgHeartRate?.toFixed(1)}bpm`);

    } catch (error) {
        console.error("❌ 날짜 필터링 테스트 실패:", error.message);
        throw error;
    }
}

/**
 * 수면 품질 분석 테스트
 */
async function testSleepQualityAnalysis() {
    console.log("\n=== 수면 품질 분석 테스트 ===");

    try {
        // 다양한 조건의 수면 품질 계산
        const testCases = [
            { humidity: 50, heartRate: 65, expected: "최적" },
            { humidity: 30, heartRate: 80, expected: "나쁨" },
            { humidity: 70, heartRate: 55, expected: "보통" },
            { humidity: 45, heartRate: 70, expected: "좋음" },
        ];

        console.log("수면 품질 점수 계산 테스트:");
        testCases.forEach((testCase, index) => {
            const score = calculateSleepQualityScore(testCase.humidity, testCase.heartRate);
            console.log(`${index + 1}. 습도 ${testCase.humidity}%, 심박수 ${testCase.heartRate}bpm → 점수: ${score}점 (${testCase.expected})`);
        });

        // 실제 데이터의 수면 품질 분포 분석
        console.log("\n실제 데이터의 수면 품질 분포:");
        const allSleepData = await repository.getSleepDataRecordsFromDB({ limit: 100 });

        const qualityRanges = {
            excellent: 0, // 90-100
            good: 0,      // 70-89
            fair: 0,      // 50-69
            poor: 0       // 0-49
        };

        allSleepData.forEach(data => {
            const score = data.sleepQualityScore;
            if (score >= 90) qualityRanges.excellent++;
            else if (score >= 70) qualityRanges.good++;
            else if (score >= 50) qualityRanges.fair++;
            else qualityRanges.poor++;
        });

        console.log(`✅ 우수 (90-100점): ${qualityRanges.excellent}개 (${(qualityRanges.excellent / allSleepData.length * 100).toFixed(1)}%)`);
        console.log(`   좋음 (70-89점): ${qualityRanges.good}개 (${(qualityRanges.good / allSleepData.length * 100).toFixed(1)}%)`);
        console.log(`   보통 (50-69점): ${qualityRanges.fair}개 (${(qualityRanges.fair / allSleepData.length * 100).toFixed(1)}%)`);
        console.log(`   나쁨 (0-49점): ${qualityRanges.poor}개 (${(qualityRanges.poor / allSleepData.length * 100).toFixed(1)}%)`);

    } catch (error) {
        console.error("❌ 수면 품질 분석 테스트 실패:", error.message);
        throw error;
    }
}

/**
 * 장치 제어 시뮬레이션 테스트
 */
async function testDeviceControlSimulation() {
    console.log("\n=== 장치 제어 시뮬레이션 테스트 ===");

    try {
        // 다양한 장치 상태 시뮬레이션
        const scenarios = [
            { humidifier: "on", speaker: "off", volume: 0, description: "습도 낮음 - 가습기 켜기" },
            { humidifier: "on", speaker: "on", volume: 30, description: "수면 환경 최적화" },
            { humidifier: "off", speaker: "on", volume: 50, description: "기상 시간 - 알람" },
            { humidifier: "off", speaker: "off", volume: 0, description: "정상 상태" },
        ];

        for (let i = 0; i < scenarios.length; i++) {
            const scenario = scenarios[i];
            console.log(`\n${i + 1}. ${scenario.description}`);

            await repository.updateDeviceStatus({
                humidifier: scenario.humidifier,
                speaker: scenario.speaker,
                volume: scenario.volume
            });

            const currentStatus = await repository.getDeviceStatusFromDB();
            console.log(`✅ 가습기: ${currentStatus.humidifier}, 스피커: ${currentStatus.speaker}, 볼륨: ${currentStatus.volume}`);

            // 1초 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error("❌ 장치 제어 시뮬레이션 실패:", error.message);
        throw error;
    }
}

/**
 * 전체 테스트 실행
 */
async function runAllTests() {
    console.log("🚀 로컬 데이터 처리 로직 테스트 시작");
    console.log("=====================================");

    try {
        // 데이터베이스 연결
        await connectToRDS();
        console.log("✅ 데이터베이스 연결 성공\n");

        // 1. 샘플 데이터 삽입
        await insertSampleData();

        // 2. 데이터 조회 테스트
        await testDataRetrieval();

        // 3. 날짜 필터링 테스트
        await testDateFiltering();

        // 4. 수면 품질 분석 테스트
        await testSleepQualityAnalysis();

        // 5. 장치 제어 시뮬레이션
        await testDeviceControlSimulation();

        console.log("\n🎉 모든 테스트가 성공적으로 완료되었습니다!");

    } catch (error) {
        console.error("\n❌ 테스트 실행 중 오류 발생:", error.message);
        throw error;
    } finally {
        await disconnectFromRDS();
        console.log("✅ 데이터베이스 연결 종료");
    }
}

/**
 * 테스트 데이터 정리
 */
async function cleanupTestData() {
    console.log("🧹 테스트 데이터 정리 중...");

    try {
        await connectToRDS();

        await executeQuery('DELETE FROM sensor_data');
        await executeQuery('DELETE FROM device_status');

        console.log("✅ 모든 테스트 데이터가 삭제되었습니다.");

    } catch (error) {
        console.error("❌ 테스트 데이터 정리 실패:", error.message);
    } finally {
        await disconnectFromRDS();
    }
}

// 명령행 실행
if (require.main === module) {
    const command = process.argv[2];

    switch (command) {
        case "all":
            runAllTests();
            break;
        case "sample":
            connectToRDS()
                .then(() => insertSampleData())
                .finally(() => disconnectFromRDS());
            break;
        case "query":
            connectToRDS()
                .then(() => testDataRetrieval())
                .finally(() => disconnectFromRDS());
            break;
        case "filter":
            connectToRDS()
                .then(() => testDateFiltering())
                .finally(() => disconnectFromRDS());
            break;
        case "analysis":
            connectToRDS()
                .then(() => testSleepQualityAnalysis())
                .finally(() => disconnectFromRDS());
            break;
        case "device":
            connectToRDS()
                .then(() => testDeviceControlSimulation())
                .finally(() => disconnectFromRDS());
            break;
        case "cleanup":
            cleanupTestData();
            break;
        default:
            console.log("로컬 데이터 처리 로직 테스트 도구");
            console.log("사용법:");
            console.log("  node local-test.js all      - 전체 테스트 실행");
            console.log("  node local-test.js sample   - 샘플 데이터 생성");
            console.log("  node local-test.js query    - 데이터 조회 테스트");
            console.log("  node local-test.js filter   - 날짜 필터링 테스트");
            console.log("  node local-test.js analysis - 수면 품질 분석 테스트");
            console.log("  node local-test.js device   - 장치 제어 시뮬레이션");
            console.log("  node local-test.js cleanup  - 테스트 데이터 정리");
    }
}

module.exports = {
    generateSampleData,
    insertSampleData,
    testDataRetrieval,
    testDateFiltering,
    testSleepQualityAnalysis,
    testDeviceControlSimulation,
    runAllTests,
    cleanupTestData,
}; 