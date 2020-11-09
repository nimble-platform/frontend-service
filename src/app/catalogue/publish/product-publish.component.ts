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

import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as lunr from "lunr";
import { PublishService } from "../publish-and-aip.service";
import { PublishMode } from "../model/publish/publish-mode";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { ItemProperty } from "../model/publish/item-property";
import { FormGroup } from "@angular/forms";
import { UBLModelUtils } from "../model/ubl-model-utils";
import { CallStatus } from "../../common/call-status";
import {isValidPrice, selectNameFromLabelObject} from '../../common/utils';
import { Quantity } from "../model/publish/quantity";
import { CategoryService } from "../category/category.service";
import { CatalogueService } from "../catalogue.service";
import { UserService } from "../../user-mgmt/user.service";
import { Router, Params, ActivatedRoute } from "@angular/router";
import { CookieService } from "ng2-cookies";
import { Category } from "../model/category/category";
import { BinaryObject } from "../model/publish/binary-object";
import { Code } from "../model/publish/code";
import {
    getPropertyKey,
    sortCategories,
    sortProperties,
    sanitizeDataTypeName,
    sanitizePropertyName,
    copy,
    isCustomProperty,
    getPropertyValuesAsStrings,
    selectPreferredName, selectName, createText, getPropertyValues, removeHjids
} from '../../common/utils';
import { Property } from "../model/category/property";
import { ProductWrapper } from "../../common/product-wrapper";
import { EditPropertyModalComponent } from "./edit-property-modal.component";
import { Location } from "@angular/common";
import { SelectedProperty } from "../model/publish/selected-property";
import { CompanyNegotiationSettings } from "../../user-mgmt/model/company-negotiation-settings";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import 'rxjs/add/observable/fromPromise'
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/takeUntil';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../model/constants';
import * as myGlobals from '../../globals';
import { CataloguePaginationResponse } from '../model/publish/catalogue-pagination-response';


type ProductType = "product" | "transportation";
import { Text } from "../model/publish/text";
import { Catalogue } from '../model/publish/catalogue';
import { MultiValuedDimension } from '../model/publish/multi-valued-dimension';
import { UnitService } from '../../common/unit-service';
import { Item } from '../model/publish/item';
import { TransportationService } from '../model/publish/transportation-service';
import { CommodityClassification } from '../model/publish/commodity-classification';
import { DocumentReference } from '../model/publish/document-reference';
import { Attachment } from '../model/publish/attachment';
import { Address } from '../model/publish/address';
import { Country } from '../model/publish/country';
import { ValidationService } from '../../common/validation/validators';
import { AppComponent } from "../../app.component";
import { TranslateService } from "@ngx-translate/core";
import {PublishingPropertyService} from './publishing-property.service';

interface SelectedProperties {
    [key: string]: SelectedProperty;
}

interface SelectedPropertiesUpdate {
    [key: string]: boolean
}

interface CategoryProperties {
    [categoryCode: string]: Property[]
}

@Component({
    selector: "product-publish",
    templateUrl: "./product-publish.component.html",
    styleUrls: ["./product-publish.component.css"]
})
export class ProductPublishComponent implements OnInit {

    /*
     * Values common to Single and Bulk
     * (I do this to split this component up after...)
     */

    publishMode: PublishMode;
    publishStatus: CallStatus = new CallStatus();
    publishingGranularity: "single" | "bulk" = "single";
    productCategoryRetrievalStatus: CallStatus = new CallStatus();
    productCatalogueRetrievalStatus: CallStatus = new CallStatus();
    ngUnsubscribe: Subject<void> = new Subject<void>();
    productType: ProductType;

    /*
     * Values for Single only
     */

    catalogueLine: CatalogueLine = null;
    productWrapper: ProductWrapper = null;
    companyNegotiationSettings: CompanyNegotiationSettings;
    private selectedProperties: SelectedProperties = {};
    private categoryProperties: CategoryProperties = {};
    private lunrIndex: lunr.Index;
    private currentLunrSearchId: string;
    private selectedPropertiesUpdates: SelectedPropertiesUpdate = {};
    selectedProperty: ItemProperty;
    categoryModalPropertyKeyword: string = "";
    // Flag indicating that the source page is the search page.
    // This is passed true when the user has searched products associated to a property
    searchRef = false;
    // form model to be provided as root model to the inner components used in publishing
    publishForm: FormGroup = new FormGroup({});
    valid = true;
    erroneousPaths: string[];

    @ViewChild(EditPropertyModalComponent)
    private editPropertyModal: EditPropertyModalComponent;
    customProperties: any[] = [];
    cataloguesIds: any[] = [];
    catalogueUUids: any = [];
    // uuid of the catalogue containing the product to be published / edited
    selectedCatalogueuuid = "";
    // id of the catalogue containing the product to be published / edited
    selectedCatalogueId: string = "default";
    callStatus: CallStatus = new CallStatus();

    /*
     * Other Values
     */

    @ViewChild('propertyValueType') propertyValueType: ElementRef;

    // placeholder for the custom property
    private newProperty: ItemProperty = UBLModelUtils.createAdditionalItemProperty(null, null);

    submitted = false;
    callback = false;
    error_detc = false;
    // check whether product id conflict exists or not
    sameIdError = false;
    // the value of the erroneousID
    erroneousID = "";

    config = myGlobals.config;

    json = JSON;

    // used to add a new property which has a unit
    private quantity = new Quantity(null, null);

