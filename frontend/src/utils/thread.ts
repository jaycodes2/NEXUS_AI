import { v4 as uuidv4 } from "uuid";

export function getThreadId() {
  return localStorage.getItem("threadId");
}

export function newThread() {
  const id = uuidv4();
  localStorage.setItem("threadId", id);
  return id;
}
