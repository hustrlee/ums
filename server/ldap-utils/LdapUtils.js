const ldap = require("ldapjs");
const client = ldap.createClient({
  url: "ldap:///"
});

const baseDn = "dc=ums";
const adminDn = "cn=admin," + baseDn;
const adminSecret = "root";

const validate = (username, password) => {
  // 通过 username 获取完整的 DN
  client.bind(adminDn, adminSecret, err => {
    if (err) {
      // admin 无法登录。通常是服务器出错
      return {
        code: 500,
        message: "LDAP 服务器故障。"
      };
    } else {
      // admin bind 成功，搜索 userDn
      const opt = {
        scope: "sub",
        filter: `(uid=${username})`,
        attributes: ["dn", "cn", "sn"]
      };
      client.search(baseDn, opt, (err, res) => {
        res.on("searchEntry", function (entry) {
          console.log("entry: " + JSON.stringify(entry.object));
        });

        res.on("end", result => {
          client.unbind();
        });
      });
    }
  });
  // 校验密码
};

module.exports = {
  validate
};
