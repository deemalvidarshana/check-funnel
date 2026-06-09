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
  Query,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientService } from './client.service';
import { ClientInsightsReportService } from './client-insights-report.service';
import { TiktokService } from '../tiktok/tiktok.service';
import { CreateClientDto, UpdateClientDto } from './dto';
import * as express from 'express';



@Controller('clients')
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly clientInsightsReportService: ClientInsightsReportService,
    private readonly tiktokService: TiktokService,
  ) {}

  @Get('tiktok/auth')
  async tiktokAuth(
    @Query('clientKey') clientKey: string,
    @Res() res: express.Response,
  ) {

    console.log('TikTok Auth Request received for key:', clientKey);
    const authUrl = this.tiktokService.getAuthUrl(clientKey, 'DUMMY_SECRET');
    return res.redirect(authUrl);
  }

  @Post('tiktok/exchange')
  async tiktokExchange(
    @Body() body: { code: string, clientKey: string, clientSecret: string },
  ) {
    console.log('TikTok Exchange Request received for code:', body.code?.substring(0, 10));
    const tokenData = await this.tiktokService.getAccessToken(body.code, body.clientKey, body.clientSecret);
    
    // Fetch user info to show display name in UI
    let displayName = 'Connected';
    try {
      const userInfo = await this.tiktokService.getUserInfo(tokenData.access_token);
      if (userInfo?.data?.user?.display_name) {
        displayName = userInfo.data.user.display_name;
      }
    } catch (e) {
      console.error('Fetch user info error:', e.message);
    }

    return { ...tokenData, displayName };
  }

  @Get(':id/tiktok/insights')
  async getTiktokInsights(@Param('id', ParseIntPipe) id: number) {
    const client = await this.clientService.findOne(id);
    if (!client.tiktokApiKey || !client.tiktokClientKey || !client.tiktokClientSecret) {
      throw new BadRequestException('TikTok not fully configured for this client');
    }

    const insights = await this.tiktokService.getInsights(client);
    
    // If token was refreshed, save it back to the database
    if (insights.newAccessToken) {
      await this.clientService.update(id, { tiktokApiKey: insights.newAccessToken } as any);
    }

    return insights;
  }

  @Get(':id/insights-report')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'viewer')
  getInsightsReport(
    @Param('id', ParseIntPipe) id: number,
    @Query('platform') platform?: string,
  ) {
    return this.clientInsightsReportService.buildReport(id, platform);
  }





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
    @Res() res: express.Response,
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
