import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import {ActivatedRoute, Params, Router} from '@angular/router';
import {UBLModelUtils} from '../model/ubl-model-utils';
import {Location} from '@angular/common';
import {PublishService} from '../publish-and-aip.service';
import {CatalogueService} from '../catalogue.service';
import {UserService} from '../../user-mgmt/user.service';
import {CookieService} from 'ng2-cookies';
import {CategoryService} from '../category/category.service';
import {CallStatus} from '../../common/call-status';
import {copy, removeHjids} from '../../common/utils';
import {CataloguePaginationResponse} from '../model/publish/catalogue-pagination-response';
import {CompanyNegotiationSettings} from '../../user-mgmt/model/company-negotiation-settings';
import {PublishMode} from '../model/publish/publish-mode';
import {CatalogueLine} from '../model/publish/catalogue-line';
import {Attachment} from '../model/publish/attachment';
import {BinaryObject} from '../model/publish/binary-object';
import {DocumentReference} from '../model/publish/document-reference';
import {Item} from '../model/publish/item';
import {ItemProperty} from '../model/publish/item-property';
import {TransportationService} from '../model/publish/transportation-service';
import {Catalogue} from '../model/publish/catalogue';
import * as myGlobals from '../../globals';
import {Category} from '../model/category/category';
import {LogisticPublishingService} from './logistic-publishing.service';

@Component({
    selector: "logistic-service-publish",
    templateUrl: "./logistic-service-publish.component.html",
    styleUrls: ["./logistic-service-publish.component.css"]
})
export class LogisticServicePublishComponent implements OnInit {

    constructor(public categoryService: CategoryService,
                private catalogueService: CatalogueService,
                public publishStateService: PublishService,
                private userService: UserService,
                private route: ActivatedRoute,
                private router: Router,
                private location: Location,
                private cookieService: CookieService,
                private logisticPublishingService:LogisticPublishingService) {
    }

    config = myGlobals.config;
    // check whether product id conflict exists or not
    sameIdError = false;
    // the value of the erroneousID
    erroneousID = "";

    submitted = false;
    callback = false;
    error_detc = false;

    // represents the logistic service in 'edit' and 'copy' publish modes
    catalogueLine: CatalogueLine = null;

    // check whether changing publish-mode to 'create' is necessary or not
    changePublishModeCreate: boolean = false;

    publishMode: PublishMode;
    publishStatus: CallStatus = new CallStatus();
    publishingGranularity: "single" | "bulk" = "single";
    companyNegotiationSettings: CompanyNegotiationSettings;

    callStatus: CallStatus = new CallStatus();

    // selected tab
    selectedTabSinglePublish = "TRANSPORT";
    // whether we need to show all tabs or not
    singleTabForLogisticServices = false;
    // publish mode of each logistic services
    logisticPublishMode:Map<string,string> = null;
    // catalogue lines of each logistic services
    logisticCatalogueLines: Map<string,CatalogueLine> = null;
    // this is the object which is taken from the catalog service and it gives us the logistic service-category uri pairs for each taxonomy id
    logisticRelatedServices = null;
    // available logistics services
    availableLogisticsServices = [];
    dialogBox = true;
    // furniture ontology categories which are used to represent Logistic Services
    furnitureOntologyLogisticCategories:Category[] = null;

    showRoadTransportService:boolean = false;
    showMaritimeTransportService:boolean = false;
    showAirTransportService:boolean = false;
    showRailTransportService:boolean = false;

