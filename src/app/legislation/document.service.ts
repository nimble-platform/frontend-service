/*
 * Copyright 2020
 * AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors; Valencia; Spain
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

import { Injectable, PipeTransform } from '@angular/core';

import { BehaviorSubject, Observable, of, Subject } from 'rxjs';

import { DecimalPipe } from '@angular/common';
import { debounceTime, delay, switchMap, tap } from 'rxjs/operators';
import { SortDirection } from './sortable.directive';
import { DocumentInterface } from './interfaces/document.interface';

interface SearchResult {
    documents: DocumentInterface[];
    total: number;
}

interface State {
    page: number;
    pageSize: number;
    searchTerm: string;
    sortColumn: string;
    sortDirection: SortDirection;
    numVisiblePages: number;
}

function compare(v1, v2) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
}

function sort(documents: DocumentInterface[], column: string, direction: string): DocumentInterface[] {
    if (direction === '') {
        return documents;
    } else {
        return [...documents].sort((a, b) => {
            const res = compare(a['mainAttr'][column], b['mainAttr'][column]);
            return direction === 'asc' ? res : -res;
        });
    }
}

function matches(document: DocumentInterface, term: string, pipe: PipeTransform) {
    return document.mainAttr.title.toLowerCase().includes(term)
        || document.mainAttr.code.toLowerCase().includes(term);
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
    private _loading$ = new BehaviorSubject<boolean>(true);
    private _search$ = new Subject<void>();
    private _documents$ = new BehaviorSubject<DocumentInterface[]>([]);
    private _total$ = new BehaviorSubject<number>(0);

    public DOCUS: DocumentInterface[] = [];

    private _state: State = {
        page: 1,
        pageSize: 8,
        searchTerm: '',
        sortColumn: '',
        sortDirection: '',
        numVisiblePages: 20
    };

    constructor(private pipe: DecimalPipe) {
        this._search$.pipe(
            tap(() => this._loading$.next(true)),
            debounceTime(200),
            switchMap(() => this._search()),
            delay(200),
            tap(() => this._loading$.next(false))
        ).subscribe(result => {
            this._documents$.next(result.documents);
            this._total$.next(result.total);
        });

        this._search$.next();
    }

    get documents$() { return this._documents$.asObservable(); }
    get total$() { return this._total$.asObservable(); }
    get loading$() { return this._loading$.asObservable(); }
    get page() { return this._state.page; }
    get pageSize() { return this._state.pageSize; }
    get numVisiblePages() { return this._state.numVisiblePages; }
    get searchTerm() { return this._state.searchTerm; }

    set page(page: number) { this._set({ page }); }
    set pageSize(pageSize: number) { this._set({ pageSize }); }
    set numVisiblePages(numVisiblePages: number) { this._set({ numVisiblePages }); }
    set searchTerm(searchTerm: string) { this._set({ searchTerm }); }
    set sortColumn(sortColumn: string) { this._set({ sortColumn }); }
    set sortDirection(sortDirection: SortDirection) { this._set({ sortDirection }); }

    private _set(patch: Partial<State>) {
        Object.assign(this._state, patch);
        this._search$.next();
    }

    private _search(): Observable<SearchResult> {
        const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;

        // 1. sort
        let documents = sort(this.DOCUS, sortColumn, sortDirection);

        // 2. filter
        documents = documents.filter(document => matches(document, searchTerm, this.pipe));
        const total = documents.length;

        // 3. paginate
        var from = (page - 1) * pageSize;
        var to = ((page - 1) * pageSize) + (+pageSize);
        documents = documents.slice(from, to);
        return of({ documents, total });
    }
}
