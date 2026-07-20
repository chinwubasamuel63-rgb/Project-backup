import api from "./api";

export const joinStream = async (streamId) => {
  const { data } = await api.post(
    `/streams/${streamId}/join`
  );

  return data;
};