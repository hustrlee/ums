const client = require("./LdapUtils.v2");

(async () => {
  const res = await client.validate("xiawei", "123");
  console.log(res);
})();
