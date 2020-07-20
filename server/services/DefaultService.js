/* eslint-disable no-unused-vars */
const Service = require("./Service");
const LdapClient = require("../ldap-utils/LdapUtils");

/**
 * 获取用户信息
 * 通过 token 获取用户信息，必须先登录成功。
 *
 * token String 用户 token
 * returns UserInfoDto
 * */
const getInfo = ({ token }) =>
  new Promise(async (resolve, reject) => {
    // try {
    //   await ldapClient.bind();
    // } catch (err) {
    //   console.log(err);
    //   reject(Service.rejectResponse("LDAP 服务器错误。", 405));
    // }
    // try {
    //   const username = "xiawei";
    //   const res = await ldapClient.getUserInfo(username);
    //   resolve(
    //     Service.successResponse({
    //       code: 20000,
    //       data: res
    //     })
    //   );
    // } catch (e) {
    //   reject(
    //     Service.rejectResponse(e.message || "Invalid input", e.status || 405)
    //   );
    //   // }
    // } finally {
    //   // 最后必须执行 unbind() 来关闭 LDAP 连接
    //   await ldapClient.unbind();
    // }
  });

/**
 * 用户登录
 *
 * loginInfoDto LoginInfoDto
 * returns LoginResDto
 * */
const login = ({ loginInfoDto }) =>
  new Promise(async (resolve, reject) => {
    const ldapClient = new LdapClient();
    try {
      // 验证用户名和密码是否正确
      await ldapClient.bind();
      const res = await ldapClient.validate(
        loginInfoDto.username,
        loginInfoDto.password
      );
      switch (res.code) {
        case 200:
          // 验证成功
          resolve(
            Service.successResponse({
              code: 20000,
              data: {
                token: loginInfoDto.username + "-token"
              }
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
      // }
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
