const tokenClient = require("./TokenUtils");

// 功能测试
let tokenToDel;

tokenClient
  .setToken("xiawei")
  .then(token => {
    tokenToDel = token;
    console.log(token);
    return tokenClient.getUsername(token);
  })
  .then(username => {
    console.log(username);
    return tokenClient.delToken(tokenToDel);
  })
  .then(res => {
    console.log(res);
  });

// 性能测试
// let i;
// for (i = 0; i < 10; i++) {
//   tokenClient.setToken("xiawei").then(token => {
//     console.log(token);
//   });
// }

// console.log("Count: ", i);
