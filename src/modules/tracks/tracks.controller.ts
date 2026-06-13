import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TracksService } from './tracks.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { StreamEventDto } from './dto/stream-event.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role, User } from '../auth/entities/user.entity';
import type { AuthRequest } from '../../types/auth-request.type';

@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get()
  findAll(
    @Query('genre') genre?: string,
    @Query('mood') mood?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.tracksService.findAllPublic(genre, mood, limit, offset);
  }

  @Get('trending')
  findTrending() {
    return this.tracksService.findTrending();
  }

  @Get('new-releases')
  findNewReleases() {
    return this.tracksService.findNewReleases();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tracksService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  create(@Body() dto: CreateTrackDto, @CurrentUser() user: User) {
    return this.tracksService.create(dto, user);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR)
  publish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tracksService.publish(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tracksService.remove(id, user);
  }

  @Post(':id/stream')
  @HttpCode(HttpStatus.OK)
  recordStream(
    @Param('id') id: string,
    @Body() dto: StreamEventDto,
    @Req() req: AuthRequest,
  ) {
    return this.tracksService.recordStream(id, dto, req.user?.id);
  }

  @Get(':id/job-status')
  getJobStatus(@Param('id') id: string) {
    return this.tracksService.getJobStatus(id);
  }
}
