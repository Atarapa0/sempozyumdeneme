import { NextResponse } from 'next/server';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

const apiClient = {
  get: async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API isteği başarısız oldu');
      }
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  post: async (url: string, data: any) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API isteği başarısız oldu');
      }
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  put: async (url: string, data: any) => {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API isteği başarısız oldu');
      }
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  patch: async (url: string, data: any) => {
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API isteği başarısız oldu');
      }
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  delete: async (url: string) => {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API isteği başarısız oldu');
      }
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};

export default apiClient; 