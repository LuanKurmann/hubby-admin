import { Component, inject } from '@angular/core';
import { AppStateService } from '../../core/services/app-state.service';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { CreateOrJoinComponent } from './create-or-join/create-or-join.component';
import { CreateClubComponent } from './create-club/create-club.component';
import { JoinClubComponent } from './join-club/join-club.component';

@Component({
  selector: 'app-auth-router',
  standalone: true,
  imports: [
    LoginComponent,
    RegisterComponent,
    CreateOrJoinComponent,
    CreateClubComponent,
    JoinClubComponent,
  ],
  template: `
    @switch (state.authView()) {
      @case ('register') { <app-register /> }
      @case ('create-or-join') { <app-create-or-join /> }
      @case ('create') { <app-create-club /> }
      @case ('join') { <app-join-club /> }
      @default { <app-login /> }
    }
  `,
})
export class AuthRouterComponent {
  state = inject(AppStateService);
}
