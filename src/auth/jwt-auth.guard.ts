
import {
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY, IS_PUBLIC_PERMISSION } from 'src/decorator/customize';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }
    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }

    handleRequest(err, user, info, context: ExecutionContext) {
        const request: Request = context.switchToHttp().getRequest();

        // You can throw an exception based on either "info" or "err" arguments
        if (err || !user) {
            throw err || new UnauthorizedException("Token không hợp lệ hoặc không có token ở Bearer Token ở Header Request");
        }

        const isPublicPermission = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_PERMISSION, [
            context.getHandler(),
            context.getClass(),
        ]);

        // check permission
        const targetMethod = request.method;
        const targetEndpoint = request.route?.path as string;

        const permission = user?.permissions ?? [];
        let isExist = permission.find(p => targetMethod === p.method && targetEndpoint === p.apiPath);
        if (targetEndpoint.startsWith("/api/v1/auth")) isExist = true;

        if (!isExist && !isPublicPermission) {
            throw new ForbiddenException("Bạn không có quyền truy cập vào API này");
        }


        return user;
    }
}