    ngOnInit() {
        const userId = this.cookieService.get("user_id");
        this.callStatus.submit();

        Promise.all([
            this.userService.getUserParty(userId),
            this.logisticPublishingService.getCachedLogisticRelatedServices(this.config.standardTaxonomy)
        ]).then(([party, logisticRelatedServices]) => {
            this.logisticRelatedServices = logisticRelatedServices;
            let keys = Object.keys(this.logisticRelatedServices);
            // get category uris for logistic services
            let eClassCategoryUris = keys.indexOf("eClass") != -1 ? this.getCategoryUrisForTaxonomyId("eClass"): null;
            let furnitureOntologyCategoryUris = keys.indexOf("FurnitureOntology") != -1 ?this.getCategoryUrisForTaxonomyId("FurnitureOntology"): null;
            return Promise.all([
                Promise.resolve(party),
                this.catalogueService.getCatalogueResponse(userId),
                this.userService.getCompanyNegotiationSettingsForParty(UBLModelUtils.getPartyId(party)),
                eClassCategoryUris ? this.categoryService.getCategoriesForIds(new Array(eClassCategoryUris.length).fill("eClass"),eClassCategoryUris): Promise.resolve(null),
                furnitureOntologyCategoryUris ? this.categoryService.getCategoriesForIds(new Array(furnitureOntologyCategoryUris.length).fill("FurnitureOntology"),furnitureOntologyCategoryUris): Promise.resolve(null)
            ]).then(([party, catalogueResponse, settings,eClassLogisticCategories,furnitureOntologyLogisticCategories]) => {
                // set furniture ontology logistic categories
                this.furnitureOntologyLogisticCategories = furnitureOntologyLogisticCategories;
                this.initView(party, catalogueResponse, settings,eClassLogisticCategories);
                this.publishStateService.publishingStarted = true;
                this.callStatus.callback("Successfully initialized.", true);
            })
                .catch(error => {
                    this.callStatus.error("Error while initializing the publish view.", error);
                });
        });

        this.route.queryParams.subscribe((params: Params) => {
            // handle publishing granularity: single, bulk, null
            this.publishingGranularity = params['pg'];
            if(this.publishingGranularity == null) {
                this.publishingGranularity = 'single';
            }
        });
    }

    getCategoryUrisForTaxonomyId(taxonomyId:string){
        let serviceCategoryUriMap = this.logisticRelatedServices[taxonomyId];

        let categoryUris = [];
        for(let key of Object.keys(serviceCategoryUriMap)){
            categoryUris.push(serviceCategoryUriMap[key]);
        }
        return categoryUris;
    }

    populateLogisticPublishMode(){
        this.logisticPublishMode = new Map<string,string>();
        for(let serviceType of this.availableLogisticsServices){
            this.logisticPublishMode.set(serviceType,this.publishStateService.publishMode);
        }
    }

    getServiceTypesFromLogisticsCatalogueLines(){
        let numberOfCatalogueLines = this.logisticCatalogueLines.size;
        let iterator = this.logisticCatalogueLines.keys();
        for(let i=0; i<numberOfCatalogueLines;i++){
            this.availableLogisticsServices.push(iterator.next().value);
        }
    }

    // switching between tabs
    onSelectTabSinglePublish(event: any) {
        event.preventDefault();
        this.selectedTabSinglePublish = event.target.id;
    }

    onSelectTab(event: any) {
        event.preventDefault();
        if(event.target.id === "singleUpload") {
            this.publishingGranularity = "single";
        } else {
            this.publishingGranularity = "bulk";
        }
    }

    isLoading(): boolean {
        return this.publishStatus.fb_submitted;
    }

    canDeactivate(): boolean {
        if(this.changePublishModeCreate) {
            this.publishStateService.publishMode = 'create';
            this.publishStateService.publishingStarted = false;
        }
        if(this.dialogBox) {
            let x:boolean = confirm("You will lose any changes you made, are you sure you want to quit ?");
            if(x){
                this.publishStateService.publishMode = 'create';
                this.publishStateService.publishingStarted = false;
            }
            return x;
        }
        this.dialogBox = true;
        return true;
    }

    private initView(userParty, catalogueResponse:CataloguePaginationResponse, settings, eClassLogisticCategories): void {
        this.companyNegotiationSettings = settings;
        this.catalogueService.setEditMode(true);
        this.publishStateService.resetData();
        // Following "if" block is executed when redirected by an "edit" button
        // "else" block is executed when redirected by "publish" tab
        this.publishMode = this.publishStateService.publishMode;

        if (this.publishMode == 'edit' || this.publishMode == 'copy') {
            if (this.publishMode == 'copy') {
                let newId = UBLModelUtils.generateUUID();
                this.catalogueService.draftCatalogueLine.id = newId;
                this.catalogueService.draftCatalogueLine.goodsItem.id = newId;
                this.catalogueService.draftCatalogueLine.goodsItem.item.manufacturersItemIdentification.id = newId;
                this.catalogueService.draftCatalogueLine = removeHjids(this.catalogueService.draftCatalogueLine);
            }
            this.catalogueLine = this.catalogueService.draftCatalogueLine;
            // add missing additional item properties to catalogue line
            this.addMissingAdditionalItemProperties(this.catalogueLine);
            if (this.catalogueLine == null) {
                this.publishStateService.publishMode = 'create';
                this.router.navigate(['catalogue/publish-logistic']);
                return;
            }

            // show only one tab
            this.singleTabForLogisticServices = true;

            this.selectedTabSinglePublish = this.getSelectedTabForLogisticServices();
            this.availableLogisticsServices.push(this.selectedTabSinglePublish);

        } else {
            // new publishing is the first entry to the publishing page
            // i.e. publishing from scratch
            if (this.publishStateService.publishingStarted == false) {
                this.logisticCatalogueLines = UBLModelUtils.createCatalogueLinesForLogistics(catalogueResponse.catalogueUuid, userParty, settings, this.logisticRelatedServices, eClassLogisticCategories,this.furnitureOntologyLogisticCategories);
                this.getServiceTypesFromLogisticsCatalogueLines();
                this.populateLogisticPublishMode();
            }
        }
    }

