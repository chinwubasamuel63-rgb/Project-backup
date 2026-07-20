import { useState } from "react";
import { adminUsers, adminAuditLogs, adminTracks } from "../../data/mockData";
import { COLORS } from "../../data/colors";

/**
 * AdminDashboard Component - Main admin dashboard
 */
export function AdminDashboard({ setView, notify }) {
  return (
    <div className="page-wrap">
      <div className="dashboard-stage">
        <section className="hero-3d">
          <div className="hero-copy">
            <span className="eyebrow">ADMIN OPERATIONS</span>
            <h1>Monitor platform health, users, and system integrity.</h1>
            <p>
              This is admin-only. Student and instructor pages are completely
              gated. Full system controls and analytics are here.
            </p>
            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={() => setView("admin-users")}
              >
                View all systems
              </button>
              <button
                className="btn-ghost"
                onClick={() =>
                  notify("System alerts checked. All systems nominal.")
                }
              >
                Check alerts
              </button>
            </div>
          </div>
          <div className="orbit-scene" aria-hidden="true">
            <div className="holo-card card-a">
              <b>2,847</b>
              <span>Active users</span>
            </div>
            <div className="holo-card card-b">
              <b>99.97%</b>
              <span>Uptime</span>
            </div>
            <div className="holo-card card-c">
              <b>0</b>
              <span>Critical alerts</span>
            </div>
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <div className="core-orb" />
          </div>
        </section>
        <div className="role-grid">
          {[
            { label: "Auth system", value: "OK", color: COLORS.green },
            { label: "Database", value: "OK", color: COLORS.green },
            { label: "Live servers", value: "OK", color: COLORS.green },
          ].map((sys) => (
            <div key={sys.label} className="card metric-card">
              <span style={{ color: sys.color }}>{sys.value}</span>
              <p>{sys.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * AdminUsers Component - Manage users and roles
 */
export function AdminUsers({ setView, notify }) {
  return (
    <div className="page-wrap">
      <div className="dashboard-stage">
        <section>
          <span className="eyebrow">USER MANAGEMENT</span>
          <h1>Active users, role assignments, and account status.</h1>
        </section>

        <div className="project-tiles">
          {adminUsers.map((user) => (
            <div key={user.id} className="project-tile">
              <div className="tile-header">
                <strong>{user.name}</strong>
                <span
                  style={{
                    background:
                      user.status === "active" ? COLORS.green : COLORS.red,
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {user.status}
                </span>
              </div>
              <p>{user.role}</p>
              <div className="tile-footer">
                <span>{user.joined}</span>
                <span>{user.email}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * AdminTracks Component - Manage learning tracks
 */
export function AdminTracks({ setView, notify }) {
  return (
    <div className="page-wrap">
      <div className="dashboard-stage">
        <section>
          <span className="eyebrow">LEARNING TRACKS</span>
          <h1>Create and manage course structures and curriculum.</h1>
        </section>

        <div className="project-tiles">
          {adminTracks.map((track) => (
            <div key={track.id} className="project-tile">
              <div className="tile-header">
                <strong>{track.name}</strong>
              </div>
              <p>{track.description}</p>
              <div className="tile-footer">
                <span>{track.modules} modules</span>
                <span>{track.students} students</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
