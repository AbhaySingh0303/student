import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Tabs, Tab, Button } from '@mui/material';
import { useAuth } from './AuthContext';
import AddStudent from './AddStudent';
import StudentList from './StudentList';
import Attendance from './Attendance';
import Assignment from './Assignment';
import ExamSchedule from './ExamSchedule';
import ExamResult from './ExamResult';
import Notes from './Notes';
import PendingRequests from './PendingRequests';
import ChangePassword from './ChangePassword';
import TeacherList from './TeacherList';
import axios from 'axios';

// Helper component for the tab panels
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [value, setValue] = useState(0);
  const [students, setStudents] = useState([]);
  const [allExamResults, setAllExamResults] = useState([]);
  const [activeTabs, setActiveTabs] = useState([]);

  // ✅ Memoize fetchAllData
  const fetchAllData = useCallback(async () => {
    if (!user?.token) return;
    try {
      const studentsRes = await axios.get("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${user.token}`, "Cache-Control": "no-cache" },
      });

      const resultsRes = await axios.get("http://localhost:5000/api/examresults", {
        headers: { Authorization: `Bearer ${user.token}`, "Cache-Control": "no-cache" },
      });

      setStudents(studentsRes.data);
      setAllExamResults(resultsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error.response?.data || error.message);
    }
  }, [user?.token]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  useEffect(() => {
    if (user?.role === 'teacher') {
      setActiveTabs([
        { label: 'Pending Requests', component: <PendingRequests onUserApproved={fetchAllData} /> },
        { label: 'Add Student', component: <AddStudent onStudentAdded={fetchAllData} /> },
        {
          label: 'Student Details',
          component: (
            <StudentList
              students={students}
              examResults={allExamResults}
              onStudentUpdated={fetchAllData}
              onStudentDeleted={fetchAllData}
            />
          ),
        },
        { label: 'Attendance', component: <Attendance students={students} onAttendanceAdded={fetchAllData} /> },
        {
          label: 'Assignments',
          component: (
            <Assignment
              students={students}
              userRole={user.role}
              onAssignmentAdded={fetchAllData}
              onSubmission={fetchAllData}
            />
          ),
        },
        { label: 'Exam Schedule', component: <ExamSchedule userRole={user.role} onScheduleAdded={fetchAllData} /> },
        {
          label: 'Exam Results',
          component: (
            <ExamResult students={students} examResults={allExamResults} onResultAdded={fetchAllData} />
          ),
        },
        { label: 'Notes', component: <Notes userRole={user.role} /> },
        { label: 'Change Password', component: <ChangePassword /> },
      ]);
    } else if (user?.role === 'student') {
      setActiveTabs([
        { label: 'My Details', component: <StudentList students={students} examResults={allExamResults} /> },
        { label: 'Attendance', component: <Attendance students={students} onAttendanceAdded={fetchAllData} /> },
        { label: 'Assignments', component: <Assignment students={students} userRole={user.role} /> },
        { label: 'Exam Schedule', component: <ExamSchedule userRole={user.role} /> },
        { label: 'Exam Results', component: <ExamResult students={students} examResults={allExamResults} /> },
        { label: 'Notes', component: <Notes userRole={user.role} /> },
        { label: 'Teachers', component: <TeacherList /> },
        { label: 'Change Password', component: <ChangePassword /> },
      ]);
    }
  }, [user, students, allExamResults, fetchAllData]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    fetchAllData();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {/* ✅ Project name */}
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          E-Campus
        </Typography>
        <Button onClick={logout} variant="outlined" color="error">
          Logout
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="dashboard tabs">
          {activeTabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>
      {activeTabs.map((tab, index) => (
        <TabPanel key={index} value={value} index={index}>
          {tab.component}
        </TabPanel>
      ))}
    </Container>
  );
};

export default Dashboard;
