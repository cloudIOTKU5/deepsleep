const express = require('express');
const router = express.Router();
const fitbitService = require('../services/fitbit-service');

// Fitbit 인증 시작
router.get('/auth', (req, res) => {
  const authUrl = fitbitService.getAuthorizationUrl();
  res.redirect(authUrl);
});

// Fitbit 콜백 처리
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({
      success: false,
      message: '인증이 거부되었습니다.',
      error
    });
  }

  try {
    const tokenData = await fitbitService.requestAccessToken(code);
    res.json({
      success: true,
      message: 'Fitbit 인증이 완료되었습니다.',
      userId: tokenData.user_id
    });
  } catch (error) {
    console.error('Fitbit 콜백 처리 실패:', error);
    res.status(500).json({
      success: false,
      message: 'Fitbit 인증 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 현재 심박수 조회
router.get('/heart-rate', async (req, res) => {
  try {
    const heartRate = await fitbitService.getHeartRate();
    res.json({
      success: true,
      data: { heartRate }
    });
  } catch (error) {
    console.error('심박수 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '심박수 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 수면 데이터 조회
router.get('/sleep', async (req, res) => {
  try {
    const sleepData = await fitbitService.getSleepData();
    res.json({
      success: true,
      data: sleepData
    });
  } catch (error) {
    console.error('수면 데이터 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '수면 데이터 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router; 