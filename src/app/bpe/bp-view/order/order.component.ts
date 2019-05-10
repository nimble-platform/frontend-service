import { Component, OnInit } from "@angular/core";
import { Order } from "../../../catalogue/model/publish/order";
import { CallStatus } from "../../../common/call-status";
import { BPDataService } from "../bp-data-service";
import { LineItem } from "../../../catalogue/model/publish/line-item";
import { Location } from "@angular/common";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { Router } from "@angular/router";
import { copy, quantityToString } from "../../../common/utils";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { UserService } from "../../../user-mgmt/user.service";
import { CookieService } from "ng2-cookies";
import { CustomerParty } from "../../../catalogue/model/publish/customer-party";
import { SupplierParty } from "../../../catalogue/model/publish/supplier-party";
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { BPEService } from "../../bpe.service";
import { BpUserRole } from "../../model/bp-user-role";
import { OrderResponseSimple } from "../../../catalogue/model/publish/order-response-simple";
import { PriceWrapper } from "../../../common/price-wrapper";
import { Party } from "../../../catalogue/model/publish/party";
import { DocumentClause } from "../../../catalogue/model/publish/document-clause";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Address } from "../../../catalogue/model/publish/address";
import { SearchContextService } from "../../../simple-search/search-context.service";
import { EpcCodes } from "../../../data-channel/model/epc-codes";
import { EpcService } from "../epc-service";
import {DocumentService} from "../document-service";
import {BpStartEvent} from '../../../catalogue/model/publish/bp-start-event';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import * as myGlobals from '../../../globals';
import {Contract} from '../../../catalogue/model/publish/contract';
import {Clause} from '../../../catalogue/model/publish/clause';

/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: "order",
    templateUrl: "./order.component.html",
    styleUrls: ["./order.component.css"]
})
export class OrderComponent implements OnInit {

    order: Order;
    address: Address
    orderResponse: OrderResponseSimple;
    paymentTermsWrapper: PaymentTermsWrapper;
    priceWrapper: PriceWrapper;
    userRole: BpUserRole;
    config = myGlobals.config;

    buyerParty: Party;
    sellerParty: Party;

    dataMonitoringDemanded: boolean;

    epcCodes: EpcCodes;
    savedEpcCodes: EpcCodes;
    initEpcCodesCallStatus: CallStatus = new CallStatus();
    saveEpcCodesCallStatus: CallStatus = new CallStatus();

    initCallStatus: CallStatus = new CallStatus();
    submitCallStatus: CallStatus = new CallStatus();
    fetchDataMonitoringStatus: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    getPartyId = UBLModelUtils.getPartyId;

    showPurchaseOrder:boolean = false;

    constructor(public bpDataService: BPDataService,
                private userService: UserService,
                private bpeService: BPEService,
                private cookieService: CookieService,
                private searchContextService: SearchContextService,
                private epcService: EpcService,
                private location: Location,
                private router: Router,
                private documentService: DocumentService) {

    }

    ngOnInit(): void {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        if(this.bpDataService.order == null) {
            this.router.navigate(['dashboard']);
        }

        this.order = this.bpDataService.order;
        this.address = this.order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        this.paymentTermsWrapper = new PaymentTermsWrapper(this.order.paymentTerms);
        this.userRole = this.bpDataService.bpStartEvent.userRole;
        this.orderResponse = this.bpDataService.orderResponse;
        this.priceWrapper = new PriceWrapper(
            this.order.orderLine[0].lineItem.price,
            this.order.orderLine[0].lineItem.quantity
        );

        // null check is for checking whether a new order is initialized
        // preceding process id check is for checking whether there is any preceding process before the order

        const sellerId: string = UBLModelUtils.getPartyId(this.order.orderLine[0].lineItem.item.manufacturerParty);
        const buyerId: string = this.cookieService.get("company_id");
        this.initCallStatus.submit();
        if(this.getNonTermAndConditionContract() == null && this.bpDataService.precedingProcessId != null) {
            Promise.all([
                this.bpeService.constructContractForProcess(this.bpDataService.precedingProcessId),
                this.userService.getParty(buyerId),
                this.userService.getParty(sellerId),
                this.isDataMonitoringDemanded(),
            ])
            .then(([contract, buyerParty, sellerParty, dataMonitoringDemanded]) => {
                this.buyerParty = buyerParty;
                this.sellerParty = sellerParty;
                this.dataMonitoringDemanded = dataMonitoringDemanded;
                this.order.contract.push(contract);
                return this.isDataMonitoringDemanded();
            })
            .then(dataMonitoringDemanded => {
                this.dataMonitoringDemanded = dataMonitoringDemanded;
                this.initCallStatus.callback("Initialized", true);
            })
            .catch(error => {
                this.initCallStatus.error("Error while initializing", error);
            });
        } else {
            Promise.all([
                this.userService.getParty(buyerId),
                this.userService.getParty(sellerId),
                this.isDataMonitoringDemanded(),
            ]).then(([buyerParty, sellerParty, dataMonitoringDemanded]) => {
                this.buyerParty = buyerParty;
                this.sellerParty = sellerParty;
                this.dataMonitoringDemanded = dataMonitoringDemanded;
                this.initCallStatus.callback("Initialized", true);
            })
            .catch(error => {
                this.initCallStatus.error("Error while initializing", error);
            });
        }

        this.initializeEPCCodes();
    }

