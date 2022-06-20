import { Component, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { IonSlides, LoadingController, ModalController, PickerColumn, PickerColumnOption, PickerOptions } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as moment from 'moment';
import { FilteroutletPage } from '../filteroutlet/filteroutlet.page'
import { Tab2Page } from '../tab2/tab2.page'
import { empty } from 'rxjs';
import { PickerController } from '@ionic/angular';

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
  AvgTrx: number = 0;
  txt_totalsales = 0;
  qtn :number = 10;
  TdyTop3Outlet =[];
  txt_totaltrx = 0;
  txt_avgtrx = 0;
  totalsales_dec = "";
  topOutletNet_dec = "";
  numberArray = [];
  reportType = [];
  storeList = [];
  topOutlet = {};
  salespercent = 0;
  trxpercent = 0;
  trxAvgpercent = 0;
  Top3OutletPercent =[];
  txt_topOutlet = { Desc: '-', Code: '-', Net: 0.00 };
  txt_topSku = { Desc: '-', Code: '-', Net: 0.00 };
  txt_topDept = { Desc: '-', Code: '-', Net: 0.00 };
  txt_topHour = { Desc: '-', Code:'-', Net: 0.00 };
  changefor ={};
  top10 = [];
  top10week = [];
  currentType = 'OUTLET';
  currentRange = 'day';
  currentDate = moment().format('YYMMDD');
  unformatcurrentDate = moment().format('YYYY-MM-DD')
  maxDate = moment().format('YYYY-MM-DD');
  favOutletArr = [];
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

  constructor(private http: HttpClient, public modalController: ModalController, private loadingController: LoadingController,private pickerController: PickerController) {
    setTimeout(async() => {
      this.reportType =await JSON.parse(localStorage.getItem('qubelive_report'));
      let tmpstore = await JSON.parse(localStorage.getItem('qubelive_store'));
      let data = await JSON.parse(localStorage.getItem('qubelive_user'));
      this.favOutletArr = data.favOutlet
      
      //const filteredArray = favOutletArr.filter(value => tmpstore.includes(value));
      if(data.favOutlet != "")
      {
        for(let i of tmpstore)
        {
          //console.log(i)
          if(this.favOutletArr.includes(i.id)){
          i.flavorite = true;
          i.status = false;
          }else{
            i.flavorite = false;
            i.status = false;
          }
        }
      }
      else
      {
        for(let i of tmpstore)
        {
            i.flavorite = false;
            i.status = true;
        }
      }
      
      this.storeList = tmpstore;
      //console.log("favOutletArr",this.favOutletArr)
      this.getAllsales();
    },1000)
  }

ionViewDidEnter() {
  this.getAllsales();
  this.segmentChanged(this.currentRange);
  }

  async getAllsales() {
    this.presentLoading();
    var names = this.storeList.filter(res => res.status == true || res.flavorite == true).map((item) => {
      return item['value'];
    });
    //console.log("test",this.storeList)
    this.txt_topOutlet = { Desc: '-', Code: '-', Net: 0.00 };
    this.txt_topSku = { Desc: '-', Code: '-', Net: 0.00 };
    this.txt_topDept = { Desc: '-', Code: '-', Net: 0.00 };
    this.txt_topHour = { Desc: '-', Code:'-', Net: 0.00 };
    
    let yesterday = moment(this.unformatcurrentDate).subtract(1, "days").format('YYMMDD');

    //Get Top SALES
    await this.getReport(this.currentDate, this.currentDate, 'SALES', names).then(async (res: any) => {
      this.txt_totalsales = await parseFloat(this.countTotalSales(res));
      this.totalsales_dec = this.txt_totalsales.toLocaleString();
      this.txt_totaltrx = await this.countTotalTrx(res);
      this.txt_avgtrx = await this.countAvgTrx(res);
      this.txt_topOutlet = await this.countTopOutlet(res);
      this.top10 = await this.countTop10Outlet(res);
      this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
        return item['Net'];
      });
      console.log("today top 3",this.TdyTop3Outlet)
      this.barChartData.labels = this.top10.map((label) => { return label['Desc'] });
      this.barChartData.datasets = [{
        data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
        label: 'TOTAL SALES',
        backgroundColor: '#9d0000'
      }] 
    });

    await this.getReport(yesterday, yesterday, 'SALES', names).then(async (res2: any) => {
      let tmpsales = await parseFloat(this.countTotalSales(res2));
      let tmptrx = await this.countTotalTrx(res2);
      let tmpavgTrx = await this.countAvgTrx(res2); 
      this.top10 = await this.countTop10Outlet(res2);
      let tmpOutlettop3 = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
        return item['Net'];
      });
      this.cuculatePercent(tmpsales, tmptrx,tmpavgTrx,tmpOutlettop3);
      console.log("yesterday top 3",tmpOutlettop3)
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
      //console.log(this.txt_topSku)
    });
    //Get Top Hour
    await this.getReport(this.currentDate, this.currentDate, 'HOURLY', names).then(async (res: any) => {
      this.txt_topHour = await this.getTopHour(res);
      this.txt_topHour.Code = moment(this.txt_topHour.Code, ["HH.mm"]).format("hh:mm a");
      //this.txt_topHour.Code = moment(this.txt_topHour.Code, ["HH.mm"]).format("hh:mm a");
    });
    //console.log("check txt.code",this.txt_topHour.Code)
    this.chart.update();
    this.loadingController.dismiss();
  }

  async segmentChanged(tabs) {
    this.presentLoading();
    var names = this.storeList.filter(res => res.status == true || res.flavorite == true).map((item) => {
      return item['value'];
    });
    //console.log("first name",names)
    //console.log("check name",names)
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
        let yesterday = moment(this.unformatcurrentDate).subtract(1, "days").format('YYMMDD');

        await this.getReport(yesterday, yesterday, 'SALES', names).then(async (res2: any) => {
          let tmpsales = await parseFloat(this.countTotalSales(res2));
          let tmptrx = await this.countTotalTrx(res2);
          let tmpavgTrx = await this.countAvgTrx(res2); 
          this.top10 = await this.countTop10Outlet(res2);
          let tmpOutlettop3 = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
            return item['Net'];
          });
          this.cuculatePercent(tmpsales, tmptrx,tmpavgTrx,tmpOutlettop3);
          console.log("yesterday top 3",tmpOutlettop3,yesterday)
        })
        await this.getReport(this.currentDate, this.currentDate, type, names).then(async (res: any) => {
          if(res){
            if(type=='SALES')
            {
              this.top10 = await this.countTop10Outlet(res);
              this.txt_totalsales = await parseFloat(this.countTotalSales(res));
              this.totalsales_dec = this.txt_totalsales.toLocaleString();
              this.txt_totaltrx = await this.countTotalTrx(res);
              this.txt_avgtrx = await this.countAvgTrx(res);
              this.txt_topOutlet = await this.countTopOutlet(res);
              this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                return item['Net'];
              });
              console.log("today top 3",this.TdyTop3Outlet)
              this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
               }] 
               //console.log("check this 1",res)
            }
            if(type=='HOURLY')
            {
              this.top10 = await this.countTop10Outlet(res);
              var top10h = await this.countTop10Hour(res);
              this.txt_topHour = await this.getTopHour(res);
              this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                return item['Net'];
              });
              console.log("today top 3",this.TdyTop3Outlet)
              this.txt_topHour.Code = moment(this.txt_topHour.Code, ["HH.mm"]).format("hh:mm a");
              this.barChartData.labels = top10h.map((label) => { return type=='HOURLY' ? moment(label.Code, ["HH.mm"]).format("h a") : label['Desc'] });
              this.barChartData.datasets = [{
                data: top10h.map((label) => { return label['Net'].toFixed(2)}),
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
              }]
            }
            if(type=='DEPARTMENT')
            {
              this.txt_topDept = await this.getTopDepart(res);
              this.top10 = await this.countTop10Outlet(res);
              this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                return item['Net'];
              });
              console.log("today top 3",this.TdyTop3Outlet)
              this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2)}),
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
              }]
              //console.log("check this2",res)
              //console.log("checkbarchartData", this.top10.map((label) => { return label['Net']}))
            }
            if(type=='SKU')
            {
              this.txt_topSku = await this.getTopSku(res);
              this.top10 = await this.countTop10Outlet(res);
              this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                return item['Net'];
              });
              console.log("today top 3",this.TdyTop3Outlet)
              this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2)}),
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
              }]
              //console.log("check this2",res)
              //console.log("checkbarchartData", this.top10.map((label) => { return label['Net']}))
            }
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
        let lastweekDate = moment(this.unformatcurrentDate).subtract(7, "days").format('YYMMDD');
        let startLastWeekData = moment(this.unformatcurrentDate).subtract(14, "days").format('YYMMDD');

        await this.getReport(startLastWeekData, lastweekDate, 'SALES', names).then(async (res2: any) => {
          let tmpsales = await parseFloat(this.countTotalSales(res2));
          let tmptrx = await this.countTotalTrx(res2);
          let tmpavgTrx = await this.countAvgTrx(res2); 
          this.top10 = await this.countTop10Outlet(res2);
          let tmpOutlettop3 = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
            return item['Net'];
          });
          this.cuculatePercent(tmpsales, tmptrx,tmpavgTrx,tmpOutlettop3);
          console.log("yesterday top 3",tmpOutlettop3,startLastWeekData,lastweekDate)
        })
        await this.getReport(lastweekDate, this.currentDate, type, names).then(async (res: any) => {
          if(res){
            if(type=='SALES')
            {
              this.top10 = await this.countTop10Outlet(res);
              this.txt_totalsales = await parseFloat(this.countTotalSales(res));
              this.totalsales_dec = this.txt_totalsales.toLocaleString();
              this.txt_totaltrx = await this.countTotalTrx(res);
              this.txt_avgtrx = await this.countAvgTrx(res);
              this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                return item['Net'];
              });
              console.log("today top 3",this.TdyTop3Outlet ,lastweekDate, this.currentDate )
              this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
               }] 
               //console.log("check this 1",res)
            }
            if(type=='HOURLY')
            {
              this.top10 = await this.countTop10Outlet(res);
              var top10h = await this.countTop10Hour(res);
              this.txt_topHour.Code = moment(this.txt_topHour.Code, ["HH.mm"]).format("hh:mm a");
              this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                return item['Net'];
              });
              console.log("today top 3",this.TdyTop3Outlet ,lastweekDate, this.currentDate )
              this.barChartData.labels = top10h.map((label) => { return type=='HOURLY' ? moment(label.Code, ["HH.mm"]).format("hh:mm a") : label['Desc'] });
              this.barChartData.datasets = [{
                data: top10h.map((label) => { return label['Net'].toFixed(2)}),
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
              }]
            }
            if(type=='DEPARTMENT')
            {
              this.top10 = await this.countTop10Outlet(res);
              this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2)}),
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
              }]
              this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                return item['Net'];
              });
              console.log("today top 3",this.TdyTop3Outlet ,lastweekDate, this.currentDate )
            }
            if(type=='SKU')
            {
              this.top10 = await this.countTop10Outlet(res);
              this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2)}),
                label: 'TOTAL '+type,
                backgroundColor: '#9d0000'
              }]
              this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                return item['Net'];
              });
              console.log("today top 3",this.TdyTop3Outlet ,lastweekDate, this.currentDate )
            }
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
          let monthstart = moment(this.unformatcurrentDate).startOf('month').format('YYMMDD');
          let monthend = moment(this.unformatcurrentDate).endOf('month').format('YYMMDD');
          let prevMonthFirstDay = moment(this.unformatcurrentDate).subtract(1, 'months').startOf('month').format('YYMMDD');
          let prevMonthLastDay = moment(this.unformatcurrentDate).subtract(1, 'months').endOf('month').format('YYMMDD');

          await this.getReport(prevMonthFirstDay, prevMonthLastDay, 'SALES', names).then(async (res2: any) => {
            let tmpsales = await parseFloat(this.countTotalSales(res2));
            let tmptrx = await this.countTotalTrx(res2);
            let tmpavgTrx = await this.countAvgTrx(res2); 
            this.top10 = await this.countTop10Outlet(res2);
            let tmpOutlettop3 = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
              return item['Net'];
            });
            this.cuculatePercent(tmpsales, tmptrx,tmpavgTrx,tmpOutlettop3);
            console.log("yesterday top 3",tmpOutlettop3,prevMonthFirstDay,prevMonthLastDay)
          })
          await this.getReport(monthstart, monthend, type, names).then(async (res: any) => {
            if(res){
              if(type=='SALES')
              {
                this.top10 = await this.countTop10Outlet(res);
                this.txt_totalsales = await parseFloat(this.countTotalSales(res));
                this.totalsales_dec = this.txt_totalsales.toLocaleString();
                this.txt_totaltrx = await this.countTotalTrx(res);
                this.txt_avgtrx = await this.countAvgTrx(res);
                this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                  return item['Net'];
                });
                console.log("today top 3",this.TdyTop3Outlet ,monthstart,monthend )
                this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
                this.barChartData.datasets = [{
                  data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                  label: 'TOTAL '+type,
                  backgroundColor: '#9d0000'
                 }] 
                 //console.log("check this 1",res)
              }
              if(type=='HOURLY')
              {
                this.top10 = await this.countTop10Outlet(res);
                var top10h = await this.countTop10Hour(res);
                this.txt_topHour.Code = moment(this.txt_topHour.Code, ["HH.mm"]).format("hh:mm a");
                this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                  return item['Net'];
                });
                console.log("today top 3",this.TdyTop3Outlet ,lastweekDate, this.currentDate )
                this.barChartData.labels = top10h.map((label) => { return type=='HOURLY' ? moment(label.Code, ["HH.mm"]).format("hh:mm a") : label['Desc'] });
                this.barChartData.datasets = [{
                  data: top10h.map((label) => { return label['Net'].toFixed(2)}),
                  label: 'TOTAL '+type,
                  backgroundColor: '#9d0000'
                }]
              }
              if(type=='DEPARTMENT')
              {
                this.top10 = await this.countTop10Outlet(res);
                this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
                this.barChartData.datasets = [{
                  data: this.top10.map((label) => { return label['Net'].toFixed(2)}),
                  label: 'TOTAL '+type,
                  backgroundColor: '#9d0000'
                }]
                this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                  return item['Net'];
                });
                console.log("today top 3",this.TdyTop3Outlet ,lastweekDate, this.currentDate )
              }
              if(type=='SKU')
              {
                this.top10 = await this.countTop10Outlet(res);
                this.barChartData.labels = this.top10.map((label) => { return type=='HOURLY' ? label['Code'] : label['Desc'] });
                this.barChartData.datasets = [{
                  data: this.top10.map((label) => { return label['Net'].toFixed(2)}),
                  label: 'TOTAL '+type,
                  backgroundColor: '#9d0000'
                }]
                this.TdyTop3Outlet = this.top10.slice(0,3).filter(res => res.Net).map((item) => {
                  return item['Net'];
                });
                console.log("today top 3",this.TdyTop3Outlet ,lastweekDate, this.currentDate )
              }
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
    //this.getAllsales();
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
    final.Net = final.Net.toLocaleString('en-US')

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
    final.Net = final.Net.toLocaleString('en-US')
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
    final.Net = final.Net.toLocaleString('en-US')
    //console.log("hour final",moment(final.Code, ["HH.mm"]).format("hh:mm a"))
    return final;
  }

  cuculatePercent(tmpsales, tmptrx,tmpavgTrx,tmpOutlettop3) {
    this.salespercent = parseInt(((1 - (tmpsales / this.txt_totalsales)) * 100).toString());
    this.trxpercent = parseInt(((1 - (tmptrx / this.txt_totaltrx)) * 100).toString());
    this.trxAvgpercent = parseInt(((1 - (tmpavgTrx / this.txt_avgtrx)) * 100).toString());
    for(var i=0;i<tmpOutlettop3.length;i++)
    {
      this.Top3OutletPercent[i] = parseInt(((1 - (tmpOutlettop3[i] / this.TdyTop3Outlet[i])) * 100).toString());
      //console.log("outlet percent top 3",this.Top3OutletPercent)   
    }
     console.log(this.Top3OutletPercent[0])
  }

  countTotalTrx(res) {
    var countTrx = 0;
    for (let i of res) {
        countTrx = countTrx + parseInt(i.Trx);
    }
    //console.log("totaltrxx",countTrx)
    return countTrx;
  }

  countAvgTrx(res) {
    this.AvgTrx = this.txt_totalsales/this.txt_totaltrx;
    var countAvgTrx = Number(this.AvgTrx.toFixed(2));
    return countAvgTrx
  }

  countTotalSales(res) {
    //console.log("res",res)
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
    final.Net = final.Net.toLocaleString('en-US')
    return final;
  }

  countTop10Outlet(res) {
    var result = [];
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        res[value.Code] = { Desc: value.Desc, Code:moment(value.Code, ["HH.mm"]).format("hh:mm a"), Net: 0 };
        //res[value.Code] = { Desc: value.Desc, Code:value.Code, Net: 0 };
        result.push(res[value.Code])
        //console.log("checles",res[value.Code])
      }
      res[value.Code].Net += parseFloat(value.Net);
        // console.log("check rs",res)
      return res;
    }, {});
    //console.log("check rs",result)
    return result.sort((a, b) => parseFloat(b.Net) - parseFloat(a.Net)).slice(0, this.qtn);
  }

  countTop10Hour(res) {
    var result = [];
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        //res[value.Code] = { Desc: value.Desc, Code:moment(value.Code, ["HH.mm"]).format("hh:mm a"), Net: 0 };
        res[value.Code] = { Desc: value.Desc, Code:value.Code, Net: 0 };
        result.push(res[value.Code])
        //console.log("checles",res[value.Code])
      }
      res[value.Code].Net += parseFloat(value.Net);
        // console.log("check rs",res)
      return res;
    }, {});
    //console.log("check rs",result)
    return result.sort((a, b) => parseFloat(a.Code) - parseFloat(b.Code));
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
      //this.getAllsales();
      this.segmentChanged(this.currentRange)
      //console.log("selectchaste",this.storeList)
    }
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 10000
    });
    await loading.present();

    const { role, data } = await loading.onDidDismiss();
    //console.log('Loading dismissed!');
  }

  public chartClicked({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    //console.log(event, active);
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
      //this.getAllsales();
      this.segmentChanged(this.currentRange);
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

  async openPicker() {
    let pickerAction;
    for(var i = 1; i <= 50; i++){
        this.numberArray.push(i);
    }
    
    let options: PickerOptions = {
      buttons: [
        {
          text: "Cancel",
          role: 'cancel',
          handler: value => {
            pickerAction = 'cancel';
          }
        },
        {
          text:'Ok',
          handler: value => {
            pickerAction = 'Ok';
          }
        }
      ],
      columns:[{
        name:'numberArray',
        options:this.getColumnOptions()
      }]
    };

    let picker = await this.pickerController.create(options);
    picker.present();
    picker.onDidDismiss().then(async data=>{
      if (pickerAction === 'Ok') {
      let col = await picker.getColumn('numberArray');
      this.qtn = col.selectedIndex+1

      this.segmentChanged(this.currentRange);
      console.log('col',this.qtn)
      }
      else
      {
       
      }
    });
  }

  getColumnOptions(){
    let options = [];
    this.numberArray.forEach(x => {
      options.push({text:x,value:x});
    });
    return options;
  }
  
}