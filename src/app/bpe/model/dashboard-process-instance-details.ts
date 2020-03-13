export class DashboardProcessInstanceDetails {
    constructor(public variableInstance:object,
                public lastActivityInstanceStartTime:string,
                public processInstanceState:string,
                public requestDocument:object,
                public responseDocumentStatus:object,
                public requestCreatorUserId:string,
                public responseCreatorUserId:string,
                public cancellationReason:string,
                public requestDate:string,
                public responseDate:string,
                public completionDate:string) {
    }
}
