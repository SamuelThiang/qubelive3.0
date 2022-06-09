import { Component, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { IonSlides, LoadingController, ModalController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as moment from 'moment';
import { FilteroutletPage } from '../filteroutlet/filteroutlet.page'
import { Tab2Page } from '../tab2/tab2.page'
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    // We use these empty structures as placeholders for dynamic theming.
    scales: {
      x: { display: false },
      y: {
        min: 10
      }
    },
    plugins: {
      legend: {
        display: true,
      },
      datalabels: {
        display: false,
        anchor: 'end',
        align: 'end'
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartPlugins = [
    DataLabelsPlugin
  ];
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'TOTAL SALES', backgroundColor: '#9d0000' },
    ]
  };
  slideOptsTwo = {
    initialSlide: 1,
    slidesPerView: 4,
    centeredSlides: true,
    spaceBetween: 0
  };
  montharr = this.getprevMonths();
  @ViewChild('slides', { read: IonSlides }) slides: IonSlides;
  DateRange = 'day';
  activeIndex: number = 0;
  txt_totalsales = 0;
  txt_totaltrx = 0;
  reportType = [];
  storeList = [];
  topOutlet = {};
  salespercent = 0;
  trxpercent = 0;
  txt_topOutlet = { Desc: '-', Code: '-', Net: 0.00 };
  txt_topSku = { Desc: '-', Code: '-', Net: 0.00 };
  txt_topDept = { Desc: '-', Code: '-', Net: 0.00 };
  txt_topHour = { Desc: '-', Code: '-', Net: 0.00 };
  top10 = [];
  top10week = [];
  currentType = 'OUTLET';
  currentRange = 'day';
  currentDate = moment().format('YYMMDD');
  unformatcurrentDate = moment().format('YYYY-MM-DD')
  maxDate = moment().format('YYYY-MM-DD');
  getprevMonths() {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var todaysDate = new Date();
    var currentMonth = months[todaysDate.getMonth()];
    var tmparr = [];
    tmparr.push(currentMonth)
    for (let i = months.indexOf(currentMonth) - 1; i >= 0; i--) {
      tmparr.push(months[i]);
    }
    return tmparr.reverse();
  }

  constructor(private http: HttpClient, public modalController: ModalController, private loadingController: LoadingController) {
    setTimeout(async() => {
      this.reportType =await JSON.parse(localStorage.getItem('qubelive_report'));
      let tmpstore = await JSON.parse(localStorage.getItem('qubelive_store'));
      for (let i of tmpstore) {
        i.status = true;
      }
      this.storeList = tmpstore;
  
      this.getAllsales();
    },1000)
  }

ionViewDidEnter() {

   
  
  }

  async getAllsales() {
    this.presentLoading();
    var names = this.storeList.filter(res => res.status == true).map((item) => {
      return item['value'];
    });
    this.txt_topOutlet = { Desc: '-', Code: '-', Net: 0.00 };
    this.txt_topSku = { Desc: '-', Code: '-', Net: 0.00 };
    this.txt_topDept = { Desc: '-', Code: '-', Net: 0.00 };
    this.txt_topHour = { Desc: '-', Code: '-', Net: 0.00 };

    let yesterday = moment(this.unformatcurrentDate).subtract(1, "days").format('YYMMDD');
    await this.getReport(this.currentDate, this.currentDate, 'SALES', names).then(async (res: any) => {
      this.txt_totalsales = await parseFloat(this.countTotalSales(res));
      this.txt_totaltrx = await this.countTotalTrx(res);
      this.txt_topOutlet = await this.countTopOutlet(res);
      this.top10 = await this.countTop10Outlet(res);

      this.barChartData.labels = this.top10.map((label) => { return label['Desc'] });
      this.barChartData.datasets = [{
        data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
        label: 'TOTAL SALES',
        backgroundColor: '#9d0000'
      }]
    });
    this.chart.update();
    await this.getReport(yesterday, yesterday, 'SALES', names).then(async (res2: any) => {
      let tmpsales = await parseFloat(this.countTotalSales(res2));
      let tmptrx = await this.countTotalTrx(res2);
      this.cuculatePercent(tmpsales, tmptrx);
    })

    //Get Top DEPTARTMENT
    await this.getReport(this.currentDate, this.currentDate, 'DEPARTMENT', names).then(async (res: any) => {
      this.txt_topDept = await this.getTopDepart(res);
    });
    //Get Top Sku
    await this.getReport(this.currentDate, this.currentDate, 'SKU', names).then(async (res: any) => {
      if(res){
        this.txt_topSku = await this.getTopSku(res);
      }
    });
    //Get Top Hour
    await this.getReport(this.currentDate, this.currentDate, 'HOURLY', names).then(async (res: any) => {
      this.txt_topHour = await this.getTopHour(res);
    });

    this.loadingController.dismiss();
  }

  async segmentChanged(tabs) {
    this.presentLoading();
    var names = this.storeList.filter(res => res.status == true).map((item) => {
      return item['value'];
    });
    console.log( this.storeList)
    this.currentRange = tabs;
    // let today = moment().format('YYMMDD');
    let type = '';
    if(this.currentType == 'OUTLET'){
      type = 'SALES'
    } else if(this.currentType == 'DEPT'){
      type = 'DEPARTMENT'
    }else if(this.currentType == 'SKU'){
      type = 'SKU'
    }else if(this.currentType == 'HOUR'){
      type = 'HOURLY'
    }

    switch (tabs) {
      case 'day':
        await this.getReport(this.currentDate, this.currentDate, type, names).then(async (res: any) => {
          if(res){
            this.top10 = await this.countTop10Outlet(res);
            this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
            this.barChartData.datasets = [{
              data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
              label: 'TOTAL '+type,
              backgroundColor: '#9d0000'
            }]
          }else{
            this.top10 = [];
            this.barChartData.labels =[];
            this.barChartData.datasets = [{
              data: [],
              label: 'TOTAL '+type,
              backgroundColor: '#9d0000'
            }]
          }
   
        });
        break;
      case 'week':
        let lastweekDate = moment().subtract(7, "days").format('YYMMDD');
        await this.getReport(lastweekDate, this.currentDate, type, names).then(async (res: any) => {
          if(res){
            this.top10 = await this.countTop10Outlet(res);
            this.barChartData.labels = this.top10.map((label) => {return type=='HOURLY' ? label['Code'] : label['Desc']  });
            this.barChartData.datasets = [{
              data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
              label: 'TOTAL '+type,
              backgroundColor: '#9d0000'
            }]
          }else{
            this.top10 = [];
            this.barChartData.labels =[];
            this.barChartData.datasets = [{
              data: [],
              label: 'TOTAL '+type,
              backgroundColor: '#9d0000'
            }]
          }
        
        });
        break;
        case 'month':
          let monthstart = moment().startOf('month').format('YYMMDD');
          let monthend = moment().endOf('month').format('YYMMDD');
          await this.getReport(monthstart, monthend, type, names).then(async (res: any) => {
            if(res){
              this.top10 = await this.countTop10Outlet(res);
              this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc']  });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
              }]
            }else{
              this.top10 = [];
              this.barChartData.labels =[];
              this.barChartData.datasets = [{
                data: [],
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
              }]
            }
            // this.activeIndex = this.montharr.length + 1;
            // this.slides.slideTo(this.activeIndex);
          });
          break;
    }
    this.chart.update();
    this.loadingController.dismiss();
  }

  changeType(type){
    this.currentType = type;
    this.segmentChanged(this.currentRange);
  }

 async showProfile(){
    const modal = await this.modalController.create({
      component: Tab2Page,
      // componentProps: {
      //   storeList: this.storeList
      // },
      initialBreakpoint: 1,
      breakpoints: [0, 1]
    });
    await modal.present();
  }

  slidechanged(event) {
    this.slides.getActiveIndex().then(result => {
      // console.log(moment().month(result).format("MM"))
      
    });
  }

  getTopSku(res) {
    var result = [];
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        res[value.Code] = { Desc: value.Desc, Code: value.Code, Net: 0 };
        result.push(res[value.Code])
      }
      res[value.Code].Net += parseFloat(value.Net);
      return res;
    }, {});
    let final = result.reduce((prev, current) => (prev.Net > current.Net) ? prev : current);
    final.Net = final.Net.toFixed(2)

    return final;
  }

  getTopDepart(res) {
    var result = [];
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        res[value.Code] = { Desc: value.Desc, Code: value.Code, Net: 0 };
        result.push(res[value.Code])
      }
      res[value.Code].Net += parseFloat(value.Net);
      return res;
    }, {});
    let final = result.reduce((prev, current) => (prev.Net > current.Net) ? prev : current);
    final.Net = final.Net.toFixed(2)
    return final;
  }

  getTopHour(res) {
    var result = [];
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        res[value.Code] = { Code: value.Code, Net: 0 };

        result.push(res[value.Code])
      }
      res[value.Code].Net += parseFloat(value.Net);
      return res;
    }, {});
    let final = result.reduce((prev, current) => (prev.Net > current.Net) ? prev : current);
    final.Net = final.Net.toFixed(2)
    return final;
  }

  cuculatePercent(tmpsales, tmptrx) {
    this.salespercent = parseInt(((1 - (tmpsales / this.txt_totalsales)) * 100).toString());
    this.trxpercent = parseInt(((1 - (tmptrx / this.txt_totaltrx)) * 100).toString());
  }

  countTotalTrx(res) {
    var countTrx = 0;
    for (let i of res) {
      countTrx = countTrx + parseInt(i.Trx);
    }
    return countTrx;
  }

  countTotalSales(res) {
    var result = [];
    var counttotal = 0;
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        res[value.Code] = { Code: value.Code, Net: 0 };
        result.push(res[value.Code])
      }
      res[value.Code].Net += parseFloat(value.Net);
      return res;
    }, {});
    for (let i of result) {
      counttotal = counttotal + i.Net;
    }
    return counttotal.toFixed(2);
  }

  countTopOutlet(res) {
    var result = [];
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        res[value.Code] = { Desc: value.Desc, Code: value.Code, Net: 0 };
        result.push(res[value.Code])
      }
      res[value.Code].Net += parseFloat(value.Net);
      return res;
    }, {});
    let final = result.reduce((prev, current) => (prev.Net > current.Net) ? prev : current);
    final.Net = final.Net.toFixed(2)
    return final;
  }

  countTop10Outlet(res) {
    var result = [];
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        res[value.Code] = { Desc: value.Desc, Code: value.Code, Net: 0 };
        result.push(res[value.Code])
      }
      res[value.Code].Net += parseFloat(value.Net);
      return res;
    }, {});
    return result.sort((a, b) => parseFloat(b.Net) - parseFloat(a.Net)).slice(0, 10);
  }

  onClickSlide(id,month) {
    this.activeIndex = id;
    this.slides.slideTo(id);
  }

  async selectStore() {
    const modal = await this.modalController.create({
      component: FilteroutletPage,
      componentProps: {
        storeList: this.storeList
      },
      initialBreakpoint: 0.5,
      breakpoints: [0, 0.5, 1]
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.storeList = data.storeList;
      this.getAllsales();
    }
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 10000
    });
    await loading.present();

    const { role, data } = await loading.onDidDismiss();
    console.log('Loading dismissed!');
  }

  public chartClicked({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    // console.log(event, active);
  }

  public randomize(): void {
    // Only Change 3 values
    this.barChartData.datasets[0].data = [
      Math.round(Math.random() * 100),
      59,
      80,
      Math.round(Math.random() * 100),
      56,
      Math.round(Math.random() * 100),
      40];

    this.chart?.update();
  }

  datepicker(date){
    this.unformatcurrentDate = moment(date).format('YYYY-MM-DD');
      this.currentDate = moment(date).format('YYMMDD');
      this.getAllsales();
  }

  async getReport(StartDate, EndDate, ReportType, outletArray) {
    //SEND USERNAME & PASSWORD TO SERVER CHECK LOGIN
    let postData = new URLSearchParams();
    postData.append('reportType', ReportType);
    postData.append('path', outletArray);
    postData.append('StartDate', StartDate);
    postData.append('EndDate', EndDate);

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };
    return this.http.post('https://qubelive.com.my/QubeSR/User/salereportAll.php', postData.toString(), httpOptions).toPromise();

  }
}