"use strict";

const ldap = require("ldapjs-promise");
const parseDn = require("ldapjs-promise").parseDN;
const ldapClientOpt = {
  url: `ldap://${process.env.LDAP_HOST || "/"}`,
  reconnect: true
};
const baseDn = "dc=ums";
const adminDn = `cn=admin,${baseDn}`;
const adminSecret = "root";

class LdapUtils {
  constructor() {
    this.ldapClient = ldap.createClient(ldapClientOpt);
    this.ldapClient.client.on("error", err => {
      console.log("LDAP Server 故障.");
    });
  }

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
  authenticate = (username, password) => {
    return new Promise(async resolve => {
      await this.ldapClient.bind(adminDn, adminSecret);
      const entry = await this.ldapClient.findUser(
        baseDn,
        `(uid=${username})`,
        { scope: "sub" }
      );
      // 搜索完毕，关闭连接
      if (entry) {
        // 验证用户密码
        await this.ldapClient.bind(entry.dn, password);
        // 密码验证成功
        resolve({ code: 20000, message: "Success." });
      } else {
        // 没有找到对应的用户DN
        resolve({ code: 60204, message: "用户名错误." });
      }
    });
  };

  /**
   * 获取图像类型
   *
   * @param {Array.<number>} buffer - 图像数据 buffer
   * @returns {string} - Mime Type
   */
  getMimeType = buffer => {
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
        isEqual = buf.equals(
          buffer.slice(0, imageBufferHeader.bufBegin.length)
        );
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
  getUserInfo = username => {
    return new Promise(resolve => {
      // const ldapClient = ldap.createClient(ldapClientOpt);

      // ldapClient.client.on("error", err => {
      //   resolve({ code: 70000, message: "LDAP Server 故障." });
      // });

      this.ldapClient
        .bind(adminDn, adminSecret)
        .then(
          res => {
            // 根据用户名搜索用户DN
            return this.ldapClient.search(baseDn, {
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
              const mimeType = this.getMimeType(entry.raw.jpegPhoto);
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

              userInfo = { username, name, roles, avatar };
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

  getRoleMember = role => {
    return new Promise(resolve => {
      // const ldapClient = ldap.createClient(ldapClientOpt);

      // ldapClient.client.on("error", err => {
      //   resolve({ code: 70000, message: "LDAP Server 故障." });
      // });

      this.ldapClient
        .bind(adminDn, adminSecret)
        .then(
          res => {
            return this.ldapClient.searchReturnAll(`ou=roles,${baseDn}`, {
              filter: `cn=${role}`,
              scope: "sub",
              attributes: ["uniqueMember"]
            });
          },
          err => {
            // Admin 绑定失败
            resolve({ code: 70000, message: "LDAP Server 授权失败." });
          }
        )
        .then(
          res => {
            if (res.entries[0]) {
              // 搜索成功，LDAP 的 groupOfUniqueNames 下至少有一个 uniqueMember
              const members = [];
              let uniqueMember = res.entries[0].uniqueMember;

              if (typeof uniqueMember === "string") {
                // 当只有一个用户的时候 uniqueMember 是一个字符串
                members.push(parseDn(uniqueMember).rdns[0].attrs.uid.value);
              } else {
                for (let item of uniqueMember) {
                  members.push(parseDn(item).rdns[0].attrs.uid.value);
                }
              }

              resolve({
                code: 20000,
                data: { role, members }
              });
            } else {
              resolve({
                code: 40001,
                message: `“${role}”不存在.`
              });
            }
          },
          err => {
            // 发生搜索错误
            resolve({ code: 70000, message: "LDAP Server 搜索故障." });
          }
        );
    });
  };
}

module.exports = { LdapUtils };
