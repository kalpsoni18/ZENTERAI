import axios, { AxiosInstance, AxiosError } from 'axios';
import { getAuthToken } from './auth';

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          code: error.response?.data?.code,
          statusCode: error.response?.status,
        };
        return Promise.reject(apiError);
      }
    );
  }

  // Auth
  async signup(email: string, password: string, orgName: string) {
    const { data } = await this.client.post('/auth/signup', { email, password, orgName });
    return data;
  }

  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data;
  }

  async inviteUser(email: string, role: string) {
    const { data } = await this.client.post('/auth/invite', { email, role });
    return data;
  }

  // Files
  async listFiles(path: string = '/', limit: number = 100) {
    const { data } = await this.client.get('/files', { params: { path, limit } });
    return data;
  }

  async createFolder(name: string, parentPath: string) {
    const { data } = await this.client.post('/files/folder', { name, parentPath });
    return data;
  }

  async deleteFile(fileId: string) {
    const { data } = await this.client.delete(`/files/${fileId}`);
    return data;
  }

  async getUploadUrl(fileName: string, fileSize: number, contentType: string, parentPath: string) {
    const { data } = await this.client.post('/upload/sign', {
      fileName,
      fileSize,
      contentType,
      parentPath,
    });
    return data;
  }

  async shareFile(fileId: string, permissions: { role?: string; email?: string; expiresAt?: string }) {
    const { data } = await this.client.post(`/files/${fileId}/share`, permissions);
    return data;
  }

  // Team
  async listUsers() {
    const { data } = await this.client.get('/admin/users');
    return data;
  }

  async updateUserRole(userId: string, role: string) {
    const { data } = await this.client.patch(`/admin/users/${userId}`, { role });
    return data;
  }

  async removeUser(userId: string) {
    const { data } = await this.client.delete(`/admin/users/${userId}`);
    return data;
  }

  // Org
  async getOrg() {
    const { data } = await this.client.get('/admin/org');
    return data;
  }

  async updateOrgSettings(settings: Record<string, any>) {
    const { data } = await this.client.patch('/admin/org', settings);
    return data;
  }

  // Billing
  async getBillingInfo() {
    const { data } = await this.client.get('/billing');
    return data;
  }

  async createCheckoutSession(priceId: string) {
    const { data } = await this.client.post('/billing/checkout', { priceId });
    return data;
  }

  async getUsage() {
    const { data } = await this.client.get('/admin/usage');
    return data;
  }

  async completeUpload(uploadId: string, fileId: string, parts: Array<{ PartNumber: number; ETag: string }>) {
    const { data } = await this.client.post('/upload/complete', { uploadId, fileId, parts });
    return data;
  }
}

export const api = new ApiClient(import.meta.env.VITE_API_BASE_URL || '/api');

