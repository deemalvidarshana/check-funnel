import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      fullName,
      status: 'pending', // Explicitly set status to pending upon registration
    });
    await this.userRepository.save(user);

    // Note: We might not want to return a token immediately if approval is required.
    // For now, we return it but the next login will fail without approval.
    return { user: this.sanitizeUser(user), access_token: this.generateToken(user) };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Check approval status
    if (user.status === 'pending') {
      throw new UnauthorizedException('Your account is awaiting administrative approval');
    }
    
    if (user.status === 'rejected') {
      throw new UnauthorizedException('Your registration request has been rejected');
    }

    if (user.status !== 'approved') {
      throw new UnauthorizedException('Access denied');
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), access_token: token };
  }

  private generateToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      featureAccess: user.featureAccess || [],
    });
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
