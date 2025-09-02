import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Button, Box, TextField } from '@mui/material';
import { useAuth } from './AuthContext';

const calculateAttendancePercentage = (attendance) => {
  if (!attendance || attendance.length === 0) return '0%';
  const presentCount = attendance.filter(record => record.status === 'Present').length;
  const percentage = (presentCount / attendance.length) * 100;
  return `${percentage.toFixed(0)}%`;
};

const calculateTotalMarksPercentage = (student, examResults) => {
  const studentResults = examResults.filter(result => {
    const resultStudentId = result.studentId?._id || result.studentId;
    return resultStudentId?.toString() === student._id?.toString();
  });

  if (!studentResults.length) return '0%';

  const totalMarks = studentResults.reduce((sum, result) => sum + (result.marks || 0), 0);
  const totalMaxMarks = studentResults.reduce((sum, result) => sum + (result.maxMarks || 0), 0);

  if (totalMaxMarks === 0) return '0%';

  const percentage = (totalMarks / totalMaxMarks) * 100;
  return `${percentage.toFixed(0)}%`;
};


const StudentList = ({ students, examResults, onStudentUpdated, onStudentDeleted }) => {
  const { user } = useAuth();
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', registrationNo: '', photo: null });

  const handleDeleteStudent = async (id) => {
    try {
      await axios.delete(`https://e-campus-backend.onrender.com/api/students/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (onStudentDeleted) onStudentDeleted();
    } catch (error) {
      console.error("Failed to delete student:", error);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student._id);
    setEditFormData({ name: student.name, registrationNo: student.registrationNo, photo: null });
  };

  const handleUpdateStudent = async (e, id) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', editFormData.name);
      data.append('registrationNo', editFormData.registrationNo);
      if (editFormData.photo) {
        data.append('photo', editFormData.photo);
      }

      await axios.put(`https://e-campus-backend.onrender.com/api/students/${id}`, data, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (onStudentUpdated) onStudentUpdated();
      setEditingStudent(null);
    } catch (error) {
      console.error("Failed to update student:", error);
    }
  };

  const handleEditFormChange = (e) => {
    if (e.target.name === 'photo') {
      setEditFormData({ ...editFormData, photo: e.target.files[0] });
    } else {
      setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    }
  };

  // ✅ Students see only their own record
  const filteredStudents = user?.role === 'student'
    ? students.filter(s => s.registrationNo?.toString() === user.registrationNo?.toString())
    : students;

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Student Records</Typography>
      {filteredStudents.map((student) => (
        <Card key={student._id} sx={{ mb: 2 }}>
          <CardContent>
            {editingStudent === student._id ? (
              // ✅ Edit Form
              <Box
                component="form"
                onSubmit={(e) => handleUpdateStudent(e, student._id)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <TextField
                  label="Name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Registration No."
                  name="registrationNo"
                  value={editFormData.registrationNo}
                  onChange={handleEditFormChange}
                  fullWidth
                  required
                />
                {/* ✅ File upload for photo */}
                <input type="file" name="photo" accept="image/*" onChange={handleEditFormChange} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button onClick={() => setEditingStudent(null)} variant="outlined" color="error">
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained">Save</Button>
                </Box>
              </Box>
            ) : (
              // ✅ Normal View
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {student.photo ? (
                    <img
                      src={`https://e-campus-backend.onrender.com${student.photo}`}
                      alt={student.name}
                      style={{ width: 50, height: 50, borderRadius: '50%' }}
                    />
                  ) : (
                    <Box sx={{ width: 50, height: 50, bgcolor: 'grey.300', borderRadius: '50%' }} />
                  )}
                  <Box>
                    <Typography variant="h6">
                      {student.name} | Reg No: {student.registrationNo}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Mobile: {student.mobileNumber || "Not Available"}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Attendance: {calculateAttendancePercentage(student.attendance)} | 
                      Overall Marks: {calculateTotalMarksPercentage(student, examResults)}
                    </Typography>
                  </Box>
                </Box>

                {user?.role === 'teacher' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={() => handleEditStudent(student)} size="small" color="primary">
                      Edit
                    </Button>
                    <Button onClick={() => handleDeleteStudent(student._id)} size="small" color="error">
                      Delete
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default StudentList;
