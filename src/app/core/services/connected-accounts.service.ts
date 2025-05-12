import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ConnectedAccount, mapBackendToFrontendAccount } from '../models/connected-account.model';

@Injectable({
  providedIn: 'root'
})
export class ConnectedAccountsService {
  constructor() {}

  getConnectedAccounts(): Observable<ConnectedAccount[]> {
    // TODO: Replace with actual API call
    return of([]);
  }
} 