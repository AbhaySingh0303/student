import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Paper,
} from '@mui/material';

const RegisterRequest = () => {
  const [role, setRole] = useState('student'); // default role
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    username: '',
    password: '',
  });
  const [trackId, setTrackId] = useState(null); 
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setTrackId(null);
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload =
        role === 'teacher'
          ? {
              name: formData.name,
              username: formData.username,
              password: formData.password,
              mobileNumber: formData.mobileNumber,
              role,
            }
          : {
              name: formData.name,
              mobileNumber: formData.mobileNumber,
              role,
            };

      const res = await axios.post('http://localhost:5000/api/register', payload);

      if (role === 'teacher') {
        setSuccessMsg('Teacher registered successfully. You can now login.');
      } else {
        setTrackId(res.data.trackId); 
        setSuccessMsg('Student registration request submitted!');
      }

      setFormData({ name: '', mobileNumber: '', username: '', password: '' });
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column', // stack heading + card
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
        gap: 3,
      }}
    >
      {/* ✅ Big E-Campus heading */}
      <Typography
        variant="h3"
        align="center"
        sx={{ fontWeight: 'bold', color: 'primary.main' }}
      >
        E-Campus
      </Typography>

      <Paper
        sx={{
          maxWidth: 400,
          width: '100%',
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" gutterBottom align="center">
          {role === 'teacher' ? 'Teacher Registration' : 'Student Registration Request'}
        </Typography>

        {/* ✅ success or track ID message */}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
        {trackId && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Your Track ID: <strong>{trackId}</strong>
            <br />
            (Keep this safe – teacher will use it to approve your account.)
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selector */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              value={role}
              onChange={handleRoleChange}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
            </Select>
          </FormControl>

          {/* Common fields */}
          <TextField
            fullWidth
            margin="normal"
            label="Your Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <TextField
            fullWidth
            margin="normal"
            label="Your Mobile Number *"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            required
          />

          {/* Teacher-only fields */}
          {role === 'teacher' && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Username *"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                type="password"
                label="Password *"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            {role === 'teacher' ? 'Register Teacher' : 'Submit Request'}
          </Button>
        </form>

        <Typography align="center" sx={{ mt: 2 }}>
          Already have an account? <a href="/login">Login</a>
        </Typography>
      </Paper>
    </Box>
  );
};

export default RegisterRequest;
