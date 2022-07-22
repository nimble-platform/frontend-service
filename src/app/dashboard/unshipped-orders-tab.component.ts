/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ng2-cookies';
import { BPEService } from '../bpe/bpe.service';
import { CallStatus } from '../common/call-status';
import { Router } from '@angular/router';
import { DocumentService } from '../bpe/bp-view/document-service';
import { Order } from '../catalogue/model/publish/order';
import { copy, quantityToString, selectPartyName, selectPreferredValue } from '../common/utils';
import { ItemProperty } from '../catalogue/model/publish/item-property';
import { CatalogueLine } from '../catalogue/model/publish/catalogue-line';
import { Quantity } from '../catalogue/model/publish/quantity';
import { CatalogueService } from '../catalogue/catalogue.service';
import { UserService } from '../user-mgmt/user.service';
import { Item } from '../catalogue/model/publish/item';
import { BPDataService } from '../bpe/bp-view/bp-data-service';
import { ProcessType } from '../bpe/model/process-type';
import { FEDERATIONID, NEGOTIATION_RESPONSES } from '../catalogue/model/constants';
import { ThreadEventStatus } from '../catalogue/model/publish/thread-event-status';
import { UnshippedOrdersTransitionService } from '../bpe/unshipped-order-transition-service';

@Component({
    selector: 'unshipped-orders-tab',
    templateUrl: './unshipped-orders-tab.component.html',
    styleUrls: ["./unshipped-orders-tab.component.css"]
})
export class UnshippedOrdersTabComponent implements OnInit {

    allOrderIds: string[] = [];
    expectedOrders: any[] = [];
    partyNames: Map<string, string> = new Map<string, string>();
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

    showSalesOrders: boolean[] = [];

    constructor(private catalogueService: CatalogueService,
        private bpeService: BPEService,
        private documentService: DocumentService,
        private userService: UserService,
        private bpDataService: BPDataService,
        private unShippedOrdersTransitionService: UnshippedOrdersTransitionService,
        private cookieService: CookieService,
        private router: Router) {
    }

    ngOnInit() {
        this.retrieveUnshippedOrders();
    }

    private retrieveUnshippedOrders(): void {
        let partyId = this.cookieService.get('company_id');
        this.orderIdsCallStatus.submit();
        this.bpeService.getExpectedOrders(partyId).then(expectedOrders => {
            this.expectedOrders = expectedOrders;
            this.retrieveAllOrders();

            this.orderIdsCallStatus.callback(null, true);

        }).catch(error => {
            this.orderIdsCallStatus.error('Failed to retrieve unshipped order ids');
        });
    }

