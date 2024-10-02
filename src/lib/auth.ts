import { auth } from "./axios";

export const logout = async () => {
  try {
    await auth.post("/logout");
  } catch (e) {
    console.error(e);
  }
}