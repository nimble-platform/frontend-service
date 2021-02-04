import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {StripeCardElementOptions, StripeElementsOptions} from '@stripe/stripe-js';
import {BPEService} from '../bpe.service';
import {StripeCardComponent, StripeService} from 'ngx-stripe';
import {AddressSubForm} from '../../user-mgmt/subforms/address.component';
import {CookieService} from 'ng2-cookies';
import {UserService} from '../../user-mgmt/user.service';
import {PaymentService} from './payment-service';
import {PriceWrapper} from '../../common/price-wrapper';
import {roundToTwoDecimals} from '../../common/utils';
import * as myGlobals from '../../globals';
import {Router} from '@angular/router';
import {CallStatus} from '../../common/call-status';
import {TranslateService} from '@ngx-translate/core';


@Component({
    selector: 'stripe',
    templateUrl: './stripe.component.html',
    styleUrls: ['./stripe.component.css']
})
export class StripeComponent implements OnInit {

    @ViewChild(StripeCardComponent) card: StripeCardComponent;
    @ViewChild('cardErrors') cardErrorsDiv: ElementRef;

    config = myGlobals.config;

    // card options
    cardOptions: StripeCardElementOptions = {
        style: {
            base: {
                iconColor: '#666EE8',
                color: '#31325F',
                fontWeight: '300',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSize: '18px',
                '::placeholder': {
                    color: '#CFD7E0'
                }
            }
        }
    };
    elementsOptions: StripeElementsOptions = {
        locale: 'en'
    };
    // form group to keep billing details
    formGroup: FormGroup;
    // information retrieved through the payment service
    orderId: string;
    priceWrappers: PriceWrapper[];
    sellerStripeAccountId: string = null;
    // whether the card information is ready to submit
    isCardInformationCompleted: boolean = false;
    // whether the payment is successful
    isPaymentSuccessful: boolean = false;
    // call status
    paymentCallStatus: CallStatus = new CallStatus();
    initCallStatus: CallStatus = new CallStatus();

    constructor(private fb: FormBuilder,
                private router: Router,
                private stripeService: StripeService,
                private cookieService: CookieService,
                private translateService: TranslateService,
                private paymentService: PaymentService,
                private userService: UserService,
                private bpeService: BPEService) {
    }

    ngOnInit(): void {
        // set order details and seller stripe account id
        this.orderId = this.paymentService.orderId;
        this.priceWrappers = this.paymentService.priceWrappers;
        this.sellerStripeAccountId = this.paymentService.sellerStripeAccountId;
        // reset payment service data
        this.paymentService.resetData();
        // get company settings for the active user
        const userId = this.cookieService.get('user_id');
        this.initCallStatus.submit();
        this.userService.getSettingsForUser(userId).then(settings => {
            const userFullName = this.cookieService.get('user_fullname');
            const userEmail = this.cookieService.get('user_email');

            // initialize form group based on the company settings
            this.formGroup = this.fb.group({
                name: [userFullName, [Validators.required]],
                email: [userEmail, [Validators.required]],
                address: AddressSubForm.update(AddressSubForm.generateForm(this.fb), settings.details.address)
            });

            this.initCallStatus.callback('Settings successfully fetched', true)
        })
            .catch(error => {
                this.initCallStatus.error('Error while fetching company settings', error);
            });
    }

    confirmCardPayment() {
        if (confirm(this.translateService.instant('Your credit card will be charged. Are you sure that you confirm the payment ?'))) {
            this.paymentCallStatus.submit();
            // create payment intent
            this.bpeService.createPaymentIntent(this.orderId).then(clientSecret => {
                // confirm card payment
                const address = (this.formGroup.get('address.streetName').value ? this.formGroup.get('address.streetName').value : '') + (this.formGroup.get('address.buildingNumber').value ? this.formGroup.get('address.buildingNumber').value : '');
                this.stripeService.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: this.card.element,
                        billing_details: {
                            name: this.formGroup.get('name').value,
                            email: this.formGroup.get('email').value,
                            address: {
                                city: this.formGroup.get('address.cityName').value,
                                country: this.formGroup.get('address.country').value,
                                line1: address,
                                postal_code: this.formGroup.get('address.postalCode').value,
                                state: this.formGroup.get('address.region').value
                            }
                        }
                    }
                }).toPromise().then(response => {
                    if (response.paymentIntent && response.paymentIntent.status === 'succeeded') {
                        this.isPaymentSuccessful = true;
                        // let business process service know about the payment
                        this.bpeService.paymentDone(this.orderId, null, this.priceWrappers[0].item.manufacturerParty.federationInstanceID);
                        this.paymentCallStatus.callback('Payment received successfully', true);
                    } else if (response.error) {
                        this.paymentCallStatus.error(response.error.message);
                    } else {
                        this.paymentCallStatus.error('Failed to process the payment.');
                    }
                }).catch(error => {
                    this.paymentCallStatus.error('Processing the payment failed', error);
                })
            }).catch(error => {
                this.paymentCallStatus.error('Processing the payment failed', error);
            })
        }
    }

    onCardInformationChanged(event) {
        this.isCardInformationCompleted = event.complete;
        // reset error message
        this.cardErrorsDiv.nativeElement.innerText = '';
        // set error message if available
        if (event.error && event.error.message) {
            this.cardErrorsDiv.nativeElement.innerText = event.error.message
        }
    }

    getGrossTotalString() {
        let grossTotal = 0;
        for (let priceWrapper of this.priceWrappers) {
            if (this.config.vatEnabled) {
                grossTotal += priceWrapper.grossTotal;
            } else {
                grossTotal += priceWrapper.totalPrice;
            }
        }
        return roundToTwoDecimals(grossTotal) + ' ' + this.priceWrappers[0].currency;
    }

    onNavigateDashboard() {
        this.router.navigate(['dashboard']);
    }
}
