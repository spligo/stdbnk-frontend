import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {catchError, interval, Observable, of, tap, throwError} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LeadsService {

  private LEAD_CONFIG!: any;

  constructor(private http: HttpClient) {
    this.retryFailed()
  }

  saveLead(lead: any) {
    this.loadLeadConfig().subscribe(value => {
      this.loadLeadDataToSubmit(value, lead);
      this.saveToServer(value);
    });
  }

  private saveToServer(value: any) {
    const headers = new HttpHeaders().set(
      'Content-Type',
      'application/json'
    );
    this.http.post<any>('http://localhost:8280/backend/leads', value, {headers: headers})
      .pipe(catchError(err => {
        console.error('Failed: Will retry later.')
        this.saveForLater(value)
        return throwError(() => new Error('Failed: Will retry later.'));
      }))
      .subscribe(value1 => console.log('Saved.'));
  }

  private loadLeadConfig(): Observable<any> {

    if (!this.LEAD_CONFIG) {
      return this.http.get("./assets/lead_config.json")
        .pipe(
          // map(value => JSON.parse(JSON.stringify(value))),
          tap(value => this.LEAD_CONFIG = JSON.parse(JSON.stringify(value))),
          catchError(err => {
            console.error(err)
            return throwError(() => new Error('Could not load lead configs.'));
          }))

    }
    return of(JSON.parse(JSON.stringify(this.LEAD_CONFIG)))
  }

  private loadLeadDataToSubmit(leadToSend: any, leadFromForm: any) {

    this.setLeadProperty(leadToSend, 'firstname', leadFromForm.firstname)
    this.setLeadProperty(leadToSend, 'surname', leadFromForm.surname)

    let parent = this.getItemBy(leadToSend, 'name', 'contacts')
    parent = this.getItemBy(parent, 'itemName', 'contactsitem1')
    parent = this.getItemBy(parent, 'propertyName', 'text')
    parent.actualValue = leadFromForm.mobileNumber

    parent = this.getItemBy(leadToSend, 'name', 'contacts')
    parent = this.getItemBy(parent, 'itemName', 'contactsitem2')
    parent = this.getItemBy(parent, 'propertyName', 'text')
    parent.actualValue = leadFromForm.email

  }

  private setLeadProperty(leadObject: any, propertyName: string, propertyValue: any) {
    for (var key in leadObject) {
      if (!leadObject.hasOwnProperty(key)) {
        continue
      }
      if (typeof leadObject[key] === 'object' && leadObject[key] !== null) {
        this.setLeadProperty(leadObject[key], propertyName, propertyValue)
      } else if (key === 'propertyName' && leadObject['propertyName'] === propertyName) {
        leadObject['actualValue'] = propertyValue;
      }
    }
  }

  private getItemBy(leadObject: any, propertyName: string, propertyValue: any): any {
    if (!leadObject) {
      return null;
    }
    for (var key in leadObject) {
      if (!leadObject.hasOwnProperty(key)) {
        continue
      }
      if (key === propertyName && leadObject[key] === propertyValue) {
        return leadObject;
      } else if (typeof leadObject[key] === 'object') {
        const item = this.getItemBy(leadObject[key], propertyName, propertyValue);
        if (item) {
          return item;
        }
      }
    }
  }

  private saveForLater(lead: any) {
    let leadString = window.localStorage.getItem('leads');
    if (!leadString) {
      leadString = '[]'
    }
    const leads = JSON.parse(leadString) as any[];
    leads.push(lead)
    window.localStorage.setItem('leads', JSON.stringify(leads))
  }

  private retryFailed() {
    interval(20000)
      .subscribe(() => {
        let leadString = window.localStorage.getItem('leads');
        if (!leadString) {
          return;
        }
        const leads = JSON.parse(leadString) as any[];
        if (leads.length === 0) {
          return;
        }
        let lead = leads[leads.length - 1]
        leads.pop()
        window.localStorage.setItem('leads', JSON.stringify(leads))
        console.log(`Remaining leads ${leads.length}`)
        this.saveToServer(lead)
      });
  }
}
