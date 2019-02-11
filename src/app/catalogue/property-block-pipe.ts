/**
 * Created by suat on 05-Aug-17.
 */
import {Pipe, PipeTransform} from "@angular/core";
import {ItemProperty} from "./model/publish/item-property";
import {Category} from "./model/category/category";
import {Property} from "./model/category/property";
import {CategoryService} from "./category/category.service";
import {PublishService} from "./publish-and-aip.service";
import {selectPreferredName} from '../common/utils';

/**
 * Pipe to transform the custom properties and properties of selected categories for a product to property blocks to
 * be presented in the user interface.
 */
@Pipe({name: 'propertyBlockPipe'})
export class PropertyBlockPipe implements PipeTransform {
    PROPERTY_BLOCK_FIELD_NAME: string = "name";
    PROPERTY_BLOCK_FIELD_ISCOLLAPSED = "isCollapsed";
    PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";
    PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS = "propertyDetails";

    private selectedCategories: Category[] = [];
    private itemProperties: ItemProperty[] = [];
    private propertyBlocks: Array<any> = [];
    private checkedProperties: Array<{propId:string,categoryId:string}> = [];
    private presentationMode:string;
    private properties:string;

    constructor(private categoryService: CategoryService,
                private publishStateService: PublishService) {
    }

    transform(itemProperties: ItemProperty[], presentationMode:string, properties:string): any {
        this.properties = properties;
        this.selectedCategories = this.categoryService.selectedCategories;
        this.itemProperties = itemProperties;
        this.presentationMode = presentationMode;
        this.propertyBlocks = [];
        this.checkedProperties = [];
        return this.retrievePropertyBlocks();
    }

    retrievePropertyBlocks(): any {
        // custom properties belonging to the item
        if(this.properties == 'Custom'){
            this.createCustomPropertyBlock();
        }
        else{
            // all the properties included in the category
            if(this.presentationMode == 'edit'){
                this.categoryPropertyBlocks();
            }
            // non-custom properties belonging to the item
            else{
                this.createNotCustomProperties();
            }
        }
        return this.propertyBlocks;


    }

    createNotCustomProperties():void{
        this.propertyBlocks = [];

        // put all properties into their blocks
        for (let property of this.itemProperties) {
            if(property.itemClassificationCode.listID === "Custom"){
                continue;
            }
            else if (property.itemClassificationCode.listID === "eClass") {
                let isBaseProperty:boolean = this.isBaseEClassProperty(property.id);
                let blockName = this.getBlockNameForEClass(property.itemClassificationCode.name, isBaseProperty);
                let blockIndex = this.propertyBlocks.findIndex(block => block[this.PROPERTY_BLOCK_FIELD_NAME] == blockName);
                if (blockIndex == -1) {
                    let eClassBlocks = this.createEmptyEClassPropertyBlocks(property.itemClassificationCode.name);
                    this.propertyBlocks.push(eClassBlocks[0]);
                    this.propertyBlocks.push(eClassBlocks[1]);

                    blockIndex = this.propertyBlocks.length - 2;
                    if(!isBaseProperty) {
                        blockIndex++;
                    }
                }

                this.propertyBlocks[blockIndex][this.PROPERTY_BLOCK_FIELD_PROPERTIES].push(property);

            } else {
                let blockName = this.getBlockName(property.itemClassificationCode.name, property.itemClassificationCode.listID);
                let blockIndex = this.propertyBlocks.findIndex(block => block[this.PROPERTY_BLOCK_FIELD_NAME] == blockName);
                if (blockIndex == -1) {
                    let block = this.createEmptyPropertyBlock(property.itemClassificationCode.name, property.itemClassificationCode.listID);
                    this.propertyBlocks.push(block);
                    blockIndex = this.propertyBlocks.length-1;
                }

                this.propertyBlocks[blockIndex][this.PROPERTY_BLOCK_FIELD_PROPERTIES].push(property);
            }
        }
    }


