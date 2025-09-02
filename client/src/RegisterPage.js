import React, { useState } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, Button, Paper, Link, MenuItem } from '@mui/material';

const RegisterPage = ({ toggleView }) => {
  const [formData, setFormData] = useState({ name: '', username: '', password: '', mobileNumber: '', role: 'student' });
  const [trackId, setTrackId] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      setFormData({ name: '', username: '', password: '', mobileNumber: '', role: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/register', formData);
      if (formData.role === 'student') {
        setTrackId(res.data.trackId);
        alert('Registration request submitted! Please save your track ID.');
      } else {
        alert('Teacher registration successful! You can now log in.');
        toggleView();
      }
    } catch (error) {
      alert('Registration failed. The username may already exist.');
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
        <Typography variant="h5" align="center">Register</Typography>
        {!trackId ? (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField select label="Register as" name="role" value={formData.role} onChange={handleChange} fullWidth required>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="student">Student</MenuItem>
            </TextField>
            <TextField label="Your Name" name="name" value={formData.name} onChange={handleChange} required />
            {formData.role === 'teacher' && (
              <>
                <TextField label="Username" name="username" value={formData.username} onChange={handleChange} required />
                <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
              </>
            )}
            {formData.role === 'student' && (
              <TextField label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required />
            )}
            <Button type="submit" variant="contained">Submit</Button>
          </Box>
        ) : (
          <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: '8px' }}>
            <Typography variant="body1">Your request has been submitted. Please give this track ID to your teacher to be approved:</Typography>
            <Typography variant="h6" align="center" sx={{ mt: 1 }}>{trackId}</Typography>
          </Box>
        )}
        <Link href="#" onClick={toggleView} align="center">Already have an account? Login</Link>
      </Paper>
    </Box>
  );
};

export default RegisterPage;