/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { CommonModule } from "@angular/common";
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { BPERoutingModule } from "./bpe-routing.module";

// TODO: Get rid of these dependencies
import { CatalogueModule } from "../catalogue/catalogue.module";

import { BPConfigureComponent } from "./bp-configure.component";
import { BPsComponent } from "./bps.component";
import { BPDetailComponent } from "./bp-detail.component";
import { ProductBpOptionsComponent } from "./bp-view/product-bp-options.component";
import { OrderComponent } from "./bp-view/order/order.component";
import { FulfilmentComponent } from "./bp-view/fulfilment/fulfilment.component";
import { ReceiptAdviceComponent } from "./bp-view/fulfilment/receipt-advice.component";
import { NegotiationComponent } from "./bp-view/negotiation/negotiation.component";
import { TransportExecutionPlanComponent } from "./bp-view/transport-execution-plan/transport-execution-plan.component";
import { PpapComponent } from "./bp-view/ppap/ppap.component";

import { PpapDocumentSelectComponent } from "./bp-view/ppap/ppap-document-select.component";
import { PpapDocumentUploadComponent } from "./bp-view/ppap/ppap-document-upload.component";
import { PpapDocumentDownloadComponent } from "./bp-view/ppap/ppap-document-download.component";

import { ContractComponent } from "./bp-view/contract/contract.component";
import { ClauseComponent } from "./bp-view/contract/clause.component";
import { PpapClauseComponent } from "./bp-view/contract/ppap-clause.component";
import { ProductBpStepsComponent } from "./bp-view/product-bp-steps.component";
import { NegotiationRequestComponent } from "./bp-view/negotiation/negotiation-request.component";
import { NegotiationRequestInputComponent } from "./bp-view/negotiation/negotiation-request-input.component";
import { NegotiationResponseComponent } from "./bp-view/negotiation/negotiation-response.component";
import { ItemInformationRequestComponent } from "./bp-view/item-information/item-information-request.component";
import { ItemInformationResponseComponent } from "./bp-view/item-information/item-information-response.component";
import { ItemInformationComponent } from "./bp-view/item-information/item-information.component";
import { ProductDetailsModule } from "../product-details/product-details.module";
import { DispatchAdviceComponent } from "./bp-view/fulfilment/dispatch-advice.component";
import { ShipmentInputComponent } from "./bp-view/fulfilment/shipment-input.component";
import { TransportNegotiationRequestComponent } from "./bp-view/transport-negotiation/transport-negotiation-request.component";
import { TransportNegotiationComponent } from "./bp-view/transport-negotiation/transport-negotiation.component";
import { TransportNegotiationResponseComponent } from "./bp-view/transport-negotiation/transport-negotiation-response.component";
import { TransportServiceDetailsComponent } from "./bp-view/transport-negotiation/transport-service-details.component";
import { TransportNegotiationAddressComponent } from "./bp-view/transport-negotiation/transport-negotiation-address.component";
import {TermsAndConditionsComponent} from './bp-view/contract/terms-and-conditions.component';
import {FrameContractDetailsComponent} from "./bp-view/contract/frame-contract-details.component";
import {ThreadSummaryComponent} from "./bp-summary/thread-summary.component";
import {ThreadEventComponent} from "./bp-summary/thread-event.component";
import {CustomTermModalComponent} from "./bp-view/negotiation/custom-term-modal.component";
import {ShoppingCartComponent} from './shopping-cart/shopping-cart.component';
import {NegotiationRequestItemComponent} from './bp-view/negotiation/negotiation-request-item.component';
import {NegotiationResponseItemComponent} from './bp-view/negotiation/negotiation-response-item.component';
import {OrderItemComponent} from './bp-view/order/order-item.component';
import {CommonCartTermsComponent} from './shopping-cart/common-cart-terms.component';
import {ShoppingCartSummaryModalComponent} from './shopping-cart/shopping-cart-summary-modal.component';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        HttpModule,
        ReactiveFormsModule,
        BPERoutingModule,
        CatalogueModule,
        ProductDetailsModule,
        NgbModule.forRoot()
    ],
    declarations: [
        BPConfigureComponent,
        BPsComponent,
        BPDetailComponent,
        ProductBpOptionsComponent,
        ProductBpStepsComponent,
        OrderComponent,
        OrderItemComponent,
        TermsAndConditionsComponent,
        FrameContractDetailsComponent,
        FulfilmentComponent,
        DispatchAdviceComponent,
        ReceiptAdviceComponent,
        ItemInformationRequestComponent,
        ItemInformationResponseComponent,
        ItemInformationComponent,
        NegotiationComponent,
        NegotiationRequestComponent,
        NegotiationRequestInputComponent,
        NegotiationRequestItemComponent,
        NegotiationResponseComponent,
        NegotiationResponseItemComponent,
        TransportExecutionPlanComponent,
        TransportNegotiationRequestComponent,
        TransportNegotiationResponseComponent,
        TransportNegotiationAddressComponent,
        TransportServiceDetailsComponent,
        TransportNegotiationComponent,
        PpapComponent,
        PpapDocumentSelectComponent,
        PpapDocumentUploadComponent,
        PpapDocumentDownloadComponent,
        ContractComponent,
        ClauseComponent,
        PpapClauseComponent,
        ShipmentInputComponent,
        ThreadSummaryComponent,
        ThreadEventComponent,
        CustomTermModalComponent,
        ShoppingCartComponent,
        CommonCartTermsComponent,
        ShoppingCartSummaryModalComponent
    ],
    exports: [
        BPConfigureComponent,
        BPsComponent,
        BPDetailComponent,
        ProductBpOptionsComponent,
        OrderComponent,
        FulfilmentComponent,
        ReceiptAdviceComponent,
        NegotiationComponent,
        TransportExecutionPlanComponent,
        ContractComponent,
        ClauseComponent,
        PpapClauseComponent,
        ThreadSummaryComponent
    ],
    providers: []
})
export class BPEModule {}
