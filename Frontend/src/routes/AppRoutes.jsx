import { Routes, Route, Navigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import DevToast from "../components/ui/DevToast";
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
import LiveRoom from "../components/stream/LiveRoom";
import LiveRooms from "../components/stream/LiveRooms";
import CreateStream from "../components/stream/CreateStream";
import Messages from "../components/messaging/Messages";
import Hire from "../components/hiring/Hire";
import CreateJob from "../pages/jobs/CreateJob";
import EditProfile from "../pages/profile/EditProfile";
import { CreateSupportTicket } from "../pages/support/CreateSupportTicket";
// import SupportTicketDetails from "../pages/support/SupportTicketDetails";
import TicketDetails from "../pages/support/TicketDetails";

import { SupportStudent } from "../components/support/Support";
import { SupportInstructor } from "../components/support/SupportInstructor";
import SupportInstructorAll from "../components/support/SupportInstructorAll";

import AdminLayout from "../components/admin/AdminLayout";
import {
  AdminAnalytics,
  AdminAuditLogs,
  AdminDashboard,
  AdminProjectDetails,
  AdminProjects,
  AdminSupport,
  AdminSupportDetails,
  AdminUserDetails,
  AdminUsers,
} from "../components/admin/AdminPages";

import Profile from "../components/profile/Profile";
import NotificationsPage from "../pages/NotificationsPage";

export default function AppRoutes() {
  const { toast, notify, clearToast } = useToast();

  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthScreen />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/dashboard"
              element={
                <RoleRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </RoleRoute>
              }
            />
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
                  <LiveRooms notify={notify} />
                </RoleRoute>
              }
            />
            <Route
              path="/live/create"
              element={
                <RoleRoute allowedRoles={["student", "instructor"]}>
                  <CreateStream notify={notify} />
                </RoleRoute>
              }
            />
            <Route
              path="/live/:streamId"
              element={
                <RoleRoute allowedRoles={["student", "instructor"]}>
                  <LiveRoom />
                </RoleRoute>
              }
            />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route
              path="/messages"
              element={
                <RoleRoute allowedRoles={["student", "instructor", "admin"]}>
                  <Messages notify={notify} />
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
            <Route
              path="/support"
              element={<SupportStudent notify={notify} />}
            />

            <Route
              path="/support/:ticketId"
              element={
                <RoleRoute allowedRoles={["student", "instructor"]}>
                  <TicketDetails notify={notify} />
                </RoleRoute>
              }
            />

            <Route
              path="/support/create"
              element={<CreateSupportTicket notify={notify} />}
            />

            {/* <Route path="/support/:ticketId" element={<SupportTicketDetails />} /> */}
            <Route
              path="/support-instructor"
              element={
                <RoleRoute allowedRoles={["instructor"]}>
                  <SupportInstructor notify={notify} />
                </RoleRoute>
              }
            />
            <Route
              path="/support-instructor/all"
              element={
                <RoleRoute allowedRoles={["instructor"]}>
                  <SupportInstructorAll notify={notify} />
                </RoleRoute>
              }
            />
            <Route path="/profile" element={<Profile notify={notify} />} />
            <Route
              path="/profile/:userId"
              element={<Profile notify={notify} />}
            />
            <Route
              path="/notifications"
              element={
                <RoleRoute allowedRoles={["student", "instructor", "admin"]}>
                  <NotificationsPage />
                </RoleRoute>
              }
            />
          </Route>
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </RoleRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetails />} />
            <Route path="profile" element={<Profile notify={notify} />} />
            <Route
              path="profile/:userId"
              element={<Profile notify={notify} />}
            />
            <Route path="projects" element={<AdminProjects />} />
            <Route
              path="projects/:projectId"
              element={<AdminProjectDetails />}
            />
            <Route path="support" element={<AdminSupport />} />
            <Route path="support/:ticketId" element={<AdminSupportDetails />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />{" "}
      </Routes>
      <DevToast message={toast} onClose={clearToast} />
    </>
  );
}
