import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TargetsService } from './targets.service';

@Controller('targets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'viewer')
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

  @Get()
  findSnapshot(
    @Query('platform') platform: string,
    @Query('targetMonth') targetMonth: string,
    @Query('scopeClientId') scopeClientId?: string,
  ) {
    return this.targetsService.findSnapshot(
      platform,
      targetMonth,
      scopeClientId ? Number(scopeClientId) : null,
    );
  }

  @Post()
  createSnapshot(@Body() body: any) {
    return this.targetsService.createSnapshot(body);
  }
}
