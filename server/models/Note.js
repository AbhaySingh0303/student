const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    subject: { type: String, required: true }, // New field for the subject
    file: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);