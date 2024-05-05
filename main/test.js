const axios = require("axios");

async function fun(n) {
  let arr = [];

  for (let i = 0; i < n; i++) {
    const res = await axios.post("http://localhost:5000/run", {
      code: 'print("Hello World!")',
      input: "",
      language: "python",
    });
    arr.push(res.data.id);
  }

  console.log(arr);
  let result = [];
  for (let i = 0; i < n; i++) {
    let status = "Running";
    let res;
    while (status === "Running") {
      res = await axios.get(
        `http://localhost:5000/status/${arr[i]}`
      );
      status = res.data.status;
    }
    result.push(res.data.output);
  }

  console.log(result);
}

const d = new Date();
fun(50).then(() => {
  console.log("total time taken: ", Date.now() - d, "ms");
});