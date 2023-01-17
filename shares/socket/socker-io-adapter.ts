import { INestApplicationContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions, Socket } from 'socket.io';
import * as dotenv from 'dotenv';
dotenv.config();

export class SocketIOAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIOAdapter.name);
  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const clientPort = parseInt(process.env.SOCKETIO_CLIENT_PORT);
    const cors = {
      origin: [
        `http://localhost:${clientPort}`,
        new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`),
      ],
    };

    this.logger.log('Configuring SocketIO server with custom CORS options', {
      cors,
    });

    const optionsWithCORS: ServerOptions = {
      ...options,
      cors,
    };
    return super.createIOServer(port, optionsWithCORS);
    // const jwtService = this.app.get(JwtService);
    // const server: Server = super.createIOServer(port, optionsWithCORS);

    // server.of('command').use(createTokenMiddleware(jwtService, this.logger));

    // return server;
  }
}
const createTokenMiddleware =
  (jwtService: JwtService, logger: Logger) =>
  (socket: SocketWithAuth, next) => {
    // for Postman testing support, fallback to token header
    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    logger.debug(`Validating auth token before connection: ${token}`);

    try {
      const payload = jwtService.verify(token);
      socket.user_id = payload.sub;

      next();
    } catch {
      next(new Error('FORBIDDEN'));
    }
  };

export type AuthPayload = {
  user_id: number;
};
export type SocketWithAuth = Socket & AuthPayload;