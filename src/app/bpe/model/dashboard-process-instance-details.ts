import {Person} from '../../catalogue/model/publish/person';

export class DashboardProcessInstanceDetails {
    constructor(public variableInstance:object,
                public lastActivityInstance:object,
                public processInstance:object,
                public requestDocument:object,
                public responseDocumentStatus:object,
                public requestMetadata:object,
                public responseMetadata:object,
                public requestCreatorUser:Person,
                public responseCreatorUser:Person,
                public cancellationReason:string,
                public requestDate:string,
                public responseDate:string,
                public completionDate:string) {
    }
}
