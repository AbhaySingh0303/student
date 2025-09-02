import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, TextField, Card, CardContent } from '@mui/material';
import { useAuth } from './AuthContext'; // adjust path as per your project

const ExamSchedule = () => {
  const { user } = useAuth(); // get logged-in user info
  const [schedules, setSchedules] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', date: '' });
  const [file, setFile] = useState(null);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get('https://e-campus-backend.onrender.com/api/examschedule');
      setSchedules(res.data);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('date', formData.date);
      if (file) data.append('file', file);

      await axios.post('https://e-campus-backend.onrender.com/api/examschedule', data);
      alert('Exam schedule added!');
      fetchSchedules();
      setFormData({ title: '', description: '', date: '' });
      setFile(null);
    } catch (error) {
      console.error("Failed to add schedule:", error);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Exam Schedule
      </Typography>

      {/* Only teachers/admins can see this form */}
      {user?.role === 'teacher' && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: 2, border: '1px solid #ccc', borderRadius: '8px', mb: 4 }}
        >
          <Typography variant="h6" gutterBottom>
            Add New Schedule
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              label="Exam Date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" component="label">
              Upload File
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            {file && <Typography variant="body2">{file.name}</Typography>}
            <Button type="submit" variant="contained">
              Add Schedule
            </Button>
          </Box>
        </Box>
      )}

      <Typography variant="h6" gutterBottom>
        Upcoming Exams
      </Typography>
      {schedules.map((schedule) => (
        <Card key={schedule._id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{schedule.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {schedule.description}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Date: {new Date(schedule.date).toLocaleDateString()}
            </Typography>
            {schedule.file && (
              <Button
                href={`https://e-campus-backend.onrender.com${schedule.file}`}
                target="_blank"
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Download Schedule
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ExamSchedule;
