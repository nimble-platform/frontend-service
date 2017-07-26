/**
 * Created by suat on 17-May-17.
 */

import {Component, Input, OnChanges, OnInit} from "@angular/core";
import {Category} from "./model/category/category";
import {Property} from "./model/category/property";
import {ItemProperty} from "./model/publish/item-property";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {PublishAndAIPCService} from "./publish-and-aip.service";
import {ModelUtils} from "./model/model-utils";

const PROPERTY_BLOCK_FIELD_NAME: string = "name";
const PROPERTY_BLOCK_FIELD_ISCOLLAPSED = "isCollapsed";
const PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";

@Component({
    selector: 'product-properties',
    templateUrl: './product-properties.component.html'
})

export class ProductPropertiesComponent implements OnInit {
    readonly PROPERTY_BLOCK_FIELD_NAME: string = "name";
    readonly PROPERTY_BLOCK_FIELD_ISCOLLAPSED = "isCollapsed";
    readonly PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";

    @Input() catalogueLine: CatalogueLine;
    @Input() selectedCategories: Category[];

    // list keeping the custom additional properties
    customProperties: ItemProperty[] = [];
    // list keeping the block for each category associated to the item
    propertyBlocks: Array<Object> = [];
    // list keeping the properties in order not to render the same property more than once
    renderedPropertyIds: Array<string> = [];

    //deletedProperties: Array<string> = [];

    constructor(private _publishAndAIPCService: PublishAndAIPCService) {
        this._publishAndAIPCService.componentMethodCalled$.subscribe(
            (inputVal: string) => {
                let indexCatalogue = this.catalogueLine.goodsItem.item.additionalItemProperty.findIndex(p => p.name == inputVal);
                this.catalogueLine.goodsItem.item.additionalItemProperty.splice(indexCatalogue, 1);
                this.refreshPropertyBlocks();
            }
        );
    }

    ngOnInit(): void {
        this.refreshPropertyBlocks();
    }

    refreshPropertyBlocks(): void {

        this.customProperties = [];
        this.propertyBlocks = [];
        this.renderedPropertyIds = [];

        // create a list including the custom properties created by the user
        for (let property of this.catalogueLine.goodsItem.item.additionalItemProperty) {
            if (property.itemClassificationCode.listID === "Custom" &&
                this.customProperties.indexOf(property) <= -1) {
                this.customProperties.push(property);
                this.renderedPropertyIds.push(property.id);
            }
        }

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

    /**
     * Creates two blocks as eClass-base and eClass-specific and puts properties into those
     */
    private createEClassPropertyBlocks(category: Category): void {

        let basePropertyBlock: any = {};
        basePropertyBlock[PROPERTY_BLOCK_FIELD_NAME] = category.preferredName + " (" + category.taxonomyId + " - Base)";
        basePropertyBlock[PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;

        let specificPropertyBlock: any = {};
        specificPropertyBlock[PROPERTY_BLOCK_FIELD_NAME] = category.preferredName + " (" + category.taxonomyId + " - Specific)";
        specificPropertyBlock[PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;


        let baseProperties: ItemProperty[] = [];
        let specificProperties: ItemProperty[] = [];
        for (let property of category.properties) {
            let aip: ItemProperty;
            let index = this.catalogueLine.goodsItem.item.additionalItemProperty.findIndex(ip => ip.id == property.id);
            if (index > -1) {
                aip = this.catalogueLine.goodsItem.item.additionalItemProperty[index];
            }
            else continue;

            aip.propertyDefinition = property.definition;
            if (!this.isPropertyPresentedAlready(property)) {
                if (this.isBaseEClassProperty(property)) {
                    if (baseProperties.indexOf(aip) <= -1) {
                        baseProperties.push(aip);
                    }

                } else {
                    if (specificProperties.indexOf(aip) <= -1) {
                        specificProperties.push(aip);
                    }

                }
                this.renderedPropertyIds.push(property.id);
            }
        }

        this.propertyBlocks.push(basePropertyBlock);
        this.propertyBlocks.push(specificPropertyBlock);

        basePropertyBlock[PROPERTY_BLOCK_FIELD_PROPERTIES] = baseProperties;
        specificPropertyBlock[PROPERTY_BLOCK_FIELD_PROPERTIES] = specificProperties;
    }

    private createPropertyBlock(category: Category): void {

        let propertyBlock: any = {};
        propertyBlock[PROPERTY_BLOCK_FIELD_NAME] = category.preferredName + " (" + category.taxonomyId + ")";
        propertyBlock[PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        this.propertyBlocks.push(propertyBlock);

        let properties: ItemProperty[] = [];
        for (let property of category.properties) {
            if (!this.isPropertyPresentedAlready(property)) {
                properties.push(this.getItemProperty(property));
                this.renderedPropertyIds.push(property.id)
            }
        }
        propertyBlock[PROPERTY_BLOCK_FIELD_PROPERTIES] = properties;
    }

    private isPropertyPresentedAlready(property: Property): boolean {
        for (let id of this.renderedPropertyIds) {
            if (property.id == id) {
                return true;
            }
        }
        return false;
    }

    private getItemProperty(property: Property): ItemProperty {
        for (let aip of this.catalogueLine.goodsItem.item.additionalItemProperty) {
            if (aip.id == property.id) {
                return aip;
            }
        }
        console.error("Property could not be found in additional item properties: " + property.id)
    }


    /* isPropertyCommonToOthercategories(propertyName: string) {
     index1 = this._publishAndAIPCService.baseProperties.findIndex(p => p.name == propertyName);
     if()
     }*/

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
    private isBaseEClassProperty(property: Property): boolean {
        let pid: string = property.id;
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