    // retrieve the order contract which is not the Term and Condition contract
    getNonTermAndConditionContract(){
        if(this.order.contract){
            for(let contract of this.order.contract){
                for(let clause of contract.clause){
                    if(clause.type){
                        return clause;
                    }
                }
            }
        }
        return null;
    }

    getTermAndConditionClauses():Clause[]{
        if(this.order.contract){
            for(let contract of this.order.contract){
                for(let clause of contract.clause){
                    if(!clause.type){
                        return contract.clause;
                    }
                }
            }
        }
        return null;
    }

    trackByFn(index: any) {
        return index;
    }

    /*
     * Event Handlers
     */

    onBack() {
        this.location.back();
    }

    onOrder() {
        this.submitCallStatus.submit();
        const order = copy(this.bpDataService.order);

        // final check on the order
        order.orderLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(order);
        order.anticipatedMonetaryTotal.payableAmount.value = this.priceWrapper.totalPrice;
        order.anticipatedMonetaryTotal.payableAmount.currencyID = this.priceWrapper.currency;

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        const buyerId: string = this.cookieService.get("company_id");
        order.buyerCustomerParty = new CustomerParty(this.buyerParty);

        const sellerId: string = UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty);
        order.sellerSupplierParty = new SupplierParty(this.sellerParty);

