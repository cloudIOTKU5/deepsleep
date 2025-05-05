require("dotenv").config();
const AWS = require("aws-sdk");

// AWS 설정
AWS.config.update({
  region: process.env.AWS_REGION || "ap-northeast-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME || "deepsleep-data";

/**
 * S3 버킷에 데이터 저장
 * @param {string} key - 저장할 객체의 키
 * @param {Object} data - 저장할 데이터 객체
 * @returns {Promise} - S3 업로드 결과
 */
async function saveToS3(key, data) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  };

  try {
    const result = await s3.putObject(params).promise();
    console.log(`데이터가 S3에 성공적으로 저장되었습니다: ${key}`);
    return result;
  } catch (error) {
    console.error(`S3 저장 오류: ${error.message}`);
    throw error;
  }
}

/**
 * S3 버킷에서 데이터 조회
 * @param {string} key - 조회할 객체의 키
 * @returns {Promise<Object>} - S3에서 조회된 데이터
 */
async function getFromS3(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const data = await s3.getObject(params).promise();
    return JSON.parse(data.Body.toString());
  } catch (error) {
    if (error.code === "NoSuchKey") {
      console.log(`데이터가 존재하지 않습니다: ${key}`);
      return null;
    }
    console.error(`S3 조회 오류: ${error.message}`);
    throw error;
  }
}

/**
 * S3 버킷의 특정 접두사로 시작하는 객체 목록 조회
 * @param {string} prefix - 검색할 접두사
 * @returns {Promise<Array>} - 객체 키 목록
 */
async function listFromS3(prefix) {
  const params = {
    Bucket: bucketName,
    Prefix: prefix,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents.map((item) => item.Key);
  } catch (error) {
    console.error(`S3 목록 조회 오류: ${error.message}`);
    throw error;
  }
}

module.exports = {
  saveToS3,
  getFromS3,
  listFromS3,
};
