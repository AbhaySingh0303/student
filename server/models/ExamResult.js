const mongoose = require('mongoose');

const examResultSchema = mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: String, required: true },
    marks: { type: Number, required: true },
    maxMarks: { type: Number, required: true }, // Add maxMarks field
    grade: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ExamResult', examResultSchema);