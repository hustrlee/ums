/* eslint-disable no-unused-vars */
const Service = require("./Service");
const { Client } = require("ldapts");

/**
 * 用户登录
 *
 * inlineObject InlineObject  (optional)
 * returns String
 * */
const client = new Client({
  url: "ldap:///"
});

const login = ({ inlineObject }) =>
  new Promise(async (resolve, reject) => {
    try {
      await client.bind("cn=admin,dc=ums", "root");
      resolve(Service.successResponse("Success"));
    } catch (e) {
      reject(
        Service.rejectResponse(e.message || "Invalid input", e.status || 405)
      );
    } finally {
      // await client.unbind();
    }
  });

module.exports = {
  login
};
