import { Component, OnInit, Input } from "@angular/core";
import { CompanySettings } from "../model/company-settings";
import { CallStatus } from "../../common/call-status";
import { UserService } from "../user.service";
import { CookieService } from "ng2-cookies";

@Component({
    selector: "company-categories-settings",
    templateUrl: "./company-categories-settings.component.html"
})
export class CompanyCategoriesSettingsComponent implements OnInit {
    
    @Input() settings: CompanySettings;

    prefCats = [];
    categoriesCallStatus: CallStatus[] = [];

    constructor(private cookieService: CookieService,
                private userService: UserService) {

    }

    ngOnInit() {
        this.prefCats = this.settings.preferredProductCategories;
        this.prefCats.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
        this.categoriesCallStatus = this.prefCats.map(() => new CallStatus());
    }

    removeCat(cat: string, i: number) {
        if (confirm("Are you sure that you want to remove this category from your favorites?")) {
            this.categoriesCallStatus[i].submit();
            let userId = this.cookieService.get("user_id");
            this.userService.togglePrefCat(userId, cat).then(res => {
                this.prefCats = res;
                this.prefCats.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
                // it's ok to have onw more call status than the number of categories here
                // no need to replace the array again.
                this.categoriesCallStatus[i].callback("Succesfully removed category", true);
            })
            .catch(error => {
                this.categoriesCallStatus[i].error("Error while removing category from favourites", error);
            });
        }
    }
}
