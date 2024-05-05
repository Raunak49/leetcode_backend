const Docker = require("dockerode");
const Submission = require("../models/Submission");

const python = async (submission) => {
  const id = submission._id;
  try {
    const code = submission.code;
    const input = submission.input;

    const command = `cat <<EOF > hello.py
${code}
EOF
cat <<EOF > input.txt
${input}
EOF
timeout 10s python3 hello.py < input.txt`;

    const docker = new Docker();
    const container = await docker.createContainer({
      Image: "raunak49/pycode",
      Cmd: ["/bin/bash", "-c", command],
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
    });

    const currentTime = new Date();
    container.start();
    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
    });
    const output = [];
    stream.on("error", async (err) => {
      throw err;
    });
    stream.on("data", (chunk) => {
      output.push(chunk.toString());
    });
    stream.on("end", async () => {
      container.remove();
      const finalTime = new Date();
      const executionTime = finalTime - currentTime;
      if (executionTime > 10000)
        await Submission.findByIdAndUpdate(id, {
          status: "Error",
          output: "Time Limit Exceeded",
        });
      else {
        output.push(`\n\nExecution Time: ${finalTime - currentTime}ms`);
        const result = output.join("");
        await Submission.findByIdAndUpdate(id, {
          status: "Success",
          output: result,
        });
      }
    });
    // fs.writeFile('./execute/pythonCode/hello.py', code, (err) => {
    //     if (err) throw err;
    // });
    // exec('docker build -t pythone ./execute/pythonCode', async (err, stdout, stderr) => {
    //     if (err) {
    //         throw err;
    //     }
    //     exec('docker run pythone', async (err, stdout, stderr) => {
    //       if (err) {
    //         throw err;
    //       }
    //         fs.unlink('./execute/pythonCode/hello.py', (err) => {
    //             if (err) throw err;
    //         });
    //         exec('docker rmi pythone -f');
    //         await Submission.findOneAndReplace(id, {status:"Success", output:stdout});
    //     });
    // });
  } catch (err) {
    console.log(err);
    await Submission.findByIdAndUpdate(id, {
      status: "Error",
      output: err,
    });
  }
};

module.exports = python;
