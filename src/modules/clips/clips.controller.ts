import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ClipsService } from './clips.service';
import { GenerateClipDto } from './dto/generate-clip.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role, User } from '../auth/entities/user.entity';

@Controller('clips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CREATOR)
export class ClipsController {
  constructor(private readonly clipsService: ClipsService) {}

  @Post('generate')
  generate(@Body() dto: GenerateClipDto, @CurrentUser() user: User) {
    return this.clipsService.generate(dto, user);
  }

  @Get('mine')
  findMine(@CurrentUser() user: User) {
    return this.clipsService.findMine(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.clipsService.findOne(id, user.id);
  }
}
