export class ConnectionHandler {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];

    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  handleOnline() {
    this.isOnline = true;
    this.notifyListeners('online');
  }

  handleOffline() {
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }

  async checkServerConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://100.88.173.46:2000/api/health', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const connectionHandler = new ConnectionHandler();