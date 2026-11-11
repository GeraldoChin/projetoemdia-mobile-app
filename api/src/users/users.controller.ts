import { Body, Controller, Get, HttpCode, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Utilizadores')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch('me/settings')
  updateSettings(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    return this.users.updateSettings(user.id, dto);
  }

  @HttpCode(200)
  @Post('me/password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, dto);
  }

  @Put('me/push-token')
  registerPushToken(@CurrentUser() user: AuthUser, @Body() dto: RegisterPushTokenDto) {
    return this.users.registerPushToken(user.id, dto.token);
  }

  @Get('search')
  search(@CurrentUser() user: AuthUser, @Query('q') q = '') {
    return this.users.search(q, user.id);
  }
}
