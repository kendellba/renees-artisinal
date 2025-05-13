import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronStore", {
  get: (key) => ipcRenderer.invoke("store:get", key),
  set: (key, value) => ipcRenderer.invoke("store:set", key, value)
});
