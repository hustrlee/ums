const crypto = require("crypto");
const ldap = require("ldapjs-promise");
const client = ldap.createClient({
  url: "ldap:///"
});

const baseDn = "dc=ums";
const adminDn = "cn=admin," + baseDn;
const adminSecret = "root";

// const validate = (username, password) => {
//   return new Promise(async (resolve, reject) => {
//     let res = {};

//     try {
//       // 通过 username 获取完整的 DN
//       await client.bind(adminDn, adminSecret);
//       const userEntry = await client.findUser(baseDn, `(uid=${username})`, {
//         scope: "sub"
//       });
//       console.log("bind success.");
//       // 校验密码
//       const hash = crypto.createHash("md5");
//       const passwordHash = hash.update(password).digest("base64");
//       if (userEntry.userPassword === `{MD5}${passwordHash}`) {
//         // 密码匹配
//         res = { code: 200, message: "success" };
//       } else {
//         // 密码不匹配
//         res = { code: 401, message: "failed" };
//       }

//       // await client.unbind();
//       resolve(res);
//     } catch (err) {
//       res = { code: 500, message: err.lde_message };

//       // await client.unbind();
//       reject(res);
//     } finally {
//       await client.unbind();
//     }
//   });
// };
const validate = async (username, password) => {
  let res = {};

  try {
    // 通过 username 获取完整的 DN
    await client.bind(adminDn, adminSecret);
    const userEntry = await client.findUser(baseDn, `(uid=${username})`, {
      scope: "sub"
    });
    console.log("bind success.");
    // 校验密码
    const hash = crypto.createHash("md5");
    const passwordHash = hash.update(password).digest("base64");
    if (userEntry.userPassword === `{MD5}${passwordHash}`) {
      // 密码匹配
      res = { code: 200, message: "success" };
    } else {
      // 密码不匹配
      res = { code: 401, message: "failed" };
    }
  } catch (err) {
    res = { code: 500, message: err.lde_message };
  } finally {
    await client.unbind();
    return res;
  }
};

module.exports = {
  validate
};
