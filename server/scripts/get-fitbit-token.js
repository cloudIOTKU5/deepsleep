require('dotenv').config();
const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:4000/api/sleep-status';

// 인증 URL 생성
const scope = ['activity', 'heartrate', 'sleep'].join(' ');
const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&expires_in=604800`;

console.log('\n='.repeat(80));
console.log('1. 아래 URL을 브라우저에서 열고 Fitbit 계정으로 로그인한 후 권한을 허용해주세요.');
console.log(`\n${authUrl}\n`);
console.log('2. 로그인 후 리다이렉트된 URL에서 code= 뒤의 값을 복사해주세요.');
console.log('='.repeat(80));

// 사용자로부터 인증 코드 입력 받기
rl.question('\n인증 코드를 붙여넣어주세요: ', async (code) => {
  try {
    // Basic 인증을 위한 헤더 생성
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    // 토큰 요청
    const response = await axios.post('https://api.fitbit.com/oauth2/token',
      `grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('\n🎉'.repeat(20));
    console.log('토큰 발급 성공!');
    console.log('🎉'.repeat(20));
    console.log('\n아래 정보를 사용하여 API를 테스트할 수 있습니다:');
    console.log('\nPOST http://localhost:4000/api/test/fitbit-token');
    console.log('Content-Type: application/json');
    console.log('\n요청 본문:');
    console.log(JSON.stringify({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      userId: response.data.user_id,
      expiresIn: response.data.expires_in
    }, null, 2));

  } catch (error) {
    console.error('\n😭'.repeat(20));
    console.error('토큰 발급 실패...');
    console.error('😭'.repeat(20));
    console.error('\n에러:', error.response?.data || error.message);
  } finally {
    rl.close();
  }
}); 