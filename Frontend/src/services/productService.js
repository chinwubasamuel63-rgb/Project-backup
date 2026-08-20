import api from "./api";

export const getProducts = async () => {
  const { data } = await api.get("/products");

  return data;
};

export const getMyProducts = async () => {
  const { data } = await api.get("/products/my/products");

  return data;
};

export const getUserProducts = async (userId) => {
  const { data } = await api.get(`/products/user/${userId}`);

  return data;
};
