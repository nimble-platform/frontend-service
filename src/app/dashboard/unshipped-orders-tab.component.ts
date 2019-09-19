import {Component, OnInit} from '@angular/core';
import {CookieService} from 'ng2-cookies';
import {BPEService} from '../bpe/bpe.service';
import {CallStatus} from '../common/call-status';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {DocumentService} from '../bpe/bp-view/document-service';
import {Order} from '../catalogue/model/publish/order';
import {quantityToString, selectPartyName, selectPreferredValue} from '../common/utils';

/**
 * Created by suat on 19-Sep-19.
 */
@Component({
    selector: 'unshipped-orders-tab',
    templateUrl: './unshipped-orders-tab.component.html'
})
export class UnshippedOrdersTabComponent implements OnInit {

    orderIds: string[] = [];
    orders: Map<string, Order> = new Map<string, Order>();
    orderIdsCallStatus: CallStatus = new CallStatus();
    orderCallStatuses: Map<string, CallStatus> = new Map<string, CallStatus>();

    selectPartyName = selectPartyName;
    selectLangLabelFromTextArray = selectPreferredValue;
    quantityToString = quantityToString;

    constructor(private bpeService: BPEService,
                private documentService: DocumentService,
                private cookieService: CookieService,
                private translate: TranslateService,
                private router: Router) {
                }

    ngOnInit() {
        this.retrieveUnshippedOrders();
    }

    private retrieveUnshippedOrders(): void {
        let partyId = this.cookieService.get('company_id');
        this.orderIdsCallStatus.submit();
        this.bpeService.getUnshippedOrderIds(partyId).then(orderIds => {
            this.orderIds = orderIds;
            for (let i = 0; i < orderIds.length; i++) {
                let callStatus: CallStatus = new CallStatus();
                callStatus.submit();

                this.orderCallStatuses.set(orderIds[i], callStatus);
                this.documentService.getCachedDocument(orderIds[i]).then(order => {
                    this.orders.set(orderIds[i], order);
                    callStatus.callback('', true);

                }).catch(error => {
                    callStatus.error('Failed to retrieve order: ' + orderIds[i]);
                });
            }

            this.orderIdsCallStatus.callback(null, true);

        }).catch(error => {
            this.orderIdsCallStatus.error('Failed to retrieve unshipped order ids');
        });
    }

    // navigateToProductDetails(frameContract: DigitalAgreement): void {
    //     this.router.navigate(['/product-details'],
    //         {
    //             queryParams: {
    //                 catalogueId: frameContract.item.catalogueDocumentReference.id,
    //                 id: frameContract.item.manufacturersItemIdentification.id
    //             }
    //         });
    // }
    //
    // navigateToCompanyDetails(frameContract: DigitalAgreement): void {
    //     this.router.navigate(['/user-mgmt/company-details'],
    //         {
    //             queryParams: {
    //                 id: this.getCorrespondingPartyId(frameContract)
    //             }
    //         });
    // }
    //
    // navigateToQuotationDetails(frameContract: DigitalAgreement): void {
    //     this.router.navigate(['/bpe/frame-contract/' + frameContract.hjid]);
    // }
}
