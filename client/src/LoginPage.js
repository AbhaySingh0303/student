import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { Box, Typography, TextField, Button, Paper, Link, Tabs, Tab } from '@mui/material';

const StudentLoginDetails = () => {
  const [trackId, setTrackId] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const checkStatus = async () => {
    try {
      const res = await axios.get(`https://e-campus-backend.onrender.com/api/user-details/${trackId}`);
      setCredentials(res.data);
      alert('Your account has been approved. You can now set your password.');
    } catch (error) {
      alert('Your account is not yet approved or the track ID is invalid.');
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    try {
      await axios.put(`https://e-campus-backend.onrender.com/api/create-password`, { newPassword }, {
        headers: { Authorization: `Bearer ${credentials.token}` }
      });
      alert('Password set successfully! You can now log in.');
      setCredentials(null);
    } catch (error) {
      alert('Failed to set password. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: '8px', mt: 2 }}>
      <Typography variant="body1" align="center">Check your registration status:</Typography>
      <TextField label="Enter Track ID" value={trackId} onChange={(e) => setTrackId(e.target.value)} fullWidth sx={{ mt: 1 }} />
      <Button onClick={checkStatus} variant="outlined" fullWidth sx={{ mt: 1 }}>Check Status</Button>
      {credentials && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: '8px' }}>
          <Typography variant="h6">Account Approved</Typography>
          <Typography variant="body1">Your username is: {credentials.username}</Typography>
          <Box component="form" onSubmit={handleSetPassword} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField label="Create new password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <TextField label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <Button type="submit" variant="contained" fullWidth>Set Password</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const LoginPage = ({ toggleView }) => {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (error) {
      alert('Login failed. Invalid username or password.');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100', pt: 6 }}>
      
      {/* ✅ Project Name */}
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        E-Campus
      </Typography>

      <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" align="center">Login</Typography>
        <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)}>
          <Tab label="Existing User" />
          <Tab label="Student Portal" />
        </Tabs>
        {tab === 0 && (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="contained">Login</Button>
            <Link href="#" onClick={toggleView} align="center">Don't have an account? Register</Link>
          </Box>
        )}
        {tab === 1 && <StudentLoginDetails />}
      </Paper>
    </Box>
  );
};

export default LoginPage;
