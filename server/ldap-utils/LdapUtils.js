"use strict";

const ldap = require("ldapjs-promise");
const paserDN = require("ldapjs-promise").parseDN;
const crypto = require("crypto");

class UmsClient {
  /**
   * 统一用户管理系统客户端构造函数
   */
  constructor() {
    this.client = ldap.createClient({
      url: "ldap:///",
      reconnect: true
    });
    this.baseDn = "dc=ums";
    this.adminDn = `cn=admin, ${this.baseDn}`;
    this.adminSecret = "root";
  }

  async bind() {
    await this.client.bind(this.adminDn, this.adminSecret);
  }

  async unbind() {
    await this.client.unbind();
  }

  /**
   * 验证用户名/密码是否正确
   *
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Object} - 验证结果
   * @property {number} code - 返回码。200: 验证通过; 401: 验证不通过
   * @property {string} message - 具体信息
   *
   */
  async validate(username, password) {
    // 搜索用户
    const userEntry = await this.client.findUser(
      this.baseDn,
      `(uid=${username})`,
      { scope: "sub" }
    );

    if (!userEntry) {
      return { code: 401, message: "用户不存在." };
    }

    // 验证密码
    const hash = crypto.createHash("md5");
    const passwordHash = hash.update(password).digest("base64");
    if (userEntry.userPassword !== `{MD5}${passwordHash}`) {
      return { code: 401, message: "密码不正确." };
    }

    return { code: 200, message: "Success." };
  }

  /**
   * @typedef {Object} UserInfo
   * @property {string} username - 用户名
   * @property {string} name - 用户的真实姓名
   * @property {array} roles - 用户的角色数组
   * @property {string} avatar - 用户头像，base64 编码图像
   */
  /**
   * 获取用户的详细信息
   *
   * @param {string} username - 用户名
   * @returns {UserInfo} - 用户的详细信息
   *
   */
  async getUserInfo(username) {
    const response = await this.client.search(this.baseDn, {
      scope: "sub",
      attributes: ["dn", "uid", "cn", "sn", "jpegPhoto", "memberOf"],
      filter: `(uid=${username})`
    });

    let userInfo;

    return new Promise((resolve, reject) => {
      response.on("searchEntry", (entry) => {
        // 判断 jpegPhoto 的类型：PNG / JPEG
        const getMimeType = (fileBuffer) => {
          if (!fileBuffer) {
            // 如果图像 Buffer 为空，则未能识别到该文件类型
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
                fileBuffer.slice(0, imageBufferHeader.bufBegin.length)
              );
            }
            // 判断标识头后缀
            if (isEqual && imageBufferHeader.bufEnd) {
              const buf = Buffer.from(imageBufferHeader.bufEnd);
              isEqual = buf.equals(
                fileBuffer.slice(-imageBufferHeader.bufEnd.length)
              );
            }
            if (isEqual) {
              return imageBufferHeader.mimeType;
            }
          }
          // 未能识别到该文件类型
          return "";
        };

        // 将 jpegPhoto 转换为 base64 图像数据，并赋值给 avatar
        let avatar = "";
        const mimeType = getMimeType(entry.raw.jpegPhoto);
        if (mimeType) {
          // 如果识别出 mimeType，则说明 avatar 数据有效
          avatar =
            `data:${mimeType};base64,` + entry.raw.jpegPhoto.toString("base64");
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
          roles.push(paserDN(item).rdns[0].attrs.cn.value);
        }

        userInfo = {
          username: entry.object.uid,
          name: entry.object.sn + entry.object.cn, // 将姓和名拼接成完整的名字
          roles,
          avatar
        };
      });

      response.on("error", (error) => {
        return reject(error);
      });

      response.on("end", (result) => {
        if (result.status !== 0) {
          return reject(result.status);
        }
        return resolve(userInfo);
      });
    });
  }
}

module.exports = UmsClient;
