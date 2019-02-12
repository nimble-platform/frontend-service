import {DespatchAdvice} from "../../catalogue/model/publish/despatch-advice";
import {Item} from "../../catalogue/model/publish/item";
import {Order} from "../../catalogue/model/publish/order";
import {RequestForQuotation} from "../../catalogue/model/publish/request-for-quotation";
import {Ppap} from "../../catalogue/model/publish/ppap";
import {TransportExecutionPlanRequest} from "../../catalogue/model/publish/transport-execution-plan-request";
import {ItemInformationRequest} from "../../catalogue/model/publish/item-information-request";
import { ProcessType } from "../model/process-type";
import {UBLModelUtils} from '../../catalogue/model/ubl-model-utils';
/**
 * Created by suat on 24-Oct-17.
 */

export class ActivityVariableParser {
    static getProcessType(processVariables): ProcessType {
        return processVariables[0]["processDefinitionKey"]
    }

    static getProcessInstanceID(processVariables: any[]): string {
        for (let variable of processVariables) {
            if (variable.name == "initialDocumentID") {
                return variable.processInstanceId;
            }
        }
        return null;
    }

    static getTradingPartnerName(initialDocument: any, partyId: string, processType: string): string {
        if (processType == "Order") {
            let order: Order = initialDocument as Order;
            if(UBLModelUtils.getPartyId(order.buyerCustomerParty.party) == partyId) {
                return UBLModelUtils.getPartyDisplayName(order.sellerSupplierParty.party);
            } else {
                return UBLModelUtils.getPartyDisplayName(order.buyerCustomerParty.party);
            }

        } else if(processType == "Ppap"){
            let ppap: Ppap = initialDocument as Ppap;
            if(UBLModelUtils.getPartyId(ppap.buyerCustomerParty.party) == partyId) {
                return UBLModelUtils.getPartyDisplayName(ppap.sellerSupplierParty.party);
            } else {
                return UBLModelUtils.getPartyDisplayName(ppap.buyerCustomerParty.party);
            }

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument as RequestForQuotation;
            if(UBLModelUtils.getPartyId(rfq.buyerCustomerParty.party) == partyId) {
                return UBLModelUtils.getPartyDisplayName(rfq.sellerSupplierParty.party);
            } else {
                return UBLModelUtils.getPartyDisplayName(rfq.buyerCustomerParty.party);
            }

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument as DespatchAdvice;
            if(UBLModelUtils.getPartyId(despatchAdvice.despatchSupplierParty.party) == partyId) {
                return UBLModelUtils.getPartyDisplayName(despatchAdvice.deliveryCustomerParty.party);
            } else {
                return UBLModelUtils.getPartyDisplayName(despatchAdvice.despatchSupplierParty.party);
            }

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument as TransportExecutionPlanRequest;
            if(UBLModelUtils.getPartyId(tepr.transportUserParty) == partyId) {
                return UBLModelUtils.getPartyDisplayName(tepr.transportServiceProviderParty);
            } else {
                return UBLModelUtils.getPartyDisplayName(tepr.transportUserParty);
            }

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument as ItemInformationRequest;
            if(UBLModelUtils.getPartyId(itemInformationRequest.buyerCustomerParty.party) == partyId) {
                return UBLModelUtils.getPartyDisplayName(itemInformationRequest.sellerSupplierParty.party);
            } else {
                return UBLModelUtils.getPartyDisplayName(itemInformationRequest.buyerCustomerParty.party);
            }
        }
    }

    static getBuyerId(initialDocument:any, processType: string){
        if (processType == "Order") {
            let order: Order = initialDocument as Order;
            return UBLModelUtils.getPartyId(order.buyerCustomerParty.party);

        } else if(processType == "Ppap"){
            let ppap: Ppap = initialDocument as Ppap;
            return UBLModelUtils.getPartyId(ppap.buyerCustomerParty.party);
        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument as RequestForQuotation;
            return UBLModelUtils.getPartyId(rfq.buyerCustomerParty.party);

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument as DespatchAdvice;
            return UBLModelUtils.getPartyId(despatchAdvice.deliveryCustomerParty.party);

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument as TransportExecutionPlanRequest;
            return UBLModelUtils.getPartyId(tepr.transportUserParty);

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument as ItemInformationRequest;
            return UBLModelUtils.getPartyId(itemInformationRequest.buyerCustomerParty.party);
        }
    }

    static getProductFromProcessData(initialDocument: any, processType: string): Item {
        if (processType == "Order") {
            let order: Order = initialDocument as Order;
            return order.orderLine[0].lineItem.item;

        } else if(processType == "Ppap"){
            let ppap: Ppap = initialDocument as Ppap;
            return ppap.lineItem.item;
        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument as RequestForQuotation;
            return rfq.requestForQuotationLine[0].lineItem.item;

        } else if (processType == "Fulfilment") {
            let despatchAdvice:DespatchAdvice = initialDocument as DespatchAdvice;
            return despatchAdvice.despatchLine[0].item;

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument as TransportExecutionPlanRequest;
            return tepr.mainTransportationService;

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument as ItemInformationRequest;
            return itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item;
        }
    }

    static getProductNameFromProcessData(initialDocument: any, processType: string): string {
        if (processType == "Order") {
            let order: Order = initialDocument as Order;
            return order.orderLine[0].lineItem.item.name[0].value;

        } else if(processType == "Ppap"){
            let ppap:Ppap = initialDocument as Ppap;
            return ppap.lineItem.item.name[0].value;
        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument as RequestForQuotation;
            return rfq.requestForQuotationLine[0].lineItem.item.name[0].value;

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument as DespatchAdvice;
            return despatchAdvice.despatchLine[0].item.name[0].value;

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument as TransportExecutionPlanRequest;
            return tepr.mainTransportationService.name[0].value;

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument as ItemInformationRequest;
            return itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item.name[0].value;
        }
    }

    static getNoteFromProcessData(initialDocument: any, processType: string): string {
        if (processType == "Order") {
            let order: Order = initialDocument as Order;
            return order.note[0];

        } else if(processType == "Ppap"){
            let ppap: Ppap = initialDocument as Ppap;
            return ppap.note[0];
        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument as RequestForQuotation;
            return rfq.note[0];

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument as DespatchAdvice;
            return despatchAdvice.note[0];

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument as TransportExecutionPlanRequest;
            return tepr.note[0];

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument as ItemInformationRequest;
            return itemInformationRequest.note[0];
        }
    }
}
