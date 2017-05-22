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
/**
 * Created by suat on 17-May-17.
 */
const core_1 = require('@angular/core');
const http_1 = require('@angular/http');
let CategoryService = class CategoryService {
    constructor(http) {
        this.http = http;
        this.headers = new http_1.Headers({ 'Accept': 'application/json' });
        // TODO remove the hardcoded URL
        //private url = myGlobals.endpoint;
        this.url = `http://localhost:8095/catalogue/category`;
        this.categories = null;
        this.selectedCategory = null;
    }
    getCategories(keyword) {
        const url = `${this.url}?categoryName=${keyword}`;
        return this.http
            .get(url, { headers: this.headers })
            .toPromise()
            .then(res => {
            this.categories = res.json();
            return this.categories;
        })
            .catch(this.handleError);
    }
    getCategory(id) {
        const url = `${this.url}/` + encodeURIComponent(id);
        return this.http
            .get(url, { headers: this.headers })
            .toPromise()
            .then(res => {
            return res.json();
        })
            .catch(this.handleError);
    }
    getSelectedCategory() {
        return this.selectedCategory;
    }
    setSelectedCategory(category) {
        this.selectedCategory = category;
    }
    handleError(error) {
        return Promise.reject(error.message || error);
    }
};
CategoryService = __decorate([
    core_1.Injectable(), 
    __metadata('design:paramtypes', [http_1.Http])
], CategoryService);
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map