/* eslint-disable no-unused-vars */
const Service = require("./Service");

/**
 * 获取用户信息
 * 通过 token 获取用户信息，必须先登录成功。
 *
 * token String 用户 token
 * returns UserInfoDto
 * */
const getInfo = ({ token }) =>
  new Promise(async (resolve, reject) => {
    try {
      resolve(
        Service.successResponse({
          id: "xiawei",
          name: "夏伟",
          avatar: "/avatars/xiawei.png",
          roles: ["定损员"]
        })
      );
    } catch (e) {
      reject(
        Service.rejectResponse(e.message || "Invalid input", e.status || 405)
      );
    }
  });

/**
 * 用户登录
 *
 * loginInfoDto LoginInfoDto
 * returns LoginResDto
 * */
const login = ({ loginInfoDto }) =>
  new Promise(async (resolve, reject) => {
    try {
      resolve(
        Service.successResponse({
          code: 20000,
          data: {
            token: loginInfoDto.username + "-token"
          }
        })
      );
    } catch (e) {
      reject(
        Service.rejectResponse(e.message || "Invalid input", e.status || 405)
      );
    }
  });

/**
 * 用户登出
 *
 * xToken String 通过 `header` 中的 `X-Token` 来传递 token
 * returns LogoutDto
 * */
const logout = ({ xToken }) =>
  new Promise(async (resolve, reject) => {
    try {
      resolve(
        Service.successResponse({
          code: 20000,
          data: "success"
        })
      );
    } catch (e) {
      reject(
        Service.rejectResponse(e.message || "Invalid input", e.status || 405)
      );
    }
  });

module.exports = {
  getInfo,
  login,
  logout
};
