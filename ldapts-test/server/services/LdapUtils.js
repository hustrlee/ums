const ldap = require("ldapjs-promise");

const authenticate = async ({ username, password }) => {
  const client = ldap.createClient({
    url: "ldap:///"
    // reconnect: true,
    // timeout: 100
  });

  client.client.on("error", err => {
    console.log("LDAP 连接数满.");
  });

  let res = "Fail";
  try {
    await client.bind("cn=admin,dc=ums", "root");
    const entry = await client.findUser("dc=ums", `(uid=${username})`, {
      scope: "sub"
    });
    await client.bind(entry.dn, password);
    res = "Success";
    await client.unbind();
  } catch (err) {
    res = "Fail";
  }
  return res;
};

module.exports = {
  authenticate
};
