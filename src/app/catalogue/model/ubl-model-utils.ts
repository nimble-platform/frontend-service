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

import { ItemProperty } from "./publish/item-property";
import { BinaryObject } from "./publish/binary-object";
import { CommodityClassification } from "./publish/commodity-classification";
import { Code } from "./publish/code";
import { Property } from "./category/property";
import { Category } from "./category/category";
import { Price } from "./publish/price";
import { Amount } from "./publish/amount";
import { ItemLocationQuantity } from "./publish/item-location-quantity";
import { Party } from "./publish/party";
import { Item } from "./publish/item";
import { GoodsItem } from "./publish/goods-item";
import { CatalogueLine } from "./publish/catalogue-line";
import { OrderReference } from "./publish/order-reference";
import { DocumentReference } from "./publish/document-reference";
import { Quantity } from "./publish/quantity";
import { LineItem } from "./publish/line-item";
import { OrderLine } from "./publish/order-line";
import { CustomerParty } from "./publish/customer-party";
import { SupplierParty } from "./publish/supplier-party";
import { DeliveryTerms } from "./publish/delivery-terms";
import { Period } from "./publish/period";
import { Package } from "./publish/package";
import { ItemIdentification } from "./publish/item-identification";
import { RequestForQuotationLine } from "./publish/request-for-quotation-line";
import { Delivery } from "./publish/delivery";
import { QuotationLine } from "./publish/quotation-line";
import { Dimension } from "./publish/dimension";
import { Country } from "./publish/country";
import { DespatchLine } from "./publish/despatch-line";
import { DespatchAdvice } from "./publish/despatch-advice";
import { ReceiptAdvice } from "./publish/receipt-advice";
import { ReceiptLine } from "./publish/receipt-line";
import { PaymentMeans } from "./publish/payment-means";
import { Order } from "./publish/order";
import { OrderResponseSimple } from "./publish/order-response-simple";
import { RequestForQuotation } from "./publish/request-for-quotation";
import { Quotation } from "./publish/quotation";
import { Location } from "./publish/location";
import { Ppap } from "./publish/ppap";
import { PpapResponse } from "./publish/ppap-response";
import { Shipment } from "./publish/shipment";
import { TransportExecutionPlanRequest } from "./publish/transport-execution-plan-request";
import { TransportExecutionPlan } from "./publish/transport-execution-plan";
import { ItemInformationRequest } from "./publish/item-information-request";
import { ItemInformationResponse } from "./publish/item-information-response";
import { PaymentTerms } from "./publish/payment-terms";
import { Address } from "./publish/address";
import { MonetaryTotal } from "./publish/monetary-total";
import { CURRENCIES, DEFAULT_LANGUAGE } from "./constants";
import { TradingTerm } from "./publish/trading-term";
import { CompanyNegotiationSettings } from "../../user-mgmt/model/company-negotiation-settings";
import { ShipmentStage } from "./publish/shipment-stage";
import { copy, isNaNNullAware, selectPreferredName } from "../../common/utils";
import { Text } from "./publish/text";
import { Attachment } from "./publish/attachment";
import { LifeCyclePerformanceAssessmentDetails } from "./publish/life-cycle-performance-assessment-details";
import { PartyName } from './publish/party-name';
import { MultiTypeValue } from "./publish/multi-type-value";
import { Clause } from "./publish/clause";
import { Contract } from './publish/contract';
import { Address as UserMgmtAddress } from '../../user-mgmt/model/address';
import { OrderLineReference } from './publish/order-line-reference';
import { Catalogue } from './publish/catalogue';

export class UBLModelUtils {

    /**
     * Create a property based on the given property and category parameters.
     *
     * If the category is not null then a corresponding code is created and used in the item property to be returned. The
     * code refers to the category in the corresponding taxonomy is created. If the category is null, the code refers to
     * the "Custom" property.
     *
     * If the property is not null; unit, value qualifier, id and name is used from the given property. Fields keeping
     * actual data are still set to empty values.
     *
     * @param property
     * @param category
     * @returns {ItemProperty}
     */
    public static createAdditionalItemProperty(property: Property, category: Category): ItemProperty {
        const code: Code = category
            ? new Code(category.id, selectPreferredName(category), category.categoryUri, category.taxonomyId, null)
            : new Code(null, null, null, "Custom", null);

        if (property == null) {
            return new ItemProperty(this.generateUUID(), [], [], [], [],
                new Array<BinaryObject>(), "STRING", code, null, []);
        }

        let itemProperty = new ItemProperty(property.id, [],
            property.dataType === "BOOLEAN" ? [new Text("false", "en")] : [], [], [],
            new Array<BinaryObject>(), property.dataType, code, property.uri, []);

        itemProperty.name = [].concat(property.preferredName);
        return itemProperty;
    }

    public static createCommodityClassification(category: Category): CommodityClassification {
        const code: Code = new Code(category.id, selectPreferredName(category), category.categoryUri, category.taxonomyId, null);
        const commodityClassification = new CommodityClassification(code, null, null, "");
        return commodityClassification;
    }

    public static createItemLocationQuantity(amount: string): ItemLocationQuantity {
        // price
        const price: Price = this.createPrice();
        // item location quantity
        const ilq: ItemLocationQuantity = new ItemLocationQuantity(null, [], price, []);
        return ilq;
    }