    categoryPropertyBlocks(): void {
        // commodity classifications
        if (this.selectedCategories != null) {
            for (let category of this.selectedCategories) {
                if (category.taxonomyId == 'eClass') {
                    this.createEClassPropertyBlocks(category);
                } else {
                    this.createPropertyBlock(category);
                }
            }
        }
    }

    private createCustomPropertyBlock():void {
        let customPropertyBlock: any = {};
        let name:string = "Custom";

        customPropertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = name;
        customPropertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = this.publishStateService.getCollapsedState(name);

        let customProps:ItemProperty[] = [];
        for(let property of this.itemProperties) {
            if(property.itemClassificationCode.listID == "Custom") {
                customProps.push(property);
                this.checkedProperties.push({propId:property.id,categoryId:"Custom"});
            }
        }

        if(customProps.length > 0) {
            customPropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = customProps;
            this.propertyBlocks.push(customPropertyBlock);
        }
    }

    /**
     * Creates two blocks as eClass-base and eClass-specific and puts properties into those
     */
    private createEClassPropertyBlocks(category: Category): void {
        let eClassBlocks = this.createEmptyEClassPropertyBlocks(selectPreferredName(category));
        let basePropertyBlock: any = eClassBlocks[0];
        let specificPropertyBlock: any = eClassBlocks[1];

        basePropertyBlock['isCollapsed'] = this.publishStateService.getCollapsedState(basePropertyBlock.name);
        specificPropertyBlock['isCollapsed'] = this.publishStateService.getCollapsedState(specificPropertyBlock.name);


        let baseProperties: ItemProperty[] = [];
        let basePropertyDetails: Property[] = [];
        let specificProperties: ItemProperty[] = [];
        let specificPropertyDetails: Property[] = [];
        for (let property of category.properties) {
            let aip: ItemProperty;
            let index = this.itemProperties.findIndex(ip => ip.id == property.id && ip.itemClassificationCode.value == category.id);
            if (index > -1) {
                aip = this.itemProperties[index];
            }
            else continue;

            if (!this.isPropertyPresentedAlready(property,category.id)) {
                if (this.isBaseEClassProperty(property.id)) {
                    baseProperties.push(aip);
                    basePropertyDetails.push(property);

                } else {
                    specificProperties.push(aip);
                    specificPropertyDetails.push(property);
                }
                this.checkedProperties.push({propId:property.id,categoryId:category.id});
            }
        }

        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = baseProperties;
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS] = basePropertyDetails;
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = specificProperties;
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS] = specificPropertyDetails;

        this.propertyBlocks.push(basePropertyBlock);
        this.propertyBlocks.push(specificPropertyBlock);
    }

    private createPropertyBlock(category: Category): void {
        let propertyBlock: any = this.createEmptyPropertyBlock(selectPreferredName(category), category.taxonomyId);
        propertyBlock['isCollapsed'] = this.publishStateService.getCollapsedState(propertyBlock.name);
        this.propertyBlocks.push(propertyBlock);

        let properties: ItemProperty[] = [];
        for (let property of category.properties) {
            if (!this.isPropertyPresentedAlready(property,category.id)) {
                properties.push(this.getItemProperty(property,category.id));
                this.checkedProperties.push({propId:property.id,categoryId:category.id});
            }
        }
        propertyBlock['properties'] = properties;
    }

    private isPropertyPresentedAlready(property: Property,categoryId: string): boolean {
        for (let x of this.checkedProperties) {
            if (property.id == x.propId && categoryId == x.categoryId) {
                return true;
            }
        }
        return false;
    }

    private getItemProperty(property: Property,categoryId: string): ItemProperty {
        for (let aip of this.itemProperties) {
            if (aip.id == property.id && aip.itemClassificationCode.value == categoryId) {
                return aip;
            }
        }
        console.error("Property could not be found in additional item properties: " + property.id)
    }


    private createEmptyEClassPropertyBlocks(categoryName):any {
        let basePropertyBlock: any = {};
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = this.getBlockNameForEClass(categoryName, true);
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS] = [];

        let specificPropertyBlock: any = {};
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = this.getBlockNameForEClass(categoryName, false);
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS] = [];

        return [basePropertyBlock, specificPropertyBlock];
    }

    private createEmptyPropertyBlock(categoryName, taxonomyId):any {
        let propertyBlock: any = {};
        propertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = this.getBlockName(categoryName, taxonomyId);
        propertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        propertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];
        propertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS] = [];

        return propertyBlock;
    }

    private getBlockNameForEClass(categoryName:string, base:boolean):string {
        if(base) {
            return categoryName + " (eClass - Base)"
        } else {
            return categoryName + " (eClass - Specific)";
        }
    }

    private getBlockName(categoryName:string, taxonomyId:string):string {
        if(categoryName != null) {
            return categoryName + " (" + taxonomyId + ")";
        } else {
            return "Custom";
        }
    }

    /*
     Checks whether the property is a base property common for many eClass properties

     The properties that are treated as a base property :
     0173-1#02-AAD931#005 - customs tariff number (TARIC)
     0173-1#02-AAO663#003 - GTIN
     0173-1#02-BAB392#012 - certificate/approval
     0173-1#02-AAO677#002 - Manufacturer name
     0173-1#02-AAO676#003 - product article number of manufacturer
     0173-1#02-AAO736#004 - product article number of supplier
     0173-1#02-AAO735#003 - name of supplier

     0173-1#02-AAP794#001 - Offerer/supplier
     0173-1#02-AAQ326#002 - address of additional link
     0173-1#02-BAE391#004 - Scope of performance
     0173-1#02-AAP796#004 - supplier of the identifier
     0173-1#02-BAF831#002 - Personnel qualification
     0173-1#02-AAM551#002 - Supplier product designation
     0173-1#02-AAU734#001 - Manufacturer product description
     0173-1#02-AAU733#001 - Manufacturer product order suffix
     0173-1#02-AAU732#001 - Manufacturer product root
     0173-1#02-AAU731#001 - Manufacturer product family
     0173-1#02-AAU730#001 - Supplier product description
     0173-1#02-AAU729#001 - Supplier product root
     0173-1#02-AAU728#001 - Supplier product family
     0173-1#02-AAO742#002 - Brand
     0173-1#02-AAW336#001 - Supplier product type
     0173-1#02-AAW337#001 - Supplier product order suffix
     0173-1#02-AAW338#001 - Manufacturer product designation
     0173-1#02-AAO057#002 - Product type
     */
    private isBaseEClassProperty(pid: string): boolean {
        if (pid == "0173-1#02-AAD931#005" ||
            pid == "0173-1#02-AAO663#003" ||
            pid == "0173-1#02-BAB392#012" ||
            pid == "0173-1#02-AAO677#002" ||
            pid == "0173-1#02-AAO676#003" ||
            pid == "0173-1#02-AAO736#004" ||
            pid == "0173-1#02-AAO735#003" ||
            pid == "0173-1#02-AAP794#001" ||
            pid == "0173-1#02-AAQ326#002" ||
            pid == "0173-1#02-BAE391#004" ||
            pid == "0173-1#02-AAP796#004" ||
            pid == "0173-1#02-BAF831#002" ||
            pid == "0173-1#02-AAM551#002" ||
            pid == "0173-1#02-AAU734#001" ||
            pid == "0173-1#02-AAU733#001" ||
            pid == "0173-1#02-AAU732#001" ||
            pid == "0173-1#02-AAU731#001" ||
            pid == "0173-1#02-AAU730#001" ||
            pid == "0173-1#02-AAU729#001" ||
            pid == "0173-1#02-AAU728#001" ||
            pid == "0173-1#02-AAO742#002" ||
            pid == "0173-1#02-AAW336#001" ||
            pid == "0173-1#02-AAW337#001" ||
            pid == "0173-1#02-AAW338#001" ||
            pid == "0173-1#02-AAO057#002") {
            return true;
        } else {
            return false;
        }
    }

}