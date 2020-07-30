const axios = require("axios");
const moment = require("moment");
const client = axios.create({
  baseURL: "http://localhost:3000/",
  headers: { "Content-Type": "application/json" },
  timeout: 0
});

const opt = {
  url: "/login",
  method: "post",
  data: {
    username: "xiawei",
    password: "123"
  }
};

const concurrent = [];
for (let i = 0; i < 800; i++) {
  concurrent.push((() => client.request(opt))());
}

const start = moment();

Promise.allSettled(concurrent).then(res => {
  const end = moment();
  console.log("耗时：", end.diff(start));
  let failCount = 0;
  let successCount = 0;
  res.forEach(element => {
    if (element.status === "rejected") {
      failCount++;
    } else {
      successCount++;
    }
  });
  console.log("成功：", successCount);
  console.log("失败：", failCount);
});
