const isElectron = () => {
  return navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
};

export const storage = {
  get: async (key: string): Promise<any> => {
    if (isElectron()) {
      return window.electronStore.get(key);
    }
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  set: async (key: string, value: any): Promise<void> => {
    if (isElectron()) {
      await window.electronStore.set(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
};

export default storage;