    // this method is used to add missing additional item properties to catalogue line in 'edit' mode
    addMissingAdditionalItemProperties(catalogueLine:CatalogueLine){
        if(this.furnitureOntologyLogisticCategories){
            let category:Category = null;
            for(let commodityClassification of catalogueLine.goodsItem.item.commodityClassification){
                for(let logisticCategory of this.furnitureOntologyLogisticCategories){
                    if(commodityClassification.itemClassificationCode.uri == logisticCategory.categoryUri){
                        category = logisticCategory;
                        break;
                    }
                }
            }
            // add missing additional item properties to catalogue line
            for(let property of category.properties){
                let missing:boolean = true;
                for(let itemProperty of catalogueLine.goodsItem.item.additionalItemProperty){
                    if(itemProperty.uri == property.uri){
                        missing = false;
                        break;
                    }
                }
                if(missing){
                    catalogueLine.goodsItem.item.additionalItemProperty.push(UBLModelUtils.createAdditionalItemProperty(property,category));
                }
            }
        }
    }

    // getters
    getLogisticCatalogueLine(serviceType:string):CatalogueLine{
        if(this.publishMode == 'create'){
            return this.logisticCatalogueLines.get(serviceType);
        }
        return this.catalogueLine;
    }

    private getSelectedTabForLogisticServices(){
        let serviceCategoryMap;
        if(this.config.standardTaxonomy == "All" || this.config.standardTaxonomy == "FurnitureOntology"){
            serviceCategoryMap = this.logisticRelatedServices["FurnitureOntology"];
        }
        else{
            serviceCategoryMap = this.logisticRelatedServices["eClass"];
        }

        for(let commodityClassification of this.catalogueLine.goodsItem.item.commodityClassification){
            let serviceTypes = Object.keys(serviceCategoryMap);
            for(let serviceType of serviceTypes){
                if(commodityClassification.itemClassificationCode.uri == serviceCategoryMap[serviceType]){
                    return serviceType;
                }
            }
        }
    }


    getButtonLabel(serviceType:string,exit:boolean = false){
        if(this.publishStateService.publishMode === "edit")
            return exit ? "Save & Exit" : "Save & Continue";
        else if(this.publishStateService.publishMode === "copy")
            return exit ? "Publish & Exit" : "Publish & Continue";

        if(serviceType == "TRANSPORT"){
            if(this.logisticPublishMode.get('ROADTRANSPORT') === 'edit' || this.logisticPublishMode.get('MARITIMETRANSPORT') === 'edit' || this.logisticPublishMode.get('AIRTRANSPORT') === 'edit' || this.logisticPublishMode.get('RAILTRANSPORT') === 'edit')
                return exit ? "Save & Exit" : "Save & Continue";
        }
        else if(this.logisticPublishMode.get(serviceType) === 'edit')
            return exit ? "Save & Exit" : "Save & Continue";

        return exit ? "Publish & Exit" : "Publish & Continue";
    }

    isProductIdEditable(serviceType:string){
        // handling of 'edit' and 'copy' publish modes
        if(this.publishStateService.publishMode === 'edit'){
            return false;
        }
        else if(this.publishStateService.publishMode === 'copy'){
            return true;
        }
        // handling of 'create' publish mode
        return this.logisticPublishMode.get(serviceType) == 'create';

    }

