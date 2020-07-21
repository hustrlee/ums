"use strict";

const Redis = require("ioredis");
const { v1: uuidv1 } = require("uuid");

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

    // 保存 username : token，同时保存 token : username
    const redis = new Redis();
    redis
      .multi()
      .hset("username:token", username, token)
      .hset("token:username", token, username)
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
 *
 */
const getUsername = token => {
  return new Promise(resolve => {
    const redis = new Redis();
    redis.hget("token:username", token).then(res => {
      resolve(res);
      redis.quit();
    });
  });
};

const getToken = username => {
  return new Promise(resolve => {
    const redis = new Redis();
    redis.hget("username:token", username).then(res => {
      resolve(res);
      redis.quit();
    });
  });
};

const delByUsername = username => {
  return new Promise(resolve => {
    getToken(username).then(token => {
      const redis = new Redis();
      redis
        .multi()
        .hdel("username:token", username)
        .hdel("token:username", token)
        .exec()
        .then(res => {
          resolve(res);
          redis.quit();
        });
    });
  });
};

const delByToken = token => {
  return new Promise(resolve => {
    getUsername(token).then(username => {
      const redis = new Redis();
      redis
        .multi()
        .hdel("username:token", username)
        .hdel("token:username", token)
        .exec()
        .then(res => {
          resolve(res);
          redis.quit();
        });
    });
  });
};

module.exports = {
  setToken,
  getUsername,
  getToken,
  delByUsername,
  delByToken
};
