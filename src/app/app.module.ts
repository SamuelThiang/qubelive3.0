import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HttpClientModule } from '@angular/common/http';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { NgChartsModule } from 'ng2-charts';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot({
    mode: 'ios',
    scrollAssist: true,
    scrollPadding: true,
}), AppRoutingModule, BrowserAnimationsModule,NgApexchartsModule,HttpClientModule,NgChartsModule],
  providers: [NativeStorage,{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },Device,Keyboard],
  bootstrap: [AppComponent],
})
export class AppModule {}
