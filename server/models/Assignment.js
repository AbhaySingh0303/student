const mongoose = require("mongoose");

const assignmentSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    file: {
      type: String, // Assignment file uploaded by teacher
      required: false,
    },
    submissions: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        submissionFile: {
          type: String,
          required: true,
        },
        submissionDate: {
          type: Date,
          default: Date.now,
        },
        grade: {
          type: String, // e.g. A, B, C, or "Pending"
          default: "Pending",
        },
        feedback: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
