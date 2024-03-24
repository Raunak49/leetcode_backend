const express = require("express");
const Docker = require("dockerode");
const cors = require("cors");
const mongoose = require("mongoose");
const https = require('https');
const fs = require('fs');
const app = express();
require("dotenv").config();

const Submission = require("./models/Submission.js");
const User = require("./models/User.js");
const execute = require('./Execute/Queue.js');

const options = {
  cert: fs.readFileSync('./certificates/65.0.5.215.crt'),
  key: fs.readFileSync('./certificates/65.0.5.215.key')
};

const server = https.createServer(options, app);

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log("unable to connect to DB");
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
});
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.post("/run", async(req,res) => {
    try {
        const code = req.body.code;
        const input = req.body.input || "";
        const language = req.body.language;

        if(language!=="java" && language!=="python" && language!=="cpp") {
            res.json({error:"Language not available"}).status(400);
        }

        const submission = await Submission.create({code, input, language});
        res.json({id: submission._id});
        execute(submission);
    } catch(error) {
        console.log(error);
        res.json(error).status(500);
    }
});

app.get("/status/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.json({ error: "Invalid id" }).status(400);
  }

  const submission = await Submission.findById(id);
  if (!submission) {
    return res.json({ error: "Id not found" }).status(400);
  }
  res.json(submission).status(200);
});

app.all("*", (req, res) => {
    res.send("URL not found");
})

app.listen(3000, () => {
  console.log("listening on port 3000!");
});

server.listen(443, () => {
  console.log('Server listening on port 443');
});
