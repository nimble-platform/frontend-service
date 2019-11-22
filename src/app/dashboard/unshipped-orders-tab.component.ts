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
import {UserService} from '../user-mgmt/user.service';
import {Item} from '../catalogue/model/publish/item';
import {BPDataService} from '../bpe/bp-view/bp-data-service';

/**
 * Created by suat on 19-Sep-19.
 */
@Component({
    selector: 'unshipped-orders-tab',
    templateUrl: './unshipped-orders-tab.component.html'
})
export class UnshippedOrdersTabComponent implements OnInit {

    allOrderIds: string[] = [];
    partyNames:Map<string, string> = new Map<string, string>();
    orders: Map<string, Order> = new Map<string, Order>();
    // keeps the aggregated products referred by the orders
    associatedProductAggregates: ProductAggregate[] = [];
    allOrdersCallStatus: CallStatus = new CallStatus();
    orderIdsCallStatus: CallStatus = new CallStatus();
    associatedProductsCallStatus: CallStatus = new CallStatus();
    // keeps the error messages, if any, received when getting all orders
    failedOrderMessages: string[] = [];

    // utility methods
    selectPartyName = selectPartyName;
    selectLangLabelFromTextArray = selectPreferredValue;
    quantityToString = quantityToString;

    showSalesOrders:boolean[] = [];

    constructor(private catalogueService: CatalogueService,
                private bpeService: BPEService,
                private documentService: DocumentService,
                private userService: UserService,
                private bpDataService: BPDataService,
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

            this.orderIdsCallStatus.callback(null, true);

        }).catch(error => {
            this.orderIdsCallStatus.error('Failed to retrieve unshipped order ids');
        });
    }

    retrieveAllOrders(): void {
        this.failedOrderMessages = [];

        let promises: Promise<any>[] = [];
        for (let i = 0; i < this.allOrderIds.length; i++) {
            this.showSalesOrders.push(false);
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
                let partyIds = new Set();
                for (let order of orders) {
                    this.orders.set(order.id, order);
                    partyIds.add(order.buyerCustomerParty.party.partyIdentification[0].id)
                }
                this.userService.getParties(Array.from(partyIds)).then(parties => {

                    for(let party of parties){
                       this.partyNames.set(party.partyIdentification[0].id,selectPartyName(party.partyName));
                    }

                    this.aggregateAssociatedProducts();
                    this.allOrdersCallStatus.callback(null, true);
                }).catch(error => {
                    this.allOrdersCallStatus.error('Failed to retrieve buyer party details')
                });
            }
        });
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
            let partyIds = new Set();
            for(let product of products){
                partyIds.add(product.goodsItem.item.manufacturerParty.partyIdentification[0].id);
            }
            this.userService.getParties(Array.from(partyIds)).then(parties => {

                for(let party of parties){
                    this.partyNames.set(party.partyIdentification[0].id,selectPartyName(party.partyName));
                }

                this.populateAggregatedProductMap(products);

                this.associatedProductsCallStatus.callback(null, true);
            }).catch(err => {
                this.associatedProductsCallStatus.error(err);
            });
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
                        pa.salesOrders.push(copy(order));
                        this.associatedProductAggregates.push(pa);
                    } else {
                        let pa: ProductAggregate = this.associatedProductAggregates[paIndex];
                        pa.quantity.value += orderLineItem.quantity.value;
                        pa.salesOrders.push(copy(order));
                    }
                }
            }
        }

        for (let pa of this.associatedProductAggregates) {
            console.log(pa);
        }
    }

    onProductDetailsClicked(item:Item, quantity:Quantity): void {
        this.router.navigate(['/product-details'],
            {
                queryParams: {
                    catalogueId: item.catalogueDocumentReference.id,
                    id: item.manufacturersItemIdentification.id,
                    orderQuantity: quantity.value
                }
            });
    }

    onOrderDetailsClicked(orderId:string): void {
        this.orderIdsCallStatus.submit();
        this.bpeService.getProcessInstanceIdForDocument(orderId).then(processInstanceId => {
            this.bpDataService.viewProcessDetails(processInstanceId);
            this.orderIdsCallStatus.callback(null,true);
        }).catch(error => {
            this.orderIdsCallStatus.error("Failed to retrieve process instance id for the order",true)
        });

    }
}

class ProductAggregate {
    constructor(public catalogueLine: CatalogueLine = null,
                public quantity: Quantity = null,
                public salesOrders:Order[] = []) {}
}
