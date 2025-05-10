import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      email: string;
      name: string;
      roleId: number;
      role?: string;
    }
    token?: string;
  }

  interface User {
    id: number;
    email: string;
    name: string;
    roleId: number;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
    roleId: number;
    role?: string;
  }
} 