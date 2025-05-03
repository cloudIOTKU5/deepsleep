#!/usr/bin/env python3
import time
import json
import random
import paho.mqtt.client as mqtt
from dotenv import load_dotenv
import os

from mock import MockGPIOHandler

# 환경 변수 로드
load_dotenv()

# MQTT 설정
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_KEEPALIVE = 60

# 자동화 설정
automation_enabled = True

# GPIO 설정
def setup_gpio():
    global gpio_handler
    # gpio_handler = GPIOHandler()
    gpio_handler = MockGPIOHandler() # 일반 PC 테스트용

# MQTT 연결 시 콜백
def on_connect(client, userdata, flags, rc):
    print(f"MQTT 브로커에 연결됨, 결과 코드: {rc}")
    # 제어 명령 수신 토픽 구독
    client.subscribe("control/humidifier")
    client.subscribe("control/speaker")
    client.subscribe("settings/automation")

# MQTT 메시지 수신 시 콜백
def on_message(client, userdata, msg):
    print(f"메시지 수신: {msg.topic} {msg.payload.decode()}")
    
    try:
        payload = json.loads(msg.payload.decode())
        
        if msg.topic == "control/humidifier":
            control_humidifier(payload.get("status", "off"))
            
        elif msg.topic == "control/speaker":
            control_speaker(payload.get("status", "off"), payload.get("volume", 50))
            
        elif msg.topic == "settings/automation":
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
    else:
        gpio_handler.control_humidifier(False)
        print("가습기가 꺼졌습니다.")

# 스피커 제어
def control_speaker(status, volume=50):
    if status == "on":
        gpio_handler.control_speaker(True, volume)
        print(f"스피커가 켜졌습니다. 볼륨: {volume}")
    else:
        gpio_handler.control_speaker(False)
        print("스피커가 꺼졌습니다.")

# 자동화 설정 업데이트
def update_automation_settings(settings):
    global automation_enabled
    
    if "enabled" in settings:
        automation_enabled = settings["enabled"]
    
    print(f"자동화 설정 업데이트: 활성화 = {automation_enabled}")

# 습도 측정 (실제 환경에서는 DHT22 센서 사용)
def get_humidity():
    # 시뮬레이션: 30-70% 사이의 습도 값 임의 생성
    return random.randint(30, 70)

# 메인 함수
def main():
    global client
    
    # GPIO 초기화
    setup_gpio()
    
    # MQTT 클라이언트 설정
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        # MQTT 브로커 연결
        client.connect(MQTT_BROKER, MQTT_PORT, MQTT_KEEPALIVE)
        
        # 백그라운드 스레드로 MQTT 클라이언트 실행
        client.loop_start()
        
        print("수면 모니터링 시스템 시작")
        
        # 메인 루프
        while True:
            # 습도 측정 및 서버로 전송
            humidity = get_humidity()
            print(f"현재 측정값: 습도 {humidity}%")
            client.publish("sensors/sleep/humidity", str(humidity))
            
            time.sleep(10)  # 10초마다 체크
            
    except KeyboardInterrupt:
        print("프로그램 종료")
    finally:
        client.loop_stop()
        gpio_handler.cleanup()

if __name__ == "__main__":
    main() 