import {Quantity} from "./quantity";
import {Amount} from "./amount";
import {MultiTypeValue} from "./lcpa-input-detail";
import {LCPAInput} from "./lcpa-input";
import {LCPAOutput} from "./lcpa-output";
export class LifeCyclePerformanceAssessmentDetails {
    constructor(public lcpainput: LCPAInput = new LCPAInput(),
                public lcpaoutput: LCPAOutput = new LCPAOutput()) {
    }
}