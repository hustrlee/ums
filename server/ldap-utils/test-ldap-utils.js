const client = require("./LdapUtils");

(async () => {
  let i;
  // 压力测试
  for (i = 0; i < 1; i++) {
    res = await client.authenticate("xiawei", "123");
    console.log(res);
    res = await client.getUserInfo("xiawei");
    console.log(res);
  }
})();
