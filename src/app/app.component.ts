import {Component} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {LeadsService} from "./services/leads.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontend';

  leadFormGroup = new FormGroup({
    firstname: new FormControl(''),
    surname: new FormControl(''),
    mobileNumber: new FormControl(''),
    email: new FormControl(''),
  });

  constructor(private leadsService: LeadsService) {
  }

  onSubmit() {
    const lead = this.getLeadFromFormGroup();
    this.leadsService.saveLead(lead);
  }

  private getLeadFromFormGroup() {
    return {
      firstname: this.leadFormGroup.get('firstname')?.value,
      surname: this.leadFormGroup.get('surname')?.value,
      mobileNumber: this.leadFormGroup.get('mobileNumber')?.value,
      email: this.leadFormGroup.get('email')?.value,
    }
  }
}
