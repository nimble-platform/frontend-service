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
import {Country} from '../model/publish/country';
import {Text} from '../model/publish/text';
import {Address} from '../model/publish/address';
import {TransportationService} from '../model/publish/transportation-service';
import {Catalogue} from '../model/publish/catalogue';

@Component({
    selector: "logistic-service-publish",
    templateUrl: "./logistic-service-publish.component.html"
})
export class LogisticServicePublishComponent implements OnInit {

    constructor(public categoryService: CategoryService,
                private catalogueService: CatalogueService,
                public publishStateService: PublishService,
                private userService: UserService,
                private route: ActivatedRoute,
                private router: Router,
                private location: Location,
                private cookieService: CookieService) {
    }

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

    // logistic categories
    private logisticCategoryIds = "0173-1#01-AGD951#001,0173-1#01-AGD936#001,0173-1#01-AGD954#001,0173-1#01-AGD963#001,0173-1#01-AGD971#001,0173-1#01-AGD948#001,0173-1#01-AGE137#001,0173-1#01-AGD955#001,0173-1#01-AGD945#001,0173-1#01-AGD957#001";
    private logisticCategoryTaxonomyIds = "eClass,eClass,eClass,eClass,eClass,eClass,eClass,eClass,eClass,eClass";
    // tabs
    selectedTabSinglePublish: "ROAD"| "MARITIME" | "AIR" | "RAIL" | "WAREHOUSING" | "CUSTOMSMANAGEMENT" | "INHOUSESERVICES" | "REVERSELOGISTICS" | "ORDERPICKING" | "DELIVERY_TRADING" | "PRICE" | "CERTIFICATES" | "TRACK_TRACE" | "LCPA" | "TRANSPORT" | "LOGISTICSCONSULTANCY" = "TRANSPORT";
    // whether we need to show available tabs or not
    singleTabForLogisticServices = false;
    // variables used in 'create' mode
    logisticCatalogueLineIndexMap:Map<string,number[]> = new Map<string, number[]>();
    // publish mode of each logistic service
    logisticPublishMode:string[] = [];
    logisticCatalogueLines: CatalogueLine[] = null;

    dialogBox = true;

    ngOnInit() {
        const userId = this.cookieService.get("user_id");
        this.callStatus.submit();
        this.userService.getUserParty(userId).then(party => {
            return Promise.all([
                Promise.resolve(party),
                this.catalogueService.getCatalogueResponse(userId),
                this.userService.getCompanyNegotiationSettingsForParty(UBLModelUtils.getPartyId(party)),
                this.categoryService.getCategoriesForIds(this.logisticCategoryTaxonomyIds,this.logisticCategoryIds)
            ])
        })
            .then(([party, catalogueResponse, settings, logisticCategories]) => {
                this.initView(party, catalogueResponse, settings,logisticCategories);
                this.publishStateService.publishingStarted = true;
                this.callStatus.callback("Successfully initialized.", true);
            })
            .catch(error => {
                this.callStatus.error("Error while initializing the publish view.", error);
            });

        this.route.queryParams.subscribe((params: Params) => {
            // handle publishing granularity: single, bulk, null
            this.publishingGranularity = params['pg'];
            if(this.publishingGranularity == null) {
                this.publishingGranularity = 'single';
            }
        });
    }

    populateLogisticCatalogueLinesMap(){
        this.logisticCatalogueLineIndexMap.set("TRANSPORT",[0,1,2,3]);
        this.logisticCatalogueLineIndexMap.set("WAREHOUSING",[4]);
        this.logisticCatalogueLineIndexMap.set("ORDERPICKING",[5]);
        this.logisticCatalogueLineIndexMap.set("REVERSELOGISTICS",[6]);
        this.logisticCatalogueLineIndexMap.set("INHOUSESERVICES",[7]);
        this.logisticCatalogueLineIndexMap.set("CUSTOMSMANAGEMENT",[8]);
        this.logisticCatalogueLineIndexMap.set("LOGISTICSCONSULTANCY",[9]);
    }

