import { Routes, Route, Navigate } from "react-router-dom";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import OAuthSuccess from "../pages/OAuthSuccess";
import AuthScreen from "../components/common/AuthScreen";
import AppLayout from "../pages/AppLayout";
import ProtectedRoute from "./ProtectedRoutes";
import RoleRoute from "./RoleRoute";

import { StudentDashboard } from "../components/dashboard/Dashboard";
import { InstructorDashboard } from "../components/dashboard/InstructorDashboard";

import Projects from "../components/projects/Projects";
import CreateProject from "../pages/projects/CreateProject";
import ProjectDetails from "../pages/projects/ProjectDetails";
import EditProject from "../pages/projects/EditProject";
import Shop from "../components/marketplace/Shop";
import Live from "../components/streaming/Live";
import Messages from "../components/messaging/Messages";
import Hire from "../components/hiring/Hire";
import CreateJob from "../pages/jobs/CreateJob";

import {
  SupportStudent,
  SupportInstructor,
} from "../components/support/Support";

import {
  AdminDashboard,
  AdminUsers,
  AdminTracks,
} from "../components/admin/Admin";

import Profile from "../components/profile/Profile";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthScreen />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route
            path="/instructor"
            element={
              <RoleRoute allowedRoles={["instructor"]}>
                <InstructorDashboard />
              </RoleRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <RoleRoute allowedRoles={["student", "instructor"]}>
                <Projects />
              </RoleRoute>
            }
          />
          <Route
            path="/shop"
            element={
              <RoleRoute allowedRoles={["student", "instructor"]}>
                <Shop />
              </RoleRoute>
            }
          />
          <Route path="/projects/create" element={<CreateProject />} />

          <Route path="/projects/:projectId" element={<ProjectDetails />} />

          <Route path="/projects/:projectId/edit" element={<EditProject />} />
          <Route
            path="/live"
            element={
              <RoleRoute allowedRoles={["student", "instructor"]}>
                <Live />
              </RoleRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <RoleRoute allowedRoles={["student", "instructor"]}>
                <Messages />
              </RoleRoute>
            }
          />
          <Route
            path="/hire"
            element={
              <RoleRoute allowedRoles={["student", "instructor"]}>
                <Hire />
              </RoleRoute>
            }
          />
          <Route
            path="/jobs/create"
            element={
              <RoleRoute allowedRoles={["student", "instructor"]}>
                <CreateJob />
              </RoleRoute>
            }
          />
          <Route path="/support" element={<SupportStudent />} />
          <Route
            path="/support-instructor"
            element={
              <RoleRoute allowedRoles={["instructor"]}>
                <SupportInstructor />
              </RoleRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin-users"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </RoleRoute>
            }
          />
          <Route
            path="/admin-tracks"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AdminTracks />
              </RoleRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />{" "}
    </Routes>
  );
}
