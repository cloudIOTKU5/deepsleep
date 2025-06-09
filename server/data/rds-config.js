require("dotenv").config();
const mysql = require("mysql2/promise");

// RDS 연결 설정 (데이터베이스 없이)
const RDS_CONFIG_WITHOUT_DB = {
    host: process.env.RDS_HOST || "localhost",
    port: process.env.RDS_PORT || 3306,
    user: process.env.RDS_USER || "root",
    password: process.env.RDS_PASSWORD || "",
    ssl: process.env.RDS_SSL === "true" ? { rejectUnauthorized: false } : false,
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
};

// RDS 연결 설정 (데이터베이스 포함)
const RDS_CONFIG = {
    ...RDS_CONFIG_WITHOUT_DB,
    database: process.env.RDS_DATABASE || "deepsleep",
};

let pool = null;

/**
 * 데이터베이스 존재 여부 확인 및 생성
 */
async function ensureDatabaseExists() {
    const databaseName = process.env.RDS_DATABASE || "deepsleep";
    let connection = null;

    try {
        console.log(`데이터베이스 '${databaseName}' 존재 여부를 확인합니다...`);

        // 데이터베이스 없이 연결
        connection = await mysql.createConnection(RDS_CONFIG_WITHOUT_DB);

        // 데이터베이스 존재 여부 확인
        const [rows] = await connection.execute(
            'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
            [databaseName]
        );

        if (rows.length === 0) {
            console.log(`데이터베이스 '${databaseName}'가 존재하지 않습니다. 생성합니다...`);

            // 데이터베이스 생성
            await connection.execute(
                `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );

            console.log(`데이터베이스 '${databaseName}'가 성공적으로 생성되었습니다.`);
        } else {
            console.log(`데이터베이스 '${databaseName}'가 이미 존재합니다.`);
        }

    } catch (error) {
        console.error("데이터베이스 확인/생성 오류:", error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

/**
 * RDS 연결 풀 초기화
 */
async function connectToRDS() {
    try {
        if (!pool) {
            // 먼저 데이터베이스 존재 여부 확인 및 생성
            await ensureDatabaseExists();

            // 데이터베이스를 포함한 연결 풀 생성
            pool = mysql.createPool(RDS_CONFIG);
            console.log("RDS 연결 풀이 생성되었습니다.");

            // 연결 테스트
            const connection = await pool.getConnection();
            await connection.ping();

            // 현재 데이터베이스 확인
            const [dbRows] = await connection.execute('SELECT DATABASE() as current_db');
            console.log(`현재 데이터베이스: ${dbRows[0].current_db}`);

            connection.release();
            console.log("RDS에 성공적으로 연결되었습니다.");

            // 테이블 초기화
            await initializeTables();
        }
        return pool;
    } catch (error) {
        console.error("RDS 연결 오류:", error.message);
        throw error;
    }
}

/**
 * RDS 연결 종료
 */
async function disconnectFromRDS() {
    try {
        if (pool) {
            await pool.end();
            pool = null;
            console.log("RDS 연결이 종료되었습니다.");
        }
    } catch (error) {
        console.error("RDS 연결 종료 오류:", error.message);
    }
}

/**
 * 데이터베이스 연결 풀 반환
 */
async function getPool() {
    if (!pool) {
        await connectToRDS();
    }
    return pool;
}

/**
 * 쿼리 실행
 * @param {string} query - SQL 쿼리
 * @param {Array} params - 쿼리 파라미터
 */
async function executeQuery(query, params = []) {
    const connection = await getPool();
    try {
        const [rows] = await connection.execute(query, params);
        return rows;
    } catch (error) {
        console.error("쿼리 실행 오류:", error.message);
        console.error("쿼리:", query);
        console.error("파라미터:", params);
        throw error;
    }
}

/**
 * 테이블 초기화
 */
async function initializeTables() {
    try {
        console.log("테이블 초기화를 시작합니다...");

        // 센서 데이터 테이블
        await executeQuery(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        humidity DECIMAL(5,2) NOT NULL,
        heart_rate INT NOT NULL,
        timestamp DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp),
        INDEX idx_created_at (created_at)
      )
    `);
        console.log("센서 데이터 테이블이 준비되었습니다.");

        // 장치 상태 테이블
        await executeQuery(`
      CREATE TABLE IF NOT EXISTS device_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL DEFAULT 'latest',
        humidifier ENUM('on', 'off') NOT NULL DEFAULT 'off',
        speaker ENUM('on', 'off') NOT NULL DEFAULT 'off',
        volume INT NOT NULL DEFAULT 0,
        timestamp DATETIME NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_type (type),
        INDEX idx_updated_at (updated_at)
      )
    `);
        console.log("장치 상태 테이블이 준비되었습니다.");

        // MySQL 버전 확인 후 뷰 생성
        try {
            await executeQuery(`
      CREATE OR REPLACE VIEW sleep_statistics AS
      SELECT 
        DATE(timestamp) as date,
        AVG(humidity) as avg_humidity,
        AVG(heart_rate) as avg_heart_rate,
        MIN(humidity) as min_humidity,
        MAX(humidity) as max_humidity,
        MIN(heart_rate) as min_heart_rate,
        MAX(heart_rate) as max_heart_rate,
        COUNT(*) as count
      FROM sensor_data
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);
            console.log("수면 통계 뷰가 생성되었습니다.");
        } catch (viewError) {
            console.warn("뷰 생성 실패 (MySQL 버전이 낮을 수 있습니다):", viewError.message);
            // 뷰 생성 실패 시 기존 뷰 삭제 후 재생성 시도
            try {
                await executeQuery(`DROP VIEW IF EXISTS sleep_statistics`);
                await executeQuery(`
      CREATE VIEW sleep_statistics AS
      SELECT 
        DATE(timestamp) as date,
        AVG(humidity) as avg_humidity,
        AVG(heart_rate) as avg_heart_rate,
        MIN(humidity) as min_humidity,
        MAX(humidity) as max_humidity,
        MIN(heart_rate) as min_heart_rate,
        MAX(heart_rate) as max_heart_rate,
        COUNT(*) as count
      FROM sensor_data
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);
                console.log("수면 통계 뷰가 생성되었습니다 (재시도 성공).");
            } catch (retryError) {
                console.warn("뷰 생성을 건너뜁니다:", retryError.message);
            }
        }

        console.log("테이블 초기화가 완료되었습니다.");
    } catch (error) {
        console.error("테이블 초기화 오류:", error.message);
        throw error;
    }
}

/**
 * 데이터베이스 상태 확인
 */
async function checkDatabaseStatus() {
    try {
        const connection = await getPool();

        // 현재 데이터베이스 정보
        const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as version');
        // 테이블 목록
        const [tables] = await connection.execute('SHOW TABLES');
        // 센서 데이터 개수
        const [sensorCount] = await connection.execute('SELECT COUNT(*) as count FROM sensor_data');
        // 장치 상태 개수
        const [deviceCount] = await connection.execute('SELECT COUNT(*) as count FROM device_status');

        const result = {
            database: {
                name: dbInfo[0].current_db,
                version: dbInfo[0].version,
            },
            tables: {
                length: tables.length,
                list: tables.map(row => Object.values(row)[0]),
            },
            sensorData: {
                count: sensorCount[0].count,
            },
            deviceStatus: {
                count: deviceCount[0].count,
            },
        }

        return result;

    } catch (error) {
        console.error("데이터베이스 상태 확인 오류:", error.message);
    }
}

module.exports = {
    connectToRDS,
    disconnectFromRDS,
    getPool,
    executeQuery,
    initializeTables,
    ensureDatabaseExists,
    checkDatabaseStatus,
}; 