    public static createCatalogueLine(catalogueUuid: string,
        providerParty: Party,
        settings: CompanyNegotiationSettings,
        dimensionUnits: string[] = []): CatalogueLine {
        // create additional item properties
        const additionalItemProperties = new Array<ItemProperty>();

        // catalogue document reference
        const docRef: DocumentReference = new DocumentReference();
        docRef.id = catalogueUuid;

        // create item
        const uuid: string = this.generateUUID();
        const item = new Item([], [], [], [], additionalItemProperties, providerParty, this.createItemIdentificationWithId(null), docRef, [], [], this.createDimensions(dimensionUnits), null);

        // create goods item
        const goodsItem = new GoodsItem(uuid, null, item, this.createPackage(),
            this.createDeliveryTerms(null, settings.deliveryPeriodUnits[0]));

        // create required item location quantity
        const ilq = this.createItemLocationQuantity("");
        const catalogueLine = new CatalogueLine(uuid, null, null, false,
            this.createPeriod(settings.warrantyPeriodRanges[0].start, settings.warrantyPeriodUnits[0]), [], ilq, [], goodsItem);

        // extra initialization
        catalogueLine.goodsItem.containingPackage.quantity.unitCode = "item(s)";
        catalogueLine.minimumOrderQuantity.unitCode = "item(s)";

        return catalogueLine;
    }

    public static createCatalogueLineWithItemCopy(item: Item): CatalogueLine {
        let copyItem = copy(item);
        let dummyItemLocationQuantity = new ItemLocationQuantity();
        dummyItemLocationQuantity.price = new Price();
        return new CatalogueLine(
            null,
            null,
            null,
            null,
            new Period(),
            null,
            dummyItemLocationQuantity,
            [],
            new GoodsItem(null, null, copyItem)
        );
    }

    public static createCatalogueLinesForLogistics(catalogueUuid: string, providerParty: Party, settings: CompanyNegotiationSettings, logisticRelatedServices, eClassLogisticCategories: Category[], furnitureOntologyLogisticCategories: Category[]): Map<string, CatalogueLine> {
        let logisticCatalogueLines: Map<string, CatalogueLine> = new Map<string, CatalogueLine>();
        // if we have furniture ontology categories for logistics services,then use them.
        if (furnitureOntologyLogisticCategories) {
            let furnitureOntologyLogisticRelatedServices = logisticRelatedServices["FurnitureOntology"];
            let eClassLogisticRelatedServices = logisticRelatedServices["eClass"];

            // for each service type, create a catalogue line
            for (let serviceType of Object.keys(furnitureOntologyLogisticRelatedServices)) {
                // get corresponding furniture ontology category
                let furnitureOntologyCategory = this.getCorrespondingCategory(furnitureOntologyLogisticRelatedServices[serviceType], furnitureOntologyLogisticCategories);
                // get corresponding eClass category
                let eClassCategory = null;
                if (eClassLogisticCategories && eClassLogisticRelatedServices[serviceType]) {
                    eClassCategory = this.getCorrespondingCategory(eClassLogisticRelatedServices[serviceType], eClassLogisticCategories);
                }

                // create the catalogue line
                let catalogueLine = this.createCatalogueLine(catalogueUuid, providerParty, settings);
                // add item name and descriptions
                let newItemName: Text = new Text("", DEFAULT_LANGUAGE());
                let newItemDescription: Text = new Text("", DEFAULT_LANGUAGE());
                catalogueLine.goodsItem.item.name.push(newItemName);
                catalogueLine.goodsItem.item.description.push(newItemDescription);
                // clear additional item properties
                catalogueLine.goodsItem.item.additionalItemProperty = [];
                // add additional item properties
                for (let property of furnitureOntologyCategory.properties) {
                    catalogueLine.goodsItem.item.additionalItemProperty.push(this.createAdditionalItemProperty(property, furnitureOntologyCategory));
                }
                // add its default furniture ontology category
                catalogueLine.goodsItem.item.commodityClassification.push(this.createCommodityClassification(furnitureOntologyCategory));
                // add its default eClass category if exists
                if (eClassCategory) {
                    catalogueLine.goodsItem.item.commodityClassification.push(this.createCommodityClassification(eClassCategory));
                }
                // push it to the list
                logisticCatalogueLines.set(serviceType, catalogueLine);
            }
            // create a dummy catalogue line to represent transport services
            let catalogueLine = this.createCatalogueLine(catalogueUuid, providerParty, settings);
            let category = this.getCorrespondingCategory(furnitureOntologyLogisticRelatedServices["ROADTRANSPORT"], furnitureOntologyLogisticCategories);
            for (let property of category.properties) {
                catalogueLine.goodsItem.item.additionalItemProperty.push(this.createAdditionalItemProperty(property, category));
            }
            // push it to the list
            logisticCatalogueLines.set("TRANSPORT", catalogueLine);
        }

        return logisticCatalogueLines;
    }

    private static getCorrespondingCategory(categoryUri, logisticCategories: Category[]) {
        for (let category of logisticCategories) {
            if (category.id == categoryUri) {
                return category;
            }
        }
    }

    public static createOrder(lineItems: LineItem[]): Order {
        let orderLines: OrderLine[] = [];
        for (let lineItem of lineItems) {
            orderLines.push(new OrderLine(lineItem));
        }

        return new Order(this.generateUUID(), [''], new Period(), new Address(), null, null, null, new MonetaryTotal(), orderLines);
    }

