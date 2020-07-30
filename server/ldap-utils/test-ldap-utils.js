// const client = require("./LdapUtils");

// // 功能测试
// // client.getUserInfo("xiawei").then(res => {
// //   console.log(res);
// // });
// // client.getRoleMember("组长").then(res => {
// //   console.log(res);
// // });

// // 压力测试
// for (let i = 0; i < 10; i++) {
//   client
//     .authenticate("xiawei", "123")
//     .then(res => {
//       // console.log(res);
//       return client.getUserInfo("xiawei");
//     })
//     .then(res => {
//       console.log(res);
//     });
// }

const Ldap = require("./LdapUtils.v2").LdapUtils;

// 功能测试
// client.getUserInfo("xiawei").then(res => {
//   console.log(res);
// });
// client.getRoleMember("组长").then(res => {
//   console.log(res);
// });
let i;
for (i = 0; i < 10; i++) {
  const client = new Ldap();
  client.authenticate("xiawei", "123").then(res => {
    console.log(res);
  });
}

console.log(i);
