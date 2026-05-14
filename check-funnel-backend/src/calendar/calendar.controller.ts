import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('calendars')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  async create(@Body() data: any, @Request() req) {
    return this.calendarService.createCalendar(data, req.user.email);
  }

  @Get()
  async findAll(@Query('clientId') clientId?: string) {
    return this.calendarService.getCalendars(clientId ? parseInt(clientId) : undefined);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.calendarService.getCalendarById(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.calendarService.deleteCalendar(id);
  }

  @Delete('posts/:id')
  async removePost(@Param('id', ParseIntPipe) id: number) {
    return this.calendarService.deletePost(id);
  }

  @Patch('posts/:id')
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.calendarService.updatePost(id, data);
  }
}
