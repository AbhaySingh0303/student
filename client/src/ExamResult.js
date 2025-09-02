import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent
} from '@mui/material';
import { useAuth } from './AuthContext';  // ✅ Import AuthContext hook

// ✅ Calculate average percentage
const calculateAverageMarks = (examResults) => {
  if (!examResults.length) return '0%';
  const totalMarks = examResults.reduce((sum, result) => sum + result.marks, 0);
  const totalMaxMarks = examResults.reduce((sum, result) => sum + result.maxMarks, 0);
  const percentage = (totalMarks / totalMaxMarks) * 100;
  return `${percentage.toFixed(0)}%`;
};

const ExamResult = ({ students, examResults, onResultAdded }) => {
  const { user } = useAuth(); // ✅ Get logged-in user
  const [formData, setFormData] = useState({ studentId: '', subject: '', marks: '', maxMarks: '' });
  const [visibleStudentId, setVisibleStudentId] = useState(null);
  const [editingResultId, setEditingResultId] = useState(null);
  const [editMarks, setEditMarks] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editMaxMarks, setEditMaxMarks] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // ✅ Add exam result
  const handleSubmit = async (e, studentId) => {
    e.preventDefault();
    try {
      await axios.post(
        'https://e-campus-backend.onrender.com/api/examresults',
        { ...formData, studentId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      alert('Exam result added!');
      onResultAdded();
      setFormData({ ...formData, subject: '', marks: '', maxMarks: '' });
    } catch (error) {
      console.error("Failed to add result:", error.response?.data || error.message);
    }
  };

  // ✅ Edit result
  const handleEditClick = (result) => {
    setEditingResultId(result._id);
    setEditMarks(result.marks);
    setEditSubject(result.subject);
    setEditMaxMarks(result.maxMarks);
  };

  // ✅ Update result
  const handleUpdateMarks = async (resultId) => {
    try {
      await axios.put(
        `https://e-campus-backend.onrender.com/api/examresults/${resultId}`,
        { subject: editSubject, marks: editMarks, maxMarks: editMaxMarks },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      onResultAdded();
      setEditingResultId(null);
    } catch (error) {
      console.error("Failed to update marks:", error.response?.data || error.message);
    }
  };

  // ✅ Delete result
  const handleDeleteResult = async (resultId) => {
    try {
      await axios.delete(`https://e-campus-backend.onrender.com/api/examresults/${resultId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      onResultAdded();
    } catch (error) {
      console.error("Failed to delete exam result:", error.response?.data || error.message);
    }
  };

  // ✅ FIX: match by registrationNo instead of _id
  const getResultsForStudent = (student) => {
    const results = examResults.filter(
      (result) => result.studentId?.registrationNo === student.registrationNo
    );
    console.log("Results for", student.name, results); // 🔍 Debug log
    return results;
  };

  // ✅ Filter students based on role
  const filteredStudents = user?.role === "student"
    ? students.filter(s => s.registrationNo === user.registrationNo) // student sees only themselves
    : students; // teacher sees all

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">Exam Results</Typography>

      {filteredStudents.map(student => (
        <Card key={student._id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {student.photo ? (
                  <img src={`https://e-campus-backend.onrender.com${student.photo}`} alt={student.name} style={{ width: 50, height: 50, borderRadius: '50%' }} />
                ) : (
                  <Box sx={{ width: 50, height: 50, bgcolor: 'grey.300', borderRadius: '50%' }} />
                )}
                <Box>
                  <Typography variant="h6">
                    {student.name} | Reg No: {student.registrationNo}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Average Marks: {calculateAverageMarks(getResultsForStudent(student))}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Button
              onClick={() => setVisibleStudentId(visibleStudentId === student._id ? null : student._id)}
              size="small"
              variant="text"
              sx={{ mt: 2 }}
            >
              {visibleStudentId === student._id ? 'Hide details' : 'More details'}
            </Button>

            {visibleStudentId === student._id && (
              <Box sx={{ mt: 2 }}>
                {/* ✅ Only teacher can add results */}
                {user?.role === "teacher" && (
                  <>
                    <Typography variant="h6" gutterBottom>Add Exam Result</Typography>
                    <Box
                      component="form"
                      onSubmit={(e) => handleSubmit(e, student._id)}
                      sx={{ p: 2, border: '1px solid #ccc', borderRadius: '8px', mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      <TextField label="Subject" name="subject" value={formData.subject} onChange={handleChange} fullWidth required />
                      <TextField label="Marks" name="marks" type="number" value={formData.marks} onChange={handleChange} fullWidth required />
                      <TextField label="Max Marks" name="maxMarks" type="number" value={formData.maxMarks} onChange={handleChange} fullWidth required />
                      <Button type="submit" variant="contained">Add Result</Button>
                    </Box>
                  </>
                )}

                <Typography variant="h6" gutterBottom>Saved Exam Results</Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell align="right">Marks</TableCell>
                        {user?.role === "teacher" && <TableCell align="right">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getResultsForStudent(student).length > 0 ? (
                        getResultsForStudent(student).map(result => (
                          <TableRow key={result._id}>
                            <TableCell>{result.subject}</TableCell>
                            <TableCell align="right">
                              {editingResultId === result._id ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <TextField
                                    type="number"
                                    value={editMarks}
                                    onChange={(e) => setEditMarks(e.target.value)}
                                    size="small"
                                    sx={{ width: '80px' }}
                                  />
                                  <Typography variant="body2">Out of {result.maxMarks}</Typography>
                                </Box>
                              ) : (
                                `${result.marks} / ${result.maxMarks}`
                              )}
                            </TableCell>
                            {user?.role === "teacher" && (
                              <TableCell align="right">
                                {editingResultId === result._id ? (
                                  <Button onClick={() => handleUpdateMarks(result._id)} size="small">Save</Button>
                                ) : (
                                  <>
                                    <Button onClick={() => handleEditClick(result)} size="small">Edit</Button>
                                    <Button onClick={() => handleDeleteResult(result._id)} color="error" size="small">Delete</Button>
                                  </>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={user?.role === "teacher" ? 3 : 2}>No results available.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ExamResult;
