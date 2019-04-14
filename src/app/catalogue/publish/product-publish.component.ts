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
import {isValidPrice} from "../../common/utils";
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
import {LANGUAGES, DEFAULT_LANGUAGE} from '../model/constants';
import * as myGlobals from '../../globals';
import {CataloguePaginationResponse} from '../model/publish/catalogue-pagination-response';


type ProductType = "product" | "transportation";
import {Text} from "../model/publish/text";
import {Catalogue} from '../model/publish/catalogue';
import {Item} from '../model/publish/item';
import {TransportationService} from '../model/publish/transportation-service';
import {CommodityClassification} from '../model/publish/commodity-classification';

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
    selectedCategories: Category[];
    publishStatus: CallStatus = new CallStatus();
    publishingGranularity: "single" | "bulk" = "single";
    productCategoryRetrievalStatus: CallStatus = new CallStatus();
    ngUnsubscribe: Subject<void> = new Subject<void>();
    productType: ProductType;
    isLogistics: boolean;

    /*
     * Values for Single only
     */

    catalogueLine: CatalogueLine = null;
    logisticCatalogueLines: CatalogueLine[] = null;
    productWrapper: ProductWrapper = null;
    companyNegotiationSettings: CompanyNegotiationSettings;
    selectedTabSinglePublish: "DETAILS" | "ROAD"| "MARITIME" | "AIR" | "RAIL" | "WAREHOUSING" | "CUSTOMSMANAGEMENT" | "INHOUSESERVICES" | "REVERSELOGISTICS" | "ORDERPICKING" | "DELIVERY_TRADING" | "PRICE" | "CERTIFICATES" | "TRACK_TRACE" | "LCPA" | "TRANSPORT" | "LOGISTICSCONSULTANCY" = "DETAILS";
    private selectedProperties: SelectedProperties = {};
    private categoryProperties: CategoryProperties = {};
    private lunrIndex: lunr.Index;
    private currentLunrSearchId: string;
    private selectedPropertiesUpdates: SelectedPropertiesUpdate = {};
    selectedProperty: ItemProperty;
    categoryModalPropertyKeyword: string = "";
    @ViewChild(EditPropertyModalComponent)
    private editPropertyModal: EditPropertyModalComponent;
    customProperties: any[] = [];
    callStatus: CallStatus = new CallStatus();

    /*
     * Other Values
     */

    @ViewChild('propertyValueType') propertyValueType: ElementRef;

    // placeholder for the custom property
    private newProperty: ItemProperty = UBLModelUtils.createAdditionalItemProperty(null, null);
    // form model to be provided as root model to the inner components used in publishing
    publishForm: FormGroup = new FormGroup({});

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

    logisticCatalogueLineIndexMap:Map<string,number[]> = new Map<string, number[]>();
    private logisticCategoryIds = "0173-1#01-AGD951#001,0173-1#01-AGD936#001,0173-1#01-AGD954#001,0173-1#01-AGD963#001,0173-1#01-AGD971#001,0173-1#01-AGD948#001,0173-1#01-AGE137#001,0173-1#01-AGD955#001,0173-1#01-AGD945#001,0173-1#01-AGD957#001";
    private logisticCategoryTaxonomyIds = "eClass,eClass,eClass,eClass,eClass,eClass,eClass,eClass,eClass,eClass";

    logisticPublishMode:string[] = []

    singleTabForLogisticServices = false;

    constructor(public categoryService: CategoryService,
                private catalogueService: CatalogueService,
                public publishStateService: PublishService,
                private userService: UserService,
                private route: ActivatedRoute,
                private router: Router,
                private location: Location,
                private cookieService: CookieService,
                private modalService: NgbModal) {
    }

    ngOnInit() {
        this.selectedCategories = this.categoryService.selectedCategories;
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
            //set product type
            this.productType = params["productType"] === "transportation" ? "transportation" : "product";
            this.isLogistics = (this.productType === "transportation");
            if(this.isLogistics) {
                this.publishStateService.publishedProductNature = 'Transportation service';
                // update the selected tab
                this.selectedTabSinglePublish = "TRANSPORT";
            } else {
                this.publishStateService.publishedProductNature = 'Regular product';
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

    ngOnDestroy() {
        this.ngUnsubscribe.next()
    }

    selectPreferredName(cp: Category | Property) {
        return selectPreferredName(cp);
    }

    /*
     * Event Handlers
     */

    onSelectTab(event: any) {
        event.preventDefault();
        if(event.target.id === "singleUpload") {
            this.publishingGranularity = "single";
        } else {
            this.publishingGranularity = "bulk";
        }
    }

    onSelectTabSinglePublish(event: any) {
        event.preventDefault();
        this.selectedTabSinglePublish = event.target.id;
    }

    onAddImage(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let images = this.catalogueLine.goodsItem.item.productImage;

            for (let i = 0; i < fileList.length; i++) {
                let file: File = fileList[i];
                const filesize = parseInt(((file.size/1024)/1024).toFixed(4));
                if (filesize <= 5) {
                  let reader = new FileReader();

                  reader.onload = function (e: any) {
                      let base64String = (reader.result as string).split(',').pop();
                      let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
                      images.push(binaryObject);
                  };
                  reader.readAsDataURL(file);
                }
                else {
                  alert("Maximum allowed filesize: 5 MB");
                }
            }
        }
    }

    onRemoveImage(index: number): void {
        this.catalogueLine.goodsItem.item.productImage.splice(index, 1);
    }

    onClickImageRecommendations(content): void {
        this.modalService.open(content);
    }

    /**
     * deselect a category
     * 1) remove the property from additional item properties
     * 2) remove the category from the selected categories
     * 3) remove the corresponding commodity classification from the item
     */
    onRemoveCategory(category:Category) {
        let index = this.categoryService.selectedCategories.findIndex(c => c.id === category.id);
        if (index > -1) {
            this.catalogueLine.goodsItem.item.additionalItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.filter(function (el) {
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
        if(event) {
            event.preventDefault();
        }
        if(dismissModal) {
            dismissModal("add category");
        }
        ProductPublishComponent.dialogBox = false;
        this.router.navigate(['catalogue/categorysearch'], { queryParams: { pageRef: "publish", pg: this.publishingGranularity, productType: this.productType }});
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
        if(isCustomProperty(property)) {
            const index = properties.indexOf(property);
            if(index >= 0) {
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

    onPublish(exitThePage:boolean) {

        if(this.isLogistics){

            if(this.publishStateService.publishMode === 'edit') {

                // remove unused properties from catalogueLine
                const splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
                // nullify the transportation service details if a regular product is being published
                this.checkProductNature(splicedCatalogueLine);


                // update existing service
                this.saveEditedProduct(exitThePage,[splicedCatalogueLine]);
            }
            else{
                let indexes:number[] = this.logisticCatalogueLineIndexMap.get(this.selectedTabSinglePublish);
                if(indexes.length > 1){

                    this.copyMissingAdditionalItemProperties(this.logisticCatalogueLines[indexes[1]]);
                    this.copyMissingAdditionalItemProperties(this.logisticCatalogueLines[indexes[2]]);
                    this.copyMissingAdditionalItemProperties(this.logisticCatalogueLines[indexes[3]]);

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
                        this.publishLogisticService(exitThePage, [this.logisticCatalogueLines[indexes[0]]]);
                    }
                    else{
                        // update the existing service
                        this.saveEditedProduct(exitThePage,[this.logisticCatalogueLines[indexes[0]]]);
                    }
                }
            }
        } else{
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
                this.saveEditedProduct(exitThePage,[splicedCatalogueLine]);
            }
        }
    }

    publishLogisticService(exitThePage:boolean,catalogueLines:CatalogueLine[]){
        // be sure that its transportation service details is not null
        for(let catalogueLine of catalogueLines){
            catalogueLine.goodsItem.item.transportationServiceDetails = new TransportationService();
        }

        // Publish the service
        this.publish(catalogueLines,exitThePage);
    }

    private copyMissingAdditionalItemProperties(catalogueLine:CatalogueLine){
        let productType = this.getProductTypeForLogistic(0);
        let industrySpecialization = this.getIndustrySpecializationForLogistics(0);
        for(let itemProperty of catalogueLine.goodsItem.item.additionalItemProperty){
            if(itemProperty.name[0].value == "Product Type"){
                itemProperty.value = productType;
            }
            else if(itemProperty.name[0].value == "Industry Specialization"){
                itemProperty.value = industrySpecialization;
            }
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
        if(!this.categoryProperties[code]) {
            this.categoryProperties[code] = sortProperties([...category.properties]);
        }
        return this.categoryProperties[code];
    }

    isCategoryPropertySelected(category: Category, property: Property): boolean {
        const key = getPropertyKey(property);
        const selectedProp = this.selectedProperties[key];
        return selectedProp.selected;
    }

    selectAllProperties(category: Category, event?: Event): any {
      if(event) {
          event.preventDefault();
      }
      var properties = this.getCategoryProperties(category);
      for(let property of properties) {
        if (!this.isCategoryPropertySelected(category,property))
          this.onToggleCategoryPropertySelected(category,property);
      }
    }

    selectNoProperties(category: Category, event?: Event): any {
      if(event) {
          event.preventDefault();
      }
      var properties = this.getCategoryProperties(category);
      for(let property of properties) {
        if (this.isCategoryPropertySelected(category,property))
          this.onToggleCategoryPropertySelected(category,property);
      }
    }

    getPropertyType(property: Property): string {
        return sanitizeDataTypeName(property.dataType);
    }

    isValidCatalogueLine(): boolean {
        // must have a name
        return this.itemHasName(this.catalogueLine.goodsItem.item);
    }

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

    private itemHasName(item:Item):boolean{
        return item.name[0] && item.name[0].value !== "";
    }

    getProductTypeForLogistic(index:number){
        let item:Item = this.getItemForLogisticCatalogueLine(index);
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
        let item:Item = this.getItemForLogisticCatalogueLine(index);
        for(let itemProperty of item.additionalItemProperty){
            if(itemProperty.name[0].value == "Industry Specialization"){
                return itemProperty.value;
            }
        }

        let itemProperty = UBLModelUtils.createIndustrySpecializationAdditionalItemProperty();
        item.additionalItemProperty.push(itemProperty);
        return itemProperty.value;
    }

    getDefaultPropertyForLogistics(index:number,propertyName:string = null){
        let item:Item = this.getItemForLogisticCatalogueLine(index);

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

    addItemNameDescription() {
      let newItemName: Text = new Text("",DEFAULT_LANGUAGE());
      let newItemDescription: Text = new Text("",DEFAULT_LANGUAGE());
      this.catalogueLine.goodsItem.item.name.push(newItemName);
      this.catalogueLine.goodsItem.item.description.push(newItemDescription);
    }

    private recomputeSelectedProperties() {
        const oldSelectedProps = this.selectedProperties;
        this.selectedProperties = {};
        const newSelectedProps = this.selectedProperties;

        for(const category of this.selectedCategories) {
            if(category.properties){
                for(const property of category.properties) {
                    const key = getPropertyKey(property);
                    if(!this.selectedProperties[key]) {
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
        switch(property.valueQualifier) {
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
        switch(property.valueQualifier) {
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
        if(property.value.length === 0) {
          if (property.valueQualifier == "BOOLEAN") {
              property.value.push(createText('false'));
          } else {
              property.value.push(createText(''));
          }
        }
        if(property.valueDecimal.length === 0) {
            property.valueDecimal.push(0);
        }
        if(property.valueQuantity.length === 0) {
            property.valueQuantity.push(new Quantity());
        }
    }

    getDefinition(property: ItemProperty): string {
      const key = getPropertyKey(property);
      let selProp = this.selectedProperties[key];
      if(!selProp) {
          return "No definition."
      }
      for(const prop of selProp.properties) {
          if(prop.definition && prop.definition !== "") {
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

    setBooleanValue(property: ItemProperty, i: number, event:any) {
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

                if(selected) {
                    // add property if not there
                    for(let i = 0; i < property.properties.length; i++) {
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
        if(this.categoryModalPropertyKeyword === "") {
            return true;
        }

        const key = getPropertyKey(property);
        return this.selectedProperties[key].lunrSearchId === this.currentLunrSearchId;
    }

    /*
     * Other Stuff
     */

    canDeactivate(): boolean {
        if(this.changePublishModeCreate) {
            this.publishStateService.publishMode = 'create';
            this.publishStateService.publishingStarted = false;
        }
        if(ProductPublishComponent.dialogBox) {
            let x:boolean = confirm("You will lose any changes you made, are you sure you want to quit ?");
            if(x){
                this.publishStateService.publishMode = 'create';
                this.publishStateService.publishingStarted = false;
            }
            return x;
        }
        ProductPublishComponent.dialogBox = true;
        return true;
    }

    getItemForLogisticCatalogueLine(index:number){
        if(this.publishMode == 'create'){
            return this.logisticCatalogueLines[index].goodsItem.item;
        }
        return this.catalogueLine.goodsItem.item;
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
                this.router.navigate(['catalogue/publish']);
                return;
            }

            // show only one tab
            this.singleTabForLogisticServices = true;

            this.selectedTabSinglePublish = this.getSelectedTabForLogisticServices();

            this.productWrapper = new ProductWrapper(this.catalogueLine, settings);

            // Get categories of item to edit
            if(this.publishStateService.publishingStarted == false) {
                let classificationCodes: Code[] = [];
                for (let classification of this.catalogueLine.goodsItem.item.commodityClassification) {
                    classificationCodes.push(classification.itemClassificationCode);
                }

                if (classificationCodes.length > 0) {
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
                            this.ngUnsubscribe.complete();
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
                if(this.isLogistics){
                    this.logisticCatalogueLines = UBLModelUtils.createCatalogueLinesForLogistics(catalogueResponse.catalogueUuid, userParty, settings, logisticCategories);
                    this.populateLogisticCatalogueLinesMap();
                    this.populateLogisticPublishMode();
                }else{
                    this.catalogueLine = UBLModelUtils.createCatalogueLine(catalogueResponse.catalogueUuid, userParty, settings);
                    this.catalogueService.draftCatalogueLine = this.catalogueLine;
                }
            } else {
                this.catalogueLine = this.catalogueService.draftCatalogueLine;
            }
            if(this.catalogueLine){
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
        this.recomputeSelectedProperties();
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

    private updateItemWithNewCategory(category: Category): void {
        this.catalogueLine.goodsItem.item.commodityClassification.push(UBLModelUtils.createCommodityClassification(category));
    }

    // should be called on publish new product
    private publishProduct(exitThePage:boolean): void {

        // remove unused properties from catalogueLine
        let splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
        // nullify the transportation service details if a regular product is being published
        this.checkProductNature(splicedCatalogueLine);

        this.publish([splicedCatalogueLine],exitThePage);
    }

    private publish(catalogueLines:CatalogueLine[],exitThePage:boolean){
        this.publishStatus.submit();
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
                        ProductPublishComponent.dialogBox = false;
                        // avoid category duplication
                        this.categoryService.resetSelectedCategories();
                        this.publishStateService.resetData();

                        this.router.navigate(['dashboard'], {
                            queryParams: {
                                tab: "CATALOGUE",
                            }
                        });
                    }
                    // stay in this page and allow the user to edit his product/service
                    else{

                        if(this.publishStateService.publishMode == 'create' && this.isLogistics){
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


    private onValueTypeChange(event: any) {
        if (event.target.value == "Text") {
            this.newProperty.valueQualifier = "STRING";
        } else if (event.target.value == "Number") {
            this.newProperty.valueQualifier = "NUMBER";
        } else if (event.target.value == "Image" || event.target.value == "File") {
            this.newProperty.valueQualifier = "BINARY";
        } else if(event.target.value == "Quantity"){
            this.newProperty.valueQualifier = "QUANTITY";
        } else if(event.target.value == "Boolean"){
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

                reader.onload = function (e: any) {
                    let base64String = (reader.result as string).split(',').pop();
                    let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
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

                reader.onload = function (e: any) {
                    let base64String = (reader.result as string).split(',').pop();
                    let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
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
        if (this.newProperty.valueQualifier == "BOOLEAN"){
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
        else if (this.newProperty.valueQualifier == "QUANTITY"){
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

        } else if (this.newProperty.valueQualifier == "BINARY") {
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
        this.quantity = new Quantity(null,null);
        this.propertyValueType.nativeElement.selectedIndex = 0;

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
}
