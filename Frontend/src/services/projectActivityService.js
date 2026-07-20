import api from "./api";

export const getProjectActivity = async (projectId) => {
  const { data } = await api.get(
    `/project-activity/${projectId}`
  );

  return data;
};