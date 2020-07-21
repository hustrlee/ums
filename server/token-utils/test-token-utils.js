const tokenClient = require("./TokenUtils");

// 性能测试
// let i;
// for (i = 0; i < 10; i++) {
//   tokenClient.setToken("xiawei").then(token => {
//     console.log(token);
//     //   return tokenClient.getUsername(token);
//     // })
//     // .then(username => {
//     //   console.log(username);
//     //   return tokenClient.delByUsername(username);
//     // })
//     // .then(res => {
//     //   console.log(res);
//   });
// }

// console.log("Count: ", i);

tokenClient.setToken("xiawei").then(token => {
  console.log(token);
});
