// lib/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // ✅ include cookies automatically
});

export default api;
