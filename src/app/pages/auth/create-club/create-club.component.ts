import { Component } from '@angular/core';
import { NewClubWizardComponent } from '../../../shared/components/new-club-wizard/new-club-wizard.component';

@Component({
  selector: 'app-create-club',
  standalone: true,
  imports: [NewClubWizardComponent],
  template: `<app-new-club-wizard [inAuthFlow]="true" />`,
})
export class CreateClubComponent {}
