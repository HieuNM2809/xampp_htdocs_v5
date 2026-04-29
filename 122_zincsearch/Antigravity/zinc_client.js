/**
 * ZincSearch HTTP Client
 * Wrapper đơn giản cho axios để gọi ZincSearch API
 */
const axios = require('axios');
const config = require('./config');

const zincClient = axios.create({
  baseURL: config.baseURL,
  auth: config.auth,
  headers: config.headers
});

// Interceptor để log request/response
zincClient.interceptors.request.use(req => {
  console.log(`\n→ ${req.method?.toUpperCase()} ${req.baseURL}${req.url}`);
  if (req.data) console.log('  Body:', JSON.stringify(req.data, null, 2));
  return req;
});

zincClient.interceptors.response.use(
  res => {
    console.log(`← ${res.status} OK`);
    return res;
  },
  err => {
    const msg = err.response?.data || err.message;
    console.error(`← ERROR:`, JSON.stringify(msg, null, 2));
    return Promise.reject(err);
  }
);

module.exports = zincClient;
