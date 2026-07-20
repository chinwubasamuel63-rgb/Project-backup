import api from "./api";

export const getProducts = async () => {
  const { data } = await api.get("/products");
  return data;
};