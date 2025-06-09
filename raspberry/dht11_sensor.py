#!/usr/bin/env python3
import time
import os
import random

# 라즈베리파이 환경 체크
try:
    import board
    import adafruit_dht

    RASPBERRY_PI = True
    print("Adafruit CircuitPython DHT 라이브러리를 사용합니다.")
except ImportError:
    RASPBERRY_PI = False
    print("DHT 라이브러리가 없습니다. 시뮬레이션 모드로 실행합니다.")


class DHT11Sensor:
    def __init__(self, pin=4):
        """
        DHT11 센서 초기화

        Args:
            pin (int): DHT11 센서가 연결된 GPIO 핀 번호 (기본값: 4)
        """
        self.pin = pin
        self.last_reading_time = 0
        self.min_reading_interval = 2  # DHT11은 최소 2초 간격으로 읽기 권장
        self.dht_device = None

        if RASPBERRY_PI:
            try:
                # GPIO 핀 매핑
                pin_map = {
                    2: board.D2,
                    3: board.D3,
                    4: board.D4,
                    5: board.D5,
                    6: board.D6,
                    7: board.D7,
                    8: board.D8,
                    9: board.D9,
                    10: board.D10,
                    11: board.D11,
                    12: board.D12,
                    13: board.D13,
                    14: board.D14,
                    15: board.D15,
                    16: board.D16,
                    17: board.D17,
                    18: board.D18,
                    19: board.D19,
                    20: board.D20,
                    21: board.D21,
                    22: board.D22,
                    23: board.D23,
                    24: board.D24,
                    25: board.D25,
                    26: board.D26,
                    27: board.D27,
                }

                if pin in pin_map:
                    board_pin = pin_map[pin]
                    self.dht_device = adafruit_dht.DHT11(board_pin)
                    print(f"DHT11 센서 초기화 완료 (GPIO 핀: {pin})")
                else:
                    print(
                        f"지원하지 않는 GPIO 핀: {pin}. 시뮬레이션 모드로 전환합니다."
                    )
                    RASPBERRY_PI = False

            except Exception as e:
                print(f"DHT11 센서 초기화 오류: {e}. 시뮬레이션 모드로 전환합니다.")
                RASPBERRY_PI = False

        if not RASPBERRY_PI:
            print("시뮬레이션 모드: 실제 센서 대신 랜덤 값을 생성합니다.")

    def read_humidity_temperature(self):
        """
        습도와 온도를 동시에 읽기

        Returns:
            tuple: (humidity, temperature) 또는 (None, None) if 읽기 실패
        """
        current_time = time.time()

        # 최소 읽기 간격 체크
        if current_time - self.last_reading_time < self.min_reading_interval:
            time.sleep(
                self.min_reading_interval - (current_time - self.last_reading_time)
            )

        if RASPBERRY_PI and self.dht_device:
            try:
                # 실제 DHT11 센서에서 읽기
                temperature = self.dht_device.temperature
                humidity = self.dht_device.humidity

                if humidity is not None and temperature is not None:
                    # 값 검증 (DHT11 범위: 습도 20-90%, 온도 0-50°C)
                    if 0 <= humidity <= 100 and -40 <= temperature <= 80:
                        self.last_reading_time = time.time()
                        return round(humidity, 1), round(temperature, 1)
                    else:
                        print(
                            f"센서 값이 범위를 벗어남: 습도={humidity}%, 온도={temperature}°C"
                        )
                        return None, None
                else:
                    print("센서에서 데이터를 읽을 수 없습니다.")
                    return None, None

            except RuntimeError as e:
                # DHT 센서는 가끔 읽기 오류가 발생할 수 있음
                error_msg = str(e)
                if "checksum did not validate" in error_msg:
                    print("체크섬 오류 (일시적 오류, 재시도 권장)")
                elif "timed out" in error_msg:
                    print("타임아웃 오류 (센서 응답 없음)")
                else:
                    print(f"DHT11 센서 읽기 오류: {e}")
                return None, None
            except Exception as e:
                print(f"예상치 못한 DHT11 센서 오류: {e}")
                return None, None
        else:
            # 시뮬레이션 모드: 랜덤 값 생성
            humidity = round(random.uniform(30, 70), 1)
            temperature = round(random.uniform(18, 28), 1)
            self.last_reading_time = time.time()
            return humidity, temperature

    def read_humidity(self):
        """
        습도만 읽기

        Returns:
            float: 습도 값 (%) 또는 None if 읽기 실패
        """
        humidity, _ = self.read_humidity_temperature()
        return humidity

    def read_temperature(self):
        """
        온도만 읽기

        Returns:
            float: 온도 값 (°C) 또는 None if 읽기 실패
        """
        _, temperature = self.read_humidity_temperature()
        return temperature

    def get_sensor_info(self):
        """
        센서 정보 반환

        Returns:
            dict: 센서 정보
        """
        return {
            "sensor_type": "DHT11",
            "gpio_pin": self.pin,
            "raspberry_pi_mode": RASPBERRY_PI and self.dht_device is not None,
            "min_reading_interval": self.min_reading_interval,
            "library": "adafruit-circuitpython-dht" if RASPBERRY_PI else "simulation",
        }

    def cleanup(self):
        """
        센서 리소스 정리
        """
        if RASPBERRY_PI and self.dht_device:
            try:
                self.dht_device.exit()
            except:
                pass


# 테스트 코드
if __name__ == "__main__":
    sensor = DHT11Sensor(pin=4)

    print("DHT11 센서 테스트 시작...")
    print(f"센서 정보: {sensor.get_sensor_info()}")

    try:
        for i in range(5):
            print(f"\n--- 측정 {i+1} ---")
            humidity, temperature = sensor.read_humidity_temperature()

            if humidity is not None and temperature is not None:
                print(f"습도: {humidity}%")
                print(f"온도: {temperature}°C")
            else:
                print("센서 읽기 실패")

            time.sleep(3)
    finally:
        sensor.cleanup()
        print("센서 정리 완료")
