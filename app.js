const express = require('express');
const Docker = require('dockerode');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello World!');
});
const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 
}

app.use(cors(corsOptions));

app.post('/run', async (req, res) => {
    const code = req.body.code;
    const input = req.body.input || '';
    const command = `cat <<EOF > Main.java 
${code} 
EOF
javac Main.java
cat <<EOF >input.txt
${input}
EOF
cat input.txt | java Main`;
    
    const docker = new Docker();
    const container = await docker.createContainer({
        Image: 'amazoncorretto',
        Cmd: ['/bin/bash', '-c', command],
        Tty: true,
        OpenStdin: true,
        StdinOnce: false,
    });
    container.start();
    const stream = await container.attach({ stream: true, stdout: true, stderr: true });
    const output = [];
    stream.on('error', (err) => {
        console.log(err);
        res.send(err);
    });
    stream.on('data', (chunk) => {
        output.push(chunk.toString());
    });
    stream.on('end', () => {
        container.remove();
        res.json({ output: output.join('') });
    });
});
    
app.listen(5000, () => {
    console.log('listening on port 5000!');
});