const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const AWS = require("aws-sdk");
const amqp = require('amqplib/callback_api');
require("dotenv").config();


// const sqs = new AWS.SQS({
//   region: "ap-south-1",
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   apiVersion: "2012-11-05",  
// });

const Submission = require("./models/Submission.js");

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
let channel = null;

amqp.connect(process.env.RABBITMQ_URL, (err, connection) => {
  if (err) {
    console.log(err);
  }
  connection.createChannel((err, chann) => {
    if (err) {
      console.log(err);
    }
    channel = chann;
  });
});

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
        
        // const params = {
        //   MessageBody: JSON.stringify({submission}),
        //   QueueUrl: process.env.AWS_SQS_URL,
        //   MessageGroupId: "1",
        //   MessageDeduplicationId: submission._id.toString()
        // }
        
        // sqs.sendMessage(params, function (err, data) {
        //   if (err) {
        //     console.log("Error", err);
        //   } else {
        //     console.log("Success", data.MessageId);
        //   }
        // });
        const message = JSON.stringify({submission});
        channel.assertQueue("task_queue", {durable: true});
        channel.sendToQueue("task_queue", Buffer.from(message), {persistent: true});
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

app.listen(5000, () => {
  console.log("listening on port 5000!");
});

