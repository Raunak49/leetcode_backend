const express = require('express');
const Docker = require('dockerode');
const Submission = require('../models/Submission');

const cpp = async (submission) => {
    const id = submission._id;
    try {
        const code = submission.code;
        const input = submission.input;

        const command = `cat <<EOF > program.cpp
${code}
EOF
g++ program.cpp
cat <<EOF >input.txt
${input}
EOF
timeout 5s ./a.out < input.txt`;
    
        const docker = new Docker();
        const container = await docker.createContainer({
            Image: "raunak49/cppcode",
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
            if (executionTime > 5000)
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
    } catch(err) {
        console.log(err);
        await Submission.findByIdAndUpdate(id, {
            status: "Error",
            output: err,
        });
    }
}

module.exports = cpp;