import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit,Input } from '@angular/core';
import { AlertController, ModalController, NavController, ToastController } from '@ionic/angular';
import { BubbleController } from 'chart.js';
import { Device } from '@awesome-cordova-plugins/device/ngx';


@Component({
  selector: 'app-filteroutlet',
  templateUrl: './filteroutlet.page.html',
  styleUrls: ['./filteroutlet.page.scss'],
})
export class FilteroutletPage implements OnInit {

  @Input() storeList = [];
  taggDefaultColor: any;
  storelist = [];
  currentEmail:string = "";
  inputPass = '';
  expDate = Date

  constructor(private modal:ModalController,
    private toastController:ToastController,
    private http: HttpClient,
    private device: Device,
    private alertCtrl: AlertController,) { }

  ngOnInit() {
    let data = JSON.parse(localStorage.getItem('qubelive_user'));
    this.currentEmail = data.email;
    this.inputPass = data.pass;
    this.expDate = data.expDate
  }

  remove(i){
    var [storeFilterStatus,storeFilterFavorities]=this.gettrueStore();
    if(storeFilterStatus > 1 || storeFilterFavorities> 0 ){
      this.storeList[i].status = false;
      this.storeList[i].flavorite = false;
    }else{
      this.presentToast('Please select atleast one store')
    }
    this.storelist = this.storeList.filter(x=>x.flavorite == true).map((item) => {
      return item['id'];
    });
  }

  gettrueStore(){
    var storeFilterStatus = this.storeList.filter(item => item.status == true).length
    var storeFilterFavorities = this.storeList.filter(item => item.flavorite == true).length
    return [storeFilterStatus,storeFilterFavorities];
  }

  add(i){
    var [storeFilterStatus,storeFilterFavorities]=this.gettrueStore();
    if(storeFilterStatus >= 20 || storeFilterFavorities>=20 ){
      this.presentToast('Max 20 Outlet!')
    }else{
      this.storeList[i].status = true;
      this.storelist = this.storeList.filter(x=>x.flavorite == true).map((item) => {
        return item['id'];
      });
    }
  }

  addFlavorite(i)
  {
    var [storeFilterStatus,storeFilterFavorities]=this.gettrueStore();
    if(storeFilterStatus >= 20 || storeFilterFavorities>=20 ){
      this.presentToast('Max 10 Outlet!')
    }else{
      this.storeList[i].flavorite = true;
      this.storelist = this.storeList.filter(x=>x.flavorite == true).map((item) => {
        return item['id'];
      });
    }
    console.log("storeFavorities",this.storelist)
  }

  done(){
    this.uploadfavOutlet(this.currentEmail,this.storelist)
    this.modal.dismiss({
      'storeList': this.storeList
    })
    //console.log('storeList',this.storeList.filter(x=>x.status == true)) 
  }

  clearall(){
    for(let i of this.storeList){
      i.status = false;
      i.flavorite = false;
    }
    this.storeList[0].status = true;
    this.storelist = this.storeList.filter(x=>x.flavorite == true).map((item) => {
      return item['id'];
    });
  }

  async presentToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }

  async uploadfavOutlet(email,storelist) 
  {
    let postData = new URLSearchParams();
    postData.append('email', email);
    postData.append('storelist', storelist);

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };
    
    this.http.post('https://qubelive.com.my/QubeSR/User/updatefavoutlet.php', postData.toString(), httpOptions).subscribe((response: any) => {
      if (response['status'] == '1') {
        response.email = this.currentEmail;
        response.imei =this.device.uuid;
        response.device = this.device.platform;
        response.pass = this.inputPass;
        response.expDate = this.expDate;
        response.favOutlet = this.storelist;
        localStorage.setItem('qubelive_user',JSON.stringify(response))
      }else{
      }
     
    });
    console.log("check",JSON.parse(localStorage.getItem('qubelive_user')))
  }

  async resultAlert(header, msg) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: msg,
      buttons: [{
        text: 'OK',
        handler: () => {
          alert.dismiss();
        }
      }]
    });
    await alert.present();
  }

}
