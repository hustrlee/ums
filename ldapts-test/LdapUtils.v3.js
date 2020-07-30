const { Client } = require("ldapts");

const client = new Client({
  url: "ldap:///"
});

(async () => {
  try {
    for (let i = 0; i < 100; i++) {
      await client.bind("cn=admin,dc=ums", "root");
      console.log("success");
    }
  } catch (err) {
    console.log("fail");
  } finally {
    await client.unbind();
  }

  try {
    for (let i = 0; i < 100; i++) {
      await client.bind("cn=admin,dc=ums", "root");
      console.log("success2");
    }
  } catch (err) {
    console.log("fail");
  } finally {
    await client.unbind();
  }
})();
