class MockGPIOHandler:
    def control_humidifier(self, status):
        print(f"가습기 제어: {status}")

    def control_speaker(self, status, volume=50):
        print(f"스피커 제어: {status}, 볼륨: {volume}")

    def cleanup(self):
        print("GPIO 클린업")