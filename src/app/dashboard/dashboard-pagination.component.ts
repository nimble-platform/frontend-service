import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

/**
 * Anthony: not used at the moment, waiting for review of the dashboard with business owner and I'll delete it then.
 */
@Component({
    selector: "dashboard-pagination",
    templateUrl: "./dashboard-pagination.component.html",
    styleUrls: ["./dashboard-pagination.component.css"]
})
export class DashboardPaginationComponent implements OnInit {

    @Input() collectionSize: number
    @Input() pageSize: number
    @Input() @Output() page: number
    @Input() limit: number = 10
    @Output() paginationHandler = new EventEmitter<void>()

    constructor() {

    }

    ngOnInit() {

    }

    pageChange() {
        this.paginationHandler.emit()
    }

    getStart(): number {
        if(this.collectionSize === 0) {
            return 0
        }
        return (this.page - 1) * this.pageSize + 1
    }

    getEnd(): number {
        const end = this.page * this.pageSize
        return end > this.collectionSize ? this.collectionSize : end
    }
}