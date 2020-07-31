"use strict";

const ldap = require("ldapjs-promise");
const parseDn = require("ldapjs-promise").parseDN;
const { getMimeType } = require("./GetMimeType");

const ldapClientOpt = {
  url: `ldap://${process.env.LDAP_HOST || "/"}`,
  idleTimeout: 1000
};
const baseDn = "dc=ums";
const adminDn = `cn=admin,${baseDn}`;
const adminSecret = "root";

/**
 * @typedef AuthenticateResult
 * @property {number} code - 结果代码。20000：成功；60204：失败；70000：发生错误
 * @property {string} data - 结果信息。
 */
/**
 * 验证用户名/密码
 *
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise.<AuthenticateResult>} - 认证结果
 */
const authenticate = async ({ username, password }) => {
  const ldapClient = ldap.createClient(ldapClientOpt);
  ldapClient.client.on("error", () => {
    console.log("LDAP Server 故障.");
  });
  ldapClient.client.on("idleTimeout", () => {
    // 关闭空闲超时连接
    ldapClient.unbind();
  });

  try {
    await ldapClient.bind(adminDn, adminSecret);
  } catch (err) {
    // Admin 绑定失败，无需释放 LDAP 连接
    return { code: 70000, message: "LDAP Server 授权失败." };
  }

  const entry = await ldapClient.findUser(baseDn, `(uid=${username})`, {
    scope: "sub"
  });

  if (entry) {
    // 用户名正确，验证用户密码
    try {
      await ldapClient.bind(entry.dn, password);
      await ldapClient.unbind(); // 要释放 LDAP 连接
      return { code: 20000, message: "Success." };
    } catch (err) {
      return { code: 60204, message: "密码错误." };
    }
  } else {
    // 用户名不正确，没有找到对应的用户DN
    await ldapClient.unbind(); // 要释放 LDAP 连接
    return { code: 60204, message: "用户名错误." };
  }
};

/**
 * @typedef UserInfoResult
 * @property {number} code - 结果代码。20000： 成功；40001：失败；70000：发生错误
 * @property {Object} data - 如果成功，返回 UserInfo Object
 * @property {string} data.name - 用户姓名
 * @property {Array.<string>} data.roles - 用户角色
 * @property {string} data.avatar - 用户头像，base64 编码图像
 * @property {string} message - 如果失败/发生错误，返回错误信息
 */
/**
 * 获取用户信息
 *
 * @param {string} username - 用户名
 * @returns {Promise.<UserInfoResult>} - 用户信息
 */
const getUserInfo = async username => {
  const ldapClient = ldap.createClient(ldapClientOpt);
  ldapClient.client.on("error", () => {
    console.log("LDAP Server 故障.");
  });
  ldapClient.client.on("idleTimeout", () => {
    // 关闭空闲超时连接
    ldapClient.unbind();
  });

  try {
    await ldapClient.bind(adminDn, adminSecret);
  } catch (err) {
    // Admin 绑定失败，无需释放 LDAP 连接
    return { code: 70000, message: "LDAP Server 授权失败." };
  }

  const userInfo = await ldapClient
    .search(baseDn, {
      filter: `(uid=${username})`,
      scope: "sub",
      attributes: ["cn", "sn", "memberOf", "jpegPhoto"]
    })
    .then(res => {
      const entries = [];
      return new Promise(resolve => {
        res.on("searchEntry", entry => {
          // 将 jpegPhoto 转换为 base64 图像数据，并赋值给 avatar
          let avatar = "";
          const mimeType = getMimeType(entry.raw.jpegPhoto);
          if (mimeType) {
            // 如果识别出 mimeType，则说明 avatar 数据有效
            avatar =
              `data:${mimeType};base64,` +
              entry.raw.jpegPhoto.toString("base64");
          }

          // 将 memberOf 数据转换为 roles 数据，并赋值给 roles
          const roles = [];
          let memberOf = entry.object.memberOf;
          if (typeof memberOf === "string") {
            // 当用户只属于一个组的时候 memberOf 是一个字符串
            roles.push(parseDn(memberOf).rdns[0].attrs.cn.value);
          } else {
            for (let item of memberOf) {
              roles.push(parseDn(item).rdns[0].attrs.cn.value);
            }
          }

          // 将姓和名拼接成完整的名字
          const name = entry.object.sn + entry.object.cn;

          entries.push({ username, name, roles, avatar });
        });

        res.on("end", result => {
          if (result.status === 0 && entries[0]) {
            // 搜索到了结果
            resolve(entries[0]);
          } else {
            resolve();
          }
        });
      });
    });

  await ldapClient.unbind();
  if (userInfo) {
    return { code: 20000, data: userInfo };
  } else {
    return { code: 60204, message: "没有找到该用户信息." };
  }
};

const getRoleMember = async role => {
  const ldapClient = ldap.createClient(ldapClientOpt);
  ldapClient.client.on("error", () => {
    console.log("LDAP Server 故障.");
  });
  ldapClient.client.on("idleTimeout", () => {
    // 关闭空闲超时连接
    ldapClient.unbind();
  });

  try {
    await ldapClient.bind(adminDn, adminSecret);
  } catch (err) {
    // Admin 绑定失败，无需释放 LDAP 连接
    return { code: 70000, message: "LDAP Server 授权失败." };
  }

  const res = await ldapClient.searchReturnAll(`ou=roles,${baseDn}`, {
    filter: `cn=${role}`,
    scope: "sub",
    attributes: ["uniqueMember"]
  });
  await ldapClient.unbind();

  if (res.entries[0]) {
    // 搜索成功，LDAP 的 groupOfUniqueNames 下至少有一个 uniqueMember
    let uniqueMember = res.entries[0].uniqueMember;

    const members = [];
    if (typeof uniqueMember === "string") {
      // 当只有一个用户的时候 uniqueMember 是一个字符串
      members.push(parseDn(uniqueMember).rdns[0].attrs.uid.value);
    } else {
      for (let item of uniqueMember) {
        members.push(parseDn(item).rdns[0].attrs.uid.value);
      }
    }

    return { code: 20000, data: { role, members } };
  } else {
    return { code: 40001, message: `“${role}”不存在.` };
  }
};

module.exports = {
  authenticate,
  getUserInfo,
  getRoleMember
};
