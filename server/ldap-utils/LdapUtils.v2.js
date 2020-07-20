"use strict";

const ldap = require("ldapjs");
const paserDN = require("ldapjs").parseDN;

const ldapClientOpt = {
  url: "ldap:///"
};
const ldapClient = ldap.createClient(ldapClientOpt);

const baseDn = "dc=ums";
const adminDn = `cn=admin,${baseDn}`;
const adminSecret = "root";

const validate = (username, password) => {
  return new Promise(resolve => {
    ldapClient.bind(adminDn, adminSecret, err => {
      if (err) {
        if (err.code === "ECONNREFUSED") {
          // LDAP 服务器故障
          resolve({
            code: 500,
            message: "LDAP server connect ECONNREFUSED."
          });
        } else {
          // admin 绑定不成功
          resolve({
            code: 500,
            message: "LDAP server authorize failed."
          });
        }
      }

      // 根据用户名搜索用户DN
      const searchOpt = {
        scope: "sub",
        filter: `uid=${username}`,
        attributes: ["dn", "password"]
      };

      ldapClient.search(baseDn, searchOpt, (err, res) => {
        let userEntry = [];

        res.on("searchEntry", entry => {
          userEntry.push(entry.object);
        });
        res.on("error", err => {
          resolve({
            code: 500,
            message: err.message
          });
        });
        res.on("end", result => {
          if (result.status === 0) {
            // 搜索成功
          } else {
            // 发生错误
            resolve({
              code: 500,
              message: result.status
            });
          }
        });
      });
    });
  });
};

// const validate = (username, password) => {
//   return new Promise(async resolve => {
//     const ldapClient = ldap.createClient(ldapClientOpt);

//     try {
//       await ldapClient.bind(adminDn, adminSecret);
//     } catch (err) {
//       if (err.code === "ECONNREFUSED") {
//         // LDAP 服务器故障
//         resolve({
//           code: 500,
//           message: "LDAP server connect ECONNREFUSED."
//         });
//       } else {
//         // admin 绑定不成功
//         resolve({
//           code: 500,
//           message: "LDAP server authorize failed."
//         });
//       }
//     }

//     // 根据用户名搜索 DN
//     const userEntry = await this.client.findUser(baseDn, `(uid=${username})`, {
//       scope: "sub"
//     });

//     if (!userEntry) {
//       resolve({
//         code: 401,
//         message: "用户不存在."
//       });
//     }

//     // 验证用户密码
//     try {
//       await ldapClient.bind(userEntry.dn, password);
//       //验证通过
//       resolve({
//         code: 200,
//         message: "Success."
//       });
//     } catch (err) {
//       // 验证不通过
//       resolve({
//         code: 401,
//         message: "密码不正确."
//       });
//     }
//   });
// };

module.exports = {
  validate
};
