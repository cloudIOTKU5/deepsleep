const axios = require("axios");
const qs = require('querystring');

// Fitbit API 설정
const FITBIT_API_BASE = "https://api.fitbit.com/1/user/-";

class FitbitService {
  constructor() {
    this.clientId = process.env.FITBIT_CLIENT_ID;
    this.clientSecret = process.env.FITBIT_CLIENT_SECRET;
    this.redirectUri = process.env.FITBIT_REDIRECT_URI || 'http://localhost:4000/api/fitbit/callback';
    
    // 환경 변수에서 토큰 초기화
    this.accessToken = process.env.FITBIT_ACCESS_TOKEN;
    this.refreshToken = process.env.FITBIT_REFRESH_TOKEN;
    this.userId = process.env.FITBIT_USER_ID;
    this.tokenExpiresAt = null;  // 처음에는 토큰 갱신이 필요하도록 설정

    // 서버 시작 시 토큰 유효성 검사
    this.initializeTokens();
  }

  async initializeTokens() {
    try {
      if (this.accessToken && this.refreshToken) {
        // 토큰이 있으면 갱신 시도
        await this.refreshAccessToken();
        console.log('Fitbit 토큰 초기화 성공');
      } else {
        console.log('Fitbit 토큰이 설정되어 있지 않습니다. 환경 변수를 확인해주세요.');
      }
    } catch (error) {
      console.error('Fitbit 토큰 초기화 실패:', error.message);
    }
  }

  updateTokenData(tokenData) {
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.userId = tokenData.user_id;
    this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('Refresh token이 없습니다. 환경 변수를 확인해주세요.');
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post('https://api.fitbit.com/oauth2/token',
        qs.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.updateTokenData(response.data);
      return response.data;
    } catch (error) {
      console.error('토큰 갱신 실패:', error.response?.data || error.message);
      // 토큰 갱신 실패 시 토큰 초기화
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiresAt = null;
      throw error;
    }
  }

  // 토큰 유효성 검사 및 필요시 갱신
  async ensureValidToken() {
    if (!this.accessToken || !this.tokenExpiresAt) {
      // 토큰이 없으면 환경 변수에서 다시 읽어오기 시도
      this.accessToken = process.env.FITBIT_ACCESS_TOKEN;
      this.refreshToken = process.env.FITBIT_REFRESH_TOKEN;
      this.userId = process.env.FITBIT_USER_ID;
      
      if (!this.accessToken || !this.refreshToken) {
        throw new Error('Fitbit 토큰이 설정되어 있지 않습니다. 환경 변수를 확인해주세요.');
      }
      
      // 새로 읽어온 토큰으로 갱신 시도
      await this.refreshAccessToken();
      return;
    }

    // 토큰 만료 10분 전에 갱신
    if (Date.now() > this.tokenExpiresAt - (10 * 60 * 1000)) {
      await this.refreshAccessToken();
    }
  }

  // 심박수 데이터 가져오기
  async fetchHeartRate() {
    await this.ensureValidToken();

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(
        `https://api.fitbit.com/1/user/${this.userId}/activities/heart/date/${today}/1d/1min.json`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const heartRateData = response.data['activities-heart-intraday'].dataset;
      if (heartRateData.length > 0) {
        return heartRateData[heartRateData.length - 1].value;
      }
      return null;
    } catch (error) {
      console.error('심박수 데이터 조회 실패:', error.response?.data || error.message);
      throw error;
    }
  }

  // 수면 데이터
  async fetchSleepData() {
    await this.ensureValidToken();

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(
        `https://api.fitbit.com/1.2/user/${this.userId}/sleep/date/${today}.json`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('수면 데이터 조회 실패:', error.response?.data || error.message);
      throw error;
    }
  }

  // 토큰 설정
  setTokens(accessToken, refreshToken, userId, expiresIn) {
    this.updateTokenData({
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: userId,
      expires_in: expiresIn
    });
  }
}

const fitbitService = new FitbitService();

module.exports = {
  fitbitService,
  fetchFitbitHeartRate: () => fitbitService.fetchHeartRate()
};
