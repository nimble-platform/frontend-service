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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { Text } from '../model/publish/text';
import { ItemProperty } from '../model/publish/item-property';
import {
    copy, createText,
    getPropertyKey, getPropertyValues, isCustomProperty,
    isValidPrice,
    removeHjids, sanitizeDataTypeName, sanitizePropertyName, selectName,
    selectNameFromLabelObject,
    sortCategories, sortProperties, selectPreferredName
} from '../../common/utils';
import { PublishingPropertyService } from './publishing-property.service';
import {PublishMode} from '../model/publish/publish-mode';
import {CallStatus} from '../../common/call-status';
import {Observable, Subject} from 'rxjs';
import {CatalogueLine} from '../model/publish/catalogue-line';
import {ProductWrapper} from '../../common/product-wrapper';
import {CompanySettings} from '../../user-mgmt/model/company-settings';
import * as lunr from 'lunr';
import {FormGroup} from '@angular/forms';
import {EditPropertyModalComponent} from './edit-property-modal.component';
import * as myGlobals from '../../globals';
import {DEFAULT_LANGUAGE, LANGUAGES, NON_PUBLIC_FIELD_ID} from '../model/constants';
import {MultiValuedDimension} from '../model/publish/multi-valued-dimension';
import {Code} from '../model/publish/code';
import {ProductPublishStep} from './product-publish-step';
import {CategoryService} from '../category/category.service';
import {CatalogueService} from '../catalogue.service';
import {PublishService} from '../publish-and-aip.service';
import {UserService} from '../../user-mgmt/user.service';
import {ValidationService} from '../../common/validation/validators';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Location} from '@angular/common';
import {CookieService} from 'ng2-cookies';
import {UnitService} from '../../common/unit-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AppComponent} from '../../app.component';
import {UBLModelUtils} from '../model/ubl-model-utils';
import {Category} from '../../common/model/category/category';
import {Catalogue} from '../model/publish/catalogue';
import {BinaryObject} from '../model/publish/binary-object';
import {DocumentReference} from '../model/publish/document-reference';
import {Attachment} from '../model/publish/attachment';
import {Property} from '../../common/model/category/property';
import {Quantity} from '../model/publish/quantity';
import {CommodityClassification} from '../model/publish/commodity-classification';
import {SelectedProperty} from '../model/publish/selected-property';
import 'rxjs/add/observable/fromPromise'
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/takeUntil';
import {NonPublicInformation} from '../model/publish/non-public-information';
import {MultiTypeValue} from '../model/publish/multi-type-value';
import {NonPublicInformationUi} from '../model/publish/non-public-information-ui';

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
    selector: "single-publish",
    templateUrl: "./single-publish.component.html",
    styleUrls: ["./single-publish.component.css"]
})
export class SinglePublishComponent implements OnInit , OnDestroy{

    publishMode: PublishMode;
    publishStatus: CallStatus = new CallStatus();
    productCategoryRetrievalStatus: CallStatus = new CallStatus();
    productCatalogueRetrievalStatus: CallStatus = new CallStatus();
    ngUnsubscribe: Subject<void> = new Subject<void>();

    // array of non-public product properties and dimensions
    nonPublicInformationUIs: NonPublicInformationUi[] = [];
    nonPublicInformationFunctionalityEnabled = myGlobals.config.nonPublicInformationFunctionalityEnabled;
    catalogueLine: CatalogueLine = null;
    productWrapper: ProductWrapper = null;
    companySettings: CompanySettings;
    private selectedCategoryProperties: SelectedProperties = {};
    private selectedCategoryPropertiesUpdates: SelectedPropertiesUpdate = {};
    private categoryProperties: CategoryProperties = {};
    private lunrIndex: lunr.Index;
    private currentLunrSearchId: string;
    categoryModalPropertyKeyword: string = "";
    // Flag indicating that the source page is the search page.
    // This is passed true when the user has searched products associated to a property
    searchRef = false;
    // form model to be provided as root model to the inner components used in publishing
    publishForm: FormGroup = new FormGroup({});
    valid = true;

    @ViewChild(EditPropertyModalComponent)
    private editPropertyModal: EditPropertyModalComponent;
    cataloguesIds: any[] = [];
    catalogueUUids: any = [];
    // uuid of the catalogue containing the product to be published / edited
    selectedCatalogueuuid: string;
    // id of the catalogue containing the product to be published / edited
    selectedCatalogueId: string;
    callStatus: CallStatus = new CallStatus();

    /*
     * Other Values
     */

    submitted = false;
    callback = false;
    error_detc = false;
    // check whether product id conflict exists or not
    sameIdError = false;
    // the value of the erroneousID
    erroneousID = "";

    config = myGlobals.config;
    selectPreferredName = selectPreferredName;
    languages: Array<string> = LANGUAGES;

