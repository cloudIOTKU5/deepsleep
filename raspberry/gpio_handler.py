import RPi.GPIO as GPIO

# GPIO 핀 설정
HUMIDIFIER_PIN = 17  # 가습기 제어용 GPIO 핀
SPEAKER_PIN = 18     # 스피커 제어용 GPIO 핀

class GPIOHandler:
    def __init__(self):
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(HUMIDIFIER_PIN, GPIO.OUT)
        GPIO.setup(SPEAKER_PIN, GPIO.OUT)
        
        # 초기 상태 설정 (둘 다 꺼짐)
        GPIO.output(HUMIDIFIER_PIN, GPIO.LOW)
        GPIO.output(SPEAKER_PIN, GPIO.LOW)
        
    def control_humidifier(self, status):
        GPIO.output(HUMIDIFIER_PIN, GPIO.HIGH if status else GPIO.LOW)
        
    def control_speaker(self, status, volume=50):
        GPIO.output(SPEAKER_PIN, GPIO.HIGH if status else GPIO.LOW)
        # 볼륨 조절 로직 (실제 환경에서는 스피커 라이브러리 사용)
        
    def cleanup(self):
        GPIO.cleanup()