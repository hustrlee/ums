const ldap = require("ldapjs-promise");

(async () => {
  const client = ldap.createClient({
    url: "ldap:///"
  });

  await client.bind("cn=admin,dc=ums", "root");
  const res = await client.findUser(
    "dc=ums",
    "(entryDN=uid=zhangyang,ou=定损中心,dc=ums)",
    {
      scope: "sub"
    }
  );

  await client.unbind();

  console.log(res);
})();