    // check whether dialogBox is necessary or not during navigation
    public static dialogBox = true;
    // check whether changing publish-mode to 'create' is necessary or not
    changePublishModeCreate: boolean = false;
    // whether we need to show dimensions or not
    showDimensions = false;
    // whether we need to show additional information or not
    showAdditionalInformation = false;
    // dimensions of the item
    multiValuedDimensions: MultiValuedDimension[] = null;
    // dimensions retrieved from the unit service
    dimensions: string[] = [];
    // dimensions' units retrieved from the unit service
    dimensionLengthUnits: string[] = [];
    dimensionWeightUnits: string[] = [];
    selectedTabSinglePublish: "DETAILS" | "DELIVERY_TRADING" | "PRICE" | "CERTIFICATES" | "LCPA" = "DETAILS";

    invalidCategoryCodes: Code[] = [];

    private translations: any;

    constructor(public categoryService: CategoryService,
        private catalogueService: CatalogueService,
        public publishStateService: PublishService,
        private userService: UserService,
        private validationService: ValidationService,
        public publishingPropertyService: PublishingPropertyService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private cookieService: CookieService,
        private unitService: UnitService,
        private modalService: NgbModal,
        private appComponent: AppComponent,
        private translate: TranslateService) {
    }

    ngOnInit() {
        this.appComponent.translate.get(['Successfully saved. You can now continue.', 'Successfully saved. You are now getting redirected.']).takeUntil(this.ngUnsubscribe).subscribe((res: any) => {
            this.translations = res;
        });
        ProductPublishComponent.dialogBox = true;
        // TODO: asych calls like below should have proper chain.
        // E.g. the below line is expected to be called upon a change in the query params.
        this.getCatagloueIdsForParty();
        const userId = this.cookieService.get("user_id");
        this.callStatus.submit();

        this.route.queryParams.subscribe((params: Params) => {
            // read the query parameters
            // handle publishing granularity: single, bulk, null
            this.publishingGranularity = params['pg'];
            if (this.publishingGranularity == null) {
                this.publishingGranularity = 'single';
            }
            let catalogueId = params['cat'];
            if (catalogueId != null) {
                this.selectedCatalogueId = catalogueId;
            }
            // searchRef is true if the searchRef parameter is set
            this.searchRef = !!params['searchRef'];


            // fetch various information required for initialization
            this.userService.getUserParty(userId).then(party => {
                return Promise.all([
                    Promise.resolve(party),
                    this.catalogueService.getCatalogueResponse(userId, null, null, 0, 0,  null, this.selectedCatalogueId),
                    this.userService.getCompanyNegotiationSettingsForParty(UBLModelUtils.getPartyId(party), party.federationInstanceID),
                    this.unitService.getCachedUnitList("dimensions"),
                    this.unitService.getCachedUnitList("length_quantity"),
                    this.unitService.getCachedUnitList("weight_quantity"),
                ])
            }).then(([party, catalogueResponse, settings, dimensions, lengthQuantities,weightQuantities]) => {
                // set dimensions and units lists
                this.dimensions = dimensions;
                this.dimensionLengthUnits = lengthQuantities;
                this.dimensionWeightUnits = weightQuantities;
                this.selectedCatalogueuuid = catalogueResponse.catalogueUuid;
                this.initView(party, catalogueResponse, settings);
                this.publishStateService.publishingStarted = true;
                this.callStatus.callback("Successfully initialized.", true);
            })
                .catch(error => {
                    this.callStatus.error("Error while initializing the publish view.", error);
                });
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    selectPreferredName(cp: Category | Property) {
        return selectPreferredName(cp);
    }

    changeCat() {
        let index = this.cataloguesIds.indexOf(this.selectedCatalogueId);
        // update selected catalogue uuid
        this.selectedCatalogueuuid = this.catalogueUUids[index];
    }

    /*
     * Event Handlers
     */

    onSelectTab(event: any, id: any) {
        event.preventDefault();
        if (id === "singleUpload") {
            this.publishingGranularity = "single";
        } else {
            this.publishingGranularity = "bulk";
        }
    }

    onSelectTabSinglePublish(event: any, id: any) {
        event.preventDefault();
        this.selectedTabSinglePublish = id;
    }

    /**
     * deselect a category
     * 1) remove the property from additional item properties
     * 2) remove the category from the selected categories
     * 3) remove the corresponding commodity classification from the item
     */
    onRemoveCategory(category: Category) {
        let index = this.categoryService.selectedCategories.findIndex(c => c.id === category.id);
        if (index > -1) {
            this.catalogueLine.goodsItem.item.additionalItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.filter(function(el) {
                return el.itemClassificationCode.value !== category.id;
            });

            this.categoryService.selectedCategories.splice(index, 1);
            this.recomputeSelectedProperties();
        }

        let i = this.catalogueLine.goodsItem.item.commodityClassification.findIndex(c => c.itemClassificationCode.value === category.id);
        if (i > -1) {
            this.catalogueLine.goodsItem.item.commodityClassification.splice(i, 1);
        }
    }

    onAddCategory(event?: Event, dismissModal?: any): void {
        if (event) {
            event.preventDefault();
        }
        if (dismissModal) {
            dismissModal("add category");
        }
        ProductPublishComponent.dialogBox = false;
        this.router.navigate(['catalogue/categorysearch'], { queryParams: { pageRef: "publish", pg: this.publishingGranularity, productType: this.productType } });
    }

    onAddCustomProperty(event: Event, dismissModal: any) {
        event.preventDefault();
        dismissModal("add property")
        const property = UBLModelUtils.createAdditionalItemProperty(null, null);
        //this.catalogueLine.goodsItem.item.additionalItemProperty.push(property);
        this.editPropertyModal.open(property, null, this.catalogueLine.goodsItem.item.additionalItemProperty);
    }

    onRemoveProperty(property: ItemProperty) {
        const properties = this.catalogueLine.goodsItem.item.additionalItemProperty;
        if (isCustomProperty(property)) {
            const index = properties.indexOf(property);
            if (index >= 0) {
                properties.splice(index, 1);
            }
        } else {
            const key = getPropertyKey(property);
            this.catalogueLine.goodsItem.item.additionalItemProperty = properties.filter(prop => {
                return key !== getPropertyKey(prop);
            })
        }
    }

    onBack() {
        this.location.back();
    }

    onPublish(exitThePage: boolean) {

        if (this.catalogueLine.requiredItemLocationQuantity.price.priceAmount.value != null) {
            if (!isValidPrice(this.catalogueLine.requiredItemLocationQuantity.price.priceAmount.value)) {
                alert("Price cannot have more than 2 decimal places");
                return false;
            }
        }

        if (this.publishStateService.publishMode === "create" || this.publishStateService.publishMode === "copy") {
            // publish new product
            this.publishProduct(exitThePage);
        } else {
            // remove unused properties from catalogueLine
            const splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
            // nullify the transportation service details if a regular product is being published
            this.checkProductNature(splicedCatalogueLine);

            // update existing product
            this.saveEditedProduct(exitThePage, [splicedCatalogueLine]);
        }

    }

    isLoading(): boolean {
        return (this.publishStatus.fb_submitted || this.isProductCategoriesLoading());
    }

    isProductCategoriesLoading(): boolean {
        return this.productCategoryRetrievalStatus.fb_submitted;
    }

    hasSelectedProperties(): boolean {
        return this.catalogueLine.goodsItem.item.additionalItemProperty.length > 0;
    }

    isCustomProperty(property: ItemProperty): boolean {
        return isCustomProperty(property);
    }

    getCategoryProperties(category: Category): Property[] {
        const code = category.code;
        if (!this.categoryProperties[code]) {
            this.categoryProperties[code] = sortProperties([...category.properties]);
        }
        return this.categoryProperties[code];
    }

    /**
     * This method handles the required properties for the selected categories.
     * It adds the required properties as additional item properties if they do not exist in the catalogue line.
     * */
    handleRequiredProperties(){
        // traverse the selected categories to find out the mandatory properties
        for(let category of this.categoryService.selectedCategories){
            for(let property of category.properties){
                if(property.required){
                    // if the catalogue line does not include the required property, add it
                    let additionalItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.find(selectedProperty => selectedProperty.id === property.id);
                    if(!additionalItemProperty){
                        additionalItemProperty = UBLModelUtils.createAdditionalItemProperty(property, category);
                        this.catalogueLine.goodsItem.item.additionalItemProperty.push(additionalItemProperty);
                    }
                    // mark this property as required
                    additionalItemProperty.required = true;
                    // if the item property has the predefined options, continue with the next property
                    if(additionalItemProperty.options && additionalItemProperty.options.length > 0){
                        continue;
                    }
                    // get property details
                    this.publishingPropertyService.getCachedProperty(property.uri).then(indexedProperty => {
                        // retrieve options
                        this.publishingPropertyService.getCachedPropertyCodeList(indexedProperty.codeListId).then(codeListResult => {
                            // populate options for the property
                            additionalItemProperty.options = [];
                            for (let result of codeListResult.result) {
                                let label = selectNameFromLabelObject(result.label);
                                additionalItemProperty.options.push(new Text(label));
                            }
                            // if no value is specified for the item property, use the first option
                            if(additionalItemProperty.value.length == 0 || !additionalItemProperty.value[0].value){
                                additionalItemProperty.value = [copy(additionalItemProperty.options[0])];
                            }
                        });
                    });
                }
            }
        }
    }
    isCategoryPropertySelected(category: Category, property: Property): boolean {
        const key = getPropertyKey(property);
        const selectedProp = this.selectedProperties[key];
        return selectedProp.selected;
    }

    selectAllProperties(category: Category, event?: Event): any {
        if (event) {
            event.preventDefault();
        }
        var properties = this.getCategoryProperties(category);
        for (let property of properties) {
            if (!this.isCategoryPropertySelected(category, property))
                this.onToggleCategoryPropertySelected(category, property);
        }
    }

    selectNoProperties(category: Category, event?: Event): any {
        if (event) {
            event.preventDefault();
        }
        var properties = this.getCategoryProperties(category);
        for (let property of properties) {
            if (this.isCategoryPropertySelected(category, property))
                this.onToggleCategoryPropertySelected(category, property);
        }
    }

    getPropertyType(property: Property): string {
        return sanitizeDataTypeName(property.dataType);
    }

    addItemNameDescription() {
        let newItemName: Text = new Text("", DEFAULT_LANGUAGE());
        let newItemDescription: Text = new Text("", DEFAULT_LANGUAGE());
        this.catalogueLine.goodsItem.item.name.push(newItemName);
        this.catalogueLine.goodsItem.item.description.push(newItemDescription);
    }

    private recomputeSelectedProperties() {
        const oldSelectedProps = this.selectedProperties;
        this.selectedProperties = {};
        const newSelectedProps = this.selectedProperties;

        for (const category of this.categoryService.selectedCategories) {
            if (category.properties) {
                for (const property of category.properties) {
                    const key = getPropertyKey(property);
                    if (!this.selectedProperties[key]) {
                        const oldProp = oldSelectedProps[key];
                        this.selectedProperties[key] = {
                            categories: [],
                            properties: [],
                            lunrSearchId: null,
                            key,
                            selected: oldProp && oldProp.selected,
                            preferredName: property.preferredName,
                            shortName: property.shortName
                        };
                    }

                    const newProp = this.selectedProperties[key];
                    newProp.properties.push(property);
                    newProp.categories.push(category);
                }
            }
        }

        this.lunrIndex = lunr(function() {
            this.field("preferredName");
            this.field("shortName");
            this.ref("key");

            Object.keys(newSelectedProps).forEach(key => {
                this.add(newSelectedProps[key]);
            })
        });

    }

    toggleDimensionCard() {
        this.showDimensions = !this.showDimensions;
    }

    toggleAdditionalInformationCard() {
        this.showAdditionalInformation = !this.showAdditionalInformation;
    }

    onAddDimension(attributeId: string) {
        this.productWrapper.addDimension(attributeId);
        // update dimensions
        this.multiValuedDimensions = this.productWrapper.getDimensionMultiValue();
    }

    onRemoveDimension(attributeId: string, quantity: Quantity) {
        this.productWrapper.removeDimension(attributeId, quantity);
        // update dimensions
        this.multiValuedDimensions = this.productWrapper.getDimensionMultiValue();
    }

    getProductProperties(): ItemProperty[] {
        return this.productWrapper.getAllUniqueProperties();
    }

    getPrettyName(property: ItemProperty): string {
        return sanitizePropertyName(selectName(property));
    }

    getValuesAsString(property: ItemProperty): string[] {
        return getPropertyValuesAsStrings(property);
    }

    private languages: Array<string> = LANGUAGES;
    onAddValue(property: ItemProperty) {
        switch (property.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER":
                property.valueDecimal.push(0);
                break;
            case "QUANTITY":
                property.valueQuantity.push(new Quantity(0, ""));
                break;
            case "STRING":
                property.value.push(createText(''));
                break;
            default:
            // BINARY and BOOLEAN: nothing
        }
    }

    onRemoveValue(property: ItemProperty, index: number) {
        switch (property.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER":
                property.valueDecimal.splice(index, 1);
                break;
            case "QUANTITY":
                property.valueQuantity.splice(index, 1);
                break;
            case "STRING":
                property.value.splice(index, 1);
                break;
            default:
            // BINARY and BOOLEAN: nothing
        }
    }

    addEmptyValuesToProperty(property: ItemProperty) {
        if (property.value.length === 0) {
            if (property.valueQualifier == "BOOLEAN") {
                property.value.push(createText('false'));
            } else {
                property.value.push(createText(''));
            }
        }
        if (property.valueDecimal.length === 0) {
            property.valueDecimal.push(0);
        }
        if (property.valueQuantity.length === 0) {
            property.valueQuantity.push(new Quantity());
        }
    }

    getDefinition(property: ItemProperty): string {
        const key = getPropertyKey(property);
        let selProp = this.selectedProperties[key];
        if (!selProp) {
            return "No definition."
        }
        for (const prop of selProp.properties) {
            if (prop.definition && prop.definition !== "") {
                return prop.definition;
            }
        }
        return "No definition."
    }

    getValues(property: ItemProperty): any[] {
        let values = getPropertyValues(property);
        this.addEmptyValuesToProperty(property);
        return values;
    }

    setValue(property: ItemProperty, i: number, event: any) {
        property.value[i].value = event.target.value;
    }

    setBooleanValue(property: ItemProperty, i: number, event: any) {
        if (event.target.checked)
            property.value[i].value = "true";
        else
            property.value[i].value = "false";
    }

    setValueDecimal(property: ItemProperty, i: number, event: any) {
        property.valueDecimal[i] = event.target.value;
    }

    onEditProperty(property: ItemProperty) {
        const key = getPropertyKey(property);
        this.editPropertyModal.open(property, this.selectedProperties[key], null);
    }

    showCategoriesModal(categoriesModal: any, event: Event) {
        event.preventDefault();
        this.categoryModalPropertyKeyword = "";
        this.modalService.open(categoriesModal).result.then(() => {
            let properties = this.catalogueLine.goodsItem.item.additionalItemProperty;

            Object.keys(this.selectedPropertiesUpdates).forEach(key => {
                const selected = this.selectedPropertiesUpdates[key];
                const property = this.selectedProperties[key];

                if (selected) {
                    // add property if not there
                    for (let i = 0; i < property.properties.length; i++) {
                        const prop = property.properties[i];
                        const category = property.categories[i];

                        properties.push(UBLModelUtils.createAdditionalItemProperty(prop, category));
                    }
                } else {
                    // remove property if there
                    properties = properties.filter(value => {
                        const propKey = getPropertyKey(value);
                        return propKey !== key;
                    });
                    this.catalogueLine.goodsItem.item.additionalItemProperty = properties;
                }
            });
            this.selectedPropertiesUpdates = {};
        }, () => {
            this.selectedPropertiesUpdates = {};
        });
    }

    onToggleCategoryPropertySelected(category: Category, property: Property) {
        const key = getPropertyKey(property);
        const selectedProp = this.selectedProperties[key];
        selectedProp.selected = !selectedProp.selected;
        this.selectedPropertiesUpdates[key] = selectedProp.selected;
    }

    onFilterPropertiesInCategoryModal() {
        this.currentLunrSearchId = UBLModelUtils.generateUUID();
        this.lunrIndex.search("*" + this.categoryModalPropertyKeyword + "*").forEach(result => {
            this.selectedProperties[result.ref].lunrSearchId = this.currentLunrSearchId;
        });
    }

    isPropertyFilteredIn(property: Property) {
        if (this.categoryModalPropertyKeyword === "") {
            return true;
        }

        const key = getPropertyKey(property);
        return this.selectedProperties[key].lunrSearchId === this.currentLunrSearchId;
    }

    /*
     * Other Stuff
     */

    canDeactivate(): boolean | Promise<boolean>{
        if (this.changePublishModeCreate) {
            this.publishStateService.publishMode = 'create';
            this.publishStateService.publishingStarted = false;
        }
        if (ProductPublishComponent.dialogBox) {
            return this.appComponent.confirmModalComponent.open('You will lose any changes you made, are you sure you want to quit ?').then(result => {
                if(result){
                    this.publishStateService.publishMode = 'create';
                    this.publishStateService.publishingStarted = false;
                }
                return result;
            });
        } else{
            ProductPublishComponent.dialogBox = true;
            return true;
        }
    }

    private initView(userParty, catalogueResponse: CataloguePaginationResponse, settings): void {
        this.companyNegotiationSettings = settings;
        this.catalogueService.setEditMode(true);
        this.publishStateService.resetData();
        // Following "if" block is executed when redirected by an "edit" button
        // "else" block is executed when redirected by "publish" tab
        this.publishMode = this.publishStateService.publishMode;

        if (this.publishMode == 'edit' || this.publishMode == 'copy') {
            if (this.publishMode == 'copy') {
                // clear the ids
                this.catalogueService.draftCatalogueLine.id = null;
                this.catalogueService.draftCatalogueLine.goodsItem.id = null;
                this.catalogueService.draftCatalogueLine.goodsItem.item.manufacturersItemIdentification.id = null;
                this.catalogueService.draftCatalogueLine = removeHjids(this.catalogueService.draftCatalogueLine);
            }
            this.catalogueLine = this.catalogueService.draftCatalogueLine;
            if (this.catalogueLine == null) {
                this.publishStateService.publishMode = 'create';
                this.router.navigate(['catalogue/publish']);
                return;
            }

            this.productWrapper = new ProductWrapper(this.catalogueLine, settings);

            // Get categories of item to edit
            if (this.publishStateService.publishingStarted == false) {
                let classificationCodes: Code[] = [];
                for (let classification of this.catalogueLine.goodsItem.item.commodityClassification) {
                    classificationCodes.push(classification.itemClassificationCode);
                }

                if (classificationCodes.length > 0) {
                    // remove default category
                    classificationCodes = classificationCodes.filter(function(cat) {
                        return cat.listID != 'Default';
                    });

                    // get non-custom categories
                    classificationCodes = classificationCodes.filter(function(cat) {
                        return cat.listID != 'Custom';
                    });

                    // temporarily store publishing started variable as it will be used inside the following callback
                    this.productCategoryRetrievalStatus.submit();
                    Observable.fromPromise(this.categoryService.getCategoriesByIds(classificationCodes))
                        .takeUntil(this.ngUnsubscribe)
                        .catch(err => {
                            this.productCategoryRetrievalStatus.error('Failed to get product categories')
                            return Observable.throw(err);
                        })
                        .subscribe((categories: Category[]) => {
                            // upon navigating from the catalogue view, classification codes are set as selected categories
                            for (let category of categories) {
                                this.categoryService.selectedCategories.push(category);
                            }
                            sortCategories(this.categoryService.selectedCategories);

                            if (this.categoryService.selectedCategories != []) {
                                for (let category of this.categoryService.selectedCategories) {
                                    let newCategory = this.isNewCategory(category);
                                    if (newCategory) {
                                        this.updateItemWithNewCategory(category);
                                    }
                                }
                            }

                            this.recomputeSelectedProperties();
                            // handle required properties
                            this.handleRequiredProperties();

                            // populate invalidCategoryCodes array
                            let validCategoryUris = categories.map(category => category.categoryUri);
                            this.invalidCategoryCodes = classificationCodes.filter(classificationCode => validCategoryUris.indexOf(classificationCode.uri) == -1)

                            this.productCategoryRetrievalStatus.callback('Retrieved product categories', true);
                        });
                }

            } else {
                for (let category of this.categoryService.selectedCategories) {
                    let newCategory = this.isNewCategory(category);
                    if (newCategory) {
                        this.updateItemWithNewCategory(category);
                    }
                }
            }

        } else {
            // new publishing is the first entry to the publishing page
            // i.e. publishing from scratch
            if (this.publishStateService.publishingStarted == false) {
                this.catalogueLine = UBLModelUtils.createCatalogueLine(catalogueResponse.catalogueUuid, userParty, settings, this.dimensions);
                this.catalogueService.draftCatalogueLine = this.catalogueLine;
            } else {
                this.catalogueLine = this.catalogueService.draftCatalogueLine;
            }
            if (this.catalogueLine) {
                if (this.catalogueLine.goodsItem.item.name.length == 0)
                    this.addItemNameDescription();
                this.productWrapper = new ProductWrapper(this.catalogueLine, settings);
                for (let category of this.categoryService.selectedCategories) {
                    let newCategory = this.isNewCategory(category);
                    if (newCategory) {
                        this.updateItemWithNewCategory(category);
                    }
                }
            }
        }

        // check the search page reference to update the property values with the selected products
        this.checkSearchReference();

        // call this function with dimension unit list to be sure that item will have some dimension
        this.multiValuedDimensions = this.productWrapper.getDimensionMultiValue(true, this.dimensions);
        this.recomputeSelectedProperties();
        // handle required properties
        this.handleRequiredProperties();
    }

    private removeInvalidCategories() {
        let invalidCategoryIds: string[] = this.invalidCategoryCodes.map(code => code.uri);
        let invalidCommodityClassifications: CommodityClassification[] = this.catalogueLine.goodsItem.item.commodityClassification.filter(commodityClassification => invalidCategoryIds.indexOf(commodityClassification.itemClassificationCode.uri) != -1);

        for (let invalidCommodityClassification of invalidCommodityClassifications) {
            let index = this.catalogueLine.goodsItem.item.commodityClassification.indexOf(invalidCommodityClassification);
            this.catalogueLine.goodsItem.item.commodityClassification.splice(index, 1);
        }
        // reset invalidCategoryCodes array
        this.invalidCategoryCodes = [];
    }

    private checkSearchReference(): void {
        // check whether the user is navigated from the search page
        if (this.searchRef) {
            // set the selected products as associated products of the property
            // setTimeout is needed as we want to wait init method to complete
            setTimeout(() => {
                let targetItemProperty: ItemProperty = this.publishStateService.itemPropertyLinkedToOtherProducts;
                targetItemProperty.valueQualifier = 'STRING';
                targetItemProperty.value = [];
                for (let associatedProduct of this.publishStateService.selectedProductsInSearch) {
                    targetItemProperty.associatedCatalogueLineID.push(associatedProduct.hjid);
                    for (let lang of Object.keys(associatedProduct.label)) {
                        targetItemProperty.value.push(new Text(associatedProduct.label[lang], lang));
                    }
                }
                this.editPropertyModal.open(targetItemProperty, null, this.catalogueLine.goodsItem.item.additionalItemProperty);
            });
        }
    }

    private updateItemWithNewCategory(category: Category): void {
        this.catalogueLine.goodsItem.item.commodityClassification.push(UBLModelUtils.createCommodityClassification(category));
    }

    // should be called on publish new product
    private publishProduct(exitThePage: boolean): void {

        // remove unused properties from catalogueLine
        let splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
        // nullify the transportation service details if a regular product is being published
        this.checkProductNature(splicedCatalogueLine);

        this.publish([splicedCatalogueLine], exitThePage);
    }

    private publish(catalogueLines: CatalogueLine[], exitThePage: boolean) {
        this.publishStatus.submit();
        if (this.catalogueService.catalogueResponse.catalogueUuid == null) {
            const userId = this.cookieService.get("user_id");
            this.userService.getUserParty(userId).then(userParty => {
                // create the catalogue
                let catalogue: Catalogue = new Catalogue("default", null, userParty, "", "", []);
                // add catalogue lines to the end of catalogue
                for (let catalogueLine of catalogueLines) {
                    catalogue.catalogueLine.push(catalogueLine);
                }

                this.catalogueService.postCatalogue(catalogue)
                    .then(() => this.onSuccessfulPublish(exitThePage, catalogueLines))
                    .catch(err => {
                        this.onFailedPublish(err);
                    })
            }).catch(err => {
                this.onFailedPublish(err);
            });

        } else {
            // this.catalogueService.getCatalogueFromId(catalogueId).then((catalogue) => {
            // TODO: create a service to add multiple catalogue lines
            for (let catalogueLine of catalogueLines) {
                catalogueLine.goodsItem.item.catalogueDocumentReference.id = this.selectedCatalogueuuid;
                this.catalogueService.addCatalogueLine(this.selectedCatalogueuuid, JSON.stringify(catalogueLine))
                    .then(() => {
                        this.onSuccessfulPublish(exitThePage, [catalogueLine]);
                    })
                    .catch(err => this.onFailedPublish(err))
            }
            // })
            // .catch(err=> {
            //     this.onFailedPublish(err)
            // })

        }
    }

    // Should be called on save
    private saveEditedProduct(exitThePage: boolean, catalogueLines: CatalogueLine[]): void {
        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        this.publishStatus.submit();
        // this.getCatalogueUUid().then((catalogue) => {
        // TODO: create a service to update multiple catalogue lines
        for (let catalogueLine of catalogueLines) {
            this.catalogueService.updateCatalogueLine(this.selectedCatalogueuuid, JSON.stringify(catalogueLine))
                .then(() => this.onSuccessfulPublish(exitThePage, [catalogueLine]))
                .then(() => this.changePublishModeToCreate())
                .catch(err => {
                    this.onFailedPublish(err);
                });
        }

        // }).catch((err) => {
        //     this.onFailedPublish(err);
        // })

    }

    // changes publishMode to create
    private changePublishModeToCreate(): void {
        this.changePublishModeCreate = true;
    }

    private checkProductNature(catalogueLine: CatalogueLine) {
        if (this.publishStateService.publishedProductNature == 'Regular product') {
            catalogueLine.goodsItem.item.transportationServiceDetails = null;
        }
    }

    // Removes empty properties from catalogueLines about to be sent
    private removeEmptyProperties(catalogueLine: CatalogueLine): CatalogueLine {

        // Make deep copy of catalogue line so we can remove empty fields without disturbing UI model
        // This is required because there is no redirect after publish action
        let catalogueLineCopy: CatalogueLine = copy(catalogueLine);

        if (catalogueLineCopy.goodsItem.item.lifeCyclePerformanceAssessmentDetails != null) {
            if (!UBLModelUtils.isFilledLCPAInput(catalogueLineCopy.goodsItem.item.lifeCyclePerformanceAssessmentDetails)) {
                catalogueLineCopy.goodsItem.item.lifeCyclePerformanceAssessmentDetails.lcpainput = null;
            }
            if (!UBLModelUtils.isFilledLCPAOutput(catalogueLineCopy.goodsItem.item.lifeCyclePerformanceAssessmentDetails)) {
                catalogueLineCopy.goodsItem.item.lifeCyclePerformanceAssessmentDetails.lcpaoutput = null;
            }
        }

        // splice out properties that are unfilled
        let properties: ItemProperty[] = catalogueLineCopy.goodsItem.item.additionalItemProperty;
        let propertiesToBeSpliced: ItemProperty[] = [];
        for (let property of properties) {
            let valueQualifier: string = property.valueQualifier.toLocaleLowerCase();
            if (valueQualifier == "int" ||
                valueQualifier == "double" ||
                valueQualifier == "number") {
                property.valueDecimal = property.valueDecimal.filter(function(el) {
                    return (el != null && el.toString() != "");
                });
                if (property.valueDecimal.length == 0 || property.valueDecimal[0] == undefined) {
                    propertiesToBeSpliced.push(property);
                }

            } else if (valueQualifier == "file") {
                if (property.valueBinary.length == 0) {
                    propertiesToBeSpliced.push(property);
                }

            } else if (valueQualifier.toLowerCase() == 'quantity') {
                if (property.valueQuantity.length == 0 || !property.valueQuantity[0].value) {
                    propertiesToBeSpliced.push(property);
                }

            } else {
                if (property.value.length == 0 || property.value[0].value == '') {
                    propertiesToBeSpliced.push(property);
                }
            }
        }

        for (let property of propertiesToBeSpliced) {
            properties.splice(properties.indexOf(property), 1);
        }

        return catalogueLineCopy;
    }

    // catalogueLineId is the id of catalogue line created or edited
    private onSuccessfulPublish(exitThePage: boolean, catalogueLines: CatalogueLine[]): void {

        let catalogueLineIds: string[] = catalogueLines.map(catalogueLine => catalogueLine.id);

        let userId = this.cookieService.get("user_id");
        this.userService.getUserParty(userId).then(party => {
            // get catalogue id-uuid pairs for the party to find the uuid of catalogue
            this.catalogueService.getCatalogueIdsUUidsForParty().then(catalogueIdsUuids => {
                // get the uuid of catalogue
                let uuid = null;
                for (let idUuid of catalogueIdsUuids) {
                    if (idUuid[0] == this.selectedCatalogueId) {
                        uuid = idUuid[1];
                        break;
                    }
                }

                // update the id of selected catalogue
                this.selectedCatalogueuuid = uuid;

                this.catalogueService.getCatalogueLines(this.selectedCatalogueuuid, catalogueLineIds).then(catalogueLines => {
                    // go to the dashboard - catalogue tab
                    if (exitThePage) {
                        this.catalogueLine = UBLModelUtils.createCatalogueLine(this.selectedCatalogueuuid,
                            party, this.companyNegotiationSettings, this.dimensions);

                        // since every changes is saved,we do not need a dialog box
                        ProductPublishComponent.dialogBox = false;
                        // avoid category duplication
                        this.categoryService.resetSelectedCategories();
                        this.publishStateService.resetData();
                        alert(this.translations["Successfully saved. You are now getting redirected."]);
                        this.router.navigate(['dashboard'], {
                            queryParams: {
                                tab: "CATALOGUE",
                            }
                        });
                    }
                    // stay in this page and allow the user to edit his product/service
                    else {
                        // since there is only one catalogue line
                        this.catalogueLine = catalogueLines[0];
                        // we need to change publish mode to 'edit' since we published the product/service
                        this.publishStateService.publishMode = "edit";
                    }
                    this.catalogueService.draftCatalogueLine = this.catalogueLine;

                    this.publishStatus.callback(this.translations["Successfully saved. You can now continue."], false);

                    this.submitted = false;
                    this.callback = true;
                    this.error_detc = false;
                }).
                    catch(error => {
                        this.publishStatus.error("Error while publishing product", error);
                    });
            })
                .catch(error => {
                    this.publishStatus.error("Error while publishing product", error);
                });
        })
            .catch(error => {
                this.publishStatus.error("Error while publishing product", error);
            });
    }

    private onFailedPublish(err): void {
        this.publishStatus.error(err._body ? err._body : err);
        this.submitted = false;
        this.error_detc = true;
        if (err.status == 406) {
            this.sameIdError = true;
            this.erroneousID = this.catalogueLine.id;
        }
        else {
            this.sameIdError = false;
        }
    }


    private onValueTypeChange(event: any) {
        if (event.target.value == "Text") {
            this.newProperty.valueQualifier = "STRING";
        } else if (event.target.value == "Number") {
            this.newProperty.valueQualifier = "NUMBER";
        } else if (event.target.value == "Image" || event.target.value == "File") {
            this.newProperty.valueQualifier = "FILE";
        } else if (event.target.value == "Quantity") {
            this.newProperty.valueQualifier = "QUANTITY";
        } else if (event.target.value == "Boolean") {
            this.newProperty.valueQualifier = "BOOLEAN";
        }
    }

    private fileChange(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let binaryObjects = this.newProperty.valueBinary;

            for (let i = 0; i < fileList.length; i++) {
                let file: File = fileList[i];
                let reader = new FileReader();

                reader.onload = function(e: any) {
                    let base64String = (reader.result as string).split(',').pop();
                    let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "", "");
                    binaryObjects.push(binaryObject);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    private addImage(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let binaryObjects = this.newProperty.valueBinary;

            for (let i = 0; i < fileList.length; i++) {
                let file: File = fileList[i];
                let reader = new FileReader();

                reader.onload = function(e: any) {
                    let base64String = (reader.result as string).split(',').pop();
                    let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "", "");
                    binaryObjects.push(binaryObject);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    /**
     * Adds the new property to the end of existing custom properties. Processes the value arrays of the property;
     * keeps only the relevant array based on the value qualifier and removes the empty values
     */
    private addCustomProperty(): void {
        if (this.newProperty.valueQualifier == "BOOLEAN") {
            let filledValues: Text[] = [];
            for (let val of this.newProperty.value) {
                if (val.value != "") {
                    filledValues.push(val);
                }
            }
            this.newProperty.value = filledValues;
            this.newProperty.valueDecimal = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [];
        }
        else if (this.newProperty.valueQualifier == "QUANTITY") {
            this.newProperty.value = [];
            this.newProperty.valueDecimal = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [this.quantity];
        }
        // remove empty/undefined values and keep only the the data array relevant to the value qualifier
        else if (this.newProperty.valueQualifier == "STRING") {
            let filledValues: Text[] = [];
            for (let val of this.newProperty.value) {
                if (val.value != "") {
                    filledValues.push(val);
                }
            }

            this.newProperty.value = filledValues;
            this.newProperty.valueDecimal = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [];

        } else if (this.newProperty.valueQualifier == "NUMBER") {
            let filledValues: number[] = [];
            for (let val of this.newProperty.valueDecimal) {
                if (val != undefined && val != null && val.toString() != "") {
                    filledValues.push(val);
                }
            }

            this.newProperty.valueDecimal = filledValues;
            this.newProperty.value = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [];

        } else if (this.newProperty.valueQualifier == "FILE") {
            this.newProperty.value = [];
            this.newProperty.valueDecimal = [];
            this.newProperty.valueQuantity = [];

        }

        // add the custom property to the end of existing custom properties
        let i = 0;
        for (i = 0; i < this.catalogueLine.goodsItem.item.additionalItemProperty.length; i++) {
            if (this.catalogueLine.goodsItem.item.additionalItemProperty[i].itemClassificationCode.listID != "Custom") {
                break;
            }
        }
        this.catalogueLine.goodsItem.item.additionalItemProperty.splice(i, 0, this.newProperty);
        this.catalogueLine.goodsItem.item.additionalItemProperty = [].concat(this.catalogueLine.goodsItem.item.additionalItemProperty);

        // reset the custom property view
        this.newProperty = UBLModelUtils.createAdditionalItemProperty(null, null);
        this.quantity = new Quantity(null, null);
        this.propertyValueType.nativeElement.selectedIndex = 0;

    }

    // Product id is not editable when publish mode is 'edit'
    isProductIdEditable(): boolean {
        return this.publishStateService.publishMode != 'edit';
    }

    /**
     * Used to establish the two-way binding on the additional values of custom properties
     */
    trackByIndex(index: any, item: any) {
        return index;
    }

    addValueToProperty() {
        if (this.newProperty.valueQualifier == 'STRING') {
            let text = createText('');
            this.newProperty.value.push(text);
        } else if (this.newProperty.valueQualifier == 'NUMBER') {
            let newNumber: number;
            this.newProperty.valueDecimal.push(newNumber);
        }
    }

    removeValueFromProperty(valueIndex: number): void {
        if (this.newProperty.valueQualifier == 'STRING') {
            this.newProperty.value.splice(valueIndex, 1)
        } else if (this.newProperty.valueQualifier == 'NUMBER') {
            this.newProperty.valueDecimal.splice(valueIndex, 1)
        }
    }

    private isNewCategory(category: Category): boolean {
        for (let commodityClassification of this.catalogueLine.goodsItem.item.commodityClassification) {
            if (category.id == commodityClassification.itemClassificationCode.value) {
                return false;
            }
        }
        return true;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

    public getCatagloueIdsForParty() {
        this.productCatalogueRetrievalStatus.submit();
        this.catalogueService.getCatalogueIdsUUidsForParty().then((catalogueIds) => {
            var idList = [];
            var uuidList = [];

            for (var obj in catalogueIds) {
                if (catalogueIds[obj][0] == this.selectedCatalogueId) {
                    this.selectedCatalogueuuid = catalogueIds[obj][1];
                }
                idList.push(catalogueIds[obj][0]);
                uuidList.push(catalogueIds[obj][1]);
            }

            this.cataloguesIds = idList;
            this.catalogueUUids = uuidList;
            this.productCatalogueRetrievalStatus.callback("Successfully loaded catalogueId list", true);
        }).catch((error) => {
            this.productCatalogueRetrievalStatus.error('Failed to get product catalogues');
        });

    }

    // used to validate inputs whose type is number
    areInputNumbersValid(): boolean {
        // get all inputs whose type is number
        let inputs = document.querySelectorAll("input[type=number]");
        let size = inputs.length;
        for (let i = 0; i < size; i++) {
            // if there are at least one input which is not valid, return false
            if (!(<HTMLInputElement>inputs[i]).validity.valid) {
                return false;
            }
        }
        // return true if all inputs are valid
        return true;
    }

    // methods to handle files for additional information
    onSelectFileForLogisticService(binaryObject: BinaryObject) {
        const document: DocumentReference = new DocumentReference();
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;
        document.documentType = "Additional Information";

        this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.push(document);
    }

    onUnSelectFileForLogisticService(binaryObject: BinaryObject) {
        const i = this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
        if (i >= 0) {
            this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.splice(i, 1);
        }
    }

    getBinaryObjectsForAdditionalInformation() {
        return this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.filter(doc => doc.documentType == "Additional Information").map(doc => doc.attachment.embeddedDocumentBinaryObject);
    }
}
