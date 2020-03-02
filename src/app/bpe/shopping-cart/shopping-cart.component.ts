import {Catalogue} from '../../catalogue/model/publish/catalogue';
import {Router} from '@angular/router';
import {Component, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {ShoppingCartDataService} from './shopping-cart-data-service';
import {copy, selectDescription, selectName, selectPreferredValues} from '../../common/utils';
import {ItemPriceWrapper} from '../../common/item-price-wrapper';
import {CatalogueLine} from '../../catalogue/model/publish/catalogue-line';
import {Item} from '../../catalogue/model/publish/item';
import {CompanySettings} from '../../user-mgmt/model/company-settings';
import {BPDataService} from '../bp-view/bp-data-service';
import {UserService} from '../../user-mgmt/user.service';
import {UBLModelUtils} from '../../catalogue/model/ubl-model-utils';
import {CallStatus} from '../../common/call-status';
import {ProductWrapper} from '../../common/product-wrapper';
import {CatalogueService} from '../../catalogue/catalogue.service';
import {RequestForQuotation} from '../../catalogue/model/publish/request-for-quotation';
import {RequestForQuotationLine} from '../../catalogue/model/publish/request-for-quotation-line';
import {DigitalAgreement} from '../../catalogue/model/publish/digital-agreement';
import {Quotation} from '../../catalogue/model/publish/quotation';
import {BPEService} from '../bpe.service';
import {CookieService} from 'ng2-cookies';
import {DocumentService} from '../bp-view/document-service';
import {Clause} from '../../catalogue/model/publish/clause';
import {NegotiationModelWrapper} from '../bp-view/negotiation/negotiation-model-wrapper';
import {NegotiationRequestItemComponent} from '../bp-view/negotiation/negotiation-request-item.component';
import {SupplierParty} from '../../catalogue/model/publish/supplier-party';
import {CustomerParty} from '../../catalogue/model/publish/customer-party';
import {Order} from '../../catalogue/model/publish/order';
import {Party} from '../../catalogue/model/publish/party';
import {TradingPreferences} from '../../catalogue/model/publish/trading-preferences';
import {CommonTerms} from '../../common/common-terms';
import {ShoppingCartSummaryModalComponent} from './shopping-cart-summary-modal.component';
import {FEDERATIONID} from '../../catalogue/model/constants';
import {FormGroup} from '@angular/forms';
/**
 * Created by suat on 11-Oct-19.
 */
@Component({
    selector: 'shopping-cart',
    templateUrl: './shopping-cart.component.html',
    styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit {
    shoppingCart: Catalogue;
    // keeps the user selections for each cart item
    modifiedCatalogueLines: Map<number, CatalogueLine> = new Map<number, CatalogueLine>();
    // wrappers wrapping each cart item
    productWrappers: Map<number, ProductWrapper> = new Map<number, ProductWrapper>();
    // wrappers for the negotiation request item components
    negotiationModelWrappers: Map<number, NegotiationModelWrapper> = new Map<number, NegotiationModelWrapper>();
    // associated products map of catalogue lines referred from the cart items
    associatedProducts: Map<number, CatalogueLine[]> = new Map<number, CatalogueLine[]>();
    // company settings for each distinct company providing one or more product in the cart
    sellersSettings: Map<string, CompanySettings> = new Map<string, CompanySettings>();
    // default settings to be used in case the seller does not have default terms and conditions
    platformTermsAndConditions: Map<number, Clause[]> = new Map<number, Clause[]>();
    buyerCompanySettings: CompanySettings;
    // whether the buyer company has its own T&Cs
    doesBuyerCompanyHasItsOwnTerms:boolean = true;
    // rfqs created for the products in the shopping cart
    // a dedicated rfq is created for each seller in the cart
    // key of the map below keeps the seller id
    rfqs: Map<string, RequestForQuotation> = new Map<string, RequestForQuotation>();
    // frame contracts for the products in cart
    frameContracts: Map<number, [DigitalAgreement, Quotation]> = new Map<number, [DigitalAgreement, Quotation]>();
    // following map stores the catalogue lines (their hjids) for each rfq
    // key of the map is the identifier of rfq
    // value of the map is the list of catalogue line hjids included in the corresponding rfq
    rfqCatalogueLineMap:Map<string,number[]> = new Map<string, number[]>();

    shoppingCartForm: FormGroup = new FormGroup({});
    collapsedStatusesOfCartItems: Map<number, boolean> = new Map<number, boolean>();
    deleteCallStatuses: Map<number, CallStatus> = new Map<number, CallStatus>();
    showCommonTerms = true;

    // call status to be able to show a single loading icon
    initCallStatus: CallStatus = new CallStatus();
    startBpCallStatus: CallStatus = new CallStatus();

    getProductName = selectPreferredValues;
    getPartyId = UBLModelUtils.getPartyId;
    getLinePartyId = UBLModelUtils.getLinePartyId;

    @ViewChild(ShoppingCartSummaryModalComponent)
    private shoppingCartSummaryModal: ShoppingCartSummaryModalComponent;

    @ViewChildren(NegotiationRequestItemComponent) negotiationRequestItemComponents: QueryList<NegotiationRequestItemComponent>;

    constructor(private shoppingCartDataService: ShoppingCartDataService,
                private catalogueService: CatalogueService,
                private bpeService: BPEService,
                private documentService: DocumentService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                private router: Router) {}

    /*
    init methods
     */

    ngOnInit() {
        // first get the cart catalogue
        this.shoppingCartDataService.getShoppingCart().then(cart => {
            if (cart == null || cart.catalogueLine.length === 0) {
                return;
            }

            this.shoppingCart = cart;
            // for each product in the cart get the settings of the corresponding companies
            let settingsPromises: Promise<CompanySettings>[] = [];
            let distinctCompanies: Set<string> = new Set<string>();
            for (let cartLine of this.shoppingCart.catalogueLine) {
                let partyId: string = UBLModelUtils.getPartyId(cartLine.goodsItem.item.manufacturerParty);
                if (!distinctCompanies.has(partyId)) {
                    settingsPromises.push(this.userService.getSettingsForParty(partyId,cartLine.goodsItem.item.manufacturerParty.federationInstanceID));
                    distinctCompanies.add(partyId);
                }
            }

            // prepare the promises
            // settings for all sellers
            let aggregatedSettingsPromise: Promise<void | CompanySettings[]> = Promise.all(settingsPromises).catch(err => {
                return this.initCallStatus.aggregatedError('Failed to retrieve company settings', err);
            });
            // buyer terms promises
            let buyersSettingsPromise: Promise<void | CompanySettings> = this.userService.getSettingsForParty(this.cookieService.get('company_id')).catch(err => {
                return this.initCallStatus.aggregatedError('Failed to retrieve buyer terms', err);
            });

            // submit all promises at once so that each of them would run in parallel
            let rootPromiseArray: Promise<any>[] = [aggregatedSettingsPromise, buyersSettingsPromise];
            this.initCallStatus.aggregatedSubmit(rootPromiseArray.length);
            Promise.all(rootPromiseArray)
                .then(([sellerSettingsResults, buyersSettings]) => {

                    // initialize the buyer and seller(s) company settings
                    this.initializeCompanySettings(sellerSettingsResults, buyersSettings);

                    // retrive rfqs
                    this.initCallStatus.aggregatedSubmit();
                    Promise.all(this.createRfqPromises()).then(rfqs => {
                        // initialize rfqs
                        this.initializeRfqs(rfqs);
                        // first, retrieve the associated products referred from the properties of cart lines
                        // then, select the first alternatives for each product
                        this.getAssociatedProductDetailsAndSelectFirstAlternatives();
                        // get frame contracts
                        this.getFrameContracts();
                        // get platform default terms and conditions for each cart line
                        this.getDefaultPlatformTermsAndConditionsForAllCartLines();

                        this.initCallStatus.aggregatedCallBack();
                    }).catch(err => {
                        this.initCallStatus.aggregatedError('Failed to construct request for quotation documents', err);
                    });

                    this.initCallStatus.aggregatedCallBack(null, true, rootPromiseArray.length);
            });

            // initialize the collapsed statuses, the first product is open
            let lines: CatalogueLine[] = this.shoppingCart.catalogueLine;
            if (lines.length > 0) {
                for (let i = 0; i < lines.length; i++) {
                    this.collapsedStatusesOfCartItems.set(lines[i].hjid, i === 0 ? true : false);
                    this.deleteCallStatuses.set(lines[i].hjid, new CallStatus());
                }
            }
        })
    }

    private initializeCompanySettings(sellerSettings: CompanySettings[], buyerSettings: CompanySettings): void {
        // set the current user's company's settings
        this.buyerCompanySettings = buyerSettings;

        // populate company settings
        for (let companySettings of sellerSettings) {
            this.sellersSettings.set(companySettings.companyID, companySettings);
        }
    }

    private getAssociatedProductDetailsAndSelectFirstAlternatives(): void {
        // We retrieve the associated product details if editing is active.
        let associatedProductIds: number[] = [];

        // aggregate identifiers of all associated products
        for (let cartLine of this.shoppingCart.catalogueLine) {
            for (let itemProperty of cartLine.goodsItem.item.additionalItemProperty) {
                if (itemProperty.associatedCatalogueLineID.length > 0) {
                    associatedProductIds = associatedProductIds.concat(itemProperty.associatedCatalogueLineID);
                }
            }
        }

        // eliminate duplicate ids
        associatedProductIds = associatedProductIds.filter((productId, i) => associatedProductIds.indexOf(productId) === i);

        // retrieve the associated products
        this.initCallStatus.aggregatedSubmit();
        this.catalogueService.getCatalogueLinesByHjids(associatedProductIds).then(associatedProductsResults => {
            // associated product for easy access
            let associatedProducts: Map<number, CatalogueLine> = new Map<number, CatalogueLine>();
            for (let associatedProduct of associatedProductsResults) {
                associatedProducts.set(associatedProduct.hjid, associatedProduct);
            }

            // construct associated products list for each cart item
            for (let cartLine of this.shoppingCart.catalogueLine) {
                let ids: number[] = this.getAssociatedProductIdsForOneProduct(cartLine);
                let lines: CatalogueLine[] = [];
                for (let id of ids) {
                    lines.push(associatedProducts.get(id));
                }
                this.associatedProducts.set(cartLine.hjid, lines);

                // set the default preferences for each product
                let itemWithDefaultSelections: Item = copy(cartLine.goodsItem.item);
                this.bpDataService.selectFirstValuesAmongAlternatives(itemWithDefaultSelections, lines);
                let copyLine: CatalogueLine = copy(cartLine);
                copyLine.goodsItem.item = itemWithDefaultSelections;
                this.modifiedCatalogueLines.set(cartLine.hjid, copyLine);
            }

            this.initCallStatus.aggregatedCallBack();

        }).catch(err => {
            return this.initCallStatus.aggregatedError('Failed to retrieve associated products', err);
        });
    }

    private createRfqPromises(): Promise<RequestForQuotation>[] {
        // aggregate cart lines according to the seller
        let sellerProducts: Map<string, CatalogueLine[]> = new Map<string, CatalogueLine[]>();
        for (let cartLine of this.shoppingCart.catalogueLine) {
            let partyId: string = UBLModelUtils.getLinePartyId(cartLine);
            if (!sellerProducts.has(partyId)) {
                sellerProducts.set(partyId, []);
            }
            sellerProducts.get(partyId).push(cartLine);
        }

        // create on rfq for each seller
        let rfqPromises: Promise<RequestForQuotation>[] = [];
        for (let sellerId of Array.from(sellerProducts.keys())) {
            rfqPromises.push(this.bpDataService.initRfq(sellerProducts.get(sellerId)));
        }
        return rfqPromises;
    }

    private initializeRfqs(rfqs: RequestForQuotation[]): void {
        for (let rfq of rfqs) {
            let sellerId: string = UBLModelUtils.getPartyId(rfq.requestForQuotationLine[0].lineItem.item.manufacturerParty);
            this.rfqs.set(sellerId, rfq);
        }
        // populate rfqCatalogueLineMap
        let catalogueLineCopies:CatalogueLine[] = copy(this.shoppingCart.catalogueLine);
        for(let rfq of rfqs){
            let catalogueLineHjids:number[] = [];
            let size = rfq.requestForQuotationLine.length;
            for(let i = 0; i < size; i++){
                let rfqLine = rfq.requestForQuotationLine[i];
                let catalogueLine = catalogueLineCopies.find(catalogueLine => catalogueLine.goodsItem.item.manufacturersItemIdentification.id == rfqLine.lineItem.item.manufacturersItemIdentification.id &&
                                                                                        catalogueLine.goodsItem.item.catalogueDocumentReference.id == rfqLine.lineItem.item.catalogueDocumentReference.id);
                catalogueLineCopies.splice(catalogueLineCopies.indexOf(catalogueLine),1);

                catalogueLineHjids.push(catalogueLine.hjid);
            }
            this.rfqCatalogueLineMap.set(rfq.id,catalogueLineHjids);
        }
    }

    // retrieve frame contracts first and then, set product wrappers and negotiation model wrappers which need frame contracts to be initialized properly
    private getFrameContracts(): void {
        // create frame contract promises
        let frameContractPromises: Promise<any>[] = [];
        for (let cartLine of this.shoppingCart.catalogueLine) {
            frameContractPromises.push(this.bpeService.getFrameContract(
                UBLModelUtils.getPartyId(cartLine.goodsItem.item.manufacturerParty),
                this.cookieService.get('company_id'),
                [cartLine.id],
                FEDERATIONID(),
                cartLine.goodsItem.item.manufacturerParty.federationInstanceID));
        }
        this.initCallStatus.aggregatedSubmit();
        Promise.all(frameContractPromises).then(frameContractsForProducts => {
            // create quotation promises
            let quotationPromises: Promise<any>[] = [];
            for (let frameContracts of frameContractsForProducts) {
                if (frameContracts != null) {
                    quotationPromises.push(this.documentService.getCachedDocument(frameContracts[0].quotationReference.id,frameContracts[0].item.manufacturerParty.federationInstanceID));
                }
                else{
                    quotationPromises.push(Promise.resolve(null));
                }
            }

            this.initCallStatus.aggregatedSubmit();
            Promise.all(quotationPromises).then(quotations => {
                let size = quotations.length;
                for(let i = 0;i<size;i++){
                    let quotation = quotations[i];
                    if(quotation){
                        // set frame contract
                        this.frameContracts.set(this.shoppingCart.catalogueLine[i].hjid, [frameContractsForProducts[i][0],quotation ]);
                    }
                }
                // set product wrappers and negotiation model wrappers
                this.initializeModelWrappers();

                this.initCallStatus.aggregatedCallBack();
            }).catch(error => {
                this.initCallStatus.aggregatedError('Failed to retrieve frame contract quotation', error);
            });

            this.initCallStatus.aggregatedCallBack();
        }).catch(error => {
            this.initCallStatus.aggregatedError('Failed to retrieve frame contract', error);
        });
    }

    private getDefaultPlatformTermsAndConditionsForAllCartLines(): void {
        let firstProduct: CatalogueLine = this.shoppingCart.catalogueLine[0];
        let sellerId: string = UBLModelUtils.getLinePartyId(firstProduct);

        this.initCallStatus.aggregatedSubmit();
        this.bpeService.getTermsAndConditions(
            this.cookieService.get('company_id'),
            FEDERATIONID(),
            sellerId,
            firstProduct.goodsItem.deliveryTerms.incoterms,
            this.sellersSettings.get(sellerId).negotiationSettings.paymentTerms[0],
            firstProduct.goodsItem.item.manufacturerParty.federationInstanceID

        ).then(termsAndConditions => {
            // adapt the terms and conditions for the other products by updating the terms including
            // incoterm and payment terms
            for (let i = 0; i < this.shoppingCart.catalogueLine.length; i++) {
                sellerId = UBLModelUtils.getLinePartyId(this.shoppingCart.catalogueLine[i]);
                // get default T&Cs for the products whose seller does not have specific T&Cs
                if (this.sellersSettings.get(sellerId).negotiationSettings.company.salesTerms == null || this.sellersSettings.get(sellerId).negotiationSettings.company.salesTerms.termOrCondition.length == 0) {
                    let copyTCs: Clause[] = copy(termsAndConditions);
                    for (let clause of copyTCs) {
                        for (let tradingTerm of clause.tradingTerms) {
                            if (tradingTerm.id.includes('incoterms_id')) {
                                tradingTerm.value.valueCode[0].value = this.shoppingCart.catalogueLine[i].goodsItem.deliveryTerms.incoterms;
                            } else if (tradingTerm.id.includes('payment_id')) {
                                tradingTerm.value.valueCode[0].value = this.sellersSettings.get(sellerId).negotiationSettings.paymentTerms[0];
                            }
                        }
                    }
                    this.platformTermsAndConditions.set(this.shoppingCart.catalogueLine[i].hjid, copyTCs);
                }
            }

            // Check buyers terms and conditions also. Buyer terms are used in the common terms component as initial default values
            if (this.buyerCompanySettings.negotiationSettings.company.salesTerms == null || this.buyerCompanySettings.negotiationSettings.company.salesTerms.termOrCondition.length == 0) {
                // the buyer company uses the default T&Cs of the platform
                this.doesBuyerCompanyHasItsOwnTerms = false;
                let copyTCs: Clause[] = copy(termsAndConditions);
                for (let clause of copyTCs) {
                    for (let tradingTerm of clause.tradingTerms) {
                        if (tradingTerm.id.includes('incoterms_id')) {
                            tradingTerm.value.valueCode[0].value = this.buyerCompanySettings.negotiationSettings.incoterms[0];
                        } else if (tradingTerm.id.includes('payment_id')) {
                            tradingTerm.value.valueCode[0].value = this.buyerCompanySettings.negotiationSettings.paymentTerms[0];
                        }
                    }
                }
                this.buyerCompanySettings.negotiationSettings.company.salesTerms = new TradingPreferences(copyTCs);
            }

            this.initCallStatus.aggregatedCallBack();
        }).catch(err => {
            this.initCallStatus.aggregatedError('Failed to retrieve platform settings', err);
        });
    }

    private initializeModelWrappers(): void {
        for (let i = 0; i < this.shoppingCart.catalogueLine.length; i++) {
            let cartLine: CatalogueLine = this.shoppingCart.catalogueLine[i];
            let lineHjid: number = cartLine.hjid;

            // initialize product wrapper
            let sellerId: string = UBLModelUtils.getLinePartyId(cartLine);
            let productWrapper: ProductWrapper = new ProductWrapper(cartLine, this.sellersSettings.get(sellerId).negotiationSettings);
            this.productWrappers.set(lineHjid, productWrapper);
            // find the index of rfq line relating to this catalogue line
            let rfq:RequestForQuotation = this.rfqs.get(sellerId);
            let index = this.rfqCatalogueLineMap.get(rfq.id).indexOf(lineHjid);
            // initialize negotiation model wrapper
            let negotiationModelWrapper = new NegotiationModelWrapper(
                cartLine,
                rfq,
                null,
                this.frameContracts.has(lineHjid) ? this.frameContracts.get(lineHjid)[1] : null,
                null,
                this.sellersSettings.get(sellerId).negotiationSettings,
                index);
            this.negotiationModelWrappers.set(lineHjid, negotiationModelWrapper)
        }
    }

    /**
     * getters for the template
     */

    getPriceString(cartLine: CatalogueLine): string {
        let priceWrapper: ItemPriceWrapper = new ItemPriceWrapper(cartLine.requiredItemLocationQuantity.price);
        return priceWrapper.pricePerItemString;
    }

    getRfq(cartLine: CatalogueLine): RequestForQuotation {
        let sellerId: string = UBLModelUtils.getPartyId(cartLine.goodsItem.item.manufacturerParty);
        return this.rfqs.get(sellerId);
    }

    /**
     * event handlers
     */

    onOrderQuantityChange(): void {
        // nothing for now
    }

    onApplyTerms(commonTerms:CommonTerms): void {
        if(commonTerms){
            for(let negotiationRequestItem of this.negotiationRequestItemComponents.toArray()){
                let negotiationModelWrapper = negotiationRequestItem.wrapper;
                negotiationModelWrapper.rfqIncoterms = commonTerms.incoTerm;
                negotiationModelWrapper.rfqPaymentMeans = commonTerms.paymentMean;
                negotiationModelWrapper.rfqPaymentTerms.paymentTerm = commonTerms.paymentTerm;
                negotiationModelWrapper.rfqWarranty = copy(commonTerms.warrantyPeriod);
                negotiationModelWrapper.rfqDeliveryAddress = copy(commonTerms.deliveryAddress);
                negotiationModelWrapper.rfqDataMonitoringRequested = commonTerms.dataMonitoringRequested;
                negotiationModelWrapper.rfqTradingTerms = copy(commonTerms.tradingTerms);

                if(!negotiationRequestItem.isDeliveryDateSectionOpen){
                    negotiationModelWrapper.rfqDeliveryPeriod = copy(commonTerms.deliveryPeriod);
                }

                if(commonTerms.clauses.length > 0){
                    // if T&Cs are the default ones of the platform, we need to keep the first clause and replace the rest,
                    // otherwise it's ok to replace all of them.
                    if(commonTerms.areDefaultTermsAndConditions){
                        negotiationModelWrapper.rfq.requestForQuotationLine[negotiationModelWrapper.lineIndex].lineItem.clause = [negotiationModelWrapper.rfq.requestForQuotationLine[negotiationModelWrapper.lineIndex].lineItem.clause[0]].concat(copy(commonTerms.clauses));
                    }
                    else{
                        negotiationModelWrapper.rfq.requestForQuotationLine[negotiationModelWrapper.lineIndex].lineItem.clause = copy(commonTerms.clauses);
                    }
                }

                negotiationRequestItem.onFrameContractDurationChanged(copy(commonTerms.frameContractDuration))
            }
        }
    }

    onNavigateToTheSearchPage(): void {
        this.router.navigate(['simple-search']);
    }

    // remove the given catalogue line from the shopping cart
    // moreover, update this.rfqs array accordingly
    onRemoveFromCart(cartLine: CatalogueLine): void {
        if(confirm('Are you sure that you want to remove this product from the shopping cart?')){
            let callStatus: CallStatus = this.deleteCallStatuses.get(cartLine.hjid);
            callStatus.submit();
            // get seller id
            let sellerId: string = UBLModelUtils.getLinePartyId(cartLine);
            this.shoppingCartDataService.removeItemsFromCart([cartLine.hjid]).then(cartCatalogue => {
                this.shoppingCart = cartCatalogue;
                // get rfq for the seller
                let rfq: RequestForQuotation = this.rfqs.get(sellerId);
                // if rfq only contains this line, delete rfq as well
                if(rfq.requestForQuotationLine.length == 1){
                    this.rfqs.delete(sellerId);
                }
                // otherwise, remove the rfq line created for this product
                else{
                    // get catalogue lines included in this rfq
                    let cartLineHjids:number[] = this.rfqCatalogueLineMap.get(rfq.id);

                    // remove catalogue line from the rfq
                    let index = cartLineHjids.indexOf(cartLine.hjid);
                    rfq.requestForQuotationLine.splice(index,1);
                    // we should also remove the line from the immutable rfq as it causes line index mismatch
                    // between the normal rfq and immutable rfq. the immutable rfq is copied in all the negotiation model wrappers
                    // for the lines of the same company
                    for (let i = 0 ; i < cartLineHjids.length; i++) {
                        this.negotiationModelWrappers.get(cartLineHjids[i]).initialImmutableRfq.requestForQuotationLine.splice(index, 1);
                    }

                    // remove catalogue line for rfqCatalogueLineMap map
                    cartLineHjids.splice(index,1);
                    this.rfqCatalogueLineMap.set(rfq.id,cartLineHjids);

                    // when one product is removed from the rfq, indexes in negotiationModelWrappers should be updated
                    let sizeOfCartLines = cartLineHjids.length;
                    for(let i = 0 ; i < sizeOfCartLines ;i++){
                        this.negotiationModelWrappers.get(cartLineHjids[i]).lineIndex = i;
                    }
                    // remove line from negotiationModelWrappers as well
                    this.negotiationModelWrappers.delete(cartLine.hjid);
                }

                // update the status in the next iteration as the button status is not updated upon deleting a product from the basket
                setTimeout(() => {
                    callStatus.callback(null, true);
                    this.deleteCallStatuses.delete(cartLine.hjid);
                })
            }).catch(error => {
                callStatus.error('Failed to delete product from the shopping cart');
            })
        }
    }

    /**
     * Checked conditions are:
     * 1) whether the cart line has a price or not
     * 2) whether a term is being negotiated
     * 3) whether the negotiation is the last entry in the seller's business workflow
     */
    areNegotiationConditionsSatisfied(cartLine: CatalogueLine): boolean {
        if (this.negotiationRequestItemComponents) {
            for (let component of this.negotiationRequestItemComponents.toArray()) {
                if (component.wrapper.catalogueLine.hjid === cartLine.hjid) {
                    let sellerId: string = UBLModelUtils.getLinePartyId(cartLine);
                    return !component.wrapper.lineDiscountPriceWrapper.itemPrice.hasPrice() ||
                    component.isNegotiatingAnyTerm() ||
                    this.bpDataService.isFinalProcessInTheWorkflow('Negotiation', this.sellersSettings.get(sellerId));
                }
            }
        }
        return false;
    }

    onSingleLineNegotiation(cartLine: CatalogueLine): void {
        if (confirm('Are you sure that you want to send this request now ?')){
            let callStatus: CallStatus = this.deleteCallStatuses.get(cartLine.hjid);
            callStatus.submit();
            let sellerId: string = UBLModelUtils.getLinePartyId(cartLine);
            // reset BP data
            this.bpDataService.resetBpData();

            // final check on the rfq
            const rfq: RequestForQuotation = copy(this.rfqs.get(sellerId));
            // in the final rfq, there should be a single rfq line relating to selected catalogue line
            // find this rfq line and remove the rest
            let index = this.negotiationModelWrappers.get(cartLine.hjid).lineIndex;
            rfq.requestForQuotationLine = [rfq.requestForQuotationLine[index]];
            // replace properties of rfq line with the selected ones
            rfq.requestForQuotationLine[0].lineItem.item.additionalItemProperty = this.modifiedCatalogueLines.get(cartLine.hjid).goodsItem.item.additionalItemProperty;

            callStatus.submit();
            Promise.all([
                this.userService.getParty(this.cookieService.get('company_id')),
                this.userService.getParty(sellerId,cartLine.goodsItem.item.manufacturerParty.federationInstanceID),

            ]).then(([buyerPartyResp, sellerPartyResp]) => {
                rfq.buyerCustomerParty = new CustomerParty(buyerPartyResp);
                rfq.sellerSupplierParty = new SupplierParty(sellerPartyResp);

                // start a request for quotation or order created using the rfq we have
                let document:RequestForQuotation | Order = this.areNegotiationConditionsSatisfied(cartLine) ? rfq: this.createOrderWithRfq(rfq,[cartLine.hjid]);

                return this.bpeService.startProcessWithDocument(document,document.sellerSupplierParty.party.federationInstanceID);
            }).then(() => {
                // started the negotiation for the product successfully,so remove it from the shopping cart
                this.shoppingCartDataService.removeItemsFromCart([cartLine.hjid]);
                callStatus.callback(null, true);
                this.router.navigate(['dashboard'], {queryParams: {tab: 'PURCHASES'}});

            }).catch(error => {
                callStatus.error('Failed to start process', error);
            });
        }
    }

    openShoppingCartSummary(){
        this.shoppingCartSummaryModal.open();
    }

    getFederationIds(){
        let fedIds = [];
        for (let sellersSettingsKey of Array.from(this.sellersSettings.keys())) {
            fedIds.push(this.sellersSettings.get(sellersSettingsKey).negotiationSettings.company.federationInstanceID)
        }
        return fedIds;
    }

    // starts Negotiation/Order for the products included in the shopping basket
    onMultipleLineNegotiation():void{
        if(confirm('Are you sure that you want to send requests for all products now ?')){
            // identifier of the buyer company
            let companyId = this.cookieService.get('company_id');
            // this array contains the identifiers of buyer and seller companies
            let partyIds = Array.from(this.sellersSettings.keys()).concat(companyId);
            let federationIds = this.getFederationIds();

            this.startBpCallStatus.submit();
            // reset BP data
            this.bpDataService.resetBpData();

            // get parties
            this.userService.getParties(partyIds,federationIds).then(parties => {
                // create party id-party map
                let partyMap:Map<string,Party> = this.createPartyMap(parties);
                let promises: Promise<any>[] = [];
                // for each rfq, start a Negotiation or Order
                this.rfqs.forEach(rfq => {
                    let copyRfq = copy(rfq);
                    let sellerId: string = null;
                    // if negotiation conditions are satisfied for at least one product included in the rfq, create a Request For Quotation
                    // otherwise, create an Order
                    let areNegotiationConditionsSatisfiedForAtLeastOneProduct:boolean = false;
                    // we need line hjids to retrieve correct NegotiationModelWrapper which is necessary to calculate the price for Order
                    let lineHjids:number[] = [];
                    // replace properties of rfq lines with the selected ones
                    for(let copyRfqLine of copyRfq.requestForQuotationLine){
                        let catalogueLine = this.getCatalogueLine(copyRfqLine);

                        // set seller id
                        if(!sellerId){
                            sellerId = UBLModelUtils.getLinePartyId(catalogueLine);
                        }
                        // push line hjid to the list
                        lineHjids.push(catalogueLine.hjid);
                        // replace item properties
                        copyRfqLine.lineItem.item.additionalItemProperty = this.modifiedCatalogueLines.get(catalogueLine.hjid).goodsItem.item.additionalItemProperty;

                        if(!areNegotiationConditionsSatisfiedForAtLeastOneProduct){
                            let areNegotiationConditionsSatisfied = this.areNegotiationConditionsSatisfied(catalogueLine);
                            if(areNegotiationConditionsSatisfied){
                                areNegotiationConditionsSatisfiedForAtLeastOneProduct = true;
                            }
                        }
                    }
                    // set buyer and seller parties
                    copyRfq.buyerCustomerParty = new CustomerParty(partyMap.get(companyId));
                    copyRfq.sellerSupplierParty = new SupplierParty(partyMap.get(sellerId));

                    // start a request for quotation or order created using the rfq we have
                    let document:RequestForQuotation | Order = areNegotiationConditionsSatisfiedForAtLeastOneProduct ? copyRfq: this.createOrderWithRfq(copyRfq,lineHjids);
                    promises.push(this.bpeService.startProcessWithDocument(document,document.sellerSupplierParty.party.federationInstanceID));
                });
                Promise.all(promises).then(response => {
                    // started the negotiation for all products successfully,so remove them from the shopping cart
                    let hjids:number[] = [];
                    for (let cartLine of this.shoppingCart.catalogueLine) {
                        hjids.push(cartLine.hjid);
                    }
                    this.shoppingCartDataService.removeItemsFromCart(hjids);
                    this.startBpCallStatus.callback(null, true);
                    this.router.navigate(['dashboard'], {queryParams: {tab: 'PURCHASES'}});
                }).catch(error => {
                    this.startBpCallStatus.error('Failed to start processes', error);
                });
            }).catch(error => {
                this.startBpCallStatus.error('Failed to get details of seller parties', error);
            })
        }

    }

    /**
     * Internal logic
     */
    private getAssociatedProductIdsForOneProduct(cartItem: CatalogueLine): number[] {
        let associatedProductIds: number[] = [];
        for (let itemProperty of cartItem.goodsItem.item.additionalItemProperty) {
            if (itemProperty.associatedCatalogueLineID.length > 0) {
                associatedProductIds = associatedProductIds.concat(itemProperty.associatedCatalogueLineID);
            }
        }

        // eliminate duplicate ids
        associatedProductIds = associatedProductIds.filter((productId, i) => associatedProductIds.indexOf(productId) === i);
        return associatedProductIds;
    }

    private createOrderWithRfq(rfq:RequestForQuotation,catHjids:number[]):Order{
        let order = UBLModelUtils.createOrderWithRfqCopy(rfq);

        // final check on the order
        let totalPrice:number = 0;
        for(let catHjid of catHjids){
            let negotiationModelWrapper:NegotiationModelWrapper = this.negotiationModelWrappers.get(catHjid);
            totalPrice += negotiationModelWrapper.rfqDiscountPriceWrapper.totalPrice;
        }

        order.anticipatedMonetaryTotal.payableAmount.value = totalPrice;
        order.anticipatedMonetaryTotal.payableAmount.currencyID = this.negotiationModelWrappers.get(catHjids[0]).currency;

        // initialize the seller and buyer parties.
        order.buyerCustomerParty = rfq.buyerCustomerParty;
        order.sellerSupplierParty = rfq.sellerSupplierParty;

        return order;
    }

    // for the given parties, this method creates party id - party map
    private createPartyMap(parties:Party[]):Map<string,Party>{
        let partyMap:Map<string,Party> = new Map<string, Party>();
        for(let party of parties){
            partyMap.set(party.partyIdentification[0].id,party);
        }
        return partyMap;
    }

    private getCatalogueLine(rfqLine:RequestForQuotationLine):CatalogueLine{
        for(let catalogueLine of this.shoppingCart.catalogueLine){
            if(rfqLine.lineItem.item.manufacturersItemIdentification.id == catalogueLine.goodsItem.item.manufacturersItemIdentification.id &&
                rfqLine.lineItem.item.catalogueDocumentReference.id == catalogueLine.goodsItem.item.catalogueDocumentReference.id){
                return catalogueLine;
            }
        }
    }

    getNegotiationModelWrappers(){
        return Array.from(this.negotiationModelWrappers.values());
    }
}
