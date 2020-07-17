"use strict";

const ldap = require("ldapjs-promise");
const crypto = require("crypto");

class UmsClient {
  /**
   * 统一用户管理系统客户端构造函数
   */
  constructor() {
    this.client = ldap.createClient({
      url: "ldap:///"
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
   * @property {string} dn - 用户的DN
   * @property {string} uid - 用户名
   * @property {string} name - 用户的真实姓名
   * @property {}
   */
  /**
   * 获取用户的详细信息
   *
   * @param {string} username - 用户名
   * @returns {Object} - 用户的详细信息
   * @returns {string}
   *
   */
  async getUserInfo(username) {
    const response = await this.client.search(this.baseDn, {
      scope: "sub",
      attributes: ["dn", "rdn", "uid", "cn", "sn", "jpegPhoto", "memberOf"],
      filter: `(uid=${username})`
    });

    let userInfo = {};

    return new Promise((resolve, reject) => {
      response.on("searchEntry", entry => {
        // 判断 jpegPhoto 的类型：PNG / JPEG
        const getMimeType = fileBuffer => {
          if (!fileBuffer) {
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
                //使用 buffer.slice 方法 对 buffer 以字节为单位切割
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
        const mimeType = getMimeType(entry.raw.jpegPhoto);
        let avatar = "";
        if (mimeType) {
          // 如果识别出 mimeType，则说明 avatar 数据有效
          avatar =
            `data:${mimeType};base64,` + entry.raw.jpegPhoto.toString("base64");
        }

        userInfo = {
          dn: entry.object.dn,
          rdn: entry.object.rdn,
          uid: entry.object.uid,
          name: entry.object.sn + entry.object.cn,
          memberOf: entry.object.memberOf,
          avatar: avatar
        };
      });
      response.on("error", error => {
        return reject(error);
      });
      response.on("end", result => {
        if (result.status !== 0) {
          return reject(result.status);
        }

        return resolve(userInfo);
      });
    });
  }
}

module.exports = UmsClient;
