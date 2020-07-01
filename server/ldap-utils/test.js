// const { validate } = require("./LdapUtils");
const crypto = require("crypto");
const ldap = require("ldapjs-promise");
const client = ldap.createClient({
  url: "ldap:///"
});

const baseDn = "dc=ums";
const adminDn = "cn=admin," + baseDn;
const adminSecret = "root";

let res = {};

(async () => {
  // 通过 username 获取完整的 DN
  await client.bind(adminDn, adminSecret);
  const userEntry = await client.findUser(baseDn, `(uid=xiawei)`, {
    scope: "sub"
  });
  // 校验密码
  const hash = crypto.createHash("md5");
  const passwordHash = hash.update("234").digest("base64");
  if (userEntry.userPassword === `{MD5}${passwordHash}`) {
    // 密码匹配
    res = { code: 200, message: "success" };
  } else {
    // 密码不匹配
    res = { code: 401, message: "failed" };
  }
  console.log(res);
  await client.unbind();
})();

