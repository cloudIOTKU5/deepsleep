#!/usr/bin/env python3
import time
import json
import random
import paho.mqtt.client as mqtt
import RPi.GPIO as GPIO
import requests
from dotenv import load_dotenv
import os

# 환경 변수 로드
load_dotenv()

# MQTT 설정
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_KEEPALIVE = 60

# GPIO 핀 설정
HUMIDIFIER_PIN = 17  # 가습기 제어용 GPIO 핀
SPEAKER_PIN = 18     # 스피커 제어용 GPIO 핀

# Fitbit API 설정 (실제 환경에서 필요)
FITBIT_API_BASE = "https://api.fitbit.com/1/user/-"
FITBIT_ACCESS_TOKEN = os.getenv("FITBIT_ACCESS_TOKEN", "")

# 자동화 설정 기본값
automation_settings = {
    "enabled": True,
    "humidityThreshold": 40,  # 40% 이하면 가습기 켜기
    "heartRateThreshold": 80,  # 80bpm 이상이면 스피커로 백색소음 재생
}

# GPIO 설정
def setup_gpio():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(HUMIDIFIER_PIN, GPIO.OUT)
    GPIO.setup(SPEAKER_PIN, GPIO.OUT)
    
    # 초기 상태 설정 (둘 다 꺼짐)
    GPIO.output(HUMIDIFIER_PIN, GPIO.LOW)
    GPIO.output(SPEAKER_PIN, GPIO.LOW)

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
        GPIO.output(HUMIDIFIER_PIN, GPIO.HIGH)
        print("가습기가 켜졌습니다.")
    else:
        GPIO.output(HUMIDIFIER_PIN, GPIO.LOW)
        print("가습기가 꺼졌습니다.")

# 스피커 제어
def control_speaker(status, volume=50):
    if status == "on":
        GPIO.output(SPEAKER_PIN, GPIO.HIGH)
        print(f"스피커가 켜졌습니다. 볼륨: {volume}")
        # 볼륨 조절 로직 (실제 환경에서는 스피커 라이브러리 사용)
    else:
        GPIO.output(SPEAKER_PIN, GPIO.LOW)
        print("스피커가 꺼졌습니다.")

# 자동화 설정 업데이트
def update_automation_settings(settings):
    global automation_settings
    
    if "enabled" in settings:
        automation_settings["enabled"] = settings["enabled"]
    
    if "humidityThreshold" in settings:
        automation_settings["humidityThreshold"] = settings["humidityThreshold"]
    
    if "heartRateThreshold" in settings:
        automation_settings["heartRateThreshold"] = settings["heartRateThreshold"]
    
    print(f"자동화 설정 업데이트: {automation_settings}")

# 습도 측정 (실제 환경에서는 DHT22 센서 사용)
def get_humidity():
    # 시뮬레이션: 30-70% 사이의 습도 값 임의 생성
    return random.randint(30, 70)

# Fitbit에서 심박수 데이터 가져오기 (실제 환경에서는 Fitbit API 사용)
def get_heart_rate():
    if FITBIT_ACCESS_TOKEN:
        try:
            # 실제 Fitbit API 호출 추후 구현
            # headers = {"Authorization": f"Bearer {FITBIT_ACCESS_TOKEN}"}
            # response = requests.get(f"{FITBIT_API_BASE}/activities/heart/date/today/1d.json", headers=headers)
            # data = response.json()
            # return data["activities-heart"][0]["value"]["restingHeartRate"]
            pass
        except Exception as e:
            print(f"Fitbit API 호출 오류: {e}")
    
    # 시뮬레이션: 50-100bpm 사이의 심박수 값
    return random.randint(50, 100)

# 자동화 제어 로직
def process_automation():
    if not automation_settings["enabled"]:
        return
    
    humidity = get_humidity()
    heart_rate = get_heart_rate()
    
    print(f"현재 측정값: 습도 {humidity}%, 심박수 {heart_rate}bpm")
    
    # MQTT로 센서 데이터 발행
    client.publish("sensors/sleep/humidity", str(humidity))
    client.publish("sensors/sleep/heartrate", str(heart_rate))
    
    # 습도에 따른 가습기 제어
    if humidity < automation_settings["humidityThreshold"]:
        control_humidifier("on")
    else:
        control_humidifier("off")
    
    # 심박수에 따른 스피커 제어
    if heart_rate > automation_settings["heartRateThreshold"]:
        control_speaker("on", 30)  # 낮은 볼륨으로 백색소음 재생 (30 임의 설정)
    else:
        control_speaker("off")

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
            process_automation()
            time.sleep(10)  # 10초마다 체크
            
    except KeyboardInterrupt:
        print("프로그램 종료")
    finally:
        client.loop_stop()
        GPIO.cleanup()

if __name__ == "__main__":
    main() 