import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, NavController, Platform } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { modalController, ViewController } from '@ionic/core';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  inputUser: string = "-";
  inputPass: string = "-";
  inputExpireDate: string = "-";
  inputAppVer: string = "-";
  alertlogout: any;
  loading: any;
  currentmail:string = "";
  oldpass: string = "";

  constructor(
    private router: NavController,
    private alertCtrl: AlertController,
    private http: HttpClient,
    public loadingController: LoadingController,
    public modal:ModalController
    ) { }

  ngOnInit() {
    let data = JSON.parse(localStorage.getItem('qubelive_user'));
    console.log("Did data load? : ", data);
    this.inputUser = data.email;
    this.currentmail = data.email;
    this.oldpass = data.pass;
    this.inputPass = this.oldpass;
    this.inputExpireDate = data.expDate;
    this.inputAppVer = '2.0.0';
  }

  async changePass() {
    let alert = await this.alertCtrl.create({
      header: 'Change Password',
      inputs: [
        {
          name: 'oldPassword',
          type: 'password',
          placeholder: 'Old Password'
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'New Password'
        },
        {
          name: 'repeatPassword',
          type: 'password',
          placeholder: 'Repeat New Password'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Send Email',
          handler: data => {
            if(data.oldPassword == this.oldpass){
              if(data.newPassword == data.repeatPassword){
                this.changePwd(data.newPassword,this.currentmail);
              }else{
                this.resultAlert('Failed','New Password Not Same With Repeat Password');
              }
            }else{
              this.resultAlert('Failed','Wrong Old Password');
            }
          }
        }
      ]
    });
    await alert.present();
  }
  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'LOGOUT',
      message: "ARE YOU SURE TO LOGOUT?",
      buttons: [{
        text: 'NO',
        handler: () => {
          console.log('cancel logout');
          alert.dismiss();
        }
      }, {
        text: 'YES',
        handler: () => {
          console.log('logout');
          localStorage.clear();
          modalController.dismiss()
          this.router.navigateBack('/login');
        }
      }]
    });
    await alert.present();
  }

  async changePwd(newPass,email){
    this.loading = await this.loadingController.create({
      message: 'Changing Password...',
    });
    this.loading.present();

    let postData = new URLSearchParams();
    postData.append('email', email);
    postData.append('password', newPass);

    console.log("chcek email.newpass",email,newPass);

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };

    this.http.post('https://qubelive.com.my/QubeSR/User/chgpwd.php', postData.toString(), httpOptions).subscribe((response: any) => {
      if (response['status'] == '1') {
        this.resultAlert('Successful', 'Your Password Changed Succesfully');
        this.loading.dismiss();
      }else{
        this.resultAlert('Failed', 'Please Try Again Later....');
        this.loading.dismiss();
      }
    }, error => {
      console.log('Change Password FAILED : ', error);
    });
    setTimeout(() => {
      console.log("timeout")
      this.loading.dismiss();
    }, 10000);
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
