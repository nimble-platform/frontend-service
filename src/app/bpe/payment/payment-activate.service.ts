import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {Observable, of} from 'rxjs';
import {PaymentService} from './payment-service';
import {config} from '../../globals';

@Injectable({providedIn: 'root'})
export class PaymentActivateService implements CanActivate {

    constructor(private router: Router,
                private paymentService: PaymentService) {
    }

    canActivate(): Observable<boolean> {
        const isPreviousPageOrder = new RegExp('/bpe/bpe-exec/.*/.*').test(this.router.url);
        if (config.enableStripePayment && this.paymentService.orderId && this.paymentService.priceWrappers && this.paymentService.sellerStripeAccountId && isPreviousPageOrder) {
            return of(true);
        } else {
            this.router.navigate(['/dashboard']);
            return of(false);
        }
    }
}
