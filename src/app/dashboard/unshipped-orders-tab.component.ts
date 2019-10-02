import {Component, OnInit} from '@angular/core';
import {CookieService} from 'ng2-cookies';
import {BPEService} from '../bpe/bpe.service';
import {CallStatus} from '../common/call-status';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {DocumentService} from '../bpe/bp-view/document-service';
import {Order} from '../catalogue/model/publish/order';
import {copy, quantityToString, selectPartyName, selectPreferredValue} from '../common/utils';
import {ItemProperty} from '../catalogue/model/publish/item-property';
import {CatalogueLine} from '../catalogue/model/publish/catalogue-line';
import {Quantity} from '../catalogue/model/publish/quantity';
import {CatalogueService} from '../catalogue/catalogue.service';
import {LineItem} from '../catalogue/model/publish/line-item';

/**
 * Created by suat on 19-Sep-19.
 */
@Component({
    selector: 'unshipped-orders-tab',
    templateUrl: './unshipped-orders-tab.component.html'
})
export class UnshippedOrdersTabComponent implements OnInit {

    allOrderIds: string[] = [];
    displayedOrderIds: string[] = [];
    orders: Map<string, Order> = new Map<string, Order>();
    // keeps the aggregated products referred by the orders
    associatedProductAggregates: ProductAggregate[] = [];
    allOrdersCallStatus: CallStatus = new CallStatus();
    orderIdsCallStatus: CallStatus = new CallStatus();
    orderCallStatuses: Map<string, CallStatus> = new Map<string, CallStatus>();
    associatedProductsCallStatus: CallStatus = new CallStatus();
    showUnshippedOrders = true;
    // keeps the error messages, if any, received when getting all orders
    failedOrderMessages: string[] = [];

    pageNum = 0;
    pageSize = 10;

    // utility methods
    selectPartyName = selectPartyName;
    selectLangLabelFromTextArray = selectPreferredValue;
    quantityToString = quantityToString;

    constructor(private catalogueService: CatalogueService,
                private bpeService: BPEService,
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
            this.allOrderIds = orderIds;
            this.retrieveAllOrders();
            // set timeout is added in order to trigger a page change event of the navigation component
            setTimeout(() => this.pageNum = 1);

            this.orderIdsCallStatus.callback(null, true);

        }).catch(error => {
            this.orderIdsCallStatus.error('Failed to retrieve unshipped order ids');
        });
    }

    retrieveAllOrders(): void {
        this.failedOrderMessages = [];

        let promises: Promise<any>[] = [];
        for (let i = 0; i < this.allOrderIds.length; i++) {
            let orderRetrievalPromise: Promise<any> = this.documentService.getCachedDocument(this.allOrderIds[i]);
            promises.push(orderRetrievalPromise);
        }

        this.allOrdersCallStatus.submit();
        Promise.all(promises
            .map(promise => promise.catch(error => {
                this.failedOrderMessages.push(error);
            }))
        ).then(orders => {
            if (this.failedOrderMessages.length > 0) {
                this.allOrdersCallStatus.error('Failed to retrieve some of the orders.')
            } else {
                for (let order of orders) {
                    this.orders.set(order.id, order);
                }
                this.aggregateAssociatedProducts();
                this.allOrdersCallStatus.callback(null, true);
            }
        });
    }

    onUnshippedOrdersPageChange(): void {
        this.displayedOrderIds = [];
        let offset: number = (this.pageNum - 1) * this.pageSize;
        for (let i = offset; i < offset + this.pageSize && i < this.allOrderIds.length; i++) {
            this.displayedOrderIds.push(this.allOrderIds[i]);
        }

        for (let i = 0; i < this.displayedOrderIds.length; i++) {
            let callStatus: CallStatus = new CallStatus();
            callStatus.submit();
            this.orderCallStatuses.set(this.displayedOrderIds[i], callStatus);

            if (this.orders.has(this.displayedOrderIds[i])) {
                callStatus.callback(null, true);
                continue;
            }

            this.documentService.getCachedDocument(this.displayedOrderIds[i]).then(order => {
                this.orders.set(this.displayedOrderIds[i], order);
                callStatus.callback(null, true);

            }).catch(error => {
                callStatus.error('Failed to retrieve order: ' + this.displayedOrderIds[i]);
            });
        }
    }

    aggregateAssociatedProducts(): void {
        // first find all the associated products for the ordered products
        let associatedProductIds: number[] = [];
        for (let order of Array.from(this.orders.values())) {
            let orderedProductProperties: ItemProperty[] = order.orderLine[0].lineItem.item.additionalItemProperty;
            for (let itemProperty of orderedProductProperties) {
                if (itemProperty.associatedCatalogueLineID.length > 0) {
                    associatedProductIds = associatedProductIds.concat(itemProperty.associatedCatalogueLineID);
                }
            }
        }
        // eliminate duplicate product ids
        associatedProductIds = associatedProductIds.filter((productId, i) => associatedProductIds.indexOf(productId) === i);

        // retrieve all the associated documents
        // this part might be improved by retrieving only the required information instead of whole product information
        this.associatedProductsCallStatus.submit();
        this.catalogueService.getCatalogueLinesByHjids(associatedProductIds).then(products => {
            this.populateAggregatedProductMap(products);

            this.associatedProductsCallStatus.callback(null, true);
        }).catch(err => {
            this.associatedProductsCallStatus.error(err);
        });
    }

    populateAggregatedProductMap(associatedProducts: CatalogueLine[]): void {
        let associatedProductMap: Map<number, CatalogueLine> = new Map<number, CatalogueLine>();
        for (let catalogueLine of associatedProducts) {
            associatedProductMap.set(catalogueLine.hjid, catalogueLine)
        }

        for (let order of Array.from(this.orders.values())) {
            let orderLineItem: LineItem = order.orderLine[0].lineItem;
            for (let itemProp of orderLineItem.item.additionalItemProperty) {
                if (itemProp.associatedCatalogueLineID != null && itemProp.associatedCatalogueLineID.length === 1) {
                    let associatedProductId: number = itemProp.associatedCatalogueLineID[0];

                    let paIndex: number = this.associatedProductAggregates.findIndex(pa => pa.catalogueLine.hjid === associatedProductId);
                    if (paIndex === -1) {
                        let pa: ProductAggregate = new ProductAggregate();
                        pa.catalogueLine = associatedProductMap.get(associatedProductId);
                        // quantity is copied since we will update the amount if needed
                        pa.quantity = copy(orderLineItem.quantity);
                        this.associatedProductAggregates.push(pa);
                    } else {
                        let pa: ProductAggregate = this.associatedProductAggregates[paIndex];
                        pa.quantity.value += orderLineItem.quantity.value;
                    }
                }
            }
        }

        for (let pa of this.associatedProductAggregates) {
            console.log(pa);
        }
    }

    onProductDetailsClicked(productAggregate: ProductAggregate): void {
        this.router.navigate(['/product-details'],
            {
                queryParams: {
                    catalogueId: productAggregate.catalogueLine.goodsItem.item.catalogueDocumentReference.id,
                    id: productAggregate.catalogueLine.goodsItem.item.manufacturersItemIdentification.id,
                    orderQuantity: productAggregate.quantity.value
                }
            });
    }
}

class ProductAggregate {
    constructor(public catalogueLine: CatalogueLine = null,
                public quantity: Quantity = null) {}
}
