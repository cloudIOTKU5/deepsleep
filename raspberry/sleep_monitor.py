#!/usr/bin/env python3
import time
import json
import random
import ssl
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
from dotenv import load_dotenv
import os

from mock import MockGPIOHandler
from dht11_sensor import DHT11Sensor

# 환경 변수 로드
load_dotenv()

# AWS IoT 설정
IOT_ENDPOINT = os.getenv("AWS_IOT_ENDPOINT")
IOT_CLIENT_ID = os.getenv("IOT_CLIENT_ID", "deepsleep-device")
IOT_CERT_PATH = os.getenv("IOT_CERT_PATH", "./certificates/certificate.pem.crt")
IOT_PRIVATE_KEY_PATH = os.getenv(
    "IOT_PRIVATE_KEY_PATH", "./certificates/private.pem.key"
)
IOT_ROOT_CA_PATH = os.getenv("IOT_ROOT_CA_PATH", "./certificates/AmazonRootCA1.pem")

# 자동화 설정
automation_enabled = True

# DHT11 센서 설정
DHT11_PIN = int(os.getenv("DHT11_PIN", "4"))  # GPIO 4번 핀 기본값


# GPIO 설정
def setup_gpio():
    global gpio_handler, dht11_sensor
    # gpio_handler = GPIOHandler()
    gpio_handler = MockGPIOHandler()  # 일반 PC 테스트용

    # DHT11 센서 초기화
    dht11_sensor = DHT11Sensor(pin=DHT11_PIN)
    print(f"DHT11 센서 설정 완료: {dht11_sensor.get_sensor_info()}")


# AWS IoT 연결 시 콜백
def on_connect():
    print("AWS IoT Core에 연결되었습니다.")


# AWS IoT 연결 해제 시 콜백
def on_disconnect():
    print("AWS IoT Core 연결이 해제되었습니다.")


# AWS IoT 메시지 수신 시 콜백
def on_message(client, userdata, message):
    print(f"메시지 수신: {message.topic} {message.payload.decode()}")

    try:
        payload = json.loads(message.payload.decode())

        if message.topic == "control/humidifier":
            control_humidifier(payload.get("status", "off"))

        elif message.topic == "control/speaker":
            control_speaker(payload.get("status", "off"), payload.get("volume", 50))

        elif message.topic == "settings/automation":
            update_automation_settings(payload)

    except json.JSONDecodeError:
        print("JSON 파싱 오류")
    except Exception as e:
        print(f"오류 발생: {e}")


# 가습기 제어
def control_humidifier(status):
    if status == "on":
        gpio_handler.control_humidifier(True)
        print("가습기가 켜졌습니다.")
        # 디바이스 상태를 AWS IoT로 전송
        publish_device_status("humidifier", "on")
    else:
        gpio_handler.control_humidifier(False)
        print("가습기가 꺼졌습니다.")
        # 디바이스 상태를 AWS IoT로 전송
        publish_device_status("humidifier", "off")


# 스피커 제어
def control_speaker(status, volume=50):
    if status == "on":
        gpio_handler.control_speaker(True, volume)
        print(f"스피커가 켜졌습니다. 볼륨: {volume}")
        # 디바이스 상태를 AWS IoT로 전송
        publish_device_status("speaker", "on", volume)
    else:
        gpio_handler.control_speaker(False)
        print("스피커가 꺼졌습니다.")
        # 디바이스 상태를 AWS IoT로 전송
        publish_device_status("speaker", "off")


# 디바이스 상태 전송
def publish_device_status(device_type, status, volume=None):
    try:
        topic = f"device/status/{device_type}"
        payload = {"status": status, "timestamp": int(time.time() * 1000)}

        if volume is not None:
            payload["volume"] = volume

        iot_client.publish(topic, json.dumps(payload), 1)
        print(f"디바이스 상태 전송: {topic} - {payload}")
    except Exception as e:
        print(f"디바이스 상태 전송 오류: {e}")


# 자동화 설정 업데이트
def update_automation_settings(settings):
    global automation_enabled

    if "enabled" in settings:
        automation_enabled = settings["enabled"]

    print(f"자동화 설정 업데이트: 활성화 = {automation_enabled}")


