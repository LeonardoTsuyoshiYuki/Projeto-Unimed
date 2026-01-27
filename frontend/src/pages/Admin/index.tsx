import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { ProfessionalsList, ProfessionalDetail } from './Professionals';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Navigate } from 'react-router-dom';

export const Admin: React.FC = () => {
    return (
        <Routes>
            <Route path="login" element={<Login />} />
            <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="professionals" element={<ProfessionalsList />} />
                <Route path="professionals/:id" element={<ProfessionalDetail />} />
                <Route path="/" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};
