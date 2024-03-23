const express = require('express');
const Docker = require('dockerode');
const Submission = require('../models/Submission');

const java = async (submission) => {
    const id = submission._id;
    try {
        const code = submission.code;
        const input = submission.input;

        const command = `cat <<EOF > Main.java 
${code} 
EOF
javac Main.java
cat <<EOF >input.txt
${input}
EOF
cat input.txt | timeout 4s java Main`;
    
        const docker = new Docker();
        const container = await docker.createContainer({
            Image: "amazoncorretto",
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
            console.log(err);
            await Submission.findByIdAndUpdate(id, { status: "Error", output: err });
        });
        stream.on("data", (chunk) => {
            output.push(chunk.toString());
        });
        stream.on("end", async () => {
            container.remove();
            const finalTime = new Date();
            const executionTime = finalTime - currentTime;
            if (executionTime > 4000)
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
            output: "Server Error",
        });
    }
}

module.exports = java;