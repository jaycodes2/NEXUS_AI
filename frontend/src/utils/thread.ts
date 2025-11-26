import { v4 as uuidv4 } from "uuid";

export function getThreadId() {
  let id = localStorage.getItem("threadId");
  if (!id) {
    id = uuidv4();
    localStorage.setItem("threadId", id);
  }
  return id;
}

export function newThread() {
  const id = uuidv4();
  localStorage.setItem("threadId", id);
  return id;
}
