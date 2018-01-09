import { Component, OnInit } from '@angular/core';
import { Router }            from '@angular/router';

import { BP }                from './model/bp';
import { BPService }         from './bp.service';

@Component({
  selector: 'my-bps',
  templateUrl: './bps.component.html'
})
export class BPsComponent implements OnInit {
  bps: BP[];

  constructor(
    private bpService: BPService,
    private router: Router) { }

  getBPs(): void {
    this.bpService
        .getBPs()
        .subscribe(bps => this.bps = bps);
  }

  delete(bp: BP): void {
    this.bpService
        .delete(bp.processID)
        .subscribe(() => {
          this.bps = this.bps.filter(h => h !== bp);
        });
  }

  ngOnInit(): void {
    this.getBPs();
  }

  edit(bp: BP): void {
    this.router.navigate(['bpe/bpe-design/detail', bp.processID]);
  }

  configure(bp: BP): void {
    this.router.navigate(['bpe/bpe-design/configure', bp.processID]);
  }

  create(): void {
      this.router.navigate(['bpe/bpe-design/create']);
  }
}
