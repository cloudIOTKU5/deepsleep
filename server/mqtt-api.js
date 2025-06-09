const AWS = require('aws-sdk');
require("dotenv").config();

// AWS IoT Data 클라이언트 설정
const iotData = new AWS.IotData({
    endpoint: process.env.AWS_IOT_ENDPOINT,
    region: process.env.AWS_REGION || 'ap-northeast-2'
});

/**
 * IoT Core에 메시지 발행
 */
async function publishToIoT(topic, payload) {
    try {
        const params = {
            topic: topic,
            payload: JSON.stringify(payload),
            qos: 1
        };

        const result = await iotData.publish(params).promise();
        console.log(`IoT 메시지 발행 성공 - 토픽: ${topic}`);
        return result;
    } catch (error) {
        console.error(`IoT 메시지 발행 실패 - 토픽: ${topic}`, error);
        throw error;
    }
}

/**
 * IoT Core에서 디바이스 섀도우 가져오기
 */
async function getDeviceShadow(thingName) {
    try {
        const params = {
            thingName: thingName
        };

        const result = await iotData.getThingShadow(params).promise();
        const shadow = JSON.parse(result.payload);
        console.log(`디바이스 섀도우 조회 성공: ${thingName}`);
        return shadow;
    } catch (error) {
        console.error(`디바이스 섀도우 조회 실패: ${thingName}`, error);
        throw error;
    }
}

/**
 * IoT Core에 디바이스 섀도우 업데이트
 */
async function updateDeviceShadow(thingName, state) {
    try {
        const payload = {
            state: {
                desired: state
            }
        };

        const params = {
            thingName: thingName,
            payload: JSON.stringify(payload)
        };

        const result = await iotData.updateThingShadow(params).promise();
        console.log(`디바이스 섀도우 업데이트 성공: ${thingName}`);
        return result;
    } catch (error) {
        console.error(`디바이스 섀도우 업데이트 실패: ${thingName}`, error);
        throw error;
    }
}

/**
 * 가습기 제어 (IoT Core 통해)
 */
async function controlHumidifier(status) {
    const topic = 'control/humidifier';
    const payload = {
        status: status,
        timestamp: new Date().toISOString(),
        source: 'lambda-api'
    };

    await publishToIoT(topic, payload);

    // 디바이스 섀도우도 업데이트
    await updateDeviceShadow('deepsleep-device', {
        humidifier: status
    });

    return { success: true, message: `가습기가 ${status}되었습니다.` };
}

/**
 * 스피커 제어 (IoT Core 통해)
 */
async function controlSpeaker(status, volume = 50) {
    const topic = 'control/speaker';
    const payload = {
        status: status,
        volume: volume,
        timestamp: new Date().toISOString(),
        source: 'lambda-api'
    };

    await publishToIoT(topic, payload);

    // 디바이스 섀도우도 업데이트
    await updateDeviceShadow('deepsleep-device', {
        speaker: status,
        volume: volume
    });

    return {
        success: true,
        message: status === 'on'
            ? `스피커가 켜졌습니다. 볼륨: ${volume}`
            : '스피커가 꺼졌습니다.'
    };
}

/**
 * 자동화 설정 전송 (IoT Core 통해)
 */
async function sendAutomationSettings(enabled) {
    const topic = 'settings/automation';
    const payload = {
        enabled: enabled,
        timestamp: new Date().toISOString(),
        source: 'lambda-api'
    };

    await publishToIoT(topic, payload);

    return {
        success: true,
        message: enabled
            ? '자동화가 활성화되었습니다.'
            : '자동화가 비활성화되었습니다.'
    };
}

/**
 * 현재 디바이스 상태 조회
 */
async function getDeviceStatus() {
    try {
        const shadow = await getDeviceShadow('deepsleep-device');
        return {
            success: true,
            data: shadow.state.reported || shadow.state.desired || {}
        };
    } catch (error) {
        // 섀도우가 없는 경우 기본값 반환
        return {
            success: true,
            data: {
                humidifier: 'off',
                speaker: 'off',
                volume: 50
            }
        };
    }
}

module.exports = {
    publishToIoT,
    getDeviceShadow,
    updateDeviceShadow,
    controlHumidifier,
    controlSpeaker,
    sendAutomationSettings,
    getDeviceStatus
}; 