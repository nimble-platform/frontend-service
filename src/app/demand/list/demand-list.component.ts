/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import {Component, Input, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {CookieService} from 'ng2-cookies';
import {ActivatedRoute, Router} from '@angular/router';
import {DemandService} from '../demand-service';
import {Demand} from '../../catalogue/model/publish/demand';
import {CategoryService} from '../../catalogue/category/category.service';
import {CategoryModelUtils} from '../../catalogue/model/model-util/category-model-utils';
import {Category} from '../../catalogue/model/category/category';
import {Text} from '../../catalogue/model/publish/text';
import {LanguageUtils} from '../../catalogue/model/model-util/language-utils';
import {FEDERATIONID} from '../../catalogue/model/constants';

@Component({
    selector: 'demand-list',
    templateUrl: './demand-list.component.html'
})
export class DemandListComponent implements OnInit {
    demands: Demand[] = [];

    page = 0;
    pageSize = 10;
    totalCount: number;
    pageCount: number;

    constructor(
        private demandService: DemandService,
        private categoryService: CategoryService,
        private cookieService: CookieService,
        private translate: TranslateService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['page']) {
                this.page = Number.parseInt(params['page']);
            } else {
                this.page = 0;
            }

            this.demandService.getDemands(this.cookieService.get('company_id'), this.page, this.pageSize).then(demands => {
                this.demands = demands.demands;
                this.totalCount = demands.totalCount;

                // fetch the labels for the categories included in the demands and update the demans with the fetched labels
                const categoryUris: string[] = this.demands.map(demand => demand.itemClassificationCode.value);
                this.categoryService.getCategories(categoryUris).then(categoriesResp => {
                    const categoriesJson: any[] = categoriesResp.result;
                    for (const demand of this.demands) {
                        for (const indexCategory of categoriesJson) {
                            const preferredName: Text[] = LanguageUtils.transformIndexLabelsToTextArray(indexCategory.label);
                            if (demand.itemClassificationCode.value === indexCategory.uri) {
                                demand.itemClassificationCode.name = preferredName[0].value;
                                break;
                            }
                        }
                    }
                });
            });
        });
    }

    onPageChange(pageNo: number): void {
        this.router.navigate(['dashboard'], {
            queryParams: {
                tab: 'DEMANDS',
                page: pageNo - 1
            }
        });
    }
}
