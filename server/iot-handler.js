const repository = require("./data/repository");
const automationController = require("./automation/controller");
const { fetchFitbitHeartRate } = require("./data/fitbit");

/**
 * AWS IoT Rules에서 트리거되는 Lambda 핸들러
 * MQTT 메시지를 받아서 처리합니다.
 */
exports.handler = async (event, context) => {
    console.log('IoT 메시지 수신:', JSON.stringify(event, null, 2));

    try {
        // IoT Rules에서 전달된 메시지 파싱
        const { topic, message, timestamp } = event;

        // 토픽별 처리
        if (topic.startsWith('sensors/sleep/')) {
            await handleSensorData(topic, message, timestamp);
        } else if (topic.startsWith('device/status/')) {
            await handleDeviceStatus(topic, message, timestamp);
        } else {
            console.log(`처리되지 않은 토픽: ${topic}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'IoT 메시지 처리 완료',
                topic: topic,
                timestamp: timestamp
            })
        };

    } catch (error) {
        console.error('IoT 메시지 처리 오류:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'IoT 메시지 처리 실패',
                message: error.message
            })
        };
    }
};

/**
 * 센서 데이터 처리
 */
async function handleSensorData(topic, message, timestamp) {
    console.log(`센서 데이터 처리: ${topic}`);

    if (topic === 'sensors/sleep/humidity') {
        const humidity = parseInt(message.value || message);
        console.log(`습도 데이터 수신: ${humidity}%`);

        // Fitbit 심박수 데이터 가져오기
        let heartRate = null;
        try {
            heartRate = await fetchFitbitHeartRate();
        } catch (error) {
            console.warn('Fitbit 데이터 가져오기 실패:', error.message);
        }

        // 센서 데이터 업데이트
        repository.updateSensorData({
            humidity,
            heartRate,
            timestamp: timestamp || new Date().toISOString()
        });

        // 자동화 처리 실행
        await automationController.processAutomation();

    } else if (topic === 'sensors/sleep/temperature') {
        const temperature = parseFloat(message.value || message);
        console.log(`온도 데이터 수신: ${temperature}°C`);

        repository.updateSensorData({
            temperature,
            timestamp: timestamp || new Date().toISOString()
        });

    } else if (topic === 'sensors/sleep/heartrate') {
        const heartRate = parseInt(message.value || message);
        console.log(`심박수 데이터 수신: ${heartRate}bpm`);

        repository.updateSensorData({
            heartRate,
            timestamp: timestamp || new Date().toISOString()
        });

        // 자동화 처리 실행
        await automationController.processAutomation();
    }
}

/**
 * 디바이스 상태 처리
 */
async function handleDeviceStatus(topic, message, timestamp) {
    console.log(`디바이스 상태 처리: ${topic}`);

    const deviceType = topic.split('/')[2]; // device/status/humidifier -> humidifier
    const status = message.status || message;

    console.log(`${deviceType} 상태 업데이트: ${status}`);

    // 디바이스 상태 업데이트
    const updateData = { [deviceType]: status };
    if (message.volume !== undefined) {
        updateData.volume = message.volume;
    }

    repository.updateDeviceStatus(updateData);
} 