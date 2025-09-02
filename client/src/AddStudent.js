// src/AddStudent.js
import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box, Typography } from '@mui/material'; // Add Typography here

const AddStudent = ({ onStudentAdded }) => {
  const [formData, setFormData] = useState({ name: '', registrationNo: '' });
  const [photo, setPhoto] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('registrationNo', formData.registrationNo);
      if (photo) {
        data.append('photo', photo);
      }

      await axios.post('http://localhost:5000/api/students', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (onStudentAdded) {
        onStudentAdded();
      }
      alert('Student added!');
      setFormData({ name: '', registrationNo: '' });
      setPhoto(null);
    } catch (error) {
      console.error("Failed to add student:", error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, margin: 'auto' }}>
      <Typography variant="h5" gutterBottom>Add Student</Typography>
      <TextField label="Name" name="name" value={formData.name} onChange={handleChange} required fullWidth />
      <TextField label="Registration No." name="registrationNo" value={formData.registrationNo} onChange={handleChange} required fullWidth />
      <Button variant="contained" component="label">
        Upload Photo
        <input type="file" hidden onChange={handlePhotoChange} />
      </Button>
      {photo && <Typography variant="body2">{photo.name}</Typography>}
      <Button type="submit" variant="contained">Add Student</Button>
    </Box>
  );
};

export default AddStudent;