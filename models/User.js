const mongoose = require('mongoose');

const User = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    submissions: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Submission'
        }],
        default: []
    }
});

module.exports = mongoose.model('User', User);