    public static createOrderWithRfqCopy(rfq: RequestForQuotation): Order {
        let lineItems: LineItem[] = [];
        for (let rfqLine of rfq.requestForQuotationLine) {
            lineItems.push(rfqLine.lineItem);
        }
        let order = UBLModelUtils.createOrder(lineItems);

        // create contracts for Terms and Conditions
        let contracts = [];
        for (let rfqLine of rfq.requestForQuotationLine) {
            let contract = new Contract();
            contract.id = UBLModelUtils.generateUUID();

            for (let clause of rfqLine.lineItem.clause) {
                let newClause: Clause = JSON.parse(JSON.stringify(clause));
                contract.clause.push(newClause);
            }
            contracts.push(contract);
        }
        // push contract to order.contract
        order.contract = contracts;
        return order;
    }

    public static createOrderResponseSimpleWithOrderCopy(order: Order, acceptedIndicator: boolean): OrderResponseSimple {
        let copyOrder: Order = copy(order);
        const orderReference: OrderReference = this.createOrderReference(copyOrder.id);
        const customerParty: CustomerParty = copyOrder.buyerCustomerParty;
        const supplierParty: SupplierParty = copyOrder.sellerSupplierParty;
        const orderResponseSimple: OrderResponseSimple = new OrderResponseSimple(this.generateUUID(), [''], "", acceptedIndicator, orderReference, supplierParty, customerParty);

        this.removeHjidFieldsFromObject(orderResponseSimple);
        return orderResponseSimple;
    }

    public static createPpap(documents: String[]): Ppap {
        const quantity: Quantity = new Quantity(null, "", null);
        const item: Item = this.createItem();
        const price: Price = this.createPrice();
        const lineItem: LineItem = this.createLineItem(quantity, price, item, null);
        const ppap = new Ppap(this.generateUUID(), [''], documents, null, null, lineItem);
        return ppap;
    }

    public static createPpapResponseWithPpapCopy(ppap: Ppap, acceptedIndicator: boolean): PpapResponse {
        let copyPpap: Ppap = copy(ppap);
        const ppapResponse: PpapResponse = new PpapResponse();
        ppapResponse.id = this.generateUUID();
        ppapResponse.ppapDocumentReference = new DocumentReference(copyPpap.id);
        ppapResponse.buyerCustomerParty = copyPpap.buyerCustomerParty;
        ppapResponse.sellerSupplierParty = copyPpap.sellerSupplierParty;
        ppapResponse.acceptedIndicator = acceptedIndicator;

        this.removeHjidFieldsFromObject(ppapResponse);
        return ppapResponse;
    }

    public static createRequestForQuotation(items: Item[] | LineItem[]): RequestForQuotation {
        let rfqLines: RequestForQuotationLine[];
        if (items == null) {
            rfqLines = [UBLModelUtils.createRequestForQuotationLine()];

        } else {
            rfqLines = [];
            for (let item of items) {
                rfqLines.push(UBLModelUtils.createRequestForQuotationLine(item));
            }
        }

        const rfq = new RequestForQuotation(this.generateUUID(), [""], null, null, new Delivery(),
            rfqLines, []);

        // TODO remove this custom dimension addition once the dimension-view is improved to handle such cases
        let handlingUnitDimension: Dimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Length';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        handlingUnitDimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Width';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);

