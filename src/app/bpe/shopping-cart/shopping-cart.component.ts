import {Catalogue} from '../../catalogue/model/publish/catalogue';
import {Router} from '@angular/router';
import {Component, OnInit} from '@angular/core';
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
    // rfqs created for the products in the shopping cart
    // a dedicated rfq is created for each seller in the cart
    // key of the map below keeps the seller id
    rfqs: Map<string, RequestForQuotation> = new Map<string, RequestForQuotation>();
    // frame contracts for the products in cart
    frameContracts: Map<number, [DigitalAgreement, Quotation]> = new Map<number, [DigitalAgreement, Quotation]>();

    collapsedStatusesOfCartItems: Map<number, boolean> = new Map<number, boolean>();
    deleteCallStatuses: Map<number, CallStatus> = new Map<number, CallStatus>();

    // call status to be able to show a single loading icon
    initCallStatus: CallStatus = new CallStatus();

    getProductName = selectPreferredValues;
    getPartyId = UBLModelUtils.getPartyId;

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
                    settingsPromises.push(this.userService.getSettingsForParty(partyId));
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
                        // set product wrappers and negotiation model wrappers
                        this.initializeModelWrappers();
                        // first, retrieve the associated products referred from the properties of cart lines
                        // then, select the first alternatives for each product
                        this.getAssociatedProductDetailsAndSelectFirstAlternatives();
                        // get frame contracts
                        this.getFrameContracts();
                        // get platform default terms and conditions for each cart line
                        this.getDefaultPlatformTermsAndConditionsForAllCartLines();
                        // initialize negotiation model wrappers
                        this.initializeModelWrappers();

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
            rfqPromises.push(this.bpDataService.initRfq(sellerProducts.get(sellerId), this.sellersSettings.get(sellerId).negotiationSettings));
        }
        return rfqPromises;
    }

    private initializeRfqs(rfqs: RequestForQuotation[]): void {
        for (let rfq of rfqs) {
            let sellerId: string = UBLModelUtils.getPartyId(rfq.requestForQuotationLine[0].lineItem.item.manufacturerParty);
            this.rfqs.set(sellerId, rfq);
        }
    }

    private getFrameContracts(): void {
        for (let cartLine of this.shoppingCart.catalogueLine) {
            this.initCallStatus.aggregatedSubmit();
            this.bpeService.getFrameContract(
                UBLModelUtils.getPartyId(cartLine.goodsItem.item.manufacturerParty),
                this.cookieService.get('company_id'),
                cartLine.id).then(frameContract => {

                if (frameContract != null) {
                    this.initCallStatus.aggregatedSubmit();
                    this.documentService.getCachedDocument(frameContract.quotationReference.id).then(quotation => {
                        this.frameContracts.set(cartLine.hjid, [frameContract, quotation]);

                        this.initCallStatus.aggregatedCallBack();
                    }).catch(error => {
                        this.initCallStatus.aggregatedError('Failed to retrieve frame contract quotation', error);
                    });
                }

                this.initCallStatus.aggregatedCallBack();

            }).catch(error => {
                this.initCallStatus.aggregatedError('Failed to retrieve frame contract', error);
            });
        }
    }

    private getDefaultPlatformTermsAndConditionsForAllCartLines(): void {
        let firstProduct: CatalogueLine = this.shoppingCart.catalogueLine[0];
        let sellerId: string = UBLModelUtils.getLinePartyId(firstProduct);

        this.initCallStatus.aggregatedSubmit();
        this.bpeService.getTermsAndConditions(
            null,
            this.cookieService.get('company_id'),
            sellerId,
            null,
            firstProduct.goodsItem.deliveryTerms.incoterms,
            this.sellersSettings.get(sellerId).negotiationSettings.paymentTerms[0]

        ).then(termsAndConditions => {
            // set the terms and conditions for the first cart line
            this.platformTermsAndConditions.set(this.shoppingCart.catalogueLine[0].hjid, termsAndConditions);
            // adapt the terms and conditions for the other products by updating the terms including
            // incoterm and payment terms
            for (let i = 1; i < this.shoppingCart.catalogueLine.length; i++) {
                sellerId = UBLModelUtils.getLinePartyId(this.shoppingCart.catalogueLine[i]);
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

            // initialize negotiation model wrapper
            let negotiationModelWrapper = new NegotiationModelWrapper(
                cartLine,
                this.rfqs.get(sellerId),
                null,
                this.frameContracts.has(lineHjid) ? this.frameContracts.has(lineHjid)[1] : null,
                null,
                this.sellersSettings.get(sellerId).negotiationSettings,
                i);
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

    getRfqLine(cartLine: CatalogueLine, lineIndex: number): RequestForQuotationLine {
        let sellerId: string = UBLModelUtils.getLinePartyId(cartLine);
        let rfq: RequestForQuotation = this.rfqs.get(sellerId);
        return rfq.requestForQuotationLine[lineIndex];
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

    onNavigateToTheSearchPage(): void {
        this.router.navigate(['simple-search']);
    }

    onRemoveFromCart(cartLineHjid: number): void {
        let callStatus: CallStatus = this.deleteCallStatuses.get(cartLineHjid);
        callStatus.submit();
        this.shoppingCartDataService.removeItemFromCart(cartLineHjid).then(cartCatalogue => {
            this.shoppingCart = cartCatalogue;
            callStatus.callback(null, true);
        }).catch(error => {
            callStatus.error('Failed to delete product from the shopping cart');
        })
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
}
