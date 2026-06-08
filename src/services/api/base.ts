import Axios from "axios";
import { API_BASE_URL } from "./endpoints";

export const api = Axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