        this.removeHjidFieldsFromObject(rfq);
        return rfq;
    }

    public static createRequestForQuotationWithCopies(order: Order, catalogueLine: CatalogueLine): RequestForQuotation {
        let copyOrder: Order = copy(order);
        let copyLine: CatalogueLine = copy(catalogueLine);

        const quantity: Quantity = new Quantity(null, "", null);
        const item: Item = copyLine.goodsItem.item;
        const price: Price = copyLine.requiredItemLocationQuantity.price;
        const lineItem: LineItem = this.createLineItem(quantity, price, item, null);
        const requestForQuotationLine: RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        const rfq = new RequestForQuotation(this.generateUUID(), [""], null, null, new Delivery(),
            [requestForQuotationLine], []);

        rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure = copyOrder.orderLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
        rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address = copyOrder.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        rfq.requestForQuotationLine[0].lineItem.item.transportationServiceDetails = copyLine.goodsItem.item.transportationServiceDetails;
        let size = copyOrder.orderLine.length;
        for (let i = 0; i < size; i++) {
            if (i != 0) {
                rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.goodsItem.push(new GoodsItem());
            }
            rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.goodsItem[i].item = copyOrder.orderLine[i].lineItem.item;
            rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.goodsItem[i].quantity = copyOrder.orderLine[i].lineItem.quantity;
        }
        // TODO remove this custom dimension addition once the dimension-view is improved to handle such cases
        let handlingUnitDimension: Dimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Length';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        handlingUnitDimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Width';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);

        this.removeHjidFieldsFromObject(rfq);
        return rfq;
    }

    public static createRequestForQuotationLine(item: Item | LineItem = null): RequestForQuotationLine {
        if (item == null) {
            item = UBLModelUtils.createItem();
        }

        // check the type of item parameter
        // its type is LineItem if it contains a field called item, otherwise, its type is Item.
        // instanceof does not work since the given object is not created using a constructor
        let isLineItem: boolean = "item" in item;

        let lineItem;
        if (isLineItem) {
            lineItem = item;
        }
        else {
            const quantity: Quantity = new Quantity(null, "", null);
            const price: Price = this.createPrice();
            lineItem = this.createLineItem(quantity, price, item, null);
        }

        return new RequestForQuotationLine(lineItem);
    }

    public static getDefaultPaymentTerms(settings?: CompanyNegotiationSettings): PaymentTerms {
        const terms = new PaymentTerms([
            new TradingTerm("Payment_In_Advance", [new Text("Payment in advance")], "PIA", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            // new TradingTerm("Values_Net","e.g.,NET 10,payment 10 days after invoice date","Net %s",[null]),
            new TradingTerm("End_of_month", [new Text("End of month")], "EOM", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            new TradingTerm("Cash_next_delivery", [new Text("Cash next delivery")], "CND", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            new TradingTerm("Cash_before_shipment", [new Text("Cash before shipment")], "CBS", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            // new TradingTerm("Values_MFI","e.g.,21 MFI,21st of the month following invoice date","%s MFI", [null]),
            // new TradingTerm("Values_/NET","e.g.,1/10 NET 30,1% discount if payment received within 10 days otherwise payment 30 days after invoice date","%s/%s NET %s",[null,null,null]),
            new TradingTerm("Cash_on_delivery", [new Text("Cash on delivery")], "COD", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            new TradingTerm("Cash_with_order", [new Text("Cash with order")], "CWO", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            new TradingTerm("Cash_in_advance", [new Text("Cash in advance")], "CIA", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
        ]);

        if (settings) {
            for (const term of terms.tradingTerms) {
                term.value.value[0].value = this.tradingTermToString(term) === settings.paymentTerms[0] ? "true" : "false";
            }
        }

        return terms;
    }

    public static getDefaultPaymentTermsAsStrings(settings?: CompanyNegotiationSettings): string[] {
        return this.getDefaultPaymentTerms(settings).tradingTerms.map(term => {
            return this.tradingTermToString(term);
        })
    }

    private static tradingTermToString(term: TradingTerm): string {
        return term.tradingTermFormat + " - " + term.description[0].value;
    }

    private static getDefaultPaymentMeans(settings: CompanyNegotiationSettings): PaymentMeans {
        return new PaymentMeans(new Code(settings.paymentMeans[0], settings.paymentMeans[0]));
    }

    public static createQuotationWithRfqCopy(rfq: RequestForQuotation): Quotation {
        let copyRfq: RequestForQuotation = copy(rfq);
        let quotationLines: QuotationLine[] = [];
        for (let requestForQuotationLine of copyRfq.requestForQuotationLine) {
            let quotationLine: QuotationLine = new QuotationLine(requestForQuotationLine.lineItem);
            // set start and end dates of tep
            if (rfq.delivery.requestedDeliveryPeriod.startDate || rfq.delivery.requestedDeliveryPeriod.endDate) {
                quotationLine.lineItem.delivery[0].requestedDeliveryPeriod.startDate = rfq.delivery.requestedDeliveryPeriod.startDate;
                quotationLine.lineItem.delivery[0].requestedDeliveryPeriod.endDate = rfq.delivery.requestedDeliveryPeriod.endDate;
            }
            // need to clear following fields for transport negotiation
            quotationLine.lineItem.delivery[0].shipment.additionalDocumentReference = [];
            quotationLine.lineItem.delivery[0].shipment.specialInstructions = [''];

            quotationLines.push(quotationLine);
        }

        const customerParty: CustomerParty = rfq.buyerCustomerParty;
        const supplierParty: SupplierParty = rfq.sellerSupplierParty;

        const documentReference: DocumentReference = new DocumentReference(rfq.id);

        const quotation = new Quotation(this.generateUUID(), [""], new Code(), new Code(), 1, documentReference,
            customerParty, supplierParty, quotationLines);

        this.removeHjidFieldsFromObject(quotation);
        return quotation;
    }

    // if goodsItems are provided, use them to create Dispatch Advice, otherwise order lines are used
    public static createDespatchAdviceWithOrderCopy(order: Order, goodsItems: GoodsItem[]): DespatchAdvice {
        let copyOrder: Order = copy(order);
        const despatchAdvice: DespatchAdvice = new DespatchAdvice();
        despatchAdvice.id = this.generateUUID();
        despatchAdvice.orderReference = [UBLModelUtils.createOrderReference(copyOrder.id)];
        despatchAdvice.despatchLine = [];

        if (goodsItems == null) {
            for (let orderLine of copyOrder.orderLine) {
                let orderLineReference: OrderLineReference = new OrderLineReference(orderLine.hjid.toString());
                let dispatchLine = new DespatchLine(new Quantity(), orderLine.lineItem.item, [new Shipment()], orderLineReference);
                dispatchLine.deliveredQuantity.unitCode = orderLine.lineItem.quantity.unitCode;
                dispatchLine.shipment[0].shipmentStage.push(new ShipmentStage());
                despatchAdvice.despatchLine.push(dispatchLine);
            }
        }
        else {
            for (let goodsItem of goodsItems) {
                let orderLineReference: OrderLineReference = new OrderLineReference(order.orderLine[parseInt(goodsItem.sequenceNumberID)].hjid.toString());
                let dispatchLine = new DespatchLine(new Quantity(), goodsItem.item, [new Shipment()], orderLineReference);
                dispatchLine.deliveredQuantity.unitCode = goodsItem.quantity.unitCode;
                dispatchLine.shipment[0].shipmentStage.push(new ShipmentStage());
                despatchAdvice.despatchLine.push(dispatchLine);
            }
        }

        despatchAdvice.despatchSupplierParty = copyOrder.sellerSupplierParty;
        despatchAdvice.deliveryCustomerParty = copyOrder.buyerCustomerParty;

        this.removeHjidFieldsFromObject(despatchAdvice);
        return despatchAdvice
    }

    public static createReceiptAdviceWithDespatchAdviceCopy(despatchAdvice: DespatchAdvice): ReceiptAdvice {
        let copyDespatchAdvice: DespatchAdvice = copy(despatchAdvice);
        const receiptAdvice: ReceiptAdvice = new ReceiptAdvice();
        receiptAdvice.id = this.generateUUID();
        receiptAdvice.orderReference = [copyDespatchAdvice.orderReference[0]];
        receiptAdvice.despatchDocumentReference = [new DocumentReference(copyDespatchAdvice.id)];
        receiptAdvice.deliveryCustomerParty = copyDespatchAdvice.deliveryCustomerParty;
        receiptAdvice.despatchSupplierParty = copyDespatchAdvice.despatchSupplierParty;

        receiptAdvice.receiptLine = [];
        for (let dispatchLine of copyDespatchAdvice.despatchLine) {
            receiptAdvice.receiptLine.push(new ReceiptLine(new Quantity(0, dispatchLine.deliveredQuantity.unitCode),
                [], dispatchLine.item))
        }

        this.removeHjidFieldsFromObject(receiptAdvice);
        return receiptAdvice;
    }

    public static createTEPlanRequestWithQuotationCopy(quotation: Quotation): TransportExecutionPlanRequest {
        let copyQuotation: Quotation = copy(quotation);
        const transportExecutionPlanRequest: TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
        transportExecutionPlanRequest.id = this.generateUUID();
        transportExecutionPlanRequest.mainTransportationService = copyQuotation.quotationLine[0].lineItem.item;
        transportExecutionPlanRequest.fromLocation.address = copyQuotation.quotationLine[0].lineItem.delivery[0].shipment.originAddress;
        transportExecutionPlanRequest.toLocation.address = copyQuotation.quotationLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        transportExecutionPlanRequest.consignment[0].consolidatedShipment.push(copyQuotation.quotationLine[0].lineItem.delivery[0].shipment);
        transportExecutionPlanRequest.consignment[0].grossVolumeMeasure = copyQuotation.quotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossVolumeMeasure;
        transportExecutionPlanRequest.consignment[0].grossWeightMeasure = copyQuotation.quotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossWeightMeasure;
        transportExecutionPlanRequest.serviceStartTimePeriod.startDate = copyQuotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.startDate;
        transportExecutionPlanRequest.serviceStartTimePeriod.endDate = copyQuotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.endDate;

        this.removeHjidFieldsFromObject(transportExecutionPlanRequest);
        return transportExecutionPlanRequest
    }

    public static createTEPlanWithTERequestCopy(transportExecutionPlanRequest: TransportExecutionPlanRequest): TransportExecutionPlan {
        let copyTepRequest: TransportExecutionPlanRequest = copy(transportExecutionPlanRequest);
        const transportExecutionPlan: TransportExecutionPlan = new TransportExecutionPlan();
        transportExecutionPlan.id = this.generateUUID();
        transportExecutionPlan.transportExecutionPlanRequestDocumentReference = new DocumentReference(copyTepRequest.id);
        transportExecutionPlan.transportUserParty = copyTepRequest.transportUserParty;
        transportExecutionPlan.transportServiceProviderParty = copyTepRequest.transportServiceProviderParty;

        this.removeHjidFieldsFromObject(transportExecutionPlan);
        return transportExecutionPlan;
    }

    public static createItemInformationRequest(): ItemInformationRequest {
        const itemInformationRequest: ItemInformationRequest = new ItemInformationRequest();
        itemInformationRequest.id = this.generateUUID();
        return itemInformationRequest;
    }

    public static createIIResponseWithIIRequestCopy(itemInformationRequest: ItemInformationRequest): ItemInformationResponse {
        let copyItemInformationRequest: ItemInformationRequest = copy(itemInformationRequest);
        const itemInformationResponse: ItemInformationResponse = new ItemInformationResponse();
        itemInformationResponse.id = this.generateUUID();
        itemInformationResponse.itemInformationRequestDocumentReference = new DocumentReference(copyItemInformationRequest.id);
        itemInformationResponse.item[0] = copyItemInformationRequest.itemInformationRequestLine[0].salesItem[0].item;
        itemInformationResponse.item[0].itemSpecificationDocumentReference = [];
        itemInformationResponse.sellerSupplierParty = copyItemInformationRequest.sellerSupplierParty;
        itemInformationResponse.buyerCustomerParty = copyItemInformationRequest.buyerCustomerParty;

        this.removeHjidFieldsFromObject(itemInformationResponse);
        return itemInformationResponse;
    }

    public static createOrderReference(orderId: string): OrderReference {
        const documentReference: DocumentReference = new DocumentReference(orderId);
        const orderReference: OrderReference = new OrderReference(documentReference);
        return orderReference;
    }

    public static createDocumentReferenceWithBinaryObject(binaryObject: BinaryObject): DocumentReference {
        let attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        let documentReference: DocumentReference = new DocumentReference();
        documentReference.attachment = attachment;
        return documentReference;
    }

    public static createItem(): Item {
        const item = new Item([], [], [], [], [], null, this.createItemIdentification(), null, [], [], [], null);
        return item;
    }

    public static createDimensions(dimensionUnits: string[]): Dimension[] {
        let dimensions: Dimension[] = [];
        for (let unit of dimensionUnits) {
            let unitName = unit.charAt(0).toUpperCase() + unit.slice(1);
            dimensions.push(new Dimension(unitName));
        }
        return dimensions;
    }

    public static createLineItem(quantity, price, item, settings: CompanyNegotiationSettings): LineItem {
        if (settings == null) {
            settings = new CompanyNegotiationSettings();
        }
        return new LineItem(quantity, [], [new Delivery()], new DeliveryTerms(), price, item, new Period(), null, false, this.getDefaultPaymentMeans(settings), this.getDefaultPaymentTerms(settings), [], []);
    }

    public static createPackage(): Package {
        return new Package(this.createQuantity(), new Code(), null);
    }

    public static getPreviousDocumentId(documentReferences: DocumentReference[]): string {
        for (let documentReference of documentReferences) {
            if (documentReference.documentType == "previousDocument") {
                return documentReference.id;
            }
        }
        return null;
    }

    public static createPrice(): Price {
        const amountObj: Amount = this.createAmountWithCurrency(CURRENCIES[0]);
        const quantity: Quantity = this.createQuantity();
        const price: Price = new Price(amountObj, quantity);
        return price;
    }

    private static createDeliveryTerms(value: number = null, unit: string = "day(s)"): DeliveryTerms {
        const deliveryTerms = new DeliveryTerms(null, this.createPeriod(value, unit),
            null, null, this.createAmount(), new Location(), null);
        return deliveryTerms;
    }

    private static createPeriod(value: number = null, unit: string = "day(s)"): Period {
        return new Period(null, null, null, null, this.createQuantity(value, unit), null);
    }

    /**
     * Converts the address in src/app/user-mgmt/model to UBL address
     * @param userMgmtAddress address entity with the type defined in the user management module
     */
    public static mapUserMgmtAddressToUblAddress(ublAddress: Address, userMgmtAddress: UserMgmtAddress): void {
        ublAddress.cityName = userMgmtAddress.cityName;
        ublAddress.region = userMgmtAddress.region;
        ublAddress.postalZone = userMgmtAddress.postalCode;
        ublAddress.buildingNumber = userMgmtAddress.buildingNumber;
        ublAddress.streetName = userMgmtAddress.streetName;
        ublAddress.country.name.value = userMgmtAddress.country;
    }

    public static createCountry(): Country {
        return new Country(null);
    }

    public static createQuantity(value: number = 1, unit: string = "item(s)"): Quantity {
        return new Quantity(value, unit, null);
    }

    public static createAmount(): Amount {
        const amount: Amount = new Amount(null, null);
        return amount;
    }

    public static createAmountWithCurrency(currency: string): Amount {
        return new Amount(null, currency);
    }

    public static createItemIdentificationWithId(id: string): ItemIdentification {
        return new ItemIdentification(id);
    }

    public static createItemIdentification(): ItemIdentification {
        return this.createItemIdentificationWithId(this.generateUUID());
    }

    public static removeHjidFieldsFromObject(object: any): any {
        delete object.hjid;
        delete object.startDateItem;
        delete object.startTimeItem;
        delete object.endDateItem;
        delete object.endTimeItem;
        delete object.estimatedDeliveryDateItem;
        for (const field in object) {
            if (object.hasOwnProperty(field) && object[field] != null && typeof (object[field]) === 'object') {
                this.removeHjidFieldsFromObject(object[field]);
            }
        }
        return object;
    }

    public static generateUUID(): string {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };

    public static getPartyId(party: Party): string {
        return party.partyIdentification[0].id;
    }

    public static getPartyDisplayName(party: Party): string {
        return this.getPartyDisplayNameForPartyName(party.partyName);
    }

    public static getPartyDisplayNameForPartyName(partyNames: PartyName[]): string {
        let defaultLanguage = DEFAULT_LANGUAGE();

        let englishName = null;
        for (let partyName of partyNames) {
            if (partyName.name.languageID == "en") {
                englishName = partyName.name.value;
            }
            if (partyName.name.languageID == defaultLanguage) {
                return partyName.name.value;
            }
        }

        if (englishName) {
            return englishName;
        }
        return partyNames[0].name.value;
    }

    public static getLinePartyId(catalogueLine: CatalogueLine) {
        return UBLModelUtils.getPartyId(catalogueLine.goodsItem.item.manufacturerParty);
    }

    public static isFilledLCPAInput(lcpaDetails: LifeCyclePerformanceAssessmentDetails): boolean {
        if (lcpaDetails.lcpainput == null) {
            return false;
        }
        let lcpaInput = lcpaDetails.lcpainput;

        if (!isNaNNullAware(lcpaInput.assemblyCost.value) ||
            !isNaNNullAware(lcpaInput.consumableCost.value) ||
            !isNaNNullAware(lcpaInput.endOfLifeCost.value) ||
            !isNaNNullAware(lcpaInput.energyConsumptionCost.value) ||
            !isNaNNullAware(lcpaInput.lifeCycleLength.value) ||
            !isNaNNullAware(lcpaInput.purchasingPrice.value) ||
            !isNaNNullAware(lcpaInput.sparePartCost.value) ||
            !isNaNNullAware(lcpaInput.transportCost.value) ||
            lcpaInput.additionalLCPAInputDetail.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    public static isFilledLCPAOutput(lcpaDetails: LifeCyclePerformanceAssessmentDetails): boolean {
        if (lcpaDetails.lcpaoutput == null) {
            return false;
        }
        let lcpaOutput = lcpaDetails.lcpaoutput;

        if (!isNaNNullAware(lcpaOutput.lifeCycleCost.value) ||
            !isNaNNullAware(lcpaOutput.acidificationPotential.value) ||
            !isNaNNullAware(lcpaOutput.aerosolFormationPotential.value) ||
            !isNaNNullAware(lcpaOutput.capex.value) ||
            !isNaNNullAware(lcpaOutput.cumulativeEnergyDemand.value) ||
            !isNaNNullAware(lcpaOutput.eutrophicationPotential.value) ||
            !isNaNNullAware(lcpaOutput.globalWarmingPotential.value) ||
            !isNaNNullAware(lcpaOutput.opex.value)) {
            return true;
        } else {
            return false;
        }
    }

    public static areTextsEqual(text1: Text, text2: Text): boolean {
        if (text1 == null && text2 == null) {
            return true;
        }
        if (text1 == null || text2 == null) {
            return false;
        }
        if (text1.value === text2.value && text1.languageID === text2.languageID) {
            return true;
        }
        return false;
    }

    public static isEmptyQuantity(quantity: Quantity): boolean {
        if (quantity == null) {
            return true;
        }
        if (quantity.value == null && !quantity.unitCode) {
            return true;
        }
        return false;
    }

    public static isEmptyOrIncompleteQuantity(quantity: Quantity): boolean {
        if (UBLModelUtils.isEmptyQuantity(quantity)) {
            return true;
        }
        if (quantity.value == null || !quantity.unitCode) {
            return true;
        }
        return false;
    }

    public static isEmptyOrIncompleteAmount(amount: Amount): boolean {
        if (amount == null) {
            return true;
        }
        if (amount.value == null || !amount.currencyID) {
            return true;
        }
        return false;
    }

    public static areQuantitiesEqual(quantity1: Quantity, quantity2: Quantity): boolean {
        if (UBLModelUtils.isEmptyQuantity(quantity1) && UBLModelUtils.isEmptyQuantity(quantity2)) {
            return true;
        }
        if (UBLModelUtils.isEmptyQuantity(quantity1) || UBLModelUtils.isEmptyQuantity(quantity2)) {
            return false;
        }
        if (quantity1.value == quantity2.value && quantity1.unitCode == quantity2.unitCode) {
            return true;
        }
        return false;
    }

    public static areTermsAndConditionListsDifferent(firstList: Clause[], secondList: Clause[]): boolean {
        // both null
        if (firstList == null && secondList == null) {
            return false;
        }
        // one of them is null
        if (firstList == null || secondList == null) {
            return true;
        }
        // check sizes
        if (firstList.length != secondList.length) {
            return true;
        }
        // check inner values
        for (let clause of firstList) {
            // find the corresponding clause in the passed array
            let correspondingClause: Clause = null;
            for (let otherClause of secondList) {
                if (clause.id == otherClause.id) {
                    correspondingClause = otherClause;
                    break;
                }
            }
            // did not found the corresponding clause
            if (correspondingClause == null) {
                return true;

            } else {
                // check the trading terms lists in the clauses
                // both null
                if (clause.tradingTerms == null && correspondingClause.tradingTerms == null) {
                    continue;
                }
                // one of them is null
                if (clause.tradingTerms == null || correspondingClause.tradingTerms == null) {
                    return true;
                }
                // check sizes
                if (clause.tradingTerms.length != correspondingClause.tradingTerms.length) {
                    return true;
                }

                // check the terms themselves
                for (let term of clause.tradingTerms) {
                    // find the corresponding clause in the passed array
                    let correspondingTerm: TradingTerm = null;
                    for (let otherTerm of correspondingClause.tradingTerms) {
                        if (term.id == otherTerm.id) {
                            correspondingTerm = otherTerm;
                            break;
                        }
                    }
                    // did not found the corresponding term
                    if (correspondingTerm == null) {
                        return true;

                    } else {
                        let qualifier: string = term.value.valueQualifier;
                        // qualifiers do not match
                        if (qualifier != correspondingTerm.value.valueQualifier) {
                            return true;
                        }
                        // skip if both values are null
                        if (term.value == null && correspondingTerm.value == null) {
                            continue;
                        }

                        // value existences do not match
                        if ((term.value == null && correspondingTerm.value != null) ||
                            term.value != null && correspondingTerm.value == null) {
                            return true;
                        }

                        // for it is possible to specify single value for terms concerning the terms and conditions
                        if (qualifier == 'STRING') {
                            if (term.value.value[0].value != correspondingTerm.value.value[0].value ||
                                term.value.value[0].languageID != correspondingTerm.value.value[0].languageID) {
                                return true;
                            }
                        } else if (qualifier == 'NUMBER') {
                            if (term.value.valueDecimal[0] != correspondingTerm.value.valueDecimal[0]) {
                                return true;
                            }
                        } else if (qualifier == 'QUANTITY') {
                            if (term.value.valueQuantity[0].value != correspondingTerm.value.valueQuantity[0].value ||
                                term.value.valueQuantity[0].unitCode != correspondingTerm.value.valueQuantity[0].unitCode) {
                                return true;
                            }
                        } else if (qualifier == 'CODE') {
                            if (term.value.valueCode[0].value != correspondingTerm.value.valueCode[0].value ||
                                term.value.valueCode[0].name != correspondingTerm.value.valueCode[0].name) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }

    // check whether delivery dates are included in the given delivery
    public static areDeliveryDatesAvailable(delivery: Delivery[]): boolean {
        if (delivery) {
            return delivery.length > 1 || delivery[0].requestedDeliveryPeriod.endDate != null || !UBLModelUtils.isEmptyQuantity(delivery[0].shipment.goodsItem[0].quantity);
        }
        return false;
    }

    public static isAddressEmpty(address: Address): boolean {
        return !(address && (this.isNotEmptyString(address.streetName) || this.isNotEmptyString(address.buildingNumber) || this.isNotEmptyString(address.postalZone) || this.isNotEmptyString(address.region) || this.isNotEmptyString(address.cityName) || this.isNotEmptyCountry(address.country)));
    }

    public static getFrameContractDurationFromRfqLine(rfqLine: RequestForQuotationLine): Quantity {
        let tradingTerm: TradingTerm = rfqLine.lineItem.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if (tradingTerm != null) {
            return tradingTerm.value.valueQuantity[0];
        }
        return null;
    }

    // we need to traverse quotation lines in the reverse order since we assume that if the same product exists in the negotiation multiple times,
    // frame contract is created for the last one
    public static getFrameContractQuotationLineIndexForProduct(quotationLines: QuotationLine[], catalogueId: string, lineId: string): number {
        let size = quotationLines.length;
        for (let i = size - 1; i > -1; i--) {
            let quotationLine = quotationLines[i];
            if (quotationLine.lineItem.item.manufacturersItemIdentification.id == lineId && quotationLine.lineItem.item.catalogueDocumentReference.id == catalogueId) {
                return i;
            }
        }
        return 0;
    }

    public static getFirstFromMultiTypeValueByQualifier(multiTypeValue: MultiTypeValue): any {
        if (multiTypeValue.valueQualifier == 'TEXT' || multiTypeValue.valueQualifier == 'STRING') {
            if (multiTypeValue.value && multiTypeValue.value.length > 0) {
                return multiTypeValue.value[0];
            }
        } else if (multiTypeValue.valueQualifier == 'NUMBER') {
            if (multiTypeValue.valueDecimal && multiTypeValue.valueDecimal.length > 0) {
                return multiTypeValue.valueDecimal[0];
            }
        } else if (multiTypeValue.valueQualifier == 'QUANTITY') {
            if (multiTypeValue.valueQuantity && multiTypeValue.valueQuantity.length > 0) {
                return multiTypeValue.valueQuantity[0];
            }
        }
        return null;
    }

    public static areTradingTermListsEqual(list1: TradingTerm[], list2: TradingTerm[]): boolean {
        if ((!list1 && !list2) ||
            (!list1 && list2.length == 0) ||
            (list1.length == 0 && !list2)) {
            return true;
        }
        if (list1.length != list2.length) {
            return false;
        }
        for (let term1 of list1) {
            let isEqual: boolean = false;
            for (let term2 of list2) {
                if (term1.id == term2.id) {
                    isEqual = UBLModelUtils.areTradingTermsEqual(term1, term2);
                    break;
                }
            }
            if (!isEqual) {
                return false;
            }
        }
        return true;
    }

    public static areTradingTermsEqual(term1: TradingTerm, term2: TradingTerm): boolean {
        if (!term1 && !term2) {
            return true;
        }
        if (!term1 || !term2) {
            return false;
        }
        if (term1.value.valueQualifier != term2.value.valueQualifier) {
            return false;
        }
        let value1 = UBLModelUtils.getFirstFromMultiTypeValueByQualifier(term1.value);
        let value2 = UBLModelUtils.getFirstFromMultiTypeValueByQualifier(term2.value);

        return value1 == value2;
    }

    public static areItemPropertyValuesEqual(value1: any, value2: any, valueQualifier: string): boolean {
        if (valueQualifier === 'QUANTITY') {
            return UBLModelUtils.areQuantitiesEqual(value1, value2);
        } else if (valueQualifier === 'STRING') {
            return UBLModelUtils.areTextsEqual(value1, value2);
        } else {
            return value1 === value2;
        }
    }

    public static doesTextArraysContainText(texts1: Text[], text2: Text): boolean {
        for (let text1 of texts1) {
            if (text1.value === text2.value && text1.languageID === text2.languageID) {
                return true;
            }
        }
        return false;
    }

    public static createTradingTerm(termName: string, termDescription: string, value, type: string) {
        let termValue: MultiTypeValue = new MultiTypeValue();
        termValue.valueQualifier = type;

        if (type == 'TEXT') {
            let text: Text = new Text(value, null);
            text.value = value;
            termValue.value.push(text);
        } else if (type == 'NUMBER') {
            termValue.valueDecimal.push(value);
        } else if (type == 'QUANTITY') {
            termValue.valueQuantity.push(value);
        }

        let description: Text[] = [new Text(termDescription, null)];
        return new TradingTerm(termName, description, null, termValue);
    }

    public static isProductInCart(catalogue: Catalogue, catalogueId: string, productId: string): boolean {
        if (catalogue == null || catalogue.catalogueLine.length == 0) {
            return false;
        }
        for (let catalogueLine of catalogue.catalogueLine) {
            if (catalogueLine.goodsItem.item.catalogueDocumentReference.id == catalogueId && catalogueLine.goodsItem.item.manufacturersItemIdentification.id == productId) {
                return true;
            }
        }
        return false;
    }

    private static isNotEmptyString(string) {
        return string != null && string !== ''
    }

    private static isNotEmptyCountry(country: Country) {
        return country && country.name && this.isNotEmptyString(country.name.value);
    }

    public static areNotesOrFilesAttachedToDocument(document: RequestForQuotation | Quotation) {
        // consider the documents which has a embedded binary objects
        // the others are just references to previous documents
        let files = document.additionalDocumentReference.filter(doc => doc.attachment != null).map(doc => doc.attachment.embeddedDocumentBinaryObject);
        return (document.note.length == 1 && document.note[0] != "") || document.note.length > 1 || files.length > 0;
    }
}
