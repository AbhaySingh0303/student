const mongoose = require('mongoose');
const examScheduleSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    file: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('ExamSchedule', examScheduleSchema);