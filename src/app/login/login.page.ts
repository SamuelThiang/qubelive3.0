import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { NavController, ToastController } from '@ionic/angular';
import { AuthGuardService } from '../services/auth.guard';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  inputEmail = '';
  inputPass = '';
  remembercheck: boolean = false;

  constructor(private auth:AuthGuardService,
    private http: HttpClient,
    private device: Device,
    private nav:NavController,
    private toastController:ToastController,
    private nativeStorage: NativeStorage) 
  {
    this.nativeStorage.getItem('rmbacc')
    .then(
      data => {
        if (data != '') {
          this.inputEmail = data.id;
          this.inputPass = data.pass;
          this.remembercheck = data.ischeck;
          this.nav.navigateRoot('tabs');
          this.presentToast('LOGIN SUCCESSFUL');
        }
      },
      error => console.error("empty user & pass :", error)
    );

  }

  ngOnInit() {
  }

  async presentAlert() {
    //SEND USERNAME & PASSWORD TO SERVER CHECK LOGIN
    let postData = new URLSearchParams();
    postData.append('email', this.inputEmail);
    postData.append('password', this.inputPass);
    postData.append('imei', this.device.uuid);
    postData.append('device', this.device.platform);

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };

    this.http.post('https://qubelive.com.my/QubeSR/User/login.php', postData.toString(), httpOptions).subscribe((response: any) => {

      if (this.remembercheck) {
        this.nativeStorage.setItem('rmbacc', { 'id': this.inputEmail, 'pass': this.inputPass, 'ischeck': 'true' })
          .then(
            () => console.log('Remember Account!'),
            error => console.error('Remember Account Failed', error)
          );
          console.log("check login",this.nativeStorage.getItem('rmbacc'))
      } else {
        this.nativeStorage.remove('rmbacc')
          .then(
            () => console.log('Removed Account!'),
            error => console.error('Removed Account Failed', error)
          );
          console.log("nocheck login")
      }

      if(response.status == '1'){
        response.email = this.inputEmail;
        response.imei =this.device.uuid;
        response.device = this.device.platform;
        response.pass = this.inputPass;
        localStorage.setItem('qubelive_user',JSON.stringify(response))
        this.dlReportList(response.path);
        this.nav.navigateRoot('tabs');
        this.presentToast('LOGIN SUCCESSFUL');
      }else{
        this.presentToast('USER NOT FOUND');
      }

    }, error => {
      this.presentToast('LOGIN FAILED : '+ error);
    });

  }
   //READ REPORTLIST FROM SERVER & SAVE TO SQLITE
   async dlReportList(path) {
    let postData = new URLSearchParams();
    postData.append('operation', 'reportList');
    postData.append('path', path);

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };

    this.http.post('https://qubelive.com.my/QubeSR/User/ListAll.php', postData.toString(), httpOptions).subscribe((response: any) => {
      localStorage.setItem('qubelive_report',JSON.stringify(response));
      this.dlStoreList(path);
    }, error => {
      console.error(error);
    });
  }

  rememberme(event) {
    if (event.target.checked) {
      this.remembercheck = true;

    } else {
      this.remembercheck = false;
    }
  }

  //READ STORELIST FROM SERVER & SAVE TO SQLITE
  async dlStoreList(path) {
    let postData = new URLSearchParams();
    postData.append('operation', 'storeList');
    postData.append('path', path);

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };

    this.http.post('https://qubelive.com.my/QubeSR/User/ListAll.php', postData.toString(), httpOptions).subscribe((response: any) => {
      localStorage.setItem('qubelive_store',JSON.stringify(response));
    }, error => {
      console.error(error);
    });
  }
  async presentToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }
}
