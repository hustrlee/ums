const { validate } = require("./LdapUtils");

(async() => {
    const res = await validate("xiawei", "123");
    console.log(res);
})();