/**
 * Created by suat on 12-May-17.
 */
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const http_1 = require("@angular/http");
const core_1 = require("@angular/core");
const router_1 = require('@angular/router');
const category_service_1 = require("./category.service");
let CategorySearchComponent = class CategorySearchComponent {
    constructor(http, router, categoryService) {
        this.http = http;
        this.router = router;
        this.categoryService = categoryService;
        this.headers = new http_1.Headers({ 'Accept': 'application/json' });
        // TODO remove the hardcoded URL
        //private url = myGlobals.endpoint;
        this.url = `http://localhost:8095/catalogue/category`;
    }
    getCategories(keyword) {
        this.categoryService.getCategories(keyword)
            .then(categories => {
            this.categories = categories;
        });
    }
    selectCategory(category) {
        this.categoryService.getCategory(category.id)
            .then(category => {
            this.categoryService.setSelectedCategory(category);
            this.router.navigate(['publish']);
        });
    }
};
CategorySearchComponent = __decorate([
    core_1.Component({
        selector: 'category-search',
        templateUrl: './category-search.component.html',
    }), 
    __metadata('design:paramtypes', [http_1.Http, router_1.Router, category_service_1.CategoryService])
], CategorySearchComponent);
exports.CategorySearchComponent = CategorySearchComponent;
//# sourceMappingURL=category-search.component.js.map