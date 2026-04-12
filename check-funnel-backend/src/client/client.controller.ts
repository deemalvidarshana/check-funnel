import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';              // <-- use import type
import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto } from './dto';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'viewer')
  @UseInterceptors(FileInterceptor('logo', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|svg)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async create(
    @Body() createClientDto: CreateClientDto,
    @UploadedFile() file: Express.Multer.File,     // <-- now works
  ) {
    const logoData = file ? file.buffer : undefined;
    return this.clientService.create(createClientDto, logoData);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'viewer')
  findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'viewer')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientService.findOne(id);
  }

  @Get(':id/logo')
  @Roles('admin', 'viewer')
  async getLogo(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,                           // <-- import type Response
  ) {
    const client = await this.clientService.findOne(id);
    if (!client.logoData) {
      throw new NotFoundException('Logo not found');
    }
    // Simple MIME detection â€“ you could store the original MIME type as well
    res.set('Content-Type', 'image/jpeg');
    res.send(client.logoData);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('logo', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|svg)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const logoData = file ? file.buffer : undefined;
    return this.clientService.update(id, updateClientDto, logoData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.clientService.remove(+id);
  }

  @Patch(':id/share')
  async toggleShare(@Param('id') id: string, @Body('isShared') isShared: boolean) {
    return this.clientService.toggleSharing(+id, isShared);
  }
}
