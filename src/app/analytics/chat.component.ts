import { Component, OnInit } from "@angular/core";
import {  NgbModal, ModalDismissReasons , NgbModalOptions} from '@ng-bootstrap/ng-bootstrap';
import {rocketChatEndpoint} from "../globals";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
    selector: "chat",
    templateUrl: "./chat.component.html",
    styleUrls: ["./chat.component.css"],
})



export class ChatComponent implements OnInit {

    chatURL = this.sanitizer.bypassSecurityTrustResourceUrl(rocketChatEndpoint);

    constructor(public sanitizer: DomSanitizer) {}

    ngOnInit(): void {

    }
}
