import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password } = registerDto;
    const user = await this.usersService.create(email, username, password);
    const payload: JwtPayload = { email: user.email, sub: user._id.toString() };
    
    return {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOne(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user._id.toString());
    await this.usersService.addActivity(user._id.toString(), 'User logged in');

    const payload: JwtPayload = { email: user.email, sub: user._id.toString() };
    
    return {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      access_token: this.jwtService.sign(payload),
    };
  }
}