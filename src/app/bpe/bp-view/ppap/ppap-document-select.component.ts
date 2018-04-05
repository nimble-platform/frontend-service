import {Component, Input, OnInit} from "@angular/core";
import {BPEService} from "../../bpe.service";
import {UserService} from "../../../user-mgmt/user.service";
import {CookieService} from "ng2-cookies";
import {BPDataService} from "../bp-data-service";
import * as myGlobals from '../../../globals';
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {ProcessVariables} from "../../model/process-variables";
import {ModelUtils} from "../../model/model-utils";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {Ppap} from "../../../catalogue/model/publish/ppap";
import {CallStatus} from "../../../common/call-status";
import {ActivatedRoute, Router} from "@angular/router";
import {ActivityVariableParser} from "../activity-variable-parser";

@Component({
    selector: 'ppap-document-select',
    templateUrl: './ppap-document-select.component.html'
})

export class PpapDocumentSelectComponent implements OnInit{

    selectedTab: string;

    callStatus:CallStatus = new CallStatus();
    error_detc: boolean;
    callback: boolean;

    level: any = -1;
    note: any;
    ppap: Ppap;
    seller: boolean = false;

    documents: {text: String, select: boolean}[] = [];

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                public route: ActivatedRoute,
                private router:Router) {
    }

    ngOnInit(){
        this.route.queryParams.subscribe(params =>{
            let check = params['pid'];
            if(check != null){
                  this.level = 0;
                  this.setDocuments();
                  this.bpeService.getProcessDetailsHistory(check).then(task => {
                      this.ppap = ActivityVariableParser.getInitialDocument(task).value as Ppap;
                      let i = 0;
                      for(;i<this.ppap.documentType.length;i++){
                          let documentName = this.ppap.documentType[i];
                          let obj = this.documents.find(o => o.text === documentName);
                          obj.select = true;
                      }
                      this.note = this.ppap.note;
                  });
            }
        });
    }


    sendRequest()
    {
        this.ppap = UBLModelUtils.createPpap([]);
        this.callStatus.submit();
        let answer: String[] = [];
        for(var i = 0; i< this.documents.length ; i=i+1)
        {
            if(this.documents[i].select)
            {
                answer.push(this.documents[i].text);
            }
        }
        this.ppap.documentType = answer;
        this.ppap.note = this.note;


        this.ppap.lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(this.ppap);


        let sellerId:string = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id;
        let buyerId:string = this.cookieService.get("company_id");


        this.userService.getParty(buyerId).then(buyerParty => {
            this.ppap.buyerCustomerParty = new CustomerParty(buyerParty);

            this.userService.getParty(sellerId).then(sellerParty => {
                this.ppap.sellerSupplierParty = new SupplierParty(sellerParty);
                let vars:ProcessVariables = ModelUtils.createProcessVariables("Ppap", buyerId, sellerId, this.ppap, this.bpDataService);
                let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");
                this.bpeService.startBusinessProcess(piim)
                    .then(res => {
                        this.callStatus.callback("Ppap request is sent", true);
                        this.router.navigate(['dashboard']);
                        this.error_detc = false;
                        this.callback = true;
                    })
                    .catch(error => {
                        this.error_detc = true;
                        this.callStatus.error("Failed to send Ppap request");
                    });
            });
        });

    }

    setDocuments()
    {
        if(this.level === 0)
        {
            this.documents = [
                {text:'Design Documentation',select:false},{text:'Engineering Change Documentation',select:false},
                {text:'Customer Engineering Approval',select:false},{text:'Design Failure Mode and Effects Analysis',select:false},
                {text:'Process Flow Diagram',select:false},{text:'Process Failure Mode and Effects Analysis',select:false},
                {text:'Control Plan',select:false},{text:'Measurement System Analysis Studies',select:false},
                {text:'Dimensional Results',select:false},{text:'Records of Material / Performance Tests',select:false},
                {text:'Initial Process Studies',select:false},{text:'Qualified Laboratory Documentation',select:false},
                {text:'Appearance Approval Report',select:false},{text:'Sample Production Parts',select:false},
                {text:'Master Sample',select:false},{text:'Checking Aids',select:false},
                {text:'Customer Specific Requirements',select:false},{text:'Part Submission Warrant',select:false}
            ];
        }
        else if(this.level === 1)
        {
            this.documents = [
                {text:'Design Documentation',select:false},{text:'Engineering Change Documentation',select:false},
                {text:'Customer Engineering Approval',select:false},{text:'Design Failure Mode and Effects Analysis',select:false},
                {text:'Process Flow Diagram',select:false},{text:'Process Failure Mode and Effects Analysis',select:false},
                {text:'Control Plan',select:false},{text:'Measurement System Analysis Studies',select:false},
                {text:'Dimensional Results',select:false},{text:'Records of Material / Performance Tests',select:false},
                {text:'Initial Process Studies',select:false},{text:'Qualified Laboratory Documentation',select:false},
                {text:'Appearance Approval Report',select:true},{text:'Sample Production Parts',select:false},
                {text:'Master Sample',select:false},{text:'Checking Aids',select:false},
                {text:'Customer Specific Requirements',select:false},{text:'Part Submission Warrant',select:true}
            ];
        }
        else if(this.level === 2)
        {
            this.documents = [
                {text:'Design Documentation',select:true},{text:'Engineering Change Documentation',select:true},
                {text:'Customer Engineering Approval',select:false},{text:'Design Failure Mode and Effects Analysis',select:false},
                {text:'Process Flow Diagram',select:false},{text:'Process Failure Mode and Effects Analysis',select:false},
                {text:'Control Plan',select:false},{text:'Measurement System Analysis Studies',select:false},
                {text:'Dimensional Results',select:true},{text:'Records of Material / Performance Tests',select:true},
                {text:'Initial Process Studies',select:false},{text:'Qualified Laboratory Documentation',select:true},
                {text:'Appearance Approval Report',select:true},{text:'Sample Production Parts',select:true},
                {text:'Master Sample',select:false},{text:'Checking Aids',select:false},
                {text:'Customer Specific Requirements',select:false},{text:'Part Submission Warrant',select:true}
            ];
        }
        else if(this.level === 3)
        {
            this.documents = [
                {text:'Design Documentation',select:true},{text:'Engineering Change Documentation',select:true},
                {text:'Customer Engineering Approval',select:true},{text:'Design Failure Mode and Effects Analysis',select:true},
                {text:'Process Flow Diagram',select:true},{text:'Process Failure Mode and Effects Analysis',select:true},
                {text:'Control Plan',select:true},{text:'Measurement System Analysis Studies',select:true},
                {text:'Dimensional Results',select:true},{text:'Records of Material / Performance Tests',select:true},
                {text:'Initial Process Studies',select:true},{text:'Qualified Laboratory Documentation',select:true},
                {text:'Appearance Approval Report',select:true},{text:'Sample Production Parts',select:true},
                {text:'Master Sample',select:false},{text:'Checking Aids',select:false},
                {text:'Customer Specific Requirements',select:false},{text:'Part Submission Warrant',select:true}
            ];
        }
        else if(this.level === 4)
        {
            this.documents = [
                {text:'Design Documentation',select:true},{text:'Engineering Change Documentation',select:true},
                {text:'Customer Engineering Approval',select:false},{text:'Design Failure Mode and Effects Analysis',select:false},
                {text:'Process Flow Diagram',select:false},{text:'Process Failure Mode and Effects Analysis',select:false},
                {text:'Control Plan',select:false},{text:'Measurement System Analysis Studies',select:false},
                {text:'Dimensional Results',select:true},{text:'Records of Material / Performance Tests',select:true},
                {text:'Initial Process Studies',select:false},{text:'Qualified Laboratory Documentation',select:true},
                {text:'Appearance Approval Report',select:true},{text:'Sample Production Parts',select:true},
                {text:'Master Sample',select:true},{text:'Checking Aids',select:true},
                {text:'Customer Specific Requirements',select:true},{text:'Part Submission Warrant',select:true}
            ];
        }
        else if(this.level === 5)
        {
            this.documents = [
                {text:'Design Documentation',select:true},{text:'Engineering Change Documentation',select:true},
                {text:'Customer Engineering Approval',select:true},{text:'Design Failure Mode and Effects Analysis',select:true},
                {text:'Process Flow Diagram',select:true},{text:'Process Failure Mode and Effects Analysis',select:true},
                {text:'Control Plan',select:true},{text:'Measurement System Analysis Studies',select:true},
                {text:'Dimensional Results',select:true},{text:'Records of Material / Performance Tests',select:true},
                {text:'Initial Process Studies',select:true},{text:'Qualified Laboratory Documentation',select:true},
                {text:'Appearance Approval Report',select:true},{text:'Sample Production Parts',select:true},
                {text:'Master Sample',select:true},{text:'Checking Aids',select:true},
                {text:'Customer Specific Requirements',select:false},{text:'Part Submission Warrant',select:true}
            ];
        }
    }
}