    getBinaryObjectsForLogisticService(serviceType:string){
        let binaryObjects:BinaryObject[] = [];


        if(this.publishStateService.publishMode == 'create'){
            binaryObjects = this.logisticCatalogueLines.get(serviceType).goodsItem.item.itemSpecificationDocumentReference.map(doc => doc.attachment.embeddedDocumentBinaryObject)
        } else{
            binaryObjects = this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.map(doc => doc.attachment.embeddedDocumentBinaryObject)
        }

        return binaryObjects;
    }

    getProductTypeProperty(serviceType:string){
        let item:Item = this.getLogisticCatalogueLine(serviceType).goodsItem.item;
        for(let property of item.additionalItemProperty){
            if(property.uri == "http://www.aidimme.es/FurnitureSectorOntology.owl#managedProductType"){
                return property;
            }
        }
    }

    getIndustrySpecializationProperty(serviceType:string){
        let item:Item = this.getLogisticCatalogueLine(serviceType).goodsItem.item;
        for(let property of item.additionalItemProperty){
            if(property.uri == "http://www.aidimme.es/FurnitureSectorOntology.owl#industrySpecialization"){
                return property;
            }
        }
    }

    getLogisticProperties(serviceType:string){
        let properties = [];
        let item:Item = this.getLogisticCatalogueLine(serviceType).goodsItem.item;
        for(let property of item.additionalItemProperty){
            if(property.uri != "http://www.aidimme.es/FurnitureSectorOntology.owl#industrySpecialization" && property.uri != "http://www.aidimme.es/FurnitureSectorOntology.owl#managedProductType"
                && property.uri != "http://www.aidimme.es/FurnitureSectorOntology.owl#originTransport" && property.uri != 'http://www.aidimme.es/FurnitureSectorOntology.owl#destinationTransport' && property.itemClassificationCode.listID != 'Custom'){
                properties.push(property);
            }
        }
        return properties
    }

    getProductTypeForLogistic(serviceType:string){
        let item:Item = this.getLogisticCatalogueLine(serviceType).goodsItem.item;
        for(let itemProperty of item.additionalItemProperty){
            if(itemProperty.uri == "http://www.aidimme.es/FurnitureSectorOntology.owl#managedProductType"){
                return itemProperty.value;
            }
        }
    }

    getIndustrySpecializationForLogistics(serviceType:string){
        let item:Item = this.getLogisticCatalogueLine(serviceType).goodsItem.item;
        for(let itemProperty of item.additionalItemProperty){
            if(itemProperty.uri == 'http://www.aidimme.es/FurnitureSectorOntology.owl#industrySpecialization'){
                return itemProperty.value;
            }
        }
    }

    getOriginAddressForLogistics(serviceType:string){
        let item:Item = this.getLogisticCatalogueLine(serviceType).goodsItem.item;
        for(let itemProperty of item.additionalItemProperty){
            if(itemProperty.uri == "http://www.aidimme.es/FurnitureSectorOntology.owl#originTransport"){
                return itemProperty;
            }
        }
    }

    getDestinationAddressForLogistics(serviceType:string){
        let item:Item = this.getLogisticCatalogueLine(serviceType).goodsItem.item;
        for(let itemProperty of item.additionalItemProperty){
            if(itemProperty.uri == "http://www.aidimme.es/FurnitureSectorOntology.owl#destinationTransport"){
                return itemProperty;
            }
        }
    }

    // methods to select/unselect files for Transport logistic services
    onSelectFileForLogisticService(binaryObject: BinaryObject,serviceType:string){
        const document: DocumentReference = new DocumentReference();
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;

        if(this.publishStateService.publishMode == 'create'){
            this.logisticCatalogueLines.get(serviceType).goodsItem.item.itemSpecificationDocumentReference.push(document);
        } else{
            this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.push(document);
        }
    }

    onUnSelectFileForLogisticService(binaryObject: BinaryObject, serviceType:string){
        if(this.publishStateService.publishMode == 'create'){
            const i = this.logisticCatalogueLines.get(serviceType).goodsItem.item.itemSpecificationDocumentReference.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
            if(i >= 0) {
                this.logisticCatalogueLines.get(serviceType).goodsItem.item.itemSpecificationDocumentReference.splice(i, 1);
            }

        } else{
            const i = this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
            if(i >= 0) {
                this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.splice(i, 1);
            }
        }
    }

