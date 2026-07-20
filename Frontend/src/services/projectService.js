import api from "./api";

export const getProjects = async (page = 1, limit = 10) => {
  const { data } = await api.get(`/projects?page=${page}&limit=${limit}`);

  return data;
};

export const getProject = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}`);

  return data;
};

export const getMyProjects = async () => {
  const { data } = await api.get("/projects/my-projects");

  return data;
};

export const createProject = async (projectData) => {
  const { data } = await api.post("/projects", projectData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

export const updateProject = async (projectId, projectData) => {
  const { data } = await api.put(`/projects/${projectId}`, projectData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

export const deleteProject = async (projectId) => {
  const { data } = await api.delete(`/projects/${projectId}`);

  return data;
};
export const leaveProject = async (projectId) => {
  const { data } = await api.delete(`/projects/${projectId}/leave`);

  return data;
};

export const removeProjectMember = async (projectId, userId) => {
  const { data } = await api.delete(`/projects/${projectId}/members/${userId}`);

  return data;
};

export const uploadProjectImages = async (projectId, files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  const { data } = await api.patch(`/projects/${projectId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

export const deleteProjectImage = async (projectId, publicId) => {
  const { data } = await api.delete(`/projects/${projectId}/images`, {
    data: {
      publicId,
    },
  });

  return data;
};