        const vars: ProcessVariables = ModelUtils.createProcessVariables("Order", buyerId, sellerId,this.cookieService.get("user_id"), order, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

        this.bpeService.startBusinessProcess(piim)
            .then(res => {
                this.submitCallStatus.callback("Order placed", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            }).catch(error => {
                this.submitCallStatus.error("Failed to send Order", error);
            });
    }

    onOrderUpdate() {
        this.submitCallStatus.submit();
        const order = copy(this.bpDataService.order);

        this.bpeService.updateBusinessProcess(JSON.stringify(order),"ORDER",this.processMetadata.processId)
            .then(() => {
                this.documentService.updateCachedDocument(order.id,order);
                this.submitCallStatus.callback("Order updated", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.submitCallStatus.error("Failed to update Order", error);
            });
    }

    onRespondToOrder(accepted: boolean): void {
        this.bpDataService.orderResponse.acceptedIndicator = accepted;

        let vars: ProcessVariables = ModelUtils.createProcessVariables(
            "Order",
            UBLModelUtils.getPartyId(this.bpDataService.order.buyerCustomerParty.party),
            UBLModelUtils.getPartyId(this.bpDataService.order.sellerSupplierParty.party),
            this.cookieService.get("user_id"),
            this.bpDataService.orderResponse,
            this.bpDataService
        );
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(
            vars,
            this.processMetadata.processId
        );

        this.submitCallStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.submitCallStatus.callback("Order Response placed", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            }).catch(error => {
                this.submitCallStatus.error("Failed to send Order Response", error);
            });
    }

    onDownloadContact() {
        this.submitCallStatus.submit();
        this.bpeService.downloadContractBundle(this.order.id)
            .then(result => {
                const link = document.createElement('a');
                link.id = 'downloadLink';
                link.href = window.URL.createObjectURL(result.content);
                link.download = result.fileName;

                document.body.appendChild(link);
                const downloadLink = document.getElementById('downloadLink');
                downloadLink.click();
                document.body.removeChild(downloadLink);
                this.submitCallStatus.callback("Bundle successfully downloaded.", true);
            },
            error => {
                this.submitCallStatus.error("Error while downloading bundle.", error);
            });
    }

    onDispatchOrder() {
        this.bpDataService.proceedNextBpStep(this.userRole, "Fulfilment");
    }

    onSearchTransportService() {
        this.searchContextService.setSearchContext('Transport Service Provider','Order',this.processMetadata,this.bpDataService.bpStartEvent.containerGroupId);
        this.router.navigate(['simple-search'], {
            queryParams: {
                searchContext: 'orderbp',
                q:'*',
                cat:'Transport Service',
                catID:'nimble:category:TransportService'
            }
        });
    }

    onDeleteEpcCode(i: number) {
        this.epcCodes.codes.splice(i, 1);
    }

    onSaveEpcCodes() {
        this.saveEpcCodesCallStatus.submit();
        // remove empty codes
        const selectedEpcCodes = [];
        for(const code of this.epcCodes.codes) {
            if(code) {
                selectedEpcCodes.push(code);
            }
        }

        const codes = new EpcCodes(this.order.id, selectedEpcCodes);

        this.epcService.registerEpcCodes(codes)
            .then(() => {
                this.savedEpcCodes = codes;
                this.saveEpcCodesCallStatus.callback("EPC Codes are saved.", true);
            }).catch(error => {
                this.saveEpcCodesCallStatus.error("Failed to save EPC Codes.", error);
            });
    }

    onAddEpcCode() {
        this.epcCodes.codes.push("");
    }

    areEpcCodesDirty(): boolean {
        if(!this.epcCodes || !this.savedEpcCodes) {
            return false;
        }

        const codes = this.epcCodes.codes;
        const saved = this.savedEpcCodes.codes;

        if(codes.length !== saved.length) {
            return true;
        }

        for(let i = 0; i < saved.length; i++) {
            if(codes[i] !== saved[i]) {
                return true;
            }
        }

        return false;
    }

    /*
     * Getters & Setters
     */

    isBuyer(): boolean {
        return this.userRole === "buyer";
    }

    isSeller(): boolean {
        return this.userRole === "seller";
    }

    isReady(): boolean {
        return !this.initCallStatus.isDisplayed() && !!this.order;
    }

    isLoading(): boolean {
        return this.submitCallStatus.fb_submitted;
    }

    isOrderCompleted(): boolean {
        return this.processMetadata && this.processMetadata.processStatus === "Completed";
    }

    isOrderRejected(): boolean {
        return this.isOrderCompleted() && !this.bpDataService.orderResponse.acceptedIndicator;
    }

    isReadOnly(): boolean {
        if(this.userRole === "buyer") {
            return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
        }
        return this.isOrderCompleted();
    }

    getQuantityText(): string {
        return quantityToString(this.order.orderLine[0].lineItem.quantity);
    }

    getTotalPriceText(): string {
        return this.priceWrapper.totalPriceString;
    }

    getDeliveryPeriodText(): string {
        const qty = this.getLineItem().delivery[0].requestedDeliveryPeriod.durationMeasure;
        return `${qty.value} ${qty.unitCode}`;
    }

    getWarrantyPeriodText(): string {
        const warranty = this.getLineItem().warrantyValidityPeriod.durationMeasure;
        if(!warranty || !warranty.unitCode || !warranty.value) {
            return "None";
        }
        return `${warranty.value} ${warranty.unitCode}`;
    }

    getIncoterm(): string {
        return this.getLineItem().deliveryTerms.incoterms;
    }

    getPaymentMeans(): string {
        return this.order.paymentMeans.paymentMeansCode.name;
    }

    getLineItem(): LineItem {
        return this.order.orderLine[0].lineItem;
    }

    trackAndTraceDetailsExists(): boolean {
        const tnt = this.order.orderLine[0].lineItem.item.trackAndTraceDetails
        if (tnt && (tnt.masterURL || tnt.eventURL || tnt.productionProcessTemplate)) {
            return true;
        }

        return false;
    }

    /*
     *
     */

    private initializeEPCCodes() {
        if(this.processMetadata
            && this.processMetadata.processStatus == 'Completed'
            && this.bpDataService.orderResponse
            && this.bpDataService.orderResponse.acceptedIndicator
            && this.trackAndTraceDetailsExists()) {
            this.initEpcCodesCallStatus.submit();
            this.epcService.getEpcCodes(this.order.id).then(res => {
                this.epcCodes = res;
                if(this.epcCodes.codes.length == 0){
                    this.epcCodes.codes.push("");
                }
                this.epcCodes.codes.sort();
                this.savedEpcCodes = copy(this.epcCodes);
                this.initEpcCodesCallStatus.callback("EPC Codes initialized", true);
            }).catch(error => {
                if(error.status && error.status == 404) {
                    this.epcCodes = new EpcCodes(this.order.id,[""]);
                    this.savedEpcCodes = new EpcCodes(this.order.id,[""]);
                    this.initEpcCodesCallStatus.callback("EPC Codes initialized", true);
                } else {
                    this.initEpcCodesCallStatus.error("Error while initializing EPC Codes", error);
                }
            })
        }
    }

    private isDataMonitoringDemanded(): Promise<boolean> {
        let docClause: DocumentClause = null;

        if (this.order.contract && this.order.contract.length > 0) {
            for (let clause of this.order.contract[0].clause) {
                let clauseCopy = JSON.parse(JSON.stringify(clause));
                if (clauseCopy.clauseDocumentRef) {
                    docClause = clause as DocumentClause;
                    if(docClause.clauseDocumentRef.documentType === "QUOTATION") {
                        break;
                    }
                }
            }
        }

        if (docClause) {
            this.fetchDataMonitoringStatus.submit();
            return this.documentService.getDocumentJsonContent(docClause.clauseDocumentRef.id).then(result => {
                this.fetchDataMonitoringStatus.callback("Successfully fetched data monitoring service", true);
                const q: Quotation = result as Quotation;
                return q.dataMonitoringPromised;
            })
            .catch(error => {
                this.fetchDataMonitoringStatus.error("Error while fetching data monitoring service", error);
                throw error;
            })
        }

        return Promise.resolve(false);
    }

    getOrderContract():Contract{
        let orderContract = null;
        if(this.order.contract){
            for(let contract of this.order.contract){
                for(let clause of contract.clause){
                    if(clause.type){
                        orderContract = contract;
                        break;
                    }
                }
            }
        }
        return orderContract;
    }
}
