"use client";

import { useCallback, useEffect, useState } from "react";
import KMLUploader from "../components/map/uploadKml";
import styles from "./admin.module.css";

const statusOptions = ["u/c", "proposed", "completed"];

const emptyGroupForm = {
  name: "",
  description: "",
  projectIds: [],
};

export default function AdminPanel({ initialIsAuthed = false }) {
  const [isAuthed, setIsAuthed] = useState(initialIsAuthed);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [projects, setProjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savingGroupId, setSavingGroupId] = useState(null);
  const [message, setMessage] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [groupError, setGroupError] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/getallmapdata", { cache: "no-store" });
      const json = await response.json();
      setProjects(Array.isArray(json) ? json : []);
    } catch (error) {
      setMessage("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const response = await fetch("/api/project-groups", { cache: "no-store" });
      const json = await response.json();
      setGroups(Array.isArray(json) ? json : []);
    } catch (error) {
      setGroupMessage("Failed to load groups.");
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([loadProjects(), loadGroups()]);
  }, [loadGroups, loadProjects]);

  useEffect(() => {
    if (isAuthed) {
      refreshData();
    }
  }, [isAuthed, refreshData]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setLoginError(payload?.error || "Login failed");
      return;
    }

    setPassword("");
    setIsAuthed(true);
    await refreshData();
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthed(false);
    setProjects([]);
    setGroups([]);
    setMessage("");
    setGroupMessage("");
  };

  const handleStatusChange = (projectId, nextStatus) => {
    setProjects((current) =>
      current.map((project) =>
        project._id === projectId ? { ...project, status: nextStatus } : project
      )
    );
  };

  const saveStatus = async (project) => {
    setSavingId(project._id);
    setMessage("");

    try {
      const response = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: project.status }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to update project");
      }

      const updatedProject = await response.json();
      setProjects((current) =>
        current.map((item) => (item._id === updatedProject._id ? updatedProject : item))
      );
      setMessage("Project updated.");
    } catch (error) {
      setMessage(error.message || "Failed to update project");
    } finally {
      setSavingId(null);
    }
  };

  const resetGroupForm = () => {
    setEditingGroupId(null);
    setGroupForm(emptyGroupForm);
    setGroupError("");
  };

  const startEditGroup = (group) => {
    setEditingGroupId(group._id);
    setGroupError("");
    setGroupMessage("");
    setGroupForm({
      name: group.name || "",
      description: group.description || "",
      projectIds: Array.isArray(group.projects)
        ? group.projects.map((project) => project?._id || project).filter(Boolean)
        : [],
    });
  };

  const handleGroupProjectChange = (event) => {
    const selectedProjectIds = Array.from(event.target.selectedOptions, (option) => option.value);
    setGroupForm((current) => ({
      ...current,
      projectIds: selectedProjectIds,
    }));
  };

  const handleGroupSave = async (event) => {
    event.preventDefault();
    setGroupError("");
    setGroupMessage("");
    setSavingGroupId(editingGroupId || "new");

    const payload = {
      name: groupForm.name,
      description: groupForm.description,
      projectIds: groupForm.projectIds,
    };

    try {
      const response = await fetch(
        editingGroupId ? `/api/project-groups/${editingGroupId}` : "/api/project-groups",
        {
          method: editingGroupId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const payloadResponse = await response.json().catch(() => ({}));
        throw new Error(payloadResponse?.error || "Failed to save group");
      }

      setGroupMessage(editingGroupId ? "Group updated." : "Group created.");
      resetGroupForm();
      await loadGroups();
    } catch (error) {
      setGroupError(error.message || "Failed to save group");
    } finally {
      setSavingGroupId(null);
    }
  };

  const handleGroupDelete = async (groupId) => {
    setGroupError("");
    setGroupMessage("");
    setSavingGroupId(groupId);

    try {
      const response = await fetch(`/api/project-groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to delete group");
      }

      if (editingGroupId === groupId) {
        resetGroupForm();
      }

      setGroupMessage("Group removed.");
      await loadGroups();
    } catch (error) {
      setGroupError(error.message || "Failed to delete group");
    } finally {
      setSavingGroupId(null);
    }
  };

  if (!isAuthed) {
    return (
      <div className={styles.shell}>
        <div className={styles.loginCard}>
          <p className={styles.kicker}>Admin access</p>
          <h1 className={styles.title}>Project Control Room</h1>
          <p className={styles.subtitle}>
            Sign in to upload projects and edit their live status.
          </p>

          <form onSubmit={handleLogin} className={styles.form}>
            <label className={styles.label}>
              Admin password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={styles.input}
                placeholder="Enter admin password"
              />
            </label>

            {loginError && <div className={styles.error}>{loginError}</div>}

            <button type="submit" className={styles.primaryButton}>
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.headerCard}>
        <div>
          <p className={styles.kicker}>Admin dashboard</p>
          <h1 className={styles.title}>Project Control Room</h1>
          <p className={styles.subtitle}>
            Add new projects, inspect the full list, and update project status.
          </p>
        </div>

        <button type="button" onClick={handleLogout} className={styles.secondaryButton}>
          Sign out
        </button>
      </div>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Add project</h2>
            <span className={styles.badge}>Admin only</span>
          </div>
          <KMLUploader onUploadSuccess={loadProjects} />
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>All projects</h2>
            <span className={styles.badge}>{projects.length} total</span>
          </div>

          {message && <div className={styles.note}>{message}</div>}
          {loading && <div className={styles.note}>Loading projects…</div>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id}>
                    <td>{project.name || "Unnamed project"}</td>
                    <td>{project.category}</td>
                    <td>
                      <select
                        className={styles.select}
                        value={project.status || "proposed"}
                        onChange={(event) =>
                          handleStatusChange(project._id, event.target.value)
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {project.uploadedAt ? new Date(project.uploadedAt).toLocaleString() : "-"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() => saveStatus(project)}
                        disabled={savingId === project._id}
                      >
                        {savingId === project._id ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!projects.length && !loading && (
                  <tr>
                    <td colSpan="5" className={styles.emptyState}>
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Project groups</h2>
            <span className={styles.badge}>{groups.length} total</span>
          </div>

          <form onSubmit={handleGroupSave} className={styles.groupForm}>
            <div className={styles.groupFormGrid}>
              <label className={styles.label}>
                Group name
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(event) =>
                    setGroupForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className={styles.input}
                  placeholder="Example: Northern corridor"
                  required
                />
              </label>

              <label className={styles.label}>
                Description
                <input
                  type="text"
                  value={groupForm.description}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={styles.input}
                  placeholder="Optional note about the group"
                />
              </label>
            </div>

            <label className={styles.label}>
              Projects in group
              <select
                multiple
                value={groupForm.projectIds}
                onChange={handleGroupProjectChange}
                className={`${styles.select} ${styles.multiselect}`}
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name || "Unnamed project"} · {project.category} · {project.status}
                  </option>
                ))}
              </select>
            </label>

            {groupError && <div className={styles.error}>{groupError}</div>}
            {groupMessage && <div className={styles.note}>{groupMessage}</div>}

            <div className={styles.groupActions}>
              <button type="submit" className={styles.primaryButton} disabled={savingGroupId !== null}>
                {savingGroupId === (editingGroupId || "new")
                  ? "Saving…"
                  : editingGroupId
                  ? "Update group"
                  : "Create group"}
              </button>

              {editingGroupId && (
                <button type="button" onClick={resetGroupForm} className={styles.secondaryButton}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          {groupsLoading && <div className={styles.note}>Loading groups…</div>}

          <div className={styles.groupList}>
            {groups.map((group) => (
              <div key={group._id} className={styles.groupCard}>
                <div className={styles.groupCardHeader}>
                  <div>
                    <h3 className={styles.groupTitle}>{group.name}</h3>
                    {group.description && <p className={styles.groupDescription}>{group.description}</p>}
                  </div>
                  <span className={styles.badge}>
                    {Array.isArray(group.projects) ? group.projects.length : 0} projects
                  </span>
                </div>

                <div className={styles.groupProjects}>
                  {Array.isArray(group.projects) && group.projects.length ? (
                    group.projects.map((project) => (
                      <span key={project._id || project} className={styles.projectChip}>
                        {project.name || "Unnamed project"}
                      </span>
                    ))
                  ) : (
                    <span className={styles.emptyText}>No projects assigned.</span>
                  )}
                </div>

                <div className={styles.groupActions}>
                  <button type="button" className={styles.smallButton} onClick={() => startEditGroup(group)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleGroupDelete(group._id)}
                    disabled={savingGroupId === group._id}
                  >
                    {savingGroupId === group._id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}

            {!groups.length && !groupsLoading && (
              <div className={styles.note}>No groups created yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}