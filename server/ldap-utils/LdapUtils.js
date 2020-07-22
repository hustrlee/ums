"use strict";

const ldap = require("ldapjs-promise");
const parseDn = require("ldapjs-promise").parseDN;

const ldapClientOpt = {
  url: "ldap:///"
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
const authenticate = (username, password) => {
  return new Promise(resolve => {
    const ldapClient = ldap.createClient(ldapClientOpt);
    ldapClient.client.on("error", err => {
      resolve({ code: 70000, message: "LDAP Server 故障." });
    });

    ldapClient
      .bind(adminDn, adminSecret)
      .then(
        res => {
          // 根据用户名搜索用户DN
          return ldapClient.findUser(baseDn, `(uid=${username})`, {
            scope: "sub"
          });
        },
        err => {
          // Admin 绑定失败
          resolve({ code: 70000, message: "LDAP Server 授权失败." });
        }
      )
      .then(
        entry => {
          // 搜索完毕
          if (entry) {
            // 验证用户密码
            return ldapClient.bind(entry.dn, password);
          } else {
            // 没有找到对应的用户DN
            resolve({ code: 60204, message: "用户名错误." });
          }
        },
        err => {
          // 发生搜索错误
          resolve({ code: 70000, message: "LDAP Server 搜索故障." });
        }
      )
      .then(
        res => {
          // 密码验证成功
          resolve({ code: 20000, message: "Success." });
        },
        err => {
          // 密码验证不成功
          resolve({ code: 60204, message: "密码错误." });
        }
      );
  });
};

/**
 * 获取图像类型
 *
 * @param {Array.<number>} buffer - 图像数据 buffer
 * @returns {string} - Mime Type
 */
const getMimeType = buffer => {
  if (!buffer) {
    // 图像 buffer 为空，未能识别到该文件类型
    return "";
  }

  // 通过文件特征码判断 MIME 类型，目前支持 PNG / JPEG
  const imageBufferHeaders = [
    {
      bufBegin: [0xff, 0xd8],
      bufEnd: [0xff, 0xd9],
      mimeType: "image/jpeg"
    },
    {
      bufBegin: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      mimeType: "image/png"
    }
  ];

  for (const imageBufferHeader of imageBufferHeaders) {
    let isEqual;
    // 判断标识头前缀
    if (imageBufferHeader.bufBegin) {
      const buf = Buffer.from(imageBufferHeader.bufBegin);
      isEqual = buf.equals(buffer.slice(0, imageBufferHeader.bufBegin.length));
    }
    // 判断标识头后缀
    if (isEqual && imageBufferHeader.bufEnd) {
      const buf = Buffer.from(imageBufferHeader.bufEnd);
      isEqual = buf.equals(buffer.slice(-imageBufferHeader.bufEnd.length));
    }
    if (isEqual) {
      return imageBufferHeader.mimeType;
    }
  }
  // 未能识别到该文件类型
  return "";
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
const getUserInfo = username => {
  return new Promise(resolve => {
    const ldapClient = ldap.createClient(ldapClientOpt);
    ldapClient.client.on("error", err => {
      resolve({ code: 70000, message: "LDAP Server 故障." });
    });

    ldapClient
      .bind(adminDn, adminSecret)
      .then(
        res => {
          // 根据用户名搜索用户DN
          return ldapClient.search(baseDn, {
            filter: `(uid=${username})`,
            scope: "sub",
            attributes: ["cn", "sn", "memberOf", "jpegPhoto"]
          });
        },
        err => {
          // Admin 绑定失败
          resolve({ code: 70000, message: "LDAP Server 授权失败." });
        }
      )
      .then(
        res => {
          let userInfo;

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
              // 为了后续处理的方便，将 memberOf 重新封装成数组
              memberOf = [memberOf];
            }
            for (let item of memberOf) {
              roles.push(parseDn(item).rdns[0].attrs.cn.value);
            }

            // 将姓和名拼接成完整的名字
            const name = entry.object.sn + entry.object.cn;

            userInfo = { name, roles, avatar };
          });

          res.on("error", err => {
            // 发生搜索错误
            resolve({ code: 70000, message: "LDAP Server 搜索故障." });
          });

          res.on("end", result => {
            if (result.status === 0) {
              // 搜索正常结束
              if (userInfo) {
                // 搜索到了结果
                resolve({ code: 20000, data: userInfo });
              } else {
                // 没有该用户信息
                resolve({ code: 40001, message: "没有该用户." });
              }
            } else {
              // 发生搜索错误
              resolve({ code: 70000, message: "LDAP Server 搜索故障." });
            }
          });
        },
        err => {
          // 发生搜索错误
          resolve({ code: 70000, message: "LDAP Server 搜索故障." });
        }
      );
  });
};

module.exports = {
  authenticate,
  getUserInfo
};
