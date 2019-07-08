import {Injectable} from "@angular/core";
import {DigitalAgreement} from "../../../catalogue/model/publish/digital-agreement";

@Injectable()
export class FrameContractTransitionService{
    // keeps the frame contract of which details are opened via the dashboard
    frameContract: DigitalAgreement;
}
