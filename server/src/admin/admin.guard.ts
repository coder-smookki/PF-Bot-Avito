import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminUsername = process.env.ADMIN_USERNAME || 'admin';
  private readonly adminPassword = process.env.ADMIN_PASSWORD || 'admin';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    if (authHeader.startsWith('Basic ')) {
      const base64 = authHeader.slice(6);
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');

      if (username === this.adminUsername && password === this.adminPassword) {
        return true;
      }
    }

    if (authHeader.startsWith('Bearer ')) {
      const user = request.user;
      if (user?.role === 'admin') {
        return true;
      }
    }

    throw new UnauthorizedException('Invalid admin credentials');
  }
}
