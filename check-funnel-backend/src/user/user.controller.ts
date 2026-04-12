import { Controller, Get, Post, Patch, Delete, Body, UseGuards, Request, UseInterceptors, UploadedFile, Param, ParseIntPipe, Res, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserService } from './user.service';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async getAllUsers() {
    return this.userService.findAll();
  }

  @Get('pending')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async getPendingUsers() {
    return this.userService.findByStatus('pending');
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
    @Request() req
  ) {
    return this.userService.updateUserStatus(id, updateStatusDto.status, req.user.email);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.userService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: { fullName?: string; role?: string }
  ) {
    return this.userService.updateUser(id, updateData);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('viewer', 'admin')
  getProfile(@Request() req) {
    return { user: req.user };
  }

  @Post('avatar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('viewer', 'admin')
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    await this.userService.updateAvatar(req.user.id, file.buffer, file.mimetype);
    return { message: 'Avatar updated successfully' };
  }

  @Get(':id/avatar')
  //@Roles('viewer', 'admin') // Allow public access to avatars if needed, or keep protected
  async getAvatar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, mimeType } = await this.userService.getAvatar(id);
    res.set('Content-Type', mimeType);
    res.send(buffer);
  }
}
