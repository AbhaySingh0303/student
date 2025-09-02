// client/src/TeacherList.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { Box, Typography, Card, CardContent } from "@mui/material";

const TeacherList = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/teachers", {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setTeachers(res.data);
      } catch (error) {
        console.error("Failed to fetch teachers:", error.response?.data || error.message);
      }
    };

    if (user?.role === "student") {
      fetchTeachers();
    }
  }, [user]);

  return (
    <Box sx={{ maxWidth: 600, margin: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>Teachers</Typography>
      {teachers.map((teacher) => (
        <Card key={teacher._id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{teacher.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Username: {teacher.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mobile: {teacher.mobileNumber || "Not Available"}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default TeacherList;
