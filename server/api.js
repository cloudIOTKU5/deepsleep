const express = require('express');
const router = express.Router();
const { analyzeSleepInsights, predictSleepQuality, analyzeSleepTrends } = require('./services/gemini-service');

// AI 수면환경 분석 API
router.post('/analyze-sleep', async (req, res) => {
  try {
    const data = {
      currentEnvironment: {
        humidity: req.body.humidity,
        heartRate: req.body.heartRate,
        humidifierStatus: req.body.humidifierStatus,
        speakerStatus: req.body.speakerStatus,
        volume: req.body.volume
      },
      sleepHistory: req.body.sleepRecords || []
    };

    // 각 분석 결과 병렬로 가져오기
    const [insights, prediction, trends] = await Promise.all([
      analyzeSleepInsights(data),
      predictSleepQuality(data),
      analyzeSleepTrends(data)
    ]);

    res.json({
      success: true,
      data: {
        insights,
        prediction,
        trends
      }
    });
  } catch (error) {
    console.error('AI 분석 실패:', error);
    res.status(500).json({
      success: false,
      message: 'AI 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router; 