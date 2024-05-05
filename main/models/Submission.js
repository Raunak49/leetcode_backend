const mongoose = require('mongoose');

const Submission = new mongoose.Schema({
    language: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ["Running", "Success", "Error"],
        default: "Running"
    },
    input: {
        type: String,
        default: ""
    },
    output: {
        type: String
    }
});

module.exports = mongoose.model('Submission', Submission);