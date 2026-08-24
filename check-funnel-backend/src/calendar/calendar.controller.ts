import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('calendars')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  private assertCanManage(req: any) {
    const user = req.user;
    if (user?.role === 'admin') return;
    if (user?.role === 'manager' && user?.featureAccess?.includes('contentCalendar')) return;
    throw new ForbiddenException('You do not have permission to manage content calendars');
  }

  private assertCanUpdatePost(req: any, data: Record<string, unknown>) {
    const viewerEditableFields = new Set(['driveLink', 'isChecked']);
    const isViewerSafeUpdate = Object.keys(data).every((key) => viewerEditableFields.has(key));

    if (req.user?.role === 'viewer' && isViewerSafeUpdate) return;
    this.assertCanManage(req);
  }

  @Post()
  async create(@Body() data: any, @Request() req) {
    this.assertCanManage(req);
    return this.calendarService.createCalendar(data, req.user.email);
  }

  @Get()
  async findAll(@Query('clientId') clientId?: string) {
    return this.calendarService.getCalendars(
      clientId ? parseInt(clientId) : undefined,
    );
  }

  @Get('settings/:clientId')
  async getSettings(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.calendarService.getSettings(clientId);
  }

  @Put('settings/:clientId')
  async saveSettings(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Body() data: any,
    @Request() req,
  ) {
    this.assertCanManage(req);
    return this.calendarService.upsertSettings(clientId, data, req.user.email);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.calendarService.getCalendarById(id);
  }

  @Post(':id/posts')
  async createPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @Request() req,
  ) {
    this.assertCanManage(req);
    return this.calendarService.createPost(id, data);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    this.assertCanManage(req);
    return this.calendarService.deleteCalendar(id);
  }

  @Delete('posts/:id')
  async removePost(@Param('id', ParseIntPipe) id: number, @Request() req) {
    this.assertCanManage(req);
    return this.calendarService.deletePost(id);
  }

  @Patch('posts/:id')
  async updatePost(@Param('id', ParseIntPipe) id: number, @Body() data: any, @Request() req) {
    this.assertCanUpdatePost(req, data);
    return this.calendarService.updatePost(id, data);
  }
}
