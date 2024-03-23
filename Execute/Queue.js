const express = require('express');
const java = require('./java');
const python = require('./python');
const cpp = require('./cpp');
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

module.exports = execute;