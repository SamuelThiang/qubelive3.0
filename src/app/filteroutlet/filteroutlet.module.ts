import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FilteroutletPageRoutingModule } from './filteroutlet-routing.module';

import { FilteroutletPage } from './filteroutlet.page';
import { Ng2SearchPipeModule } from 'ng2-search-filter';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FilteroutletPageRoutingModule,
    Ng2SearchPipeModule
  ],
  declarations: [FilteroutletPage]
})
export class FilteroutletPageModule {}
