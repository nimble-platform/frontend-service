import {Catalogue} from '../../catalogue/model/publish/catalogue';
import {Router} from '@angular/router';
import {Component, OnInit} from '@angular/core';
import {ShoppingCartDataService} from './shopping-cart-data-service';
import {copy, selectDescription, selectName} from '../../common/utils';
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
    itemsWithSelectedProperties: Map<number, Item> = new Map<number, Item>();
    // wrappers wrapping each cart item
    productWrappers: Map<number, ProductWrapper> = new Map<number, ProductWrapper>();
    // associated products map of catalogue lines referred from the cart items
    associatedProducts: Map<number, CatalogueLine[]> = new Map<number, CatalogueLine[]>();
    // company settings for each distinct company providing one or more product in the cart
    companiesSettings: Map<string, CompanySettings> = new Map<string, CompanySettings>();

    companySettingsCallStatus: CallStatus = new CallStatus();
    associatedProductsCallStatus: CallStatus = new CallStatus();
    // call status to be able to show a single loading icon
    initCallStatus: CallStatus = new CallStatus();

    selectName = selectName;
    selectDescription = selectDescription;
    getPartyId = UBLModelUtils.getPartyId;

    constructor(private shoppingCartDataService: ShoppingCartDataService,
                private catalogueService: CatalogueService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private router: Router) {}

    /*
    init methods
     */

    ngOnInit() {
        // first get the cart catalogue
        this.shoppingCartDataService.getShoppingCart().then(cart => {
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

            this.companySettingsCallStatus.submit();
            let aggregatedSettingsPromise: Promise<void | CompanySettings[]> = Promise.all(settingsPromises).catch(err => {
                return this.companySettingsCallStatus.error('Failed to retrieve company settings', err);
            });
            let associatedProductsPromise: Promise<void | CatalogueLine[]> = this.retrieveAssociatedProductDetails().catch(err => {
                return this.associatedProductsCallStatus.error('Failed to retrieve associated products', err);
            });
            this.initCallStatus.submit();
            Promise.all([aggregatedSettingsPromise, associatedProductsPromise]).then(([settingsResults, associatedProductsResults]) => {
                console.log("in all results");
                console.log(settingsResults);
                console.log(associatedProductsResults);

                if (!associatedProductsResults || !settingsResults) {
                    return;
                }

                // populate company settings
                for (let companySettings of settingsResults) {
                    this.companiesSettings.set(companySettings.companyID, companySettings);
                }

                // associated product for easy access
                let associatedProducts: Map<number, CatalogueLine> = new Map<number, CatalogueLine>();
                for (let associatedProduct of associatedProductsResults) {
                    associatedProducts.set(associatedProduct.hjid, associatedProduct);
                }

                for (let cartLine of this.shoppingCart.catalogueLine) {
                    // construct associated products list for each cart item
                    let ids: number[] = this.getAssociatedProductIdsForOneProduct(cartLine);
                    let lines: CatalogueLine[] = [];
                    for (let id of ids) {
                        lines.push(associatedProducts.get(id));
                    }
                    this.associatedProducts.set(cartLine.hjid, lines);

                    // product wrappers for each cart item
                    let companyId: string = UBLModelUtils.getPartyId(cartLine.goodsItem.item.manufacturerParty);
                    let productWrapper: ProductWrapper = new ProductWrapper(cartLine, this.companiesSettings.get(companyId).negotiationSettings);
                    this.productWrappers.set(cartLine.hjid, productWrapper);

                    // set the default preferences for each product
                    let itemWithDefaultSelections: Item = copy(cartLine.goodsItem.item);
                    this.bpDataService.selectFirstValuesAmongAlternatives(itemWithDefaultSelections, lines);
                    this.itemsWithSelectedProperties.set(cartLine.hjid, itemWithDefaultSelections);
                }

                this.associatedProductsCallStatus.callback(null, true);
                this.companySettingsCallStatus.callback(null, true);
                this.initCallStatus.callback(null, true);
            });
        })
    }

    retrieveAssociatedProductDetails(): Promise<CatalogueLine[]> {
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
        return this.catalogueService.getCatalogueLinesByHjids(associatedProductIds);
    }

    /**
     * getters for the template
     */

    getPriceString(cartLine: CatalogueLine): string {
        let priceWrapper: ItemPriceWrapper = new ItemPriceWrapper(cartLine.requiredItemLocationQuantity.price);
        return priceWrapper.pricePerItemString;
    }

    /**
     * event handlers
     */

    onOrderQuantityKeyPressed(event: any): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    onOrderQuantityChange(): void {
        // nothing for now
    }

    onNavigateToTheSearchPage(): void {
        this.router.navigate(['simple-search']);
    }

    onRemoveFromCart(cartLineHjid: number): void {
        this.shoppingCartDataService.removeItemFromCart(cartLineHjid).then(cartCatalogue => {
            this.shoppingCart = cartCatalogue;
        }).catch(error => {
            console.log('Failed to delete product from the shopping cart');
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