    populateLogisticPublishMode(){
        this.logisticPublishMode = ['create','create','create','create','create','create','create','create','create','create'];
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

    private initView(userParty, catalogueResponse:CataloguePaginationResponse, settings, logisticCategories): void {
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
            if (this.catalogueLine == null) {
                this.publishStateService.publishMode = 'create';
                this.router.navigate(['catalogue/publish-logistic']);
                return;
            }

            // show only one tab
            this.singleTabForLogisticServices = true;

            this.selectedTabSinglePublish = this.getSelectedTabForLogisticServices();

        } else {
            // new publishing is the first entry to the publishing page
            // i.e. publishing from scratch
            if (this.publishStateService.publishingStarted == false) {
                this.logisticCatalogueLines = UBLModelUtils.createCatalogueLinesForLogistics(catalogueResponse.catalogueUuid, userParty, settings, logisticCategories);
                this.populateLogisticCatalogueLinesMap();
                this.populateLogisticPublishMode();
            }
        }
    }

    // getters
    getLogisticCatalogueLine(index:number):CatalogueLine{
        if(this.publishMode == 'create'){
            return this.logisticCatalogueLines[index];
        }
        return this.catalogueLine;
    }

    private getSelectedTabForLogisticServices(){
        for(let commodityClassification of this.catalogueLine.goodsItem.item.commodityClassification){
            if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGD951#001")
                return "ROAD";
            else if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGD936#001")
                return "MARITIME";
            else if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGD954#001")
                return "AIR";
            else if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGD963#001")
                return "RAIL";
            else if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGD971#001")
                return "WAREHOUSING";
            else if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGD948#001")
                return "ORDERPICKING";
            else if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGE137#001")
                return "REVERSELOGISTICS";
            else if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGD955#001")
                return "INHOUSESERVICES";
            else if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGD945#001")
                return "CUSTOMSMANAGEMENT";
            else if(commodityClassification.itemClassificationCode.uri == "http://www.nimble-project.org/resource/eclass#0173-1#01-AGD957#001")
                return "LOGISTICSCONSULTANCY";
        }
    }

    getBinaryObjectsForLogisticService(index:number){
        let binaryObjects:BinaryObject[] = [];


        if(this.publishStateService.publishMode == 'create'){
            binaryObjects = this.logisticCatalogueLines[index].goodsItem.item.itemSpecificationDocumentReference.map(doc => doc.attachment.embeddedDocumentBinaryObject)
        } else{
            binaryObjects = this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.map(doc => doc.attachment.embeddedDocumentBinaryObject)
        }

        return binaryObjects;
    }

    getProductTypeForLogistic(index:number){
        let item:Item = this.getLogisticCatalogueLine(index).goodsItem.item;
        for(let itemProperty of item.additionalItemProperty){
            if(itemProperty.name[0].value == "Product Type"){
                return itemProperty.value;
            }
        }

        let itemProperty = UBLModelUtils.createProductTypeAdditionalItemProperty();
        item.additionalItemProperty.push(itemProperty);
        return itemProperty.value;
    }

    getIndustrySpecializationForLogistics(index:number){
        let item:Item = this.getLogisticCatalogueLine(index).goodsItem.item;
        for(let itemProperty of item.additionalItemProperty){
            if(itemProperty.name[0].value == "Industry Specialization"){
                return itemProperty.value;
            }
        }

        let itemProperty = UBLModelUtils.createIndustrySpecializationAdditionalItemProperty();
        item.additionalItemProperty.push(itemProperty);
        return itemProperty.value;
    }

    getOriginAddressForLogistics(index:number){
        let item:Item = this.getLogisticCatalogueLine(index).goodsItem.item;
        for(let itemProperty of item.additionalItemProperty){
            if(itemProperty.name[0].value == "Origin Address"){
                return itemProperty.value;
            }
        }

        let itemProperty = UBLModelUtils.createOriginAddressAdditionalItemProperty();
        item.additionalItemProperty.push(itemProperty);
        return itemProperty.value;
    }

