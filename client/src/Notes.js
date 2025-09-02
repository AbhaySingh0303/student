import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, TextField, Card, CardContent } from '@mui/material';
import { useAuth } from './AuthContext';  // ⬅️ Make sure this path is correct

const Notes = () => {
    const { user } = useAuth();   // role will be "teacher" or "student"
    const [notes, setNotes] = useState([]);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [file, setFile] = useState(null);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [currentView, setCurrentView] = useState('subjectList');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [availableSubjects, setAvailableSubjects] = useState([]);

    const fetchNotes = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/notes');
            setNotes(res.data);
            const subjectsFromNotes = [...new Set(res.data.map(note => note.subject))];
            setAvailableSubjects(subjectsFromNotes);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleAddNote = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim() || !selectedSubject) {
            alert("Please fill in the title, content, and subject.");
            return;
        }

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('content', formData.content);
            data.append('subject', selectedSubject);
            if (file) data.append('file', file);

            const res = await axios.post('http://localhost:5000/api/notes', data);
            setNotes([...notes, res.data]);
            setFormData({ title: '', content: '' });
            setFile(null);
            document.querySelector("input[type=file]").value = null;
        } catch (error) {
            console.error("Failed to add note:", error);
        }
    };

    const handleAddSubject = (e) => {
        e.preventDefault();
        if (newSubjectName && !availableSubjects.includes(newSubjectName)) {
            setAvailableSubjects([...availableSubjects, newSubjectName]);
            setNewSubjectName('');
        }
    };

    const filteredNotes = notes.filter(note => note.subject === selectedSubject);

    if (currentView === 'subjectList') {
        return (
            <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
                <Typography variant="h4" gutterBottom align="center">Notes</Typography>

                {/* Teacher Only: Add Subject */}
                {user?.role === "teacher" && (
                    <Box component="form" onSubmit={handleAddSubject} sx={{ p: 2, border: '1px solid #ccc', borderRadius: '8px', mb: 4 }}>
                        <Typography variant="h6" gutterBottom>Add New Subject</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Subject Name"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                fullWidth
                                required
                            />
                            <Button type="submit" variant="contained">Add Subject</Button>
                        </Box>
                    </Box>
                )}

                <Typography variant="h6" gutterBottom>Available Subjects</Typography>
                {availableSubjects.length > 0 ? (
                    availableSubjects.map((subject, index) => (
                        <Card key={index} sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6">{subject}</Typography>
                                <Button
                                    onClick={() => {
                                        setSelectedSubject(subject);
                                        setCurrentView('notesList');
                                    }}
                                    variant="outlined"
                                >
                                    View Notes
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Typography variant="body1">No subjects available.</Typography>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
            <Button onClick={() => setCurrentView('subjectList')} variant="outlined" sx={{ mb: 2 }}>
                &larr; Back to Subjects
            </Button>
            <Typography variant="h4" gutterBottom align="center">Notes for {selectedSubject}</Typography>

            {/* Teacher Only: Add Note */}
            {user?.role === "teacher" && (
                <Box component="form" onSubmit={handleAddNote} sx={{ p: 2, border: '1px solid #ccc', borderRadius: '8px', mb: 4 }}>
                    <Typography variant="h6" gutterBottom>Add New Note</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Title" name="title" value={formData.title} onChange={handleChange} fullWidth required />
                        <TextField label="Content" name="content" value={formData.content} onChange={handleChange} fullWidth multiline rows={4} required />
                        <Button variant="contained" component="label">
                            Upload File
                            <input type="file" hidden onChange={handleFileChange} />
                        </Button>
                        {file && <Typography variant="body2">{file.name}</Typography>}
                        <Button type="submit" variant="contained">Add Note</Button>
                    </Box>
                </Box>
            )}

            <Typography variant="h6" gutterBottom>Notes for {selectedSubject}</Typography>
            {filteredNotes.length > 0 ? (
                filteredNotes.map(note => (
                    <Card key={note._id} sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">{note.title}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                {note.content}
                            </Typography>
                            {note.file && (
                                <Button href={`http://localhost:5000${note.file}`} target="_blank" variant="outlined" sx={{ mt: 1 }}>
                                    Download File
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Typography variant="body1">No notes available for this subject.</Typography>
            )}
        </Box>
    );
};

export default Notes;
