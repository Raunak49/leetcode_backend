const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/run', async (req, res) => {
    const code = req.body.code;
    fs.writeFile('./code/Hello.java', code, (err) => {
        if (err) throw err;
    });
    exec('docker build -t code ./code', (err, stdout, stderr) => {
        if (err) {
            res.send(stderr);
        }
        exec('docker run code', (err, stdout, stderr) => {
            if (err) {
                res.send(stderr);
            }
            fs.unlink('./code/Hello.java', (err) => {
                if (err) throw err;
            });
            exec('docker rmi code -f');
            res.send(stdout);
        });
    });
});
    
app.listen(3000, () => {
    console.log('listening on port 3000!');
});