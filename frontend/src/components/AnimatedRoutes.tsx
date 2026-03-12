import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';

import Landing from './Landing';
import Login from './Login';
import Dashboard from './Dashboard';
import CreateAssignment from './CreateAssignment';
import FindWriter from './FindWriter';
import WriterProfile from './WriterProfile';
import BrowseRequests from './BrowseRequests';
import Profile from './Profile';
import MyAssignments from './MyAssignments';
import MyRatings from './MyRatings';
import Tutorial from './Tutorial';
import AccountDeleted from './AccountDeleted';

interface AnimatedRoutesProps {
    isAuthenticated: boolean | null;
    isGuest: boolean;
}

const AnimatedRoutes: React.FC<AnimatedRoutesProps> = ({ isAuthenticated, isGuest }) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={
                    <PageTransition>
                        {!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
                    </PageTransition>
                } />
                <Route path="/account-deleted" element={
                    <PageTransition>
                        <AccountDeleted />
                    </PageTransition>
                } />
                <Route path="/" element={
                    <PageTransition>
                        {isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />}
                    </PageTransition>
                } />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={
                    <PageTransition>
                        {isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
                    </PageTransition>
                } />
                <Route path="/create-assignment" element={
                    <PageTransition>
                        {isAuthenticated && !isGuest ? <CreateAssignment /> : (isGuest ? <Navigate to="/dashboard" /> : <Navigate to="/login" />)}
                    </PageTransition>
                } />
                <Route path="/find-writer" element={
                    <PageTransition>
                        {isAuthenticated ? <FindWriter /> : <Navigate to="/login" />}
                    </PageTransition>
                } />
                <Route path="/writer-profile/:id" element={
                    <PageTransition>
                        {isAuthenticated ? <WriterProfile /> : <Navigate to="/login" />}
                    </PageTransition>
                } />
                <Route path="/browse-requests" element={
                    <PageTransition>
                        {isAuthenticated ? <BrowseRequests /> : <Navigate to="/login" />}
                    </PageTransition>
                } />
                <Route path="/profile" element={
                    <PageTransition>
                        {isAuthenticated && !isGuest ? <Profile /> : (isGuest ? <Navigate to="/dashboard" /> : <Navigate to="/login" />)}
                    </PageTransition>
                } />
                <Route path="/my-assignments" element={
                    <PageTransition>
                        {isAuthenticated ? <MyAssignments /> : <Navigate to="/login" />}
                    </PageTransition>
                } />
                <Route path="/my-ratings" element={
                    <PageTransition>
                        {isAuthenticated ? <MyRatings /> : <Navigate to="/login" />}
                    </PageTransition>
                } />
                <Route path="/tutorial" element={
                    <PageTransition>
                        {isAuthenticated ? <Tutorial /> : <Navigate to="/login" />}
                    </PageTransition>
                } />
            </Routes>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;