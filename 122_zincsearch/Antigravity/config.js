/**
 * ZincSearch Configuration
 * Cấu hình kết nối ZincSearch
 */
const config = {
  baseURL: 'http://localhost:4080',
  auth: {
    username: 'admin',
    password: 'Complexpass#123'
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

module.exports = config;
