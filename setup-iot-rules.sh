#!/bin/bash

# AWS IoT Rules 설정 스크립트
# MQTT 메시지를 Lambda 함수로 라우팅합니다.

REGION="ap-northeast-2"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_FUNCTION_NAME="deepsleep-api-api-iotHandler"  # Serverless가 생성하는 함수명

echo "AWS IoT Rules 설정을 시작합니다..."
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"
echo "Lambda Function: $LAMBDA_FUNCTION_NAME"

# 1. 센서 데이터를 Lambda로 라우팅하는 Rule 생성
echo "1. 센서 데이터 Rule 생성 중..."
aws iot create-topic-rule \
  --rule-name "SensorDataToLambda" \
  --topic-rule-payload '{
    "sql": "SELECT topic() as topic, * as message, timestamp() as timestamp FROM \"sensors/sleep/+\"",
    "description": "센서 데이터를 Lambda로 전송",
    "actions": [
      {
        "lambda": {
          "functionArn": "arn:aws:lambda:'$REGION':'$ACCOUNT_ID':function:'$LAMBDA_FUNCTION_NAME'"
        }
      }
    ],
    "ruleDisabled": false
  }' \
  --region $REGION

# 2. 디바이스 상태를 Lambda로 라우팅하는 Rule 생성
echo "2. 디바이스 상태 Rule 생성 중..."
aws iot create-topic-rule \
  --rule-name "DeviceStatusToLambda" \
  --topic-rule-payload '{
    "sql": "SELECT topic() as topic, * as message, timestamp() as timestamp FROM \"device/status/+\"",
    "description": "디바이스 상태를 Lambda로 전송",
    "actions": [
      {
        "lambda": {
          "functionArn": "arn:aws:lambda:'$REGION':'$ACCOUNT_ID':function:'$LAMBDA_FUNCTION_NAME'"
        }
      }
    ],
    "ruleDisabled": false
  }' \
  --region $REGION

# 3. Lambda 함수에 IoT 권한 부여
echo "3. Lambda 함수에 IoT 권한 부여 중..."
aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id "iot-sensor-data-rule" \
  --action "lambda:InvokeFunction" \
  --principal "iot.amazonaws.com" \
  --source-arn "arn:aws:iot:$REGION:$ACCOUNT_ID:rule/SensorDataToLambda" \
  --region $REGION

aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id "iot-device-status-rule" \
  --action "lambda:InvokeFunction" \
  --principal "iot.amazonaws.com" \
  --source-arn "arn:aws:iot:$REGION:$ACCOUNT_ID:rule/DeviceStatusToLambda" \
  --region $REGION

echo "AWS IoT Rules 설정이 완료되었습니다!"
echo ""
echo "생성된 Rules:"
echo "- SensorDataToLambda: sensors/sleep/+ 토픽을 Lambda로 라우팅"
echo "- DeviceStatusToLambda: device/status/+ 토픽을 Lambda로 라우팅"
echo ""
echo "테스트 명령어:"
echo "aws iot-data publish --topic 'sensors/sleep/humidity' --payload '{\"value\": 45, \"deviceId\": \"test\"}' --region $REGION"
echo "aws iot-data publish --topic 'device/status/humidifier' --payload '{\"status\": \"on\"}' --region $REGION" 