import { Component, OnInit } from "@angular/core";
import {  NgbModal, ModalDismissReasons , NgbModalOptions} from '@ng-bootstrap/ng-bootstrap';
import {rocketChatEndpoint} from "../globals";

@Component({
    selector: "chat",
    templateUrl: "./chat.component.html",
    styleUrls: ["./chat.component.css"],
})



export class ChatComponent implements OnInit {

    rocketChatEndpoint = rocketChatEndpoint;
    constructor(private modalService: NgbModal) {}

    ngOnInit(): void {

    }
}