    getDefaultPropertyForLogistics(index:number,propertyName:string = null){
        let item:Item = this.getLogisticCatalogueLine(index).goodsItem.item;

        let itemProperty:ItemProperty = null;
        for(let ip of item.additionalItemProperty){
            if(ip.name[0].value != "Industry Specialization" && ip.name[0].value != "Product Type"){
                if(propertyName && ip.name[0].value == propertyName){
                    return ip.value;
                } else{
                    itemProperty = ip;
                }
            }
        }

        if(itemProperty){
            return itemProperty.value;
        }

        let itemProperties = UBLModelUtils.createItemPropertiesForLogistics(index);

        for(let itemProperty of itemProperties){
            item.additionalItemProperty.push(itemProperty);
        }

        return itemProperties[0].value;
    }
    // methods to select/unselect files for Transport logistic services
    onSelectFileForLogisticService(binaryObject: BinaryObject,index:number){
        const document: DocumentReference = new DocumentReference();
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;

        if(this.publishStateService.publishMode == 'create'){
            this.logisticCatalogueLines[index].goodsItem.item.itemSpecificationDocumentReference.push(document);
        } else{
            this.catalogueLine.goodsItem.item.itemSpecificationDocumentReference.push(document);
        }
    }

    onUnSelectFileForLogisticService(binaryObject: BinaryObject, index:number){
        if(this.publishStateService.publishMode == 'create'){
            const i = this.logisticCatalogueLines[index].goodsItem.item.itemSpecificationDocumentReference.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
            if(i >= 0) {
                this.logisticCatalogueLines[i].goodsItem.item.itemSpecificationDocumentReference.splice(i, 1);
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
            let indexes:number[] = this.logisticCatalogueLineIndexMap.get(this.selectedTabSinglePublish);
            for(let index of indexes){
                if(this.itemHasName(this.logisticCatalogueLines[index].goodsItem.item)){
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

    private checkProductNature(catalogueLine: CatalogueLine) {
        if(this.publishStateService.publishedProductNature == 'Regular product') {
            catalogueLine.goodsItem.item.transportationServiceDetails = null;
        }
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
        let productType = this.getProductTypeForLogistic(0);
        let industrySpecialization = this.getIndustrySpecializationForLogistics(0);
        let originAddress = this.getOriginAddressForLogistics(0);
        for(let itemProperty of catalogueLine.goodsItem.item.additionalItemProperty){
            if(itemProperty.name[0].value == "Product Type"){
                itemProperty.value = productType;
            }
            else if(itemProperty.name[0].value == "Industry Specialization"){
                itemProperty.value = industrySpecialization;
            }
            else if(itemProperty.name[0].value == "Origin Address"){
                itemProperty.value = originAddress;
            }
        }
        // destination address
        for(let address of this.logisticCatalogueLines[0].requiredItemLocationQuantity.applicableTerritoryAddress){
            let country:Country = null;
            if(address.country.name){
                country = new Country(new Text(address.country.name.value));
            }

            let newAddress:Address = new Address(address.cityName,address.region,address.postalZone,address.buildingNumber,address.streetName,country);

            catalogueLine.requiredItemLocationQuantity.applicableTerritoryAddress.push(newAddress);
        }
    }

    // publish or save

    onPublish(exitThePage:boolean) {
        if(this.publishStateService.publishMode === 'edit' || this.publishStateService.publishMode === 'copy') {

            // remove unused properties from catalogueLine
            const splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
            // nullify the transportation service details if a regular product is being published
            this.checkProductNature(splicedCatalogueLine);

            if(this.publishStateService.publishMode === 'edit'){
                // update existing service
                this.saveEditedProduct(exitThePage,[splicedCatalogueLine]);
            }
            else{
                // publish the new service
                this.publish([splicedCatalogueLine],exitThePage);
            }
        }
        else{
            let indexes:number[] = this.logisticCatalogueLineIndexMap.get(this.selectedTabSinglePublish);
            if(indexes.length > 1){

                this.copyMissingAdditionalItemPropertiesAndAddresses(this.logisticCatalogueLines[indexes[1]]);
                this.copyMissingAdditionalItemPropertiesAndAddresses(this.logisticCatalogueLines[indexes[2]]);
                this.copyMissingAdditionalItemPropertiesAndAddresses(this.logisticCatalogueLines[indexes[3]]);

                let validCatalogueLinesToBePublished:CatalogueLine[] = [];
                let validCatalogueLinesToBeUpdated:CatalogueLine[] = [];

                for(let i = 0; i < 4 ; i++){
                    if(this.itemHasName(this.logisticCatalogueLines[i].goodsItem.item)){
                        // be sure that its transportation service details is not null
                        this.logisticCatalogueLines[i].goodsItem.item.transportationServiceDetails = new TransportationService();

                        if(this.logisticPublishMode[i] == 'edit'){
                            validCatalogueLinesToBeUpdated.push(this.logisticCatalogueLines[i]);
                        }else{
                            validCatalogueLinesToBePublished.push(this.logisticCatalogueLines[i]);
                        }
                    }
                }

                if(validCatalogueLinesToBePublished.length > 0){
                    this.publish(validCatalogueLinesToBePublished,exitThePage);
                }
                if(validCatalogueLinesToBeUpdated.length > 0){
                    this.saveEditedProduct(exitThePage,validCatalogueLinesToBeUpdated);
                }
            }
            else{
                if(this.logisticPublishMode[indexes[0]] === "create" || this.logisticPublishMode[indexes[0]] === "copy"){
                    // publish new service
                    this.publish([this.logisticCatalogueLines[indexes[0]]], exitThePage);
                }
                else{
                    // update the existing service
                    this.saveEditedProduct(exitThePage,[this.logisticCatalogueLines[indexes[0]]]);
                }
            }
        }
    }

    private publish(catalogueLines:CatalogueLine[],exitThePage:boolean){
        this.publishStatus.submit();
        // be sure that its transportation service details is not null
        for(let catalogueLine of catalogueLines){
            catalogueLine.goodsItem.item.transportationServiceDetails = new TransportationService();
        }

        if (this.catalogueService.catalogueResponse.catalogueUuid == null) {
            const userId = this.cookieService.get("user_id");
            this.userService.getUserParty(userId).then(userParty => {
                // create the catalogue
                let catalogue:Catalogue = new Catalogue("default", null, userParty, "", "", []);
                // add catalogue lines to the end of catalogue
                for(let catalogueLine of catalogueLines){
                    catalogue.catalogueLine.push(catalogueLine);
                }

                this.catalogueService.postCatalogue(catalogue)
                    .then(() => this.onSuccessfulPublish(exitThePage,catalogueLines))
                    .catch(err => {
                        this.onFailedPublish(err);
                    })
            }).catch(err => {
                this.onFailedPublish(err);
            });

        } else {
            // TODO: create a service to add multiple catalogue lines
            for(let catalogueLine of catalogueLines){
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

        // TODO: create a service to update multiple catalogue lines
        for(let catalogueLine of catalogueLines){
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
                                for(let logisticCatalogueLine of this.logisticCatalogueLines){
                                    if(catalogueLine.id == logisticCatalogueLine.id){
                                        let index = this.logisticCatalogueLines.indexOf(logisticCatalogueLine);
                                        this.logisticCatalogueLines[index] = catalogueLine;
                                        this.logisticPublishMode[index] = 'edit';
                                        break;
                                    }
                                }
                            }
                            // be sure that each logistics catalogue line has a reference to the catalogue
                            for(let catalogueLine of this.logisticCatalogueLines){
                                catalogueLine.goodsItem.item.catalogueDocumentReference.id = catalogueResponse.catalogueUuid;
                            }
                        } else{
                            // since there is only one catalogue line
                            this.catalogueLine = catalogueLines[0];
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

}
