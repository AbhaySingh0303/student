// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const Assignment = require('./models/Assignment');
const ExamSchedule = require('./models/ExamSchedule');
const ExamResult = require('./models/ExamResult');
const Note = require('./models/Note');
const User = require('./models/User');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
// 🚀 Prevent browser caching for all API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
connectDB();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

// protect middleware: sets req.user (id string) and req.role
const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // store id string and role
      req.user = decoded.id;
      req.role = decoded.role;

      // quick role-based allowance: GETs always allowed
      if (req.method === 'GET') {
        return next();
      }

      // Teacher full write access
      if (req.role === 'teacher') {
        return next();
      }

      // Student-specific allowances
      if (req.role === 'student') {
        // allow students to submit assignments
        if (
          req.method === 'POST' &&
          req.originalUrl.includes('/api/assignments') &&
          req.originalUrl.includes('/submit')
        ) {
          return next();
        }
        // allow students to create/change their own password
        if (
          req.method === 'PUT' &&
          (req.originalUrl.includes('/api/change-password') ||
            req.originalUrl.includes('/api/create-password'))
        ) {
          return next();
        }

        // block other write actions
        return res.status(403).json({ message: 'Forbidden: Students cannot perform this action' });
      }

      // invalid role
      return res.status(403).json({ message: 'Forbidden: Invalid role' });
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// ---------- Auth / user routes ----------
app.put('/api/create-password', protect, async (req, res) => {
  const { newPassword } = req.body;
  try {
    // req.user is id string
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.password) {
      return res.status(400).json({ message: 'Password already exists. Use change password route.' });
    }

    user.password = newPassword; // pre-save will hash if model uses pre('save')
    await user.save();

    return res.json({ message: 'Password set successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create password.' });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, username, password, mobileNumber, role } = req.body;
  try {
    if (role === 'teacher') {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'A user with this username already exists.' });
  }

  const user = await User.create({
    name,
    username,
    password,
    mobileNumber,   // ✅ store teacher’s mobile number
    role,
    isApproved: true
  });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.status(201).json({
    token,
    role: user.role,
    username: user.username,
    mobileNumber: user.mobileNumber  // ✅ return it to frontend
  });
}

  } catch (error) {
    res.status(400).json({ message: 'Registration failed.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await user.matchPassword(password)) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, role: user.role, username: user.username, registrationNo: user.registrationNo || null, name: user.name });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// pending requests and approval (teacher only via protect)
app.get('/api/pending-requests', protect, async (req, res) => {
  try {
    const requests = await User.find({ isApproved: false });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending requests.' });
  }
});

app.put('/api/approve-user/:trackId', protect, async (req, res) => {
  const { trackId } = req.params;
  const { registrationNo } = req.body;
  try {
    const user = await User.findOne({ trackId });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.isApproved) {
      return res.status(400).json({ message: 'User is already approved.' });
    }

    // Generate username from name + regNo
    const username = `${user.name.replace(/\s/g, '').toLowerCase()}${registrationNo}`;

    // Check duplicate username
    const existingUserWithUsername = await User.findOne({ username });
    if (existingUserWithUsername) {
      return res.status(400).json({ message: 'Registration number results in a username that already exists. Please choose a different one.' });
    }

    // Update user details
    user.username = username;
    user.registrationNo = registrationNo;
    user.isApproved = true;
    await user.save();

    // ✅ Add student record to Student collection if not already exists
    let student = await Student.findOne({ registrationNo: registrationNo });
    if (!student) {
      student = new Student({
        name: user.name,
        registrationNo: registrationNo,
        photo: null,
        attendance: [],
        subjects: [],
        mobileNumber: user.mobileNumber   // ✅ save mobile number too
      });
      await student.save();
    }

    res.json({ username, message: "Student approved and added to Student records." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'User approval failed.' });
  }
});

// GET user details after approval
app.get('/api/user-details/:trackId', async (req, res) => {
  const { trackId } = req.params;
  try {
    const user = await User.findOne({ trackId });
    if (!user || !user.isApproved) {
      return res.status(404).json({ message: 'User not approved or track ID invalid.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ username: user.username, isApproved: user.isApproved, token });

  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve user details.' });
  }
});

app.put('/api/change-password', protect, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If old password matches
    if (user.password && await user.matchPassword(oldPassword)) {
      user.password = newPassword;  // ✅ Plain password, pre('save') will hash it
      await user.save();
      return res.json({ message: 'Password changed successfully.' });
    } 
    
    // If password was not set earlier (newly approved student)
    else if (!user.password && oldPassword === '') {
      user.password = newPassword;  // ✅ Plain password
      await user.save();
      return res.json({ message: 'Password set successfully.' });
    } 
    
    else {
      return res.status(401).json({ message: 'Invalid old password.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to change password.' });
  }
});


// ---------- Students ----------
// ---------- Students ----------
app.get('/api/students', protect, async (req, res) => {
  try {
    // fetch all students
    const students = await Student.find({});

    // fetch users with matching registration numbers
    const users = await User.find({
      registrationNo: { $in: students.map(s => s.registrationNo) }
    }).select("registrationNo mobileNumber");

    // merge mobileNumber into student object
    const enrichedStudents = students.map(student => {
      const user = users.find(u => u.registrationNo === student.registrationNo);
      return {
        ...student.toObject(),
        mobileNumber: user ? user.mobileNumber : null
      };
    });

    res.json(enrichedStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get single student by id
app.get('/api/students/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/students', protect, upload.single('photo'), async (req, res) => {
  try {
    const { name, registrationNo } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    const newStudent = new Student({ name, registrationNo, photo, subjects: [], attendance: [] });
    const createdStudent = await newStudent.save();
    res.status(201).json(createdStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/students/:id', protect, upload.single('photo'), async (req, res) => {
  try {
    const { name, registrationNo } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.name = name || student.name;
    student.registrationNo = registrationNo || student.registrationNo;
    if (photo) {
      student.photo = photo;
    }
    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/students/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await Student.deleteOne({ _id: req.params.id });
    res.json({ message: 'Student removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/students/:id/add-subject', protect, async (req, res) => {
  const { subject, marks } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      student.subjects.push({ subject, marks });
      const updatedStudent = await student.save();
      res.json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/students/:id/delete-subject', protect, async (req, res) => {
  const { subject } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      student.subjects = student.subjects.filter(
        (sub) => sub.subject !== subject
      );
      const updatedStudent = await student.save();
      res.json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/students/:id/update-subject', protect, async (req, res) => {
  const { subject, marks } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      const subjectToUpdate = student.subjects.find(sub => sub.subject === subject);
      if (subjectToUpdate) {
        subjectToUpdate.marks = marks;
        const updatedStudent = await student.save();
        res.json(updatedStudent);
      } else {
        res.status(404).json({ message: 'Subject not found for this student' });
      }
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/students/:id/add-attendance', protect, async (req, res) => {
  const { date, status } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      const attendanceRecord = student.attendance.find(
        (record) => new Date(record.date).toDateString() === new Date(date).toDateString()
      );
      if (attendanceRecord) {
        attendanceRecord.status = status;
      } else {
        student.attendance.push({ date, status });
      }
      const updatedStudent = await student.save();
      res.json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/attendance/bulk-update', protect, async (req, res) => {
  const attendanceRecords = req.body;
  try {
    const updates = attendanceRecords.map(record =>
      Student.findByIdAndUpdate(
        record.studentId,
        {
          $push: {
            attendance: {
              date: record.date,
              status: record.status
            }
          }
        },
        { new: true, upsert: true }
      )
    );
    await Promise.all(updates);
    res.status(200).json({ message: 'Attendance updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Teachers List (for students) ----------
app.get('/api/teachers', protect, async (req, res) => {
  try {
    if (req.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view teachers' });
    }

    // 👇 include mobileNumber in the response
    const teachers = await User.find({ role: 'teacher' })
      .select('name username mobileNumber');
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});




// ---------- Assignments (improved) ----------

// Create assignment (teacher only)
app.post('/api/assignments', protect, upload.single('file'), async (req, res) => {
  try {
    // Extra guard: ensure teacher
    if (req.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create assignments' });
    }

    const { title, description, dueDate } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;
    const newAssignment = new Assignment({
      title,
      description,
      dueDate,
      file: filePath,
    });
    const createdAssignment = await newAssignment.save();
    res.status(201).json(createdAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get assignments: teachers see all, students see only their own submission inside each assignment
app.get('/api/assignments', protect, async (req, res) => {
  try {
    let assignments = await Assignment.find({}).populate('submissions.studentId', 'name registrationNo');

    if (req.role === 'student') {
      // map to include only the logged-in student's submission
      assignments = assignments.map(a => {
        const mySubmissions = a.submissions.filter(s => s.studentId && s.studentId._id.toString() === req.user.toString());
        // return the assignment with submissions replaced by mySubmissions
        return { ...a.toObject(), submissions: mySubmissions };
      });
    }
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment (student only) — use req.user as studentId and prevent duplicates
app.post('/api/assignments/:id/submit', protect, upload.single('submissionFile'), async (req, res) => {
  try {
    // guard
    if (req.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit assignments' });
    }

    const submissionFile = req.file ? `/uploads/${req.file.filename}` : null;
    if (!submissionFile) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // Prevent duplicate submission by this student
    const existing = assignment.submissions.find(sub => sub.studentId.toString() === req.user.toString());
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted this assignment.' });
    }

    assignment.submissions.push({
      studentId: req.user,
      submissionFile,
      submissionDate: Date.now(),
      grade: 'Pending',
      feedback: ''
    });

    const updated = await assignment.save();
    // populate the newly added submission's studentId for response
    await updated.populate('submissions.studentId', 'name registrationNo');
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Grade a submission (teacher only)
app.put('/api/assignments/:id/grade/:studentId', protect, async (req, res) => {
  try {
    if (req.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can grade submissions' });
    }

    const { grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = assignment.submissions.find(
      sub => sub.studentId.toString() === req.params.studentId.toString()
    );
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found for this student' });
    }

    submission.grade = grade || submission.grade;
    submission.feedback = feedback || submission.feedback;

    await assignment.save();
    res.json({ message: 'Graded successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Exam schedule ----------
app.post('/api/examschedule', protect, upload.single('file'), async (req, res) => {
  try {
    // only teacher allowed by protect middleware for POST except student submit exceptions
    const { title, description, date } = req.body;
    const file = req.file ? `/uploads/${req.file.filename}` : null;
    const newSchedule = new ExamSchedule({ title, description, date, file });
    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
app.get('/api/examschedule', protect, async (req, res) => {
  try {
    const schedules = await ExamSchedule.find({});
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Exam results (restricted) ----------
// ---------- Exam results (restricted) ----------

// Add result (teacher only)
app.post('/api/examresults', protect, async (req, res) => {
  try {
    if (req.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can add exam results' });
    }

    const { studentId, subject, marks, maxMarks } = req.body;

    // ensure student exists
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const newResult = new ExamResult({
      studentId: student._id,
      subject,
      marks,
      maxMarks,
    });

    await newResult.save();
    res.status(201).json(newResult);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// Get all results: teachers see all, students see only their own
app.get('/api/examresults', protect, async (req, res) => {
  try {
    if (req.role === 'teacher') {
      const results = await ExamResult.find({})
        .populate('studentId', 'name registrationNo');
      return res.json(results);
    } 
    
    if (req.role === 'student') {
      // find user by id
      const user = await User.findById(req.user);
      if (!user || !user.registrationNo) {
        return res.status(404).json({ message: 'Student not found (user has no registrationNo)' });
      }

      // find student by registration number
      const student = await Student.findOne({ registrationNo: user.registrationNo });
      if (!student) {
        return res.status(404).json({ message: 'Student not found in Student collection' });
      }

      const results = await ExamResult.find({ studentId: student._id })
        .populate('studentId', 'name registrationNo');
      return res.json(results);
    }

    res.status(403).json({ message: 'Forbidden' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Get results for a specific student (teacher or that student only)
app.get('/api/examresults/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.role === 'student') {
      const user = await User.findById(req.user);
      if (!user || !user.registrationNo) {
        return res.status(404).json({ message: 'User not found or no registrationNo' });
      }

      const student = await Student.findOne({ registrationNo: user.registrationNo });
      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({ message: 'Forbidden: cannot view other students results' });
      }
    }

    const results = await ExamResult.find({ studentId })
      .populate('studentId', 'name registrationNo');
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Update result (teacher only)
app.put('/api/examresults/:id', protect, async (req, res) => {
  try {
    if (req.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update results' });
    }

    const { subject, marks, maxMarks } = req.body;
    const result = await ExamResult.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Exam result not found' });

    result.subject = subject || result.subject;
    result.marks = marks || result.marks;
    result.maxMarks = maxMarks || result.maxMarks;

    const updatedResult = await result.save();
    res.json(updatedResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Delete result (teacher only)
app.delete('/api/examresults/:id', protect, async (req, res) => {
  try {
    if (req.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete results' });
    }

    const result = await ExamResult.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Exam result not found' });

    await ExamResult.deleteOne({ _id: req.params.id });
    res.json({ message: 'Exam result removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});


// ---------- Notes ----------
app.post('/api/notes', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, content, subject } = req.body;
    const file = req.file ? `/uploads/${req.file.filename}` : null;
    const newNote = new Note({ title, content, subject, file });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
app.get('/api/notes', protect, async (req, res) => {
  try {
    const notes = await Note.find({});
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
