const axios = require('axios');
const qs = require('querystring');

class FitbitService {
  constructor() {
    this.clientId = process.env.FITBIT_CLIENT_ID;
    this.clientSecret = process.env.FITBIT_CLIENT_SECRET;
    this.redirectUri = process.env.FITBIT_REDIRECT_URI || 'http://localhost:4000/api/fitbit/callback';
    
    // 토큰 저장
    this.accessToken = null;
    this.refreshToken = null;
    this.userId = null;
    this.tokenExpiresAt = null;
  }

  // 인증 URL 생성
  getAuthorizationUrl() {
    const scope = ['activity', 'heartrate', 'sleep'].join(' ');
    const params = {
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scope,
      expires_in: '604800' // 7일
    };

    return `https://www.fitbit.com/oauth2/authorize?${qs.stringify(params)}`;
  }

  // 액세스 토큰 요청
  async requestAccessToken(authorizationCode) {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post('https://api.fitbit.com/oauth2/token', 
        qs.stringify({
          grant_type: 'authorization_code',
          code: authorizationCode,
          client_id: this.clientId,
          redirect_uri: this.redirectUri
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
      console.error('액세스 토큰 요청 실패:', error.response?.data || error.message);
      throw error;
    }
  }

  // 토큰 갱신
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('Refresh token이 없습니다. 다시 인증해주세요.');
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
      throw error;
    }
  }

  // 토큰 데이터 업데이트
  updateTokenData(tokenData) {
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.userId = tokenData.user_id;
    this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
  }

  // 토큰 유효성 검사 및 필요시 갱신
  async ensureValidToken() {
    if (!this.accessToken || !this.tokenExpiresAt) {
      throw new Error('인증이 필요합니다.');
    }

    // 토큰 만료 10분 전에 갱신
    if (Date.now() > this.tokenExpiresAt - (10 * 60 * 1000)) {
      await this.refreshAccessToken();
    }
  }

  // 심박수 데이터 가져오기
  async getHeartRate() {
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

      // 가장 최근 심박수 데이터 반환
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

  // 수면 데이터 가져오기
  async getSleepData() {
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
}

// 싱글톤 인스턴스 생성
const fitbitService = new FitbitService();

module.exports = fitbitService; 