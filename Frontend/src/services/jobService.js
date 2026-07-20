import api from "./api";

export const getJobs = async () => {
  const { data } = await api.get("/jobs");
  return data;
};

export const getProjectJobs = async (projectId) => {
  const { data } = await api.get(`/jobs/project/${projectId}`);

  return data;
};

export const getMyJobs = async () => {
  const { data } = await api.get("/jobs/my/jobs");

  return data;
};

export const createJob = async (jobData) => {
  const { data } = await api.post("/jobs", jobData);

  return data;
};
