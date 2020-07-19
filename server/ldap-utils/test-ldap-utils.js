const LdapClient = require("./LdapUtils");
const ldapClient = new LdapClient();

(async () => {
  try {
    await ldapClient.bind();
    // const res = await umsClient.validate("xiawei", "123");
    const res = await ldapClient.getUserInfo("guoping");
    console.log(res);
    await ldapClient.unbind();
  } catch (err) {
    console.log(err.lde_message);
  }
})();
