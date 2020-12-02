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
import {Component, ElementRef, Injectable, ViewChild} from '@angular/core'
import {NgbModal} from '@ng-bootstrap/ng-bootstrap'
import {CallStatus} from './call-status';
import {AppComponent} from '../app.component';
import {BPEService} from '../bpe/bpe.service';

@Component({
    selector: 'cancel-collaboration-modal',
    templateUrl: './cancel-collaboration-modal.component.html',
    styleUrls: ['./cancel-collaboration-modal.component.css']
})
@Injectable()
export class CancelCollaborationModalComponent {

    // comment of the company for the cancellation of collaboration
    private compComment: string = '';
    // identifier of the process instance group representing the collaboration
    private processInstanceGroupId: string;
    // seller federation id
    private sellerFederationId: string;

    cancelCollaborationCallStatus: CallStatus = new CallStatus();

    @ViewChild('modal') modal: ElementRef;

    constructor(private modalService: NgbModal,
                private bpeService: BPEService,
                private appComponent: AppComponent) {
    }

    /**
     * Opens the modal
     * @param processInstanceGroupId identifier of the process instance group representing the collaboration
     * @param sellerFederationId seller federation id
     * @return true if the collaboration is canceled successfully or return false if the modal is closed
     * */
    open(processInstanceGroupId: string, sellerFederationId: string): Promise<boolean> {
        // set the given fields
        this.sellerFederationId = sellerFederationId;
        this.processInstanceGroupId = processInstanceGroupId;
        // reset the company comment
        this.compComment = '';
        return this.modalService.open(this.modal, {windowClass: 'high-z-index'}).result.then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    }

    checkCompComment(): boolean {
        return this.compComment == '';
    }

    cancelCollaboration(close) {
        this.appComponent.confirmModalComponent.open('Are you sure that you want to cancel this collaboration?').then(result => {
            if (result) {
                this.cancelCollaborationCallStatus.submit();
                this.bpeService.cancelCollaboration(this.processInstanceGroupId, this.compComment, this.sellerFederationId)
                    .then(() => {
                        this.cancelCollaborationCallStatus.callback('Cancelled collaboration successfully');
                        close();
                    })
                    .catch(err => {
                        this.cancelCollaborationCallStatus.error('Failed to cancel collaboration', err);
                    });
            }
        });
    }

}
