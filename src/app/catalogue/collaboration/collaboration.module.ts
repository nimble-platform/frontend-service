import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { CommonModule } from "@angular/common";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { CollaborationViewComponent } from "./collaboration-view.component";
import { AppCommonModule } from "../../common/common.module";
import { UserMgmtModule } from "../../user-mgmt/user-mgmt.module";

@NgModule({
	imports: [CommonModule, 
		AppCommonModule, 
		FormsModule, 
		ReactiveFormsModule, 
		HttpModule, 
        UserMgmtModule,
		NgbModule.forRoot()
	],
    declarations: [
        CollaborationViewComponent
    ],
    exports: [
        CollaborationViewComponent
    ],
    providers: []
})
export class CollaborationModule {}
