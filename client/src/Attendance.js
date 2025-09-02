import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Attendance.css';
import { 
  Card, CardContent, Typography, Button, Box, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';
import { useAuth } from './AuthContext';

const calculateAttendancePercentage = (attendance) => {
  if (!attendance || attendance.length === 0) return '0%';
  const presentCount = attendance.filter(record => record.status === 'Present').length;
  const percentage = (presentCount / attendance.length) * 100;
  return `${percentage.toFixed(0)}%`;
};

const formatDateToLocalISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const Attendance = ({ students, onAttendanceAdded }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('main');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [singleStudentDate, setSingleStudentDate] = useState(new Date());
  const [singleStudentStatus, setSingleStudentStatus] = useState('Present');
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Initialize bulk attendance
  useEffect(() => {
    const initialData = students.map(student => ({
      studentId: student._id,
      status: 'Present'
    }));
    setAttendanceData(initialData);
  }, [students]);

  // Fetch attendance for selected student
  useEffect(() => {
    if (selectedStudent) {
      const fetchAttendance = async () => {
        try {
          const res = await axios.get(`https://e-campus-backend.onrender.com/api/students/${selectedStudent._id}`);
          setAttendanceRecords(res.data.attendance || []);
        } catch (err) {
          console.error("Failed to fetch student attendance:", err);
        }
      };
      fetchAttendance();
    }
  }, [selectedStudent]);

  const handleBulkStatusChange = (studentId, newStatus) => {
    setAttendanceData(prevData =>
      prevData.map(record =>
        record.studentId === studentId ? { ...record, status: newStatus } : record
      )
    );
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = attendanceData.map(record => ({
        ...record,
        date: selectedDate
      }));
      await axios.post('https://e-campus-backend.onrender.com/api/attendance/bulk-update', formattedData);
      if (onAttendanceAdded) onAttendanceAdded();
      alert("Attendance records updated successfully!");
    } catch (error) {
      console.error("Failed to update attendance records:", error);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    try {
      const today = new Date();
      if (singleStudentDate.setHours(0,0,0,0) > today.setHours(0,0,0,0)) {
        alert("Attendance cannot be marked for future dates.");
        return;
      }
      await axios.put(
        `https://e-campus-backend.onrender.com/api/students/${selectedStudent._id}/add-attendance`,
        { date: singleStudentDate, status: singleStudentStatus }
      );
      // Refresh the attendance for the student
      const res = await axios.get(`https://e-campus-backend.onrender.com/api/students/${selectedStudent._id}`);
      setAttendanceRecords(res.data.attendance || []);
      if (onAttendanceAdded) onAttendanceAdded();
      alert("Attendance recorded successfully!");
    } catch (error) {
      console.error("Failed to record attendance:", error);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const record = attendanceRecords.find(record =>
        new Date(record.date).toDateString() === date.toDateString()
      );
      if (record) {
        if (record.status === 'Present') return 'present';
        if (record.status === 'Absent') return 'absent';
        if (record.status === 'Leave') return 'leave';
      }
    }
    return null;
  };

  // For students, show only their own record. Prefer matching by registrationNo if present.
  const filteredStudents = user?.role === 'student'
    ? students.filter(s => {
        if (user.registrationNo) {
          return s.registrationNo === user.registrationNo;
        }
        // fallback: match by username-derived name + registration in case registrationNo missing from auth
        if (user.username && s.registrationNo) {
          const reg = s.registrationNo.toString();
          const baseName = user.username.endsWith(reg)
            ? user.username.slice(0, -reg.length)
            : user.username;
          return s.name.replace(/\s/g, '').toLowerCase() === baseName.replace(/\s/g, '').toLowerCase();
        }
        return false;
      })
    : students;

  // Main view
  if (currentView === 'main') {
    return (
      <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>Attendance</Typography>
        {user?.role === 'teacher' && (
          <>
            <Button variant="contained" onClick={() => setCurrentView('bulk')}>Mark Attendance</Button>
            <Button variant="contained" onClick={() => setCurrentView('single')}>View/Edit Attendance</Button>
          </>
        )}
        {user?.role === 'student' && (
          <Button variant="contained" onClick={() => setCurrentView('single')}>View My Attendance</Button>
        )}
      </Box>
    );
  }

  // Bulk attendance view (teacher only)
  if (currentView === 'bulk' && user?.role === 'teacher') {
    return (
      <Box sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
        <Button onClick={() => setCurrentView('main')} variant="outlined" sx={{ mb: 2 }}>
          &larr; Back
        </Button>
        <Typography variant="h4" gutterBottom align="center">Bulk Attendance</Typography>
        <Box component="form" onSubmit={handleBulkSubmit}>
          <TextField
            type="date"
            label="Select Date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Registration No.</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.registrationNo}</TableCell>
                    <TableCell align="right">
                      <TextField
                        select
                        value={(attendanceData.find(d => d.studentId === s._id) || {}).status || 'Present'}
                        onChange={(e) => handleBulkStatusChange(s._id, e.target.value)}
                        sx={{ width: '120px' }}
                      >
                        <MenuItem value="Present">Present</MenuItem>
                        <MenuItem value="Absent">Absent</MenuItem>
                        <MenuItem value="Leave">Leave</MenuItem>
                      </TextField>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Submit All Attendance
          </Button>
        </Box>
      </Box>
    );
  }

  // Single student selection view
  if (currentView === 'single' && !selectedStudent) {
    return (
      <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
        <Button onClick={() => setCurrentView('main')} variant="outlined" sx={{ mb: 2 }}>
          &larr; Back
        </Button>
        <Typography variant="h5" gutterBottom>
          {user?.role === 'teacher' ? 'Select a Student' : 'My Attendance'}
        </Typography>

        {filteredStudents.map((s) => (
          <Card key={s._id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {s.photo ? (
                    <img src={`https://e-campus-backend.onrender.com${s.photo}`} alt={s.name} style={{ width: 50, height: 50, borderRadius: '50%' }} />
                  ) : (
                    <Box sx={{ width: 50, height: 50, bgcolor: 'grey.300', borderRadius: '50%' }} />
                  )}
                  <Box>
                    <Typography variant="h6">{s.name} | Reg No: {s.registrationNo}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Attendance: {calculateAttendancePercentage(s.attendance)}
                    </Typography>
                  </Box>
                </Box>
                <Button onClick={() => setSelectedStudent(s)} size="small" variant="text">
                  View
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // Single student attendance calendar view
  if (currentView === 'single' && selectedStudent) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, margin: 'auto' }}>
        <Button onClick={() => setSelectedStudent(null)} variant="outlined" sx={{ mb: 2 }}>
          &larr; Back
        </Button>
        <Typography variant="h5" gutterBottom>
          Attendance for {selectedStudent.name}
        </Typography>

        <Calendar
          onChange={setSingleStudentDate}
          value={singleStudentDate}
          tileClassName={tileClassName}
        />

        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 15, height: 15, bgcolor: '#4caf50' }} />
            <Typography variant="body2">Present</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 15, height: 15, bgcolor: '#f44336' }} />
            <Typography variant="body2">Absent</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 15, height: 15, bgcolor: '#ff9800' }} />
            <Typography variant="body2">Leave</Typography>
          </Box>
        </Box>

        {user?.role === 'teacher' && (
          <Box component="form" onSubmit={handleSingleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
            <Typography variant="h6">Update Attendance for Selected Date</Typography>
            <TextField
              type="date"
              label="Selected Date"
              value={formatDateToLocalISO(singleStudentDate)}
              onChange={(e) => setSingleStudentDate(new Date(e.target.value))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Status"
              value={singleStudentStatus}
              onChange={(e) => setSingleStudentStatus(e.target.value)}
              fullWidth
            >
              <MenuItem value="Present">Present</MenuItem>
              <MenuItem value="Absent">Absent</MenuItem>
              <MenuItem value="Leave">Leave</MenuItem>
            </TextField>
            <Button type="submit" variant="contained">Record Attendance</Button>
          </Box>
        )}
      </Box>
    );
  }
};

export default Attendance;
