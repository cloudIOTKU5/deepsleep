#!/usr/bin/env python3
"""
DHT11 센서 테스트 스크립트

이 스크립트는 DHT11 센서가 올바르게 연결되고 작동하는지 테스트합니다.
"""

import time
import sys
from dht11_sensor import DHT11Sensor


def main():
    print("=== DHT11 센서 테스트 ===")
    print("Ctrl+C로 종료할 수 있습니다.\n")

    # DHT11 센서 초기화 (GPIO 4번 핀)
    sensor = DHT11Sensor(pin=4)

    # 센서 정보 출력
    sensor_info = sensor.get_sensor_info()
    print(f"센서 정보:")
    for key, value in sensor_info.items():
        print(f"  {key}: {value}")
    print()

    # 연속 측정
    measurement_count = 0
    success_count = 0

    try:
        while True:
            measurement_count += 1
            print(f"--- 측정 #{measurement_count} ---")

            # 습도와 온도 동시 측정
            humidity, temperature = sensor.read_humidity_temperature()

            if humidity is not None and temperature is not None:
                success_count += 1
                print(f"✓ 습도: {humidity}%")
                print(f"✓ 온도: {temperature}°C")

                # 간단한 상태 평가
                if humidity < 30:
                    print("  → 습도가 낮습니다 (건조)")
                elif humidity > 70:
                    print("  → 습도가 높습니다 (습함)")
                else:
                    print("  → 습도가 적절합니다")

                if temperature < 18:
                    print("  → 온도가 낮습니다 (추움)")
                elif temperature > 28:
                    print("  → 온도가 높습니다 (더움)")
                else:
                    print("  → 온도가 적절합니다")

            else:
                print("✗ 센서 읽기 실패")
                print("  → 센서 연결을 확인하세요")
                print("  → 전원 공급을 확인하세요")
                print("  → 풀업 저항(10kΩ)이 연결되어 있는지 확인하세요")

            # 성공률 계산
            success_rate = (success_count / measurement_count) * 100
            print(f"성공률: {success_rate:.1f}% ({success_count}/{measurement_count})")
            print()

            # 3초 대기 (DHT11 권장 간격)
            time.sleep(3)

    except KeyboardInterrupt:
        print("\n\n=== 테스트 종료 ===")
        print(f"총 측정 횟수: {measurement_count}")
        print(f"성공 횟수: {success_count}")
        if measurement_count > 0:
            success_rate = (success_count / measurement_count) * 100
            print(f"최종 성공률: {success_rate:.1f}%")

            if success_rate >= 80:
                print("✓ 센서가 정상적으로 작동합니다!")
            elif success_rate >= 50:
                print("⚠ 센서가 불안정합니다. 연결을 확인하세요.")
            else:
                print("✗ 센서에 문제가 있습니다. 하드웨어를 점검하세요.")

        print("테스트를 종료합니다.")
        sys.exit(0)

    except Exception as e:
        print(f"\n오류 발생: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
