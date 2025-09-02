import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, TextField, Card, CardContent } from '@mui/material';
import { useAuth } from './AuthContext'; // ✅ Import role from context

const Assignment = ({ students }) => {
  const { user } = useAuth(); // ✅ access user + role
  const [assignments, setAssignments] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '' });
  const [file, setFile] = useState(null);
  const [submissionData, setSubmissionData] = useState({ studentId: '', submissionFile: null });

  const fetchAssignments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/assignments');
      setAssignments(res.data);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmissionChange = (e) => {
    if (e.target.name === 'submissionFile') {
      setSubmissionData({ ...submissionData, submissionFile: e.target.files[0] });
    } else {
      setSubmissionData({ ...submissionData, studentId: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('dueDate', formData.dueDate);
      if (file) {
        data.append('file', file);
      }

      await axios.post('http://localhost:5000/api/assignments', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Assignment added successfully!');
      fetchAssignments();
      setFormData({ title: '', description: '', dueDate: '' });
      setFile(null);
    } catch (error) {
      console.error("Failed to add assignment:", error);
    }
  };

  const handleSubmission = async (e, assignmentId) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('studentId', submissionData.studentId);
      data.append('submissionFile', submissionData.submissionFile);

      await axios.post(`http://localhost:5000/api/assignments/${assignmentId}/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Assignment submitted successfully!');
      fetchAssignments();
      setSubmissionData({ studentId: '', submissionFile: null });
    } catch (error) {
      console.error("Failed to submit assignment:", error);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">Assignments</Typography>

      {/* ✅ Only TEACHER can create assignments */}
      {user?.role === "teacher" && (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, border: '1px solid #ccc', borderRadius: '8px', mb: 4 }}>
          <Typography variant="h6" gutterBottom>Add New Assignment</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Title" name="title" value={formData.title} onChange={handleChange} fullWidth required />
            <TextField label="Description" name="description" value={formData.description} onChange={handleChange} fullWidth multiline rows={3} required />
            <TextField
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" component="label">
              Upload File
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            {file && <Typography variant="body2">{file.name}</Typography>}
            <Button type="submit" variant="contained">Add Assignment</Button>
          </Box>
        </Box>
      )}

      <Typography variant="h6" gutterBottom>Available Assignments</Typography>
      {assignments.map((assignment) => (
        <Card key={assignment._id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{assignment.title}</Typography>
            <Typography variant="body2" color="text.secondary">{assignment.description}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Due Date: {new Date(assignment.dueDate).toLocaleDateString()}</Typography>
            {assignment.file && (
              <Button href={`http://localhost:5000${assignment.file}`} target="_blank" variant="outlined" sx={{ mt: 1 }}>
                Download File
              </Button>
            )}

            {/* ✅ Only STUDENT can submit assignments */}
            {user?.role === "student" && (
              <Box component="form" onSubmit={(e) => handleSubmission(e, assignment._id)} sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: '8px' }}>
                <Typography variant="body1">Submit Your Assignment</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                  {/* Auto-fill studentId instead of dropdown */}
                  <input type="hidden" value={user._id} name="studentId" />
                  <Button variant="contained" component="label">
                    Upload Submission
                    <input type="file" hidden name="submissionFile" onChange={handleSubmissionChange} />
                  </Button>
                  {submissionData.submissionFile && <Typography variant="body2">{submissionData.submissionFile.name}</Typography>}
                  <Button type="submit" variant="contained" sx={{ mt: 1 }}>Submit</Button>
                </Box>
              </Box>
            )}

            {/* ✅ Teacher can see all submissions */}
            {user?.role === "teacher" && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Submissions:</Typography>
                {assignment.submissions.length > 0 ? (
                  assignment.submissions.map((submission, index) => {
                    const student = students.find(s => s._id === submission.studentId);
                    return (
                      <Box key={index} sx={{ mt: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                        <Typography variant="body2">
                          <strong>Student:</strong> {student ? student.name : 'Unknown'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date:</strong> {new Date(submission.submissionDate).toLocaleString()}
                        </Typography>
                        <Button href={`http://localhost:5000${submission.submissionFile}`} target="_blank" variant="text" size="small">
                          Download Submitted File
                        </Button>
                      </Box>
                    );
                  })
                ) : (
                  <Typography variant="body2">No submissions yet.</Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Assignment;
