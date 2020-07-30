/* eslint-disable no-unused-vars */
const Service = require("./Service");
const ldapClient = require("../ldap-utils/LdapUtils");
const tokenClient = require("../token-utils/TokenUtils");

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
      const username = await tokenClient.getUsername(token);
      const userInfo = await ldapClient.getUserInfo(username);
      resolve(Service.successResponse(userInfo));
    } catch (e) {
      reject(
        Service.rejectResponse(e.message || "Invalid input", e.status || 405)
      );
    }
  });

// const getName = ({ username }) =>
//   new Promise(async (resolve, reject) => {
//     try {
//       const userInfo = await ldapClient.getUserInfo(username);
//       if (userInfo.code === 20000) {
//         resolve(
//           Service.successResponse({
//             code: 20000,
//             data: userInfo.data.name
//           })
//         );
//       } else {
//         resolve(
//           Service.successResponse({
//             code: userInfo.code,
//             message: userInfo.message
//           })
//         );
//       }
//     } catch (e) {
//       reject(
//         Service.rejectResponse(e.message || "Invalid input", e.status || 405)
//       );
//     }
//   });

/**
 * 用户登录
 *
 * loginInfoDto LoginInfoDto
 * returns LoginResDto
 * */
const login = ({ loginInfoDto }) =>
  new Promise(async (resolve, reject) => {
    try {
      // 校验用户名/密码
      const res = await ldapClient.authenticate(
        loginInfoDto.username,
        loginInfoDto.password
      );
      switch (res.code) {
        case 20000:
          // 验证成功，生成/保存 token
          const token = await tokenClient.setToken(loginInfoDto.username);
          resolve(
            Service.successResponse({
              code: 20000,
              data: { token }
            })
          );
          break;
        default:
          // 验证失败
          resolve(
            Service.successResponse({
              code: 60204,
              message: res.message
            })
          );
          break;
      }
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
const logout = ({ ...xToken }) =>
  new Promise(async (resolve, reject) => {
    try {
      // 删除 Token
      await tokenClient.delToken(xToken["x-token"]);
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

const getGroupMember = ({ role }) => {};

module.exports = {
  getInfo,
  // getName,
  login,
  logout,
  getGroupMember
};
