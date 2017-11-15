import {DespatchAdvice} from "../../catalogue/model/publish/despatch-advice";
import {Item} from "../../catalogue/model/publish/item";
import {Order} from "../../catalogue/model/publish/order";
import {RequestForQuotation} from "../../catalogue/model/publish/request-for-quotation";
import {TransportExecutionPlanRequest} from "../../catalogue/model/publish/transport-execution-plan-request";
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
                variable.name == "transportExecutionPlanRequest") {
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
                variable.name == "transportExecutionPlan") {
                return variable;
            }
        }
        return null;
    }

    static getResponderNameProcessData(initialDocument: any): string {
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            return order.sellerSupplierParty.party.name;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            return rfq.sellerSupplierParty.party.name;

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument.value as DespatchAdvice;
            return despatchAdvice.despatchSupplierParty.party.name;

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            return tepr.transportServiceProviderParty.name;
        }
    }

    static getInitiatorNameProcessData(initialDocument: any): string {
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            return order.buyerCustomerParty.party.name;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            return rfq.buyerCustomerParty.party.name;

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument.value as DespatchAdvice;
            return despatchAdvice.deliveryCustomerParty.party.name;

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            return tepr.transportUserParty.name;
        }
    }

    static getProductFromProcessData(initialDocument: any): Item {
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            return order.orderLine[0].lineItem.item;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            return rfq.requestForQuotationLine[0].lineItem.item;

        } else if (processType == "Fulfilment") {
            let despatchAdvice:DespatchAdvice = initialDocument.value as DespatchAdvice;
            return despatchAdvice.despatchLine[0].item;

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            return tepr.mainTransportationService;
        }
    }

    static getProductNameFromProcessData(initialDocument: any): string {
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            return order.orderLine[0].lineItem.item.name;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            return rfq.requestForQuotationLine[0].lineItem.item.name;

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument.value as DespatchAdvice;
            return despatchAdvice.despatchLine[0].item.name;

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            return tepr.mainTransportationService.name;
        }
    }

    static getNoteFromProcessData(initialDocument: any): string {
        let processType: string = initialDocument.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = initialDocument.value as Order;
            return order.note;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = initialDocument.value as RequestForQuotation;
            return rfq.note[0];

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = initialDocument.value as DespatchAdvice;
            return despatchAdvice.note[0];

        } else if(processType == "Transport_Execution_Plan") {
            let tepr: TransportExecutionPlanRequest = initialDocument.value as TransportExecutionPlanRequest;
            return tepr.note[0];
        }
    }
}
