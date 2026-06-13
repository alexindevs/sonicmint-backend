import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StudioService } from './studio.service';
import { GenerateDto } from './dto/generate.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role, User } from '../auth/entities/user.entity';

@Controller('studio')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CREATOR)
export class StudioController {
  constructor(private readonly studioService: StudioService) {}

  @Post('generate')
  generate(@Body() dto: GenerateDto, @CurrentUser() user: User) {
    return this.studioService.generate(dto, user);
  }
}
