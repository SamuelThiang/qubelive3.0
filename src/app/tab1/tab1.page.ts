import { Component, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { IonSlides, LoadingController, ModalController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as moment from 'moment';
import { FilteroutletPage } from '../filteroutlet/filteroutlet.page'
import { Tab2Page } from '../tab2/tab2.page'
import { PickerController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  // @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @ViewChildren(BaseChartDirective) charts: QueryList<BaseChartDirective>;

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
      { data: [], label: 'TOTAL SALES', backgroundColor:[] },
    ]
  };

  public ChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    // We use these empty structures as placeholders for dynamic theming.
    scales: {
      x: { display: true },
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
  public ChartType: ChartType = 'line';

  public ChartPlugins = [
    DataLabelsPlugin
  ];
  public ChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
 
  slideOptsTwo = {
    initialSlide: 0,
    slidesPerView: 1.1,
  };
  montharr = this.getprevMonths();
  @ViewChild('slides', { read: IonSlides }) slides: IonSlides;
  DateRange = 'day';
  DateRange2 = 'week';
  activeIndex: number = 0;
  txt_totalsales = 0;
  txt_totaltrx = 0;
  txt_avgtrx = 0;
  fx_txt_totalsales = 0;
  fx_txt_totaltrx = 0;
  fx_txt_avgtrx = 0;
  qtn: number = 10;
  numberArray = [];
  reportType = [];
  storeList = [];
  topOutlet = {};
  salespercent = 0;
  trxpercent = 0;
  trxAvgpercent = 0;
  Top3OutletPercent = [];
  txt_topOutlet = { Desc: '-', Code: '-', Net: 0.00 };
  txt_topSku = { Desc: '-', Code: '-', Net: 0.00 };
  txt_topDept = { Desc: '-', Code: '-', Net: 0.00 };
  txt_topHour = { Desc: '-', Code: '-', Net: 0.00 };
  changefor = {};
  top10 = [];
  top10week = [];
  currentType = 'OUTLET';
  currentRange = 'day';
  currentDate = moment().format('YYMMDD');
  unformatcurrentDate = moment().format('YYYY-MM-DD')

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

  constructor(private http: HttpClient, public modalController: ModalController, private loadingController: LoadingController, private pickerController: PickerController) {

  }

  ionViewDidEnter() {
    setTimeout(async() => {
      this.reportType = await JSON.parse(localStorage.getItem('qubelive_report'));
      let tmpstore = await JSON.parse(localStorage.getItem('qubelive_store'));
      let data = await JSON.parse(localStorage.getItem('qubelive_user'));
      this.favOutletArr = data.favOutlet
  
      if (data.favOutlet != "") {
        console.log(tmpstore)
        for (let i of tmpstore) {
          //console.log(i)
          if (this.favOutletArr.includes(i.id)) {
            i.flavorite = true;
            i.status = false;
          } else {
            i.flavorite = false;
            i.status = false;
          }
        }
      }
      else {
        for (let i of tmpstore) {
          i.flavorite = false;
          i.status = true;
        }
      }
  
      this.storeList = tmpstore;
      this.getAllsales();
      this.segmentChanged2('week');
    }, 888);
   
  }

  async getAllsales() {
    this.presentLoading();
    let canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    var background_1 = ctx.createLinearGradient(0, 0, 0, 600);
    background_1.addColorStop(0, 'red');
    background_1.addColorStop(1, 'blue');

    var names = this.storeList.filter(res => res.status == true || res.flavorite == true).map((item) => {
      return item['value'];
    });

    this.txt_topOutlet = { Desc: '-', Code: '-', Net: 0.00 };
    this.txt_topSku = { Desc: '-', Code: '-', Net: 0.00 };
    this.txt_topDept = { Desc: '-', Code: '-', Net: 0.00 };
    this.txt_topHour = { Desc: '-', Code: '-', Net: 0.00 };

    //Get Top SALES
    await this.getReport(this.currentDate, this.currentDate, 'SALES', names).then(async (res: any) => {
      this.fx_txt_totalsales = await parseFloat(this.countTotalSales(res));
      this.fx_txt_totaltrx = await this.countTotalTrx(res);
      this.fx_txt_avgtrx = await this.countfxAvgTrx();
      this.txt_topOutlet = await this.countTopOutlet(res);
      this.top10 = await this.countTop10Outlet(res);

      this.barChartData.labels = this.top10.map((label) => { return label['Desc'] });
      this.barChartData.datasets = [{
        data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
        label: 'TOTAL SALES',
        backgroundColor: [background_1]
      }]
      
    });
    //GET PERCENTAGE
    // let yesterday = moment(this.unformatcurrentDate).subtract(1, "days").format('YYMMDD');
    // await this.getReport(yesterday, yesterday, 'SALES', names).then(async (res2: any) => {
    //   let tmpsales = await parseFloat(this.countTotalSales(res2));
    //   let tmptrx = await this.countTotalTrx(res2); 

    //   this.cuculatePercent(tmpsales, tmptrx,this.txt_totalsales,this.txt_totaltrx);
    // })

    //Get Top DEPTARTMENT
    await this.getReport(this.currentDate, this.currentDate, 'DEPARTMENT', names).then(async (res: any) => {
      this.txt_topDept = await this.getTopDepart(res);
    });
    //Get Top Sku
    await this.getReport(this.currentDate, this.currentDate, 'SKU', names).then(async (res: any) => {
      if (res) {
        this.txt_topSku = await this.getTopSku(res);
      }
    });
    //Get Top Hour
    await this.getReport(this.currentDate, this.currentDate, 'HOURLY', names).then(async (res: any) => {
      this.txt_topHour = await this.getTopHour(res);
      this.txt_topHour.Code = moment(this.txt_topHour.Code, ["HH.mm"]).format("hh:mm a");
    });

    this.charts.forEach((child) => {
      child.chart.update()
    });
    this.loadingController.dismiss();
  }

  async segmentChanged(tabs) {
    this.presentLoading();
    let canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    var background_1 = ctx.createLinearGradient(0, 0, 0, 600);
    background_1.addColorStop(0, 'red');
    background_1.addColorStop(1, 'blue');

    var names = this.storeList.filter(res => res.status == true || res.flavorite == true).map((item) => {
      return item['value'];
    });
    this.currentRange = tabs;
    let type = '';
    let displaylabel = false;
    if (this.currentType == 'OUTLET') {
      type = 'SALES';
      displaylabel = false;
    } else if (this.currentType == 'DEPT') {
      type = 'DEPARTMENT';
      displaylabel = false;
    } else if (this.currentType == 'SKU') {
      type = 'SKU';
      displaylabel = false;
    } else if (this.currentType == 'HOUR') {
      type = 'HOURLY';
      displaylabel = true;
    }
 
    switch (tabs) {
      case 'day':
        let yesterday = moment(this.unformatcurrentDate).subtract(1, "days").format('YYMMDD');

        //NORMAL OPERATION
        await this.getReport(this.currentDate, this.currentDate, type, names).then(async (res: any) => {
          if (res) {
            if (type == 'SALES') {
              this.top10 = await this.countTop10Outlet(res);
              this.txt_topOutlet = await this.countTopOutlet(res);
  
              this.barChartData.labels = this.top10.map((label) => { return type == 'HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor:[background_1]
              }]
            }
            if (type == 'HOURLY') {
              this.top10 = await this.countTop10Outlet(res);
              var top10h = await this.countTop10Hour(res);
              this.txt_topHour = await this.getTopHour(res);
              this.txt_topHour.Code = moment(this.txt_topHour.Code, ["HH.mm"]).format("hh:mm a");
              this.barChartData.labels = top10h.map((label) => { return type == 'HOURLY' ? moment(label.Code, ["HH.mm"]).format("h a") : label['Desc'] });
              this.barChartData.datasets = [{
                data: top10h.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor:[background_1]
              }]
            }
            if (type == 'DEPARTMENT') {
              this.txt_topDept = await this.getTopDepart(res);
              this.top10 = await this.countTop10Outlet(res);
     
              this.barChartData.labels = this.top10.map((label) => { return type == 'HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor:[background_1]
              }]
            }
            if (type == 'SKU') {
              this.txt_topSku = await this.getTopSku(res);
              this.top10 = await this.countTop10Outlet(res);
         
              this.barChartData.labels = this.top10.map((label) => { return type == 'HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor:[background_1]
              }]
            }
          } else {
            this.top10 = [];
            this.barChartData.labels = [];
            this.barChartData.datasets = [{
              data: [],
              label: 'TOTAL ' + type,
              backgroundColor:[background_1]
            }]
          }
        });

        break;

      case 'week':
        let startLastWeekStart = moment(this.unformatcurrentDate).subtract(13, "days").format('YYMMDD');
        let startLastWeekEnd = moment(this.unformatcurrentDate).subtract(7, "days").format('YYMMDD');
        let lastweekDate = moment(this.unformatcurrentDate).subtract(6, "days").format('YYMMDD');
        //NORMAL OPERATION
        await this.getReport(lastweekDate, this.currentDate, type, names).then(async (res: any) => {
          if (res) {
            if (type == 'SALES') {
              this.top10 = await this.countTop10Outlet(res);

              this.barChartData.labels = this.top10.map((label) => { return type == 'HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor:[background_1]
              }]
            }
            if (type == 'HOURLY') {
              this.top10 = await this.countTop10Outlet(res);
              var top10h = await this.countTop10Hour(res);
    
              this.txt_topHour.Code = moment(this.txt_topHour.Code, ["HH.mm"]).format("hh:mm a");
              this.barChartData.labels = top10h.map((label) => { return type == 'HOURLY' ? moment(label.Code, ["HH.mm"]).format("h a") : label['Desc'] });
              this.barChartData.datasets = [{
                data: top10h.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor:[background_1]
              }]
            }
            if (type == 'DEPARTMENT') {
              this.top10 = await this.countTop10Outlet(res);
              this.barChartData.labels = this.top10.map((label) => { return type == 'HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor: [background_1]
              }]
         
            }
            if (type == 'SKU') {
              this.top10 = await this.countTop10Outlet(res);
              this.barChartData.labels = this.top10.map((label) => { return type == 'HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor: [background_1]
              }]
     
            }
          } else {
            this.top10 = [];
            this.barChartData.labels = [];
            this.barChartData.datasets = [{
              data: [],
              label: 'TOTAL ' + type,
              backgroundColor: [background_1]
            }]
          }
        });

        break;

      case 'month':
        let monthstart = moment(this.unformatcurrentDate).startOf('month').format('YYMMDD');
        let monthend = moment(this.unformatcurrentDate).endOf('month').format('YYMMDD');
        let prevMonthFirstDay = moment(this.unformatcurrentDate).subtract(1, 'months').startOf('month').format('YYMMDD');
        let prevMonthLastDay = moment(this.unformatcurrentDate).subtract(1, 'months').endOf('month').format('YYMMDD');
        //NORMAL OPERATION
        await this.getReport(monthstart, monthend, type, names).then(async (res: any) => {
          if (res) {
            if (type == 'SALES') {
              this.top10 = await this.countTop10Outlet(res);
    
              this.barChartData.labels = this.top10.map((label) => { return type == 'HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor: [background_1]
              }]
            }
            if (type == 'HOURLY') {
              this.top10 = await this.countTop10Outlet(res);
              var top10h = await this.countTop10Hour(res);
              this.txt_topHour.Code = moment(this.txt_topHour.Code, ["HH.mm"]).format("hh:mm a");
       
              this.barChartData.labels = top10h.map((label) => { return type == 'HOURLY' ? moment(label.Code, ["HH.mm"]).format("hh:mm a") : label['Desc'] });
              this.barChartData.datasets = [{
                data: top10h.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor:[background_1]
              }]
            }
            if (type == 'DEPARTMENT') {
              this.top10 = await this.countTop10Outlet(res);
              this.barChartData.labels = this.top10.map((label) => { return type == 'HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor:[background_1]
              }]
   
            }
            if (type == 'SKU') {
              this.top10 = await this.countTop10Outlet(res);
              this.barChartData.labels = this.top10.map((label) => { return type == 'HOURLY' ? label['Code'] : label['Desc'] });
              this.barChartData.datasets = [{
                data: this.top10.map((label) => { return label['Net'].toFixed(2) }),
                label: 'TOTAL ' + type,
                backgroundColor:[background_1]
              }]
     
            }
          } else {
            this.top10 = [];
            this.barChartData.labels = [];
            this.barChartData.datasets = [{
              data: [],
              label: 'TOTAL ' + type,
              backgroundColor: [background_1]
            }]
          }
        });
        break;
    }
    this.barChartOptions = {
      responsive: true,
      // We use these empty structures as placeholders for dynamic theming.
      scales: {
        x: { display: displaylabel },
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
   
    this.charts.forEach((child) => {
      child.chart.update()
    });
    this.loadingController.dismiss();
  }

  async segmentChanged2(tabs) {
    this.presentLoading();
    var names = this.storeList.filter(res => res.status == true || res.flavorite == true).map((item) => {
      return item['value'];
    });
 
    switch (tabs) {
      case 'day':
        let yesterday = moment(this.unformatcurrentDate).subtract(1, "days").format('YYMMDD');
        let yesterdaydefault = moment(this.unformatcurrentDate).subtract(1, "days").format('YYYY-MM-DD');
        let tmptotalsales ;
        //NORMAL OPERATION
        await this.getReport(this.currentDate, this.currentDate, 'SALES', names).then(async (res: any) => {
          if (res) {
              this.txt_totalsales = await parseFloat(this.countTotalSales(res));
              this.txt_totaltrx = await this.countTotalTrx(res);
              this.txt_avgtrx = await this.countAvgTrx();
              tmptotalsales = await parseFloat(this.countTotalSales(res));
          }
        });
        //COMPARE LAST DAY GET PERCENT
        await this.getReport(yesterday, yesterday, 'SALES', names).then(async (res2: any) => {
          if(res2){
            let tmpsales = await parseFloat(this.countTotalSales(res2));
            let tmptrx = await this.countTotalTrx(res2);
            this.cuculatePercent(tmpsales, tmptrx,this.txt_totalsales,this.txt_totaltrx);
              this.ChartData.labels = [this.unformatcurrentDate];
              this.ChartData.datasets = [{
                //y-axis
                data:[tmpsales],
                fill: true,
                borderColor: "rgba(245, 129, 129, 1)",
                backgroundColor: "rgba(244, 158, 158, 0.41)",
                tension: 0.5,
                borderWidth: 1,
                label: 'Yesterday',
              },
              {
                data:[tmptotalsales],
                fill: true,
                borderColor: 'rgba(120, 114, 231, 1)',
                backgroundColor: 'rgba(148, 144, 225, 0.47)',
                tension: 0.5,
                borderWidth: 1,
                label: 'Today',
              }
            ] 
          }
        })
        break;

      case 'week':
        let startLastWeekStart = moment(this.unformatcurrentDate).subtract(13, "days").format('YYMMDD');
        let startLastWeekEnd = moment(this.unformatcurrentDate).subtract(7, "days").format('YYMMDD');
        let lastweekDate = moment(this.unformatcurrentDate).subtract(6, "days").format('YYMMDD');
        //NORMAL OPERATION
        await this.getReport(lastweekDate, this.currentDate, 'SALES', names).then(async (res: any) => {
          if (res) {
              this.txt_totalsales = await parseFloat(this.countTotalSales(res));
              this.txt_totaltrx = await this.countTotalTrx(res);
              this.txt_avgtrx = await this.countAvgTrx();
          } 
        });
        //COMPARE LAST WEEK GET PERCENT
        await this.getReport(startLastWeekStart, startLastWeekEnd, 'SALES', names).then(async (res2: any) => {
          let tmpsales = await parseFloat(this.countTotalSales(res2));
          let tmptrx = await this.countTotalTrx(res2);

          this.cuculatePercent(tmpsales, tmptrx,this.txt_totalsales,this.txt_totaltrx);
        })
        let tmpWeekTotal :any= [];
        let tmpWeekDate  :any = [];
        let tmplastWeekTotal :any= [];

        for(let i = 0; i < 7;i++){
          let tmpdate = moment(this.unformatcurrentDate).subtract(i, "days").format('YYMMDD');
          tmpWeekDate.push(moment(this.unformatcurrentDate).subtract(i, "days").format('DD'));
          await this.getReport(tmpdate, tmpdate, 'SALES', names).then(async (res3: any) => {
            tmpWeekTotal.push(await parseFloat(this.countTotalSales(res3)));
          });
          let tmpLastWeekdate = moment(this.unformatcurrentDate).subtract(13-i, "days").format('YYMMDD');
          await this.getReport(tmpLastWeekdate, tmpLastWeekdate, 'SALES', names).then(async (res3: any) => {
            tmplastWeekTotal.push(await parseFloat(this.countTotalSales(res3)));
          });
        }
        this.ChartData.labels = tmpWeekDate.reverse();
        this.ChartData.datasets = [{
          data: tmpWeekTotal.reverse(),
          fill: true,
          borderColor: 'rgba(120, 114, 231, 1)',
          backgroundColor: 'rgba(148, 144, 225, 0.47)',
          tension: 0.5,
          borderWidth: 1,
          label: 'This Week',
        },{
          data: tmplastWeekTotal,
          fill: true,
          borderColor: "rgba(245, 129, 129, 1)",
          backgroundColor: "rgba(244, 158, 158, 0.41)",
          tension: 0.5,
          borderWidth: 1,
          label: 'Last Week',
        }];
        break;

      case 'month':
        let monthstart = moment(this.unformatcurrentDate).startOf('month').format('YYMMDD');
        let monthend = moment(this.unformatcurrentDate).endOf('month').format('YYMMDD');
        let prevMonthFirstDay = moment(this.unformatcurrentDate).subtract(1, 'months').startOf('month').format('YYMMDD');
        // let prevMonthFirstDayUnformat = moment(this.unformatcurrentDate).subtract(1, 'months').startOf('month').format('DD');
        let prevMonthLastDay = moment(this.unformatcurrentDate).subtract(1, 'months').endOf('month').format('YYMMDD');
        let LastDay = Number(moment(this.unformatcurrentDate).subtract(1, 'months').endOf('month').format('DD'));
        let today = Number(moment(this.unformatcurrentDate).format('DD'));
        //NORMAL OPERATION
        await this.getReport(monthstart, monthend, 'SALES', names).then(async (res: any) => {
          if (res) {
              this.txt_totalsales = await parseFloat(this.countTotalSales(res));
              this.txt_totaltrx = await this.countTotalTrx(res);
              this.txt_avgtrx = await this.countAvgTrx();
          }
        });
       //COMPARE LAST MONTH GET PERCENT
        await this.getReport(prevMonthFirstDay, prevMonthLastDay, 'SALES', names).then(async (res2: any) => {
          let tmpsales = await parseFloat(this.countTotalSales(res2));
          let tmptrx = await this.countTotalTrx(res2);
          this.cuculatePercent(tmpsales, tmptrx,this.txt_totalsales,this.txt_totaltrx);
        })
        let tmpMonthTotal :any= [];
        let tmpMonthDate  :any = [];
        let tmplastMonthTotal :any= [];

        for(let i = 0; i < LastDay;i++){
          let tmpLastMonthdate = moment(this.unformatcurrentDate).subtract(1, 'months').endOf('month').subtract(i, "days").format('YYMMDD');
          console.log(tmpLastMonthdate)
          await this.getReport(tmpLastMonthdate, tmpLastMonthdate, 'SALES', names).then(async (res3: any) => {
            tmplastMonthTotal.push(await parseFloat(this.countTotalSales(res3)));
          });
        }
        for(let a = 0; a < today ;a++){
          let tmpdate = moment(this.unformatcurrentDate).subtract(a, "days").format('YYMMDD');
          tmpMonthDate.push(moment(this.unformatcurrentDate).subtract(a, "days").format('DD'));
          await this.getReport(tmpdate, tmpdate, 'SALES', names).then(async (res3: any) => {
            tmpMonthTotal.push(await parseFloat(this.countTotalSales(res3)));
          });
        }
        this.ChartData.labels = tmpMonthDate.reverse();
        this.ChartData.datasets = [{
          data: tmpMonthTotal.reverse(),
          fill: true,
          borderColor: 'rgba(120, 114, 231, 1)',
          backgroundColor: 'rgba(148, 144, 225, 0.47)',
          tension: 0.5,
          borderWidth: 1,
          label: 'This Week',
        },{
          data: tmplastMonthTotal.reverse(),
          fill: true,
          borderColor: "rgba(245, 129, 129, 1)",
          backgroundColor: "rgba(244, 158, 158, 0.41)",
          tension: 0.5,
          borderWidth: 1,
          label: 'Last Week',
        }];

        break;
    }
    this.charts.forEach((child) => {
      child.chart.update()
    });
    this.loadingController.dismiss();
  }

  changeType(type) {
    this.currentType = type;
    this.segmentChanged(this.currentRange);
  }

  async showProfile() {
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
    final.Net = final.Net

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
    final.Net = final.Net
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
    final.Net = final.Net
    //console.log("hour final",moment(final.Code, ["HH.mm"]).format("hh:mm a"))
    return final;
  }

  cuculatePercent(tmpsales, tmptrx, currentsales, currenttrx) {
    this.salespercent = parseInt(((1 - (tmpsales / currentsales)) * 100).toString());
    this.trxpercent = parseInt(((1 - (tmptrx / currenttrx)) * 100).toString());
  }

  countTotalTrx(res) {
    var countTrx = 0;
    for (let i of res) {
      countTrx = countTrx + parseInt(i.Trx);
    }
    //console.log("totaltrxx",countTrx)
    return countTrx;
  }

  countAvgTrx() {
    return (this.txt_totalsales / this.txt_totaltrx);
  }
  countfxAvgTrx(){
    return (this.fx_txt_totalsales / this.fx_txt_totaltrx);
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
    final.Net = final.Net.toLocaleString('en-US', {minimumFractionDigits: 2})
    return final;
  }

  countTop10Outlet(res) {
    var result = [];
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        res[value.Code] = { Desc: value.Desc, Code: moment(value.Code, ["HH.mm"]).format("hh:mm a"), Net: 0 };
        //res[value.Code] = { Desc: value.Desc, Code:value.Code, Net: 0 };
        result.push(res[value.Code])
      }
      res[value.Code].Net += parseFloat(value.Net);
      return res;
    }, {});
    return result.sort((a, b) => parseFloat(b.Net) - parseFloat(a.Net));
  }

  countTop10Hour(res) {
    var result = [];
    res.reduce((res, value) => {
      if (!res[value.Code]) {
        //res[value.Code] = { Desc: value.Desc, Code:moment(value.Code, ["HH.mm"]).format("hh:mm a"), Net: 0 };
        res[value.Code] = { Desc: value.Desc, Code: value.Code, Net: 0 };
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

  onClickSlide(id, month) {
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
      duration: 60000
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

  datepicker(date) {
    this.unformatcurrentDate = moment(date).format('YYYY-MM-DD');
    this.currentDate = moment(date).format('YYMMDD');
    this.getAllsales();
    // this.segmentChanged(this.currentRange);
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
    let col = [];
    for(let i = 0;i < 50;i++){
      col.push({text :i+1 ,value : i+1});
    }
      const picker = await this.pickerController.create({
        buttons: [
          {
            text: 'Confirm',
            handler: (selected) => {
              this.qtn = selected.qty.value;
            },
          }
        ],
        columns: [
          {
            name: 'qty',
            options:col
          }
        ]
      });
      await picker.present();
    }

}