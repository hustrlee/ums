/* eslint-disable no-unused-vars */
const Service = require("./Service");
// const ldap = require("ldapjs-promise");
const { authenticate } = require("./LdapUtils");

/**
 * 用户登录
 *
 * loginDto LoginDto
 * returns String
 * */
const login = async ({ loginDto }) => {
  // const client = ldap.createClient({
  //   url: "ldap:///"
  // });
  // const { username, password } = loginDto;
  // let res = "Fail";
  // try {
  //   await client.bind("cn=admin,dc=ums", "root");
  //   const entry = await client.findUser("dc=ums", `(uid=${username})`, {
  //     scope: "sub"
  //   });
  //   await client.bind(entry.dn, password);
  //   res = "Success";
  //   await client.unbind();
  // } catch (err) {
  //   res = "Fail";
  // }
  // return new Promise(resolve => resolve(res));

  const res = await authenticate(loginDto);
  return new Promise(resolve => resolve(Service.successResponse(res)));
};

module.exports = {
  login
};
