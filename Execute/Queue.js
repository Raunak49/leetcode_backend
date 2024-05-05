require('dotenv').config()
const java = require('./language/java');
const python = require('./language/python');
const cpp = require('./language/cpp');
const amqp = require('amqplib/callback_api');
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log("unable to connect to DB");
    console.log(err);
  });


// const sqs = new AWS.SQS({
//     region: 'ap-south-1',
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     apiVersion: '2012-11-05'
// });

// const params = {
//     QueueUrl: process.env.AWS_SQS_URL,
//     MaxNumberOfMessages: 1,
//     VisibilityTimeout: 10,
//     WaitTimeSeconds: 0
// };

// sqs.receiveMessage(params, async (err, data) => {
//     if (err) {
//       console.log(err);
//     } else if (data.Messages.length===0) {
//       console.log('no message found');
//     } else {
//         console.log(data)
//         const message = data.Messages[0];
//         console.log(message)
//         const body = JSON.parse(message.Body);
//         console.log(body.id);
//         const receiptHandle = message.ReceiptHandle;
//         const submission = body.submission;
//         await execute(submission);
//         const deleteParams = {
//             QueueUrl: process.env.AWS_SQS_URL,
//             ReceiptHandle: receiptHandle,
//         };
//         sqs.deleteMessage(deleteParams, (err, data) => {
//             if (err) {
//             console.log(err);
//             } else {
//             console.log('message deleted');
//             }
//         });
//     }
//   });
amqp.connect(process.env.RABBITMQ_URL, (err, connection) => {
    if(err) {
        console.log(err);
    }
    connection.createChannel((err, channel) => {
        if(err) {
            console.log(err);
        }
        channel.assertQueue('task_queue', {
            durable: true
        });
        channel.consume('task_queue', async (msg) => {
            const submission = JSON.parse(msg.content.toString()).submission;
            await execute(submission);
            channel.ack(msg);
        });
    });
});


const execute = async (submission) => {
    const language = submission.language;
    if(language==="java") {
        java(submission);
    }
    else if(language==="python") {
        python(submission);
    }
    else if(language==="cpp") {
        cpp(submission);
    }
}
