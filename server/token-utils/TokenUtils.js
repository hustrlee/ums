"use strict";

const Redis = require("ioredis");
const { v1: uuidv1 } = require("uuid");
const redisHost = `${process.env.REDIS_HOST || "localhost"}`;
const expireTime = 86400; // 86400s，一天

/**
 * 生成并保存 Token
 *
 * @description 不允许多终端登录；Token Expire Time：1 天。
 * @param {string} username - 用户名
 * @returns {Promise.<string>} - 返回生成的 Token
 */
const setToken = username => {
  return new Promise(resolve => {
    // 通过 uuidv1 来生成 Token
    const token = uuidv1();

    // 保存 token:username，同时保存 username_token(hash)，并设置有效期
    const redis = new Redis({ host: redisHost });
    redis
      .multi()
      .set(token, username)
      .expire(token, expireTime)
      .hset("username_token", username, token)
      .exec()
      .then(res => {
        resolve(token);
        redis.quit();
      });
  });
};

/**
 * 通过 Token 获取用户名
 *
 * @param {string} token - 用户 Token
 * @returns {Promise.<string>} - 返回用户名
 */
const getUsername = token => {
  return new Promise(resolve => {
    const redis = new Redis({ host: redisHost });
    redis.get(token).then(res => {
      resolve(res);
      redis.quit();
    });
  });
};

/**
 * 删除一个 Token
 *
 * @param {string} token - 要删除的 Token
 * @returns {string} - 删除成功，返回 "OK"
 */
const delToken = token => {
  return new Promise(resolve => {
    getUsername(token).then(username => {
      const redis = new Redis({ host: redisHost });
      redis.del(token).then(res => {
        resolve("OK");
        redis.quit();
      });
    });
  });
};

module.exports = {
  setToken,
  getUsername,
  delToken
};
