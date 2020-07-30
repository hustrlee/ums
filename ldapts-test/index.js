const axios = require("axios");
const concurrent = [];

for (let i = 0; i < 1; i++) {
  concurrent.push(
    axios.post("http://localhost:3000/login", {
      header: "content-type: application/json",
      data: {
        username: "xiawei",
        password: "123"
      }
    })
  );
}

console.log(concurrent);

Promise.all(concurrent)
  .then(res => {
    console.log(res.data);
  })
  .catch(err => {
    console.log(err);
  });
