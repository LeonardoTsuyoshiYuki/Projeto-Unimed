import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Login } from './Login';
import { Dashboard } from './Dashboard';

export const Admin: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="dashboard" element={<Dashboard />} />
        </Routes>
    );
};