    // methods used to validate catalogue lines
    isValidCatalogueLineForLogistics(): boolean {
        if(this.publishMode == 'create'){
            if(this.selectedTabSinglePublish == 'TRANSPORT'){
                if(this.logisticCatalogueLines.has("ROADTRANSPORT")){
                    if(this.itemHasName(this.logisticCatalogueLines.get("ROADTRANSPORT").goodsItem.item)){
                        return true;
                    }
                }
                if(this.logisticCatalogueLines.has("MARITIMETRANSPORT")){
                    if(this.itemHasName(this.logisticCatalogueLines.get("MARITIMETRANSPORT").goodsItem.item)){
                        return true;
                    }
                }
                if(this.logisticCatalogueLines.has("AIRTRANSPORT")){
                    if(this.itemHasName(this.logisticCatalogueLines.get("AIRTRANSPORT").goodsItem.item)){
                        return true;
                    }
                }
                if(this.logisticCatalogueLines.has("RAILTRANSPORT")){
                    if(this.itemHasName(this.logisticCatalogueLines.get("RAILTRANSPORT").goodsItem.item)){
                        return true;
                    }
                }
            }else{
                if(this.itemHasName(this.logisticCatalogueLines.get(this.selectedTabSinglePublish).goodsItem.item)){
                    return true;
                }
            }
            return false;
        }
        return this.isValidCatalogueLine();
    }

    isValidCatalogueLine(): boolean {
        // must have a name
        return this.itemHasName(this.catalogueLine.goodsItem.item);
    }

    private itemHasName(item:Item):boolean{
        return item.name[0] && item.name[0].value !== "";
    }

