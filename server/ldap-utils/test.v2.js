const UmsClient = require("./LdapUtils.v2");
const umsClient = new UmsClient();

(async () => {
  try {
    await umsClient.bind();
    // const res = await umsClient.validate("xiawei", "123");
    const res = await umsClient.getUserInfo("zhangyang");
    console.log(res);
    await umsClient.unbind();
  } catch (err) {
    console.log(err.lde_message);
  }
})();
