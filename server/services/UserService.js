/* eslint-disable no-unused-vars */
const Service = require("./Service");
const ldapUtils = require("./ldap-utils");
const tokenUtils = require("./token-utils");

/**
 * 获取用户组中的所有成员列表
 * 通过 role 来获取该角色的所有成员列表
 *
 * role String 角色名称
 * returns RoleMemberResDto
 * */
const getRoleMember = async ({ role }) => {
  const res = await ldapUtils.getRoleMember(role);

  return new Promise(async (resolve, reject) => {
    try {
      resolve(Service.successResponse(res));
    } catch (e) {
      reject(
        Service.rejectResponse(e.message || "Invalid input", e.status || 405)
      );
    }
  });
};

/**
 * 获取用户信息
 * 通过 token 获取用户信息，必须先登录成功。
 *
 * token String 用户 token
 * returns InfoResDto
 * */
const getInfo = async ({ token }) => {
  const username = await tokenUtils.getUsername(token);
  const res = await ldapUtils.getUserInfo(username);

  return new Promise(async (resolve, reject) => {
    try {
      resolve(Service.successResponse(res));
    } catch (e) {
      reject(
        Service.rejectResponse(e.message || "Invalid input", e.status || 405)
      );
    }
  });
};

/**
 * 用户登录
 *
 * loginDto LoginDto
 * returns LoginResDto
 * */
const login = async ({ loginDto }) => {
  const authRes = await ldapUtils.authenticate(loginDto);
  let res;
  switch (authRes.code) {
    case 20000:
      const token = await tokenUtils.setToken(loginDto.username);
      res = { code: 20000, data: { token } };
      break;
    default:
      res = { code: 60204, message: authRes.message };
      break;
  }

  return new Promise(async (resolve, reject) => {
    try {
      resolve(Service.successResponse(res));
    } catch (e) {
      reject(
        Service.rejectResponse(e.message || "Invalid input", e.status || 405)
      );
    }
  });
};

/**
 * 用户登出
 *
 * xToken String 通过 `header` 中的 `X-Token` 来传递 token
 * returns LogoutResDto
 * */
const logout = async ({ ...xToken }) => {
  await tokenUtils.delToken(xToken["x-token"]);

  return new Promise(async (resolve, reject) => {
    try {
      resolve(Service.successResponse({ code: 20000, data: "success" }));
    } catch (e) {
      reject(
        Service.rejectResponse(e.message || "Invalid input", e.status || 405)
      );
    }
  });
};

module.exports = {
  getRoleMember,
  getInfo,
  login,
  logout
};