    retrieveAllOrders(): void {
        this.failedOrderMessages = [];
        // retrieve all unshipped order ids
        for (let expectedOrder of this.expectedOrders) {
            for (let orderId of expectedOrder.unShippedOrderIds) {
                this.allOrderIds.push(orderId);
            }
        }

        let promises: Promise<any>[] = [];
        for (let i = 0; i < this.allOrderIds.length; i++) {
            this.showSalesOrders.push(false);
            let orderRetrievalPromise: Promise<any> = this.documentService.getCachedDocument(this.allOrderIds[i], FEDERATIONID());
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
                let federationIds = new Set();
                for (let order of orders) {
                    this.orders.set(order.id, order);
                    partyIds.add(order.buyerCustomerParty.party.partyIdentification[0].id)
                    federationIds.add(order.buyerCustomerParty.party.federationInstanceID);
                }
                this.userService.getParties(Array.from(partyIds), Array.from(federationIds)).then(parties => {

                    for (let party of parties) {
                        this.partyNames.set(party.partyIdentification[0].id, selectPartyName(party.partyName));
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
            let orderedProductProperties: ItemProperty[] = [];
            for (let orderLine of order.orderLine) {
                orderedProductProperties = orderedProductProperties.concat(orderLine.lineItem.item.additionalItemProperty);
            }
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
            let federationIds = new Set();
            for (let product of products) {
                partyIds.add(product.goodsItem.item.manufacturerParty.partyIdentification[0].id);
                federationIds.add(product.goodsItem.item.manufacturerParty.federationInstanceID);
            }
            this.userService.getParties(Array.from(partyIds), Array.from(federationIds)).then(parties => {

                for (let party of parties) {
                    this.partyNames.set(party.partyIdentification[0].id, selectPartyName(party.partyName));
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

        for (let expectedOrder of this.expectedOrders) {
            let pa: ProductAggregate = new ProductAggregate();
            // pa.catalogueLine = associatedProductMap.get(associatedProductId);
            let size = expectedOrder.unShippedOrderIds.length;
            for (let i = 0; i < size; i++) {
                let unShippedOrder = this.orders.get(expectedOrder.unShippedOrderIds[i]);

                let orderLineSize = unShippedOrder.orderLine.length;
                let firstIndex;
                for (let j = 0; j < orderLineSize; j++) {
                    let orderLine = unShippedOrder.orderLine[j];
                    for (let itemProp of orderLine.lineItem.item.additionalItemProperty) {
                        if (itemProp.associatedCatalogueLineID != null && itemProp.associatedCatalogueLineID.length === 1 && itemProp.associatedCatalogueLineID[0] == expectedOrder.lineHjid) {
                            let associatedProductId: number = itemProp.associatedCatalogueLineID[0];
                            pa.catalogueLine = associatedProductMap.get(associatedProductId);

                            if (pa.quantity) {
                                pa.quantity.value += orderLine.lineItem.quantity.value;
                            }
                            else {
                                // quantity is copied since we will update the amount if needed
                                pa.quantity = copy(orderLine.lineItem.quantity);
                            }

                            if (!firstIndex) {
                                firstIndex = j;
                            }
                        }
                    }
                }
                pa.salesOrders.push(copy(unShippedOrder));
                // it's important to know the index of product to retrieve its name etc
                pa.salesOrdersFirstIndexes.push(firstIndex);
            }

            pa.state = expectedOrder.state;
            pa.processType = expectedOrder.processType;
            pa.processInstanceId = expectedOrder.processInstanceId;
            pa.responseMetadata = expectedOrder.responseMetadata;
            this.setStatusText(pa);

            this.associatedProductAggregates.push(pa);
        }
    }

    onProductDetailsClicked(item: Item, quantity: Quantity = null, salesOrders: Order[] = null): void {
        // if salesOrders is not null, we'll set unShippedOrdersTransitionService using these orders
        // since an associated process will be started for them
        if (salesOrders) {
            let orderIds: string[] = [];
            for (let salesOrder of salesOrders) {
                orderIds.push(salesOrder.id);
            }
            this.unShippedOrdersTransitionService.setUnShippedOrderIds(orderIds);
        }
        this.router.navigate(['/product-details'],
            {
                queryParams: {
                    catalogueId: item.catalogueDocumentReference.id,
                    id: item.manufacturersItemIdentification.id,
                    orderQuantity: quantity ? quantity.value : 1
                }
            });
    }

    onOrderDetailsClicked(orderId: string): void {
        this.orderIdsCallStatus.submit();
        this.bpeService.getProcessInstanceIdForDocument(orderId).then(processInstanceId => {
            this.bpDataService.viewProcessDetails(processInstanceId, FEDERATIONID());
            this.orderIdsCallStatus.callback(null, true);
        }).catch(error => {
            this.orderIdsCallStatus.error("Failed to retrieve process instance id for the order", true)
        });

    }

    onProcessDetailsClicked(processInstanceId: string, federationId: string): void {
        this.bpDataService.viewProcessDetails(processInstanceId, federationId);
    }

    public setStatusText(pa: ProductAggregate): void {

        pa.status = this.setStatus(pa);

        let statusText: string;
        // messages if there is no response from the responder party
        if (pa.responseMetadata == null) {
            // messages for the buyer
            switch (pa.processType) {
                case "Fulfilment":
                    statusText = "Send Receipt Advice";
                    break;
                case "Order":
                    statusText = "Waiting for Order Response";
                    break;
                case "Negotiation":
                    statusText = "Waiting for Quotation";
                    break;
                case "Ppap":
                    statusText = "Waiting for Ppap Response";
                    break;
                case "Transport_Execution_Plan":
                    statusText = "Waiting for Transport Execution Plan";
                    break;
                case "Item_Information_Request":
                    statusText = 'Waiting for Information Response';
            }
            // messages if the responder party responded already
        } else {
            switch (pa.processType) {
                case "Order":
                    if (pa.responseMetadata.documentStatus == "true") {
                        statusText = "Order approved";
                    } else {
                        statusText = "Order declined";
                    }
                    break;
                case "Negotiation":
                    if (pa.responseMetadata.documentStatus == NEGOTIATION_RESPONSES.REJECTED) {
                        statusText = "Quotation rejected";
                    } else if (pa.responseMetadata.documentStatus == NEGOTIATION_RESPONSES.TERMS_UPDATED) {
                        statusText = "Quotation terms updated";
                    } else {
                        statusText = "Quotation accepted";
                    }
                    break;
                case "Fulfilment":
                    statusText = "Receipt Advice sent";
                    break;
                case "Ppap":
                    if (pa.responseMetadata.documentStatus == "true") {
                        statusText = "Ppap approved";
                    } else {
                        statusText = "Ppap declined";
                    }
                    break;
                case "Transport_Execution_Plan":
                    statusText = "Transport Execution Plan received"
                    break;
                case "Item_Information_Request":
                    statusText = "Information Request received"
            }
        }
        pa.statusText = statusText;
    }

    private setStatus(pa: ProductAggregate): ThreadEventStatus {
        switch (pa.state) {
            case "COMPLETED":
                return "DONE";
            case "EXTERNALLY_TERMINATED":
            case "CANCELLED":
                return "CANCELLED";
            default:
                if (pa.responseMetadata) {
                    return "WAITING";
                }
                return pa.processType === "Fulfilment" ? "ACTION_REQUIRED" : "WAITING";
        }
    }

    getOrderedQuantity(lineHjid: number, order: Order) {

        let quantity: Quantity = null;

        for (let orderLine of order.orderLine) {
            for (let itemProp of orderLine.lineItem.item.additionalItemProperty) {
                if (itemProp.associatedCatalogueLineID != null && itemProp.associatedCatalogueLineID.length === 1 && itemProp.associatedCatalogueLineID[0] == lineHjid) {
                    if (quantity) {
                        quantity.value += orderLine.lineItem.quantity.value;
                    }
                    else {
                        quantity = copy(orderLine.lineItem.quantity);
                    }
                }
            }
        }
        return quantityToString(quantity);
    }
}

class ProductAggregate {
    constructor(public catalogueLine: CatalogueLine = null,
        public quantity: Quantity = null,
        public salesOrders: Order[] = [],
        public salesOrdersFirstIndexes: number[] = [],
        public state: "EXTERNALLY_TERMINATED" | "COMPLETED" | "ACTIVE" | "CANCELLED" = null,
        public processType: ProcessType = null,
        public processInstanceId: string = null,
        public responseMetadata: any = null,
        public statusText: string = null,
        public status: string = null) { }
}
