import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080/server_war_exploded/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const auth = axios.create({
  baseURL: "http://localhost:8080/server_war_exploded/auth",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
