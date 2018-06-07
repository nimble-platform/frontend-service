import {DespatchAdvice} from "../../catalogue/model/publish/despatch-advice";
import {Item} from "../../catalogue/model/publish/item";
import {Order} from "../../catalogue/model/publish/order";
import {RequestForQuotation} from "../../catalogue/model/publish/request-for-quotation";
import {Ppap} from "../../catalogue/model/publish/ppap";
import {TransportExecutionPlanRequest} from "../../catalogue/model/publish/transport-execution-plan-request";
import {ItemInformationRequest} from "../../catalogue/model/publish/item-information-request";
/**
 * Created by suat on 24-Oct-17.
 */

export class ActivityVariableParser {
    static getProcessType(processVariables): string {
        return processVariables[0]["processDefinitionKey"]
    }

    static getInitialDocument(processVariables: any[]): any {
        for (let variable of processVariables) {
            if (variable.name == "order" ||
                variable.name == "requestForQuotation" ||
                variable.name == "despatchAdvice" ||
                variable.name == "transportExecutionPlanRequest" ||
                variable.name == 'itemInformationRequest' || variable.name=="ppapRequest") {
                return variable;
            }
        }
        return null;
    }

    static getResponse(processVariables: any[]): any {
        for (let variable of processVariables) {
            if (variable.name == "orderResponse" ||
                variable.name == "quotation" ||
                variable.name == "receiptAdvice" ||
                variable.name == "transportExecutionPlan" ||
                variable.name == 'itemInformationResponse'|| variable.name == "ppapResponse") {
                return variable;
            }
        }
        return null;
    }

    static getTradingPartnerName(initialDocument: any, partyId: string): string {
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            if(order.buyerCustomerParty.party.id == partyId) {
                return order.sellerSupplierParty.party.name;
            } else {
                return order.buyerCustomerParty.party.name;
            }

        } else if(processType == "Ppap"){
            let ppap: Ppap = initialDocument.value as Ppap;
            if(ppap.buyerCustomerParty.party.id == partyId) {
                return ppap.sellerSupplierParty.party.name;
            } else {
                return ppap.buyerCustomerParty.party.name;
            }

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            if(rfq.buyerCustomerParty.party.id == partyId) {
                return rfq.sellerSupplierParty.party.name;
            } else {
                return rfq.buyerCustomerParty.party.name;
            }

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument.value as DespatchAdvice;
            if(despatchAdvice.despatchSupplierParty.party.id == partyId) {
                return despatchAdvice.deliveryCustomerParty.party.name;
            } else {
                return despatchAdvice.despatchSupplierParty.party.name;
            }

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            if(tepr.transportUserParty.id == partyId) {
                return tepr.transportServiceProviderParty.name;
            } else {
                return tepr.transportUserParty.name;
            }

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument.value as ItemInformationRequest;
            if(itemInformationRequest.buyerCustomerParty.party.id == partyId) {
                return itemInformationRequest.sellerSupplierParty.party.name;
            } else {
                return itemInformationRequest.buyerCustomerParty.party.name;
            }
        }
    }

    static getBuyerId(initialDocument:any){
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            return order.buyerCustomerParty.party.id;

        } else if(processType == "Ppap"){
            let ppap: Ppap = initialDocument.value as Ppap;
            return ppap.buyerCustomerParty.party.id;
        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            return rfq.buyerCustomerParty.party.id;

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument.value as DespatchAdvice;
            return despatchAdvice.deliveryCustomerParty.party.id;

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            return tepr.transportUserParty.id;

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument.value as ItemInformationRequest;
            return itemInformationRequest.buyerCustomerParty.party.id;
        }
    }

    static getUserRole(activityVariables: any,partyId:any):string{
        let initialDoc: any = ActivityVariableParser.getInitialDocument(activityVariables);
        let buyerId:any = ActivityVariableParser.getBuyerId(initialDoc);
        return buyerId == partyId ? 'buyer' : 'seller';
    }

    static getProductFromProcessData(initialDocument: any): Item {
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            return order.orderLine[0].lineItem.item;

        } else if(processType == "Ppap"){
            let ppap: Ppap = initialDocument.value as Ppap;
            return ppap.lineItem.item;
        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            return rfq.requestForQuotationLine[0].lineItem.item;

        } else if (processType == "Fulfilment") {
            let despatchAdvice:DespatchAdvice = initialDocument.value as DespatchAdvice;
            return despatchAdvice.despatchLine[0].item;

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            return tepr.mainTransportationService;

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument.value as ItemInformationRequest;
            return itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item;
        }
    }

    static getProductNameFromProcessData(initialDocument: any): string {
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            return order.orderLine[0].lineItem.item.name;

        } else if(processType == "Ppap"){
            let ppap:Ppap = initialDocument.value() as Ppap;
            return ppap.lineItem.item.name;
        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            return rfq.requestForQuotationLine[0].lineItem.item.name;

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument.value as DespatchAdvice;
            return despatchAdvice.despatchLine[0].item.name;

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            return tepr.mainTransportationService.name;

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument.value as ItemInformationRequest;
            return itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item.name;
        }
    }

    static getNoteFromProcessData(initialDocument: any): string {
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            return order.note;

        } else if(processType == "Ppap"){
            let ppap: Ppap = initialDocument.value as Ppap;
            return ppap.note;
        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            return rfq.note[0];

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument.value as DespatchAdvice;
            return despatchAdvice.note[0];

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            return tepr.note[0];

        } else if(processType == 'Item_Information_Request') {
            let itemInformationRequest: ItemInformationRequest = initialDocument.value as ItemInformationRequest;
            return itemInformationRequest.note[0];
        }
    }
}
