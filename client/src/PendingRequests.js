import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Card, CardContent, TextField } from '@mui/material';
// The useAuth hook is no longer needed here

const PendingRequests = ({ onUserApproved }) => {
    // The user variable is no longer being destructured
    const [pendingUsers, setPendingUsers] = useState([]);
    const [registrationNo, setRegistrationNo] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);

    const fetchPendingRequests = async () => {
        try {
            const res = await axios.get('https://e-campus-backend.onrender.com/api/pending-requests');
            setPendingUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch pending requests:", error);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const handleApprove = async (trackId) => {
        try {
            const res = await axios.put(`https://e-campus-backend.onrender.com/api/approve-user/${trackId}`, { registrationNo });
            alert(`User approved! Credentials are: Username - ${res.data.username}, Password - ${res.data.password}`);
            onUserApproved();
            fetchPendingRequests();
            setEditingUserId(null);
            setRegistrationNo('');
        } catch (error) {
            alert('Failed to approve user.');
        }
    };

    return (
        <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom align="center">Pending Registration Requests</Typography>
            {pendingUsers.length > 0 ? (
                pendingUsers.map(user => (
                    <Card key={user._id} sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Name: {user.name}</Typography>
                            <Typography variant="body2" color="text.secondary">Track ID: {user.trackId}</Typography>
                            
                            {editingUserId === user._id ? (
                                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <TextField label="Registration Number" value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} required />
                                    <Button onClick={() => handleApprove(user.trackId)} variant="contained">
                                        Confirm and Approve
                                    </Button>
                                    <Button onClick={() => setEditingUserId(null)} variant="outlined" color="error">
                                        Cancel
                                    </Button>
                                </Box>
                            ) : (
                                <Button onClick={() => setEditingUserId(user._id)} variant="contained" sx={{ mt: 2 }}>
                                    Approve Request
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Typography variant="body1">No pending requests.</Typography>
            )}
        </Box>
    );
};
export default PendingRequests;