# DHT11 센서로 습도와 온도 측정
def get_sensor_data():
    """
    DHT11 센서에서 습도와 온도 데이터를 읽어옵니다.

    Returns:
        dict: {"humidity": float, "temperature": float} 또는 None if 읽기 실패
    """
    try:
        humidity, temperature = dht11_sensor.read_humidity_temperature()

        if humidity is not None and temperature is not None:
            return {"humidity": humidity, "temperature": temperature}
        else:
            print("센서 데이터 읽기 실패, 이전 값 또는 기본값 사용")
            return None

    except Exception as e:
        print(f"센서 데이터 읽기 오류: {e}")
        return None


# 습도만 측정 (하위 호환성)
def get_humidity():
    """
    습도 값만 반환 (하위 호환성을 위한 함수)

    Returns:
        float: 습도 값 또는 기본값
    """
    sensor_data = get_sensor_data()
    if sensor_data:
        return sensor_data["humidity"]
    else:
        # 센서 읽기 실패 시 기본값 반환
        return 50.0


# AWS IoT 클라이언트 초기화
def setup_iot_client():
    global iot_client

    # AWS IoT MQTT 클라이언트 생성
    iot_client = AWSIoTMQTTClient(IOT_CLIENT_ID)
    iot_client.configureEndpoint(IOT_ENDPOINT, 8883)
    iot_client.configureCredentials(
        IOT_ROOT_CA_PATH, IOT_PRIVATE_KEY_PATH, IOT_CERT_PATH
    )

    # 연결 설정
    iot_client.configureAutoReconnectBackoffTime(1, 32, 20)
    iot_client.configureOfflinePublishQueueing(-1)  # 무제한 큐잉
    iot_client.configureDrainingFrequency(2)  # 2Hz로 드레이닝
    iot_client.configureConnectDisconnectTimeout(10)  # 10초 타임아웃
    iot_client.configureMQTTOperationTimeout(5)  # 5초 MQTT 작업 타임아웃

    return iot_client


# 메인 함수
def main():
    global iot_client

    # GPIO 초기화
    setup_gpio()

    try:
        # AWS IoT 클라이언트 설정
        iot_client = setup_iot_client()

        # AWS IoT Core 연결
        print("AWS IoT Core에 연결 중...")
        iot_client.connect()
        print("AWS IoT Core 연결 완료")

        # 제어 명령 수신 토픽 구독
        iot_client.subscribe("control/humidifier", 1, on_message)
        iot_client.subscribe("control/speaker", 1, on_message)
        iot_client.subscribe("settings/automation", 1, on_message)

        print("수면 모니터링 시스템 시작 (AWS IoT Core 연동)")

        # 메인 루프
        while True:
            # DHT11 센서에서 습도와 온도 측정
            sensor_data = get_sensor_data()

            if sensor_data:
                humidity = sensor_data["humidity"]
                temperature = sensor_data["temperature"]
                print(f"현재 측정값: 습도 {humidity}%, 온도 {temperature}°C")

                # 습도 데이터를 AWS IoT로 전송
                humidity_payload = {
                    "value": humidity,
                    "timestamp": int(time.time() * 1000),
                    "device_id": IOT_CLIENT_ID,
                    "sensor_type": "DHT11",
                }
                iot_client.publish(
                    "sensors/sleep/humidity", json.dumps(humidity_payload), 1
                )

                # 온도 데이터를 AWS IoT로 전송
                temperature_payload = {
                    "value": temperature,
                    "timestamp": int(time.time() * 1000),
                    "device_id": IOT_CLIENT_ID,
                    "sensor_type": "DHT11",
                }
                iot_client.publish(
                    "sensors/sleep/temperature", json.dumps(temperature_payload), 1
                )

            else:
                print("센서 데이터 읽기 실패, 다음 주기에 재시도합니다.")

            time.sleep(10)  # 10초마다 체크

    except KeyboardInterrupt:
        print("프로그램 종료")
    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        try:
            iot_client.disconnect()
            print("AWS IoT Core 연결 해제")
        except:
            pass
        gpio_handler.cleanup()


if __name__ == "__main__":
    main()
