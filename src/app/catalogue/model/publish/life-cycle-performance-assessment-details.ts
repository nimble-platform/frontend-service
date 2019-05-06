import {LCPAInput} from "./lcpa-input";
import {LCPAOutput} from "./lcpa-output";
export class LifeCyclePerformanceAssessmentDetails {
    constructor(public lcpainput: LCPAInput = new LCPAInput(),
                public lcpaoutput: LCPAOutput = new LCPAOutput()) {
    }
}