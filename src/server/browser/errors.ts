export class BrowserServiceError extends Error {
  constructor(readonly code: string, message: string, readonly statusCode = 409) {
    super(message);
    this.name = 'BrowserServiceError';
  }
}
