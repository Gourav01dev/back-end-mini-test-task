import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private connectedClients = new Map<string, Socket>();
  
  constructor(private usersService: UsersService) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
    this.emitDashboardUpdate();
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.emitDashboardUpdate();
  }

  notifyProductCreated(product: any) {
    this.server.emit('productCreated', {
      product,
      timestamp: new Date(),
    });
    
    this.emitDashboardUpdate();
  }

  @SubscribeMessage('requestDashboardUpdate')
  async handleDashboardUpdate(@ConnectedSocket() client: Socket) {
    const activeUsers = await this.usersService.getActiveUsers();
    
    client.emit('dashboardUpdate', {
      activeUsers,
      connectedClients: this.connectedClients.size,
      timestamp: new Date(),
    });
  }

  private async emitDashboardUpdate() {
    const activeUsers = await this.usersService.getActiveUsers();
    
    this.server.emit('dashboardUpdate', {
      activeUsers,
      connectedClients: this.connectedClients.size,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('userActivity')
  handleUserActivity(@MessageBody() data: { userId: string; activity: string }) {
    this.server.emit('liveActivity', {
      userId: data.userId,
      activity: data.activity,
      timestamp: new Date(),
    });
  }
}