    // check whether dialogBox is necessary or not during navigation
    public static dialogBox = true;
    // check whether changing publish-mode to 'create' is necessary or not
    changePublishModeCreate: boolean = false;
    // whether we need to show dimensions or not
    showDimensions = false;
    // whether we need to show additional information or not
    showAdditionalInformation = false;
    // whether we need to show properties or not
    showProperties = false;
    // dimensions of the item
    multiValuedDimensions: MultiValuedDimension[] = null;
    // dimensions retrieved from the unit service
    dimensions: string[] = [];
    // dimensions' units retrieved from the unit service
    dimensionLengthUnits: string[] = [];
    dimensionWeightUnits: string[] = [];

    invalidCategoryCodes: Code[] = [];

    private translations: any;

    // the current step in single/bulk upload publishing
    public publishingStep:ProductPublishStep = "Category";
    // whether the categories are selected for the publishing
    public categorySelectedForPublishing:boolean = false;

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
                private appComponent: AppComponent) {
    }

    ngOnInit() {
        this.appComponent.translate.get(['Successfully saved. You can now continue.', 'Successfully saved. You are now getting redirected.']).takeUntil(this.ngUnsubscribe).subscribe((res: any) => {
            this.translations = res;
        });
        SinglePublishComponent.dialogBox = true;
        // TODO: asych calls like below should have proper chain.
        // E.g. the below line is expected to be called upon a change in the query params.
        this.getCatalogueIdsForParty();
        const userId = this.cookieService.get("user_id");
        this.route.queryParams.subscribe((params: Params) => {
            let catalogueId = params['cat'];
            if (catalogueId != null) {
                this.selectedCatalogueId = catalogueId;
            }
            // searchRef is true if the searchRef parameter is set
            this.searchRef = !!params['searchRef'];
        });
        // fetch various information required for initialization
        // first retrieve the available catalogue ids
        this.callStatus.submit();
        this.catalogueService.getCatalogueIdsUUidsForParty().then(idsUuids => {
            this.setCatalogueUuidsOnInit(idsUuids);

            // then retrieve all other data
        }).then(() => {
            this.userService.getUserParty(userId).then(party => {
                return Promise.all([
                    Promise.resolve(party),
                    this.userService.getSettingsForParty(UBLModelUtils.getPartyId(party), party.federationInstanceID),
                    this.unitService.getCachedUnitList('dimensions'),
                    this.unitService.getCachedUnitList('length_quantity'),
                    this.unitService.getCachedUnitList('weight_quantity')
                ])
            }).then(([party, settings, dimensions, lengthQuantities, weightQuantities]) => {
                // set dimensions and units lists
                this.dimensions = dimensions;
                this.dimensionLengthUnits = lengthQuantities;
                this.dimensionWeightUnits = weightQuantities;
                this.initView(party, settings);
                this.publishStateService.publishingStarted = true;
                this.callStatus.callback('Successfully initialized.', true);
            }).catch(error => {
                this.callStatus.error('Error while initializing the publish view.', error);
            });
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    canDeactivate(): boolean | Promise<boolean>{
        if (this.changePublishModeCreate) {
            this.publishStateService.resetData();
        }
        if (SinglePublishComponent.dialogBox) {
            return this.appComponent.confirmModalComponent.open('You will lose any changes you made, are you sure you want to quit ?').then(result => {
                if(result){
                    this.publishStateService.resetData();
                }
                return result;
            });
        } else{
            SinglePublishComponent.dialogBox = true;
            return true;
        }
    }

    private initView(userParty, settings): void {
        this.companySettings = settings;
        // Following "if" block is executed when redirected by an "edit" button
        // "else" block is executed when redirected by "publish" tab
        this.publishMode = this.publishStateService.publishMode;

        if (this.publishMode == 'edit' || this.publishMode == 'copy') {
            // for the products which are being edited or copied, display the 'Review' step
            this.publishingStep = 'Review';
            // each product should have some categories if they are being edited or copied
            this.categorySelectedForPublishing = true;
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
                this.router.navigate(['catalogue/publish-single']);
                return;
            }

            this.productWrapper = new ProductWrapper(this.catalogueLine, settings.negotiationSettings);

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
                            this.productCategoryRetrievalStatus.error('Failed to get product categories');
                            return Observable.throw(err);
                        })
                        .subscribe((categories: Category[]) => {
                            // upon navigating from the catalogue view, classification codes are set as selected categories
                            for (let category of categories) {
                                this.categoryService.addSelectedCategory(category);
                            }

                            if (this.categoryService.selectedCategories != []) {
                                this.populateCommodityClassificationForCategories();
                            }

                            this.recomputeSelectedCategoryProperties();
                            // handle required properties
                            this.handleRequiredProperties();

                            // populate invalidCategoryCodes array
                            let validCategoryUris = categories.map(category => category.categoryUri);
                            this.invalidCategoryCodes = classificationCodes.filter(classificationCode => validCategoryUris.indexOf(classificationCode.uri) == -1);

                            this.productCategoryRetrievalStatus.callback('Retrieved product categories', true);
                        });
                }

            } else {
                this.populateCommodityClassificationForCategories();
            }

        } else {
            // new publishing is the first entry to the publishing page
            // i.e. publishing from scratch
            if (this.publishStateService.publishingStarted == false) {
                this.catalogueLine = UBLModelUtils.createCatalogueLine(this.selectedCatalogueuuid, userParty, settings.negotiationSettings, this.dimensions);
                this.catalogueService.draftCatalogueLine = this.catalogueLine;
            } else {
                this.catalogueLine = this.catalogueService.draftCatalogueLine;
            }
            if (this.catalogueLine) {
                if (this.catalogueLine.goodsItem.item.name.length == 0)
                    this.addItemNameDescription();
                this.productWrapper = new ProductWrapper(this.catalogueLine, settings.negotiationSettings);
            }
        }

        // check the search page reference to update the property values with the selected products
        this.checkSearchReference();

        // call this function with dimension unit list to be sure that item will have some dimension
        this.multiValuedDimensions = this.productWrapper.getDimensionMultiValue(true, this.dimensions);
        if(this.nonPublicInformationFunctionalityEnabled){
            this.populateNonPublicInformation()
        }
    }

    // methods to handle publishing of products

    // catalogueLineId is the id of catalogue line created or edited
    private onSuccessfulPublish(exitThePage: boolean, catalogueLine: CatalogueLine): void {
        let userId = this.cookieService.get("user_id");
        this.userService.getUserParty(userId).then(party => {
            // get catalogue id-uuid pairs for the party to find the uuid of catalogue
            this.catalogueService.getCatalogueIdsUUidsForParty().then(catalogueIdsUuids => {

                // if there is no selected uuid yet (e.g. when a product is published when there is no catalogue),
                // choose the first catalogue id pair
                if (!this.selectedCatalogueuuid) {
                    this.selectedCatalogueId = catalogueIdsUuids[0][0];
                    this.selectedCatalogueuuid = catalogueIdsUuids[0][1];
                }

                this.catalogueService.getCatalogueLine(this.selectedCatalogueuuid, catalogueLine.id).then(catalogueLine => {
                    // go to the dashboard - catalogue tab
                    if (exitThePage) {
                        this.catalogueLine = UBLModelUtils.createCatalogueLine(this.selectedCatalogueuuid,
                            party, this.companySettings.negotiationSettings, this.dimensions);

                        // since every changes is saved,we do not need a dialog box
                        SinglePublishComponent.dialogBox = false;
                        // avoid category duplication
                        this.categoryService.resetSelectedCategories();
                        alert(this.translations["Successfully saved. You are now getting redirected."]);
                        this.router.navigate(['dashboard'], {
                            queryParams: {
                                tab: "CATALOGUE",
                            }
                        });
                    }
                    // stay in this page and allow the user to edit his product/service
                    else {
                        this.catalogueLine = catalogueLine;
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

    // changes publishMode to create
    private changePublishModeToCreate(): void {
        this.changePublishModeCreate = true;
    }

    // should be called on publish new product
    private publishProduct(exitThePage: boolean): void {

        // remove unused properties from catalogueLine
        let splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
        // nullify the transportation service details since a regular product is being published
        splicedCatalogueLine.goodsItem.item.transportationServiceDetails = null;

        if(this.nonPublicInformationFunctionalityEnabled){
            splicedCatalogueLine.nonPublicInformation = this.processNonPublicProductPropertiesAndDimensions(splicedCatalogueLine)
        }
        this.publish(splicedCatalogueLine, exitThePage);
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
            // nullify the transportation service details since a regular product is being published
            splicedCatalogueLine.goodsItem.item.transportationServiceDetails = null;

            if(this.nonPublicInformationFunctionalityEnabled){
                splicedCatalogueLine.nonPublicInformation = this.processNonPublicProductPropertiesAndDimensions(splicedCatalogueLine)
            }
            // update existing product
            this.saveEditedProduct(exitThePage, splicedCatalogueLine);
        }

    }

    private publish(catalogueLine: CatalogueLine, exitThePage: boolean) {
        this.publishStatus.submit();
        if (this.selectedCatalogueuuid == null) {
            const userId = this.cookieService.get("user_id");
            this.userService.getUserParty(userId).then(userParty => {
                // create the catalogue
                let catalogue: Catalogue = new Catalogue("default", null, userParty, "", "", []);
                // add catalogue lines to the end of catalogue
                catalogue.catalogueLine.push(catalogueLine);

                this.catalogueService.postCatalogue(catalogue)
                    .then(() => this.onSuccessfulPublish(exitThePage, catalogueLine))
                    .catch(err => {
                        this.onFailedPublish(err);
                    })
            }).catch(err => {
                this.onFailedPublish(err);
            });

        } else {
            catalogueLine.goodsItem.item.catalogueDocumentReference.id = this.selectedCatalogueuuid;
            this.catalogueService.addCatalogueLine(this.selectedCatalogueuuid, JSON.stringify(catalogueLine))
                .then(() => {
                    this.onSuccessfulPublish(exitThePage, catalogueLine);
                })
                .catch(err => this.onFailedPublish(err))
        }
    }

    // Should be called on save
    private saveEditedProduct(exitThePage: boolean, catalogueLine: CatalogueLine): void {
        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        this.publishStatus.submit();
        this.catalogueService.updateCatalogueLine(this.selectedCatalogueuuid, JSON.stringify(catalogueLine))
            .then(() => this.onSuccessfulPublish(exitThePage, catalogueLine))
            .then(() => this.changePublishModeToCreate())
            .catch(err => {
                this.onFailedPublish(err);
            });
    }
    // the end of methods to handle publishing of products

    // methods to handle file upload for additional information //
    onSelectFile(binaryObject: BinaryObject) {
        const document: DocumentReference = new DocumentReference();
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;
        document.documentType = "Additional Information";

        this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.push(document);
    }

    onUnSelectFile(binaryObject: BinaryObject) {
        const i = this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
        if (i >= 0) {
            this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.splice(i, 1);
        }
    }

    getBinaryObjectsForAdditionalInformation() {
        return this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.filter(doc => doc.documentType == "Additional Information").map(doc => doc.attachment.embeddedDocumentBinaryObject);
    }
    // the end of methods to handle file upload for additional information //

    // methods to handle properties

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

    /**
     * Recomputes {@link selectedCategoryProperties} and creates a {@link lunr} index for the category properties
     * */
    private recomputeSelectedCategoryProperties() {
        this.selectedCategoryProperties = {};
        const newSelectedProps = this.selectedCategoryProperties;

        for (const category of this.categoryService.selectedCategories) {
            if (category.properties) {
                for (const property of category.properties) {
                    const key = getPropertyKey(property);
                    if (!this.selectedCategoryProperties[key]) {
                        // index of the property in the catalogue line's item properties
                        const index = this.catalogueLine.goodsItem.item.additionalItemProperty.findIndex(itemProperty => getPropertyKey(itemProperty) == key);
                        this.selectedCategoryProperties[key] = {
                            categories: [],
                            properties: [],
                            lunrSearchId: null,
                            key,
                            selected: index != -1,
                            preferredName: property.preferredName,
                            shortName: property.shortName
                        };
                    }

                    const newProp = this.selectedCategoryProperties[key];
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

    selectAllProperties(category: Category, event?: Event): any {
        if (event) {
            event.preventDefault();
        }
        const properties = this.getCategoryProperties(category);
        for (let property of properties) {
            if (!this.isCategoryPropertySelected(category, property))
                this.onToggleCategoryPropertySelected(category, property);
        }
    }

    selectNoProperties(category: Category, event?: Event): any {
        if (event) {
            event.preventDefault();
        }
        const properties = this.getCategoryProperties(category);
        for (let property of properties) {
            if (this.isCategoryPropertySelected(category, property))
                this.onToggleCategoryPropertySelected(category, property);
        }
    }

    getPropertyType(property: Property): string {
        return sanitizeDataTypeName(property.dataType);
    }

    onAddCustomProperty(event: Event, dismissModal: any) {
        event.preventDefault();
        dismissModal("add property");
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

        if(this.nonPublicInformationFunctionalityEnabled){
            this.removeNonPublicInformation(property.id)
        }
    }

    getSelectedPropertiesCount(): number{
        return this.catalogueLine.goodsItem.item.additionalItemProperty.length;
    }

    toggleProperties() {
        this.showProperties = !this.showProperties;
    }

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
        if(this.nonPublicInformationFunctionalityEnabled){
            this.removeNonPublicInformationIndex(property.id,index)
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
        let selProp = this.selectedCategoryProperties[key];
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
        this.editPropertyModal.open(property, this.selectedCategoryProperties[key], null);
    }

    getProductProperties(): ItemProperty[] {
        return this.productWrapper.getAllUniqueProperties();
    }

    getPrettyName(property: ItemProperty): string {
        return sanitizePropertyName(selectName(property));
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

    isPropertyFilteredIn(property: Property) {
        if (this.categoryModalPropertyKeyword === "") {
            return true;
        }

        const key = getPropertyKey(property);
        return this.selectedCategoryProperties[key].lunrSearchId === this.currentLunrSearchId;
    }

    onToggleCategoryPropertySelected(category: Category, property: Property) {
        const key = getPropertyKey(property);
        const selectedProp = this.selectedCategoryProperties[key];
        selectedProp.selected = !selectedProp.selected;
        this.selectedCategoryPropertiesUpdates[key] = selectedProp.selected;
    }

    onFilterPropertiesInCategoryModal() {
        this.currentLunrSearchId = UBLModelUtils.generateUUID();
        this.lunrIndex.search("*" + this.categoryModalPropertyKeyword + "*").forEach(result => {
            this.selectedCategoryProperties[result.ref].lunrSearchId = this.currentLunrSearchId;
        });
    }

    isCategoryPropertySelected(category: Category, property: Property): boolean {
        const key = getPropertyKey(property);
        const selectedProp = this.selectedCategoryProperties[key];
        return selectedProp.selected;
    }
    // the end of methods to handle properties

    // methods to handle dimensions
    toggleDimensionCard() {
        this.showDimensions = !this.showDimensions;
    }

    onAddDimension(attributeId: string) {
        this.productWrapper.addDimension(attributeId);
        // update dimensions
        this.multiValuedDimensions = this.productWrapper.getDimensionMultiValue();
    }

    onRemoveDimension(attributeId: string, quantity: Quantity) {
        let index: number = this.productWrapper.item.dimension.slice().reverse().findIndex(dim => dim.attributeID == attributeId && dim.measure.value == quantity.value);
        this.productWrapper.removeDimension(attributeId, quantity);
        // update dimensions
        this.multiValuedDimensions = this.productWrapper.getDimensionMultiValue();
        if(this.nonPublicInformationFunctionalityEnabled){
            this.removeNonPublicInformationIndex(attributeId,index);
        }
    }

    public getMultiValuedDimensionCount():number{
        return this.productWrapper.getDimensionMultiValue(false,this.dimensions).length;
    }
    // the end of methods to handle dimensions

    // methods to handle categories
    private populateCommodityClassificationForCategories(){
        for (let category of this.categoryService.selectedCategories) {
            if (this.isNewCategory(category)) {
                this.updateItemWithNewCategory(category);
            }
        }
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

    private isNewCategory(category: Category): boolean {
        for (let commodityClassification of this.catalogueLine.goodsItem.item.commodityClassification) {
            if (category.id == commodityClassification.itemClassificationCode.value) {
                return false;
            }
        }
        return true;
    }

    private updateItemWithNewCategory(category: Category): void {
        this.catalogueLine.goodsItem.item.commodityClassification.push(UBLModelUtils.createCommodityClassification(category));
    }

    /**
     * deselect a category
     * 1) remove the property from additional item properties
     * 2) remove the corresponding commodity classification from the item
     */
    onRemoveCategory(categoryId:string) {
        this.catalogueLine.goodsItem.item.additionalItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.filter(function(el) {
            return el.itemClassificationCode.value !== categoryId;
        });

        this.recomputeSelectedCategoryProperties();

        let i = this.catalogueLine.goodsItem.item.commodityClassification.findIndex(c => c.itemClassificationCode.value === categoryId);
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
        // change publishing step to Category
        this.publishingStep = "Category";
    }

    isProductCategoriesLoading(): boolean {
        return this.productCategoryRetrievalStatus.fb_submitted;
    }

    getCategoryProperties(category: Category): Property[] {
        const code = category.code;
        if (!this.categoryProperties[code]) {
            this.categoryProperties[code] = sortProperties([...category.properties]);
        }
        return this.categoryProperties[code];
    }
    // the end of methods to handle categories
    // Other methods //

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

    /*
     * Event Handlers
     */
    changeCat() {
        let index = this.cataloguesIds.indexOf(this.selectedCatalogueId);
        // update selected catalogue uuid
        this.selectedCatalogueuuid = this.catalogueUUids[index];
    }

    onBack() {
        this.location.back();
    }

    toggleAdditionalInformationCard() {
        this.showAdditionalInformation = !this.showAdditionalInformation;
    }

    showCategoriesModal(categoriesModal: any, event: Event) {
        event.preventDefault();
        this.categoryModalPropertyKeyword = "";
        this.modalService.open(categoriesModal).result.then(() => {
            let properties = this.catalogueLine.goodsItem.item.additionalItemProperty;

            Object.keys(this.selectedCategoryPropertiesUpdates).forEach(key => {
                const selected = this.selectedCategoryPropertiesUpdates[key];
                const property = this.selectedCategoryProperties[key];

                if (selected) {
                    // add property iff the catalogue line does not already have this property
                    let index = properties.findIndex(property => getPropertyKey(property) == key);
                    if(index == -1){
                        // use the first property/category information to create an additional item property
                        // since all properties are the same (that is, they have the same id but they belong to different categories)
                        const prop = property.properties[0];
                        const category = property.categories[0];

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
            this.selectedCategoryPropertiesUpdates = {};
        }, () => {
            this.selectedCategoryPropertiesUpdates = {};
        });
    }

    /*
     * Other Stuff
     */
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

    // Product id is not editable when publish mode is 'edit'
    isProductIdEditable(): boolean {
        return this.publishStateService.publishMode != 'edit';
    }

    public getCatalogueIdsForParty() {
        this.productCatalogueRetrievalStatus.submit();
        this.catalogueService.getCatalogueIdsUUidsForParty().then((catalogueIds) => {
            const idList = [];
            const uuidList = [];

            for (let obj in catalogueIds) {
                if (catalogueIds[obj][0] == this.selectedCatalogueId) {
                    this.selectedCatalogueuuid = catalogueIds[obj][1];
                }
                idList.push(catalogueIds[obj][0]);
                uuidList.push(catalogueIds[obj][1]);
            }

            this.cataloguesIds = idList;
            this.catalogueUUids = uuidList;
            this.productCatalogueRetrievalStatus.callback("Successfully loaded catalogueId list", true);
        }).catch(() => {
            this.productCatalogueRetrievalStatus.error('Failed to get product catalogues');
        });

    }

    isLoading(): boolean {
        return (this.publishStatus.fb_submitted || this.isProductCategoriesLoading());
    }

    addItemNameDescription() {
        let newItemName: Text = new Text("", DEFAULT_LANGUAGE());
        let newItemDescription: Text = new Text("", DEFAULT_LANGUAGE());
        this.catalogueLine.goodsItem.item.name.push(newItemName);
        this.catalogueLine.goodsItem.item.description.push(newItemDescription);
    }

    private setCatalogueUuidsOnInit(catalogueIdsUuids: string[][]): void {
        // check whether there exists a catalogue at all (there might not be one yet)
        if (catalogueIdsUuids.length > 0) {
            // if there is a provided catalogue id specified already, find the corredponsing uuid for that
            if (this.selectedCatalogueId) {
                for (let idUuid of catalogueIdsUuids) {
                    if (idUuid[0] === this.selectedCatalogueId) {
                        this.selectedCatalogueuuid = idUuid[1];
                        break;
                    }
                }
            } else {
                // catalogue response might be null when the publish page is loaded directly by providing the complete url
                if (this.catalogueService.catalogueResponse) {

                    // if the navigation is from catalogue view component, we should use the catalogue pagination response including
                    // the catalogue id of the recent active catalogue
                    if (this.catalogueService.catalogueResponse.catalogueId === 'all') {
                        this.selectedCatalogueId = catalogueIdsUuids[0][0];
                        this.selectedCatalogueuuid = catalogueIdsUuids[0][1];

                    } else {
                        this.selectedCatalogueId = this.catalogueService.catalogueResponse.catalogueId;
                        this.selectedCatalogueuuid = this.catalogueService.catalogueResponse.catalogueUuid;
                    }

                } else {
                    this.selectedCatalogueId = catalogueIdsUuids[0][0];
                    this.selectedCatalogueuuid = catalogueIdsUuids[0][1];
                }
            }
        }
    }

    // methods to handle guided publishing
    onPreviousStep(){
        switch (this.publishingStep) {
            case 'Category':
                break;
            case 'Catalogue':
                this.publishingStep = "Category";
                break;
            case 'ID/Name/Image':
                this.publishingStep = this.cataloguesIds.length > 1 ? "Catalogue" : 'Category';
                break;
            case 'Details':
                this.publishingStep = "ID/Name/Image";
                break;
            case 'Price':
                this.publishingStep = "Details";
                break;
            case 'Delivery&Trading':
                this.publishingStep = "Price";
                break;
            case 'Certificates':
                this.publishingStep = "Delivery&Trading";
                break;
            case 'LCPA':
                this.publishingStep = "Certificates";
                break;
            case 'Review':
                this.publishingStep = this.config.showLCPA ? "LCPA" : "Certificates";
        }
    }

    onNextStep(){
        switch (this.publishingStep) {
            case 'Category':
                this.publishingStep = this.cataloguesIds.length > 1 ? "Catalogue" : "ID/Name/Image";
                this.onCategorySelectionCompleted();
                break;
            case 'Catalogue':
                this.publishingStep = "ID/Name/Image";
                break;
            case 'ID/Name/Image':
                this.publishingStep = "Details";
                break;
            case 'Details':
                this.publishingStep = "Price";
                break;
            case 'Price':
                this.publishingStep = "Delivery&Trading";
                break;
            case 'Delivery&Trading':
                this.publishingStep = "Certificates";
                break;
            case 'Certificates':
                this.publishingStep = this.config.showLCPA ? "LCPA" : "Review";
                break;
            case 'LCPA':
                // set the non-public information of catalogue line for the review tab
                this.catalogueLine.nonPublicInformation = this.processNonPublicProductPropertiesAndDimensions(this.catalogueLine);
                this.publishingStep = "Review";
        }
    }

    onStepChanged(step:ProductPublishStep){
        // handle the case where the publishing step is Category
        if(this.publishingStep == "Category"){
            this.onCategorySelectionCompleted();
        }
        // set the non-public information of catalogue line for the review tab
        if(step === 'Review'){
            this.catalogueLine.nonPublicInformation = this.processNonPublicProductPropertiesAndDimensions(this.catalogueLine);
        }
        // set the current publishing step
        this.publishingStep = step;
    }

    private onCategorySelectionCompleted(){
        // the category selection is completed, so the product has some categories
        this.categorySelectedForPublishing = true;
        // populate commodity classification for selected categories
        this.populateCommodityClassificationForCategories();
        // add the selected categories to the recent categories list of company
        this.categoryService.addRecentCategories(this.categoryService.selectedCategories);
        // recompute selected category properties
        this.recomputeSelectedCategoryProperties();
        // handle required properties
        this.handleRequiredProperties();
    }
    // the end of methods to handle guided publishing

    // methods to handle non-public information
    removeNonPublicInformation(id){
        let i = this.nonPublicInformationUIs.findIndex(value => value.id === id);
        if(i !== -1){
            this.nonPublicInformationUIs.splice(i,1)
        }
    }

    removeNonPublicInformationIndex(id, index){
        let nonPublicInformationIndex = this.nonPublicInformationUIs.findIndex(value => value.id === id);
        if(nonPublicInformationIndex !== -1){
            let i = this.nonPublicInformationUIs[nonPublicInformationIndex].indexes.indexOf(index);
            if(i !== -1){
                this.nonPublicInformationUIs[nonPublicInformationIndex].indexes.splice(i,1)
            }
            if(this.nonPublicInformationUIs[nonPublicInformationIndex].indexes.length === 0){
                this.nonPublicInformationUIs.splice(nonPublicInformationIndex,1)
            }
        }
    }

    onPropertyNonPublicClicked(property:ItemProperty, propertyValueIndex, checked:boolean){
        if(checked){
            // check whether the property has any non-public values
            let nonPublicInformation = this.nonPublicInformationUIs.find(value => value.id == property.id);
            // if yes, add the selected property index
            if(nonPublicInformation){
                nonPublicInformation.indexes.push(propertyValueIndex);
            }
            // otherwise, create a non-public information object for the property value
            else{
                let multiTypeValue:MultiTypeValue = new MultiTypeValue();
                multiTypeValue.valueQualifier = property.valueQualifier;
                switch (property.valueQualifier){
                    case "BOOLEAN":
                    case "STRING":
                        multiTypeValue.value = property.value;
                        break;
                    case "QUANTITY":
                        multiTypeValue.valueQuantity = property.valueQuantity;
                        break;
                    case "NUMBER":
                        multiTypeValue.valueDecimal = property.valueDecimal;
                }
                let nonPublicInformationUI = new NonPublicInformationUi();
                nonPublicInformationUI.id = property.id;
                nonPublicInformationUI.value = multiTypeValue;
                nonPublicInformationUI.indexes = [propertyValueIndex];

                this.nonPublicInformationUIs.push(nonPublicInformationUI);
            }
        } else{
            let nonPublicInformation = this.nonPublicInformationUIs.find(value => value.id == property.id);
            nonPublicInformation.indexes.splice(nonPublicInformation.indexes.indexOf(propertyValueIndex),1);
        }
    }

    onDimensionNonPublicClicked(property:MultiValuedDimension,index,checked:boolean){
        if(checked){
            let multiTypeValue:MultiTypeValue = new MultiTypeValue();
            multiTypeValue.valueQualifier = "QUANTITY";
            multiTypeValue.valueQuantity = property.measure;
            let nonPublicInformationUI = new NonPublicInformationUi();
            nonPublicInformationUI.id = property.attributeID;
            nonPublicInformationUI.value = multiTypeValue;
            nonPublicInformationUI.indexes = [index];

            this.nonPublicInformationUIs.push(nonPublicInformationUI);
        } else{
            let nonPublicInformation = this.nonPublicInformationUIs.find(value => value.id == property.attributeID);
            nonPublicInformation.indexes.splice(nonPublicInformation.indexes.indexOf(index),1);
        }
    }

    isNonPublicChecked(fieldId, index){
        let nonPublicInformation = this.nonPublicInformationUIs.find(value => value.id == fieldId);
        if(nonPublicInformation){
            return nonPublicInformation.indexes.indexOf(index) !== -1;
        }
        return false;
    }

    populateNonPublicInformation(){
        this.nonPublicInformationUIs = [];
        if(this.catalogueLine.nonPublicInformation && this.catalogueLine.nonPublicInformation.length > 0){
            // handle additional item properties
            for (let itemProperty of this.catalogueLine.goodsItem.item.additionalItemProperty) {
                let nonPublicInformation = this.catalogueLine.nonPublicInformation.find(value => value.id === itemProperty.id);

                let nonPublicInformationUI = new NonPublicInformationUi();
                nonPublicInformationUI.id = nonPublicInformation.id ;

                let indexes = []
                let multiTypeValue = new MultiTypeValue();
                multiTypeValue.valueQualifier = itemProperty.valueQualifier;
                switch (multiTypeValue.valueQualifier){
                    case "BOOLEAN":
                    case "STRING":
                        multiTypeValue.value = itemProperty.value;
                        for (let value of nonPublicInformation.value.value) {
                            let index = itemProperty.value.findIndex(value1 => value1.value === value.value && value1.languageID === value.languageID)
                            indexes.push(index);
                        }
                        break;
                    case "QUANTITY":
                        multiTypeValue.valueQuantity = itemProperty.valueQuantity;
                        for (let value of nonPublicInformation.value.valueQuantity) {
                            let index = itemProperty.valueQuantity.findIndex(value1 => value1.value === value.value && value1.unitCode === value.unitCode)
                            indexes.push(index);
                        }
                        break;
                    case "NUMBER":
                        multiTypeValue.valueDecimal = itemProperty.valueDecimal;
                        for (let value of nonPublicInformation.value.valueDecimal) {
                            let index = itemProperty.valueDecimal.findIndex(value1 => value1 == value)
                            indexes.push(index);
                        }
                }
                nonPublicInformationUI.value = multiTypeValue;
                nonPublicInformationUI.indexes = indexes;

                this.nonPublicInformationUIs.push(nonPublicInformationUI)
            }
            // handle dimensions
            for (let dimension of this.multiValuedDimensions) {
                // create non-public information ui model for the dimension
                let nonPublicInformationUI = new NonPublicInformationUi();
                nonPublicInformationUI.id = dimension.attributeID ;
                let multiTypeValue = new MultiTypeValue();
                multiTypeValue.valueQualifier = "QUANTITY";
                multiTypeValue.valueQuantity = dimension.measure;

                // find the indexes of values which are non-public
                let indexes = []
                let nonPublicInformationList = this.catalogueLine.nonPublicInformation.filter(value => value.id === dimension.attributeID);
                for (let nonPublicInformation of nonPublicInformationList) {
                    for (let value of nonPublicInformation.value.valueQuantity) {
                        let index = dimension.measure.findIndex(value1 => value1.value === value.value && value1.unitCode === value.unitCode)
                        indexes.push(index);
                    }
                }
                nonPublicInformationUI.value = multiTypeValue;
                nonPublicInformationUI.indexes = indexes;

                this.nonPublicInformationUIs.push(nonPublicInformationUI)
            }
        }

    }

    /**
     * Converts {@link NonPublicInformationUi} to {@link NonPublicInformation} for the given catalogue line
     * */
    processNonPublicProductPropertiesAndDimensions(splicedCatalogueLine:CatalogueLine){
        let constants = Object.keys(NON_PUBLIC_FIELD_ID).map(value => NON_PUBLIC_FIELD_ID[value]);

        let nonPublicInformationList = splicedCatalogueLine.nonPublicInformation.filter(value => constants.indexOf(value.id) !== -1)

        for (let nonPublicInformationUI of this.nonPublicInformationUIs) {
            let nonPublicInformation:NonPublicInformation = new NonPublicInformation();
            nonPublicInformation.id = nonPublicInformationUI.id;

            let multiTypeValue = new MultiTypeValue();
            multiTypeValue.valueQualifier = nonPublicInformationUI.value.valueQualifier;
            switch (multiTypeValue.valueQualifier){
                case "BOOLEAN":
                case "STRING":
                    for (let index of nonPublicInformationUI.indexes) {
                        multiTypeValue.value.push(new Text(nonPublicInformationUI.value.value[index].value,nonPublicInformationUI.value.value[index].languageID));
                    }
                    break;
                case "QUANTITY":
                    for (let index of nonPublicInformationUI.indexes) {
                        multiTypeValue.valueQuantity.push(new Quantity(nonPublicInformationUI.value.valueQuantity[index].value,nonPublicInformationUI.value.valueQuantity[index].unitCode));
                    }
                    break;
                case "NUMBER":
                    for (let index of nonPublicInformationUI.indexes) {
                        multiTypeValue.valueDecimal.push(nonPublicInformationUI.value.valueDecimal[index]);
                    }
            }

            nonPublicInformation.value = multiTypeValue;

            nonPublicInformationList.push(nonPublicInformation)
        }

        return nonPublicInformationList;
    }

    // the end of methods to handle non-public information
}
