import { Controller, Get, UseGuards } from '@nestjs/common';
import { MeService } from './me.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('tracks')
  getTracks(@CurrentUser() user: User) {
    return this.meService.getTracks(user.id);
  }

  @Get('stats')
  getStats(@CurrentUser() user: User) {
    return this.meService.getStats(user.id);
  }

  @Get('payout')
  getPayout(@CurrentUser() user: User) {
    return this.meService.getPayout(user);
  }
}