    // Removes empty properties from catalogueLines about to be sent
    private removeEmptyProperties(catalogueLine: CatalogueLine): CatalogueLine {

        // Make deep copy of catalogue line so we can remove empty fields without disturbing UI model
        // This is required because there is no redirect after publish action
        let catalogueLineCopy: CatalogueLine = copy(catalogueLine);

        if(catalogueLineCopy.goodsItem.item.lifeCyclePerformanceAssessmentDetails != null) {
            if(!UBLModelUtils.isFilledLCPAInput(catalogueLineCopy.goodsItem.item.lifeCyclePerformanceAssessmentDetails)) {
                catalogueLineCopy.goodsItem.item.lifeCyclePerformanceAssessmentDetails.lcpainput = null;
            }
            if(!UBLModelUtils.isFilledLCPAOutput(catalogueLineCopy.goodsItem.item.lifeCyclePerformanceAssessmentDetails)) {
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
                property.valueDecimal = property.valueDecimal.filter(function (el){
                    return (el != null && el.toString() != "");
                });
                if (property.valueDecimal.length == 0 || property.valueDecimal[0] == undefined) {
                    propertiesToBeSpliced.push(property);
                }

            } else if (valueQualifier == "binary") {
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

    private copyMissingAdditionalItemPropertiesAndAddresses(catalogueLine:CatalogueLine){
        let productType = this.getProductTypeForLogistic('TRANSPORT');
        let industrySpecialization = this.getIndustrySpecializationForLogistics('TRANSPORT');
        let originAddress = this.getOriginAddressForLogistics('TRANSPORT');
        let destinationAddress = this.getDestinationAddressForLogistics('TRANSPORT');
        for(let itemProperty of catalogueLine.goodsItem.item.additionalItemProperty){
            if(itemProperty.uri == 'http://www.aidimme.es/FurnitureSectorOntology.owl#managedProductType'){
                itemProperty.value = productType;
            }
            else if(itemProperty.uri == 'http://www.aidimme.es/FurnitureSectorOntology.owl#industrySpecialization'){
                itemProperty.value = industrySpecialization;
            }
            else if(itemProperty.uri == "http://www.aidimme.es/FurnitureSectorOntology.owl#originTransport"){
                itemProperty.value = originAddress.value;
            }
            else if(itemProperty.uri == "http://www.aidimme.es/FurnitureSectorOntology.owl#destinationTransport"){
                itemProperty.value = destinationAddress.value;
            }
        }
    }

    // publish or save

    onPublish(exitThePage:boolean) {
        if(this.publishStateService.publishMode === 'edit' || this.publishStateService.publishMode === 'copy') {

            if(this.publishStateService.publishMode === 'edit'){
                // update existing service
                this.saveEditedProduct(exitThePage,[this.catalogueLine]);
            }
            else{
                // publish the new service
                this.publish([this.catalogueLine],exitThePage);
            }
        }
        else{
            if(this.selectedTabSinglePublish == "TRANSPORT"){
                let transportServiceCatalogueLines:CatalogueLine[] = [];
                let transportServicePublishModes:string[] = [];
                if(this.logisticCatalogueLines.has("ROADTRANSPORT")){
                    this.copyMissingAdditionalItemPropertiesAndAddresses(this.logisticCatalogueLines.get("ROADTRANSPORT"));
                    transportServiceCatalogueLines.push(this.logisticCatalogueLines.get("ROADTRANSPORT"));
                    transportServicePublishModes.push(this.logisticPublishMode.get("ROADTRANSPORT"));
                }
                if(this.logisticCatalogueLines.has("MARITIMETRANSPORT")){
                    this.copyMissingAdditionalItemPropertiesAndAddresses(this.logisticCatalogueLines.get("MARITIMETRANSPORT"));
                    transportServiceCatalogueLines.push(this.logisticCatalogueLines.get("MARITIMETRANSPORT"));
                    transportServicePublishModes.push(this.logisticPublishMode.get("MARITIMETRANSPORT"));
                }
                if(this.logisticCatalogueLines.has("AIRTRANSPORT")){
                    this.copyMissingAdditionalItemPropertiesAndAddresses(this.logisticCatalogueLines.get("AIRTRANSPORT"));
                    transportServiceCatalogueLines.push(this.logisticCatalogueLines.get("AIRTRANSPORT"));
                    transportServicePublishModes.push(this.logisticPublishMode.get("AIRTRANSPORT"));
                }
                if(this.logisticCatalogueLines.has("RAILTRANSPORT")){
                    this.copyMissingAdditionalItemPropertiesAndAddresses(this.logisticCatalogueLines.get("RAILTRANSPORT"));
                    transportServiceCatalogueLines.push(this.logisticCatalogueLines.get("RAILTRANSPORT"));
                    transportServicePublishModes.push(this.logisticPublishMode.get("RAILTRANSPORT"));
                }

                let validCatalogueLinesToBePublished:CatalogueLine[] = [];
                let validCatalogueLinesToBeUpdated:CatalogueLine[] = [];

                for(let i = 0; i < transportServiceCatalogueLines.length ; i++){
                    if(this.itemHasName(transportServiceCatalogueLines[i].goodsItem.item)){
                        // be sure that its transportation service details is not null
                        transportServiceCatalogueLines[i].goodsItem.item.transportationServiceDetails = new TransportationService();

                        if(transportServicePublishModes[i] == 'edit'){
                            validCatalogueLinesToBeUpdated.push(transportServiceCatalogueLines[i]);
                        }else{
                            validCatalogueLinesToBePublished.push(transportServiceCatalogueLines[i]);
                        }
                    }
                }

                if(validCatalogueLinesToBePublished.length > 0){
                    this.publish(validCatalogueLinesToBePublished,exitThePage);
                }
                if(validCatalogueLinesToBeUpdated.length > 0){
                    this.saveEditedProduct(exitThePage,validCatalogueLinesToBeUpdated);
                }

            } else{
                if(this.logisticPublishMode.get(this.selectedTabSinglePublish) === "create" || this.logisticPublishMode.get(this.selectedTabSinglePublish) === "copy"){
                    // publish new service
                    this.publish([this.logisticCatalogueLines.get(this.selectedTabSinglePublish)], exitThePage);
                }
                else{
                    // update the existing service
                    this.saveEditedProduct(exitThePage,[this.logisticCatalogueLines.get(this.selectedTabSinglePublish)]);
                }
            }
        }
    }

    private publish(catalogueLines:CatalogueLine[],exitThePage:boolean){
        this.publishStatus.submit();

        let splicedCatalogueLines: CatalogueLine[] = [];
        // remove unused properties from catalogueLine
        for(let catalogueLine of catalogueLines){
            splicedCatalogueLines.push(this.removeEmptyProperties(catalogueLine));
        }

        if (this.catalogueService.catalogueResponse.catalogueUuid == null) {
            const userId = this.cookieService.get("user_id");
            this.userService.getUserParty(userId).then(userParty => {
                // create the catalogue
                let catalogue:Catalogue = new Catalogue("default", null, userParty, "", "", []);
                // add catalogue lines to the end of catalogue
                for(let catalogueLine of splicedCatalogueLines){
                    catalogue.catalogueLine.push(catalogueLine);
                }

                this.catalogueService.postCatalogue(catalogue)
                    .then(() => this.onSuccessfulPublish(exitThePage,splicedCatalogueLines))
                    .catch(err => {
                        this.onFailedPublish(err);
                    })
            }).catch(err => {
                this.onFailedPublish(err);
            });

        } else {
            // TODO: create a service to add multiple catalogue lines
            for(let catalogueLine of splicedCatalogueLines){
                this.catalogueService.addCatalogueLine(this.catalogueService.catalogueResponse.catalogueUuid,JSON.stringify(catalogueLine))
                    .then(() => {
                        this.onSuccessfulPublish(exitThePage,[catalogueLine]);
                    })
                    .catch(err=> this.onFailedPublish(err))
            }
        }
    }

    // Should be called on save
    private saveEditedProduct(exitThePage:boolean, catalogueLines:CatalogueLine[]): void {
        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        this.publishStatus.submit();

        let splicedCatalogueLines: CatalogueLine[] = [];
        // remove unused properties from catalogueLine
        for(let catalogueLine of catalogueLines){
            splicedCatalogueLines.push(this.removeEmptyProperties(catalogueLine));
        }

        // TODO: create a service to update multiple catalogue lines
        for(let catalogueLine of splicedCatalogueLines){
            this.catalogueService.updateCatalogueLine(this.catalogueService.catalogueResponse.catalogueUuid,JSON.stringify(catalogueLine))
                .then(() => this.onSuccessfulPublish(exitThePage,[catalogueLine]))
                .then(() => this.changePublishModeToCreate())
                .catch(err => {
                    this.onFailedPublish(err);
                });
        }
    }

    // changes publishMode to create
    private changePublishModeToCreate():void{
        this.changePublishModeCreate = true;
    }

    private onFailedPublish(err): void {
        this.publishStatus.error(err);
        this.submitted = false;
        this.error_detc = true;
        if(err.status == 406){
            this.sameIdError = true;
            this.erroneousID = this.catalogueLine.id;
        }
        else{
            this.sameIdError = false;
        }
    }

    // catalogueLineId is the id of catalogue line created or edited
    private onSuccessfulPublish(exitThePage:boolean,catalogueLines:CatalogueLine[]): void {
        let catalogueLineIds:string[] = catalogueLines.map(catalogueLine => catalogueLine.id);

        let userId = this.cookieService.get("user_id");
        this.userService.getUserParty(userId).then(party => {
            this.catalogueService.getCatalogueResponse(userId).then(catalogueResponse => {
                this.catalogueService.getCatalogueLines(catalogueResponse.catalogueUuid,catalogueLineIds).then(catalogueLines => {
                    // go to the dashboard - catalogue tab
                    if(exitThePage){
                        this.catalogueLine = UBLModelUtils.createCatalogueLine(catalogueResponse.catalogueUuid,
                            party, this.companyNegotiationSettings);

                        // since every changes is saved,we do not need a dialog box
                        this.dialogBox = false;

                        this.router.navigate(['dashboard'], {
                            queryParams: {
                                tab: "CATALOGUE",
                            }
                        });
                    }
                    // stay in this page and allow the user to edit his product/service
                    else{

                        if(this.publishStateService.publishMode == 'create'){
                            for(let catalogueLine of catalogueLines){
                                for(let serviceType of this.availableLogisticsServices){
                                    if(catalogueLine.id == this.logisticCatalogueLines.get(serviceType).id){
                                        // add missing additional item properties
                                        this.addMissingAdditionalItemProperties(catalogueLine);
                                        this.logisticCatalogueLines.set(serviceType,catalogueLine);
                                        this.logisticPublishMode.set(serviceType,'edit');
                                        break;
                                    }
                                }
                            }
                            // be sure that each logistics catalogue line has a reference to the catalogue
                            for(let serviceType of this.availableLogisticsServices){
                                this.logisticCatalogueLines.get(serviceType).goodsItem.item.catalogueDocumentReference.id = catalogueResponse.catalogueUuid;
                            }
                        } else{
                            // since there is only one catalogue line
                            this.catalogueLine = catalogueLines[0];
                            // add missing additional item properties
                            this.addMissingAdditionalItemProperties(this.catalogueLine);
                            // we need to change publish mode to 'edit' since we published the product/service
                            this.publishStateService.publishMode = "edit";
                        }
                    }
                    this.catalogueService.draftCatalogueLine = this.catalogueLine;

                    this.publishStatus.callback("Successfully Submitted", true);

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

    onBack() {
        this.location.back();
    }

}
