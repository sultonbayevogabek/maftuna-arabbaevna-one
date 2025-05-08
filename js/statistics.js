'use strict';

class Statistics {
  PROJECT_NAME = window.location.host.replace(/\./g, '-');
  DB_URL = 'https://webinar-pages-statistics-default-rtdb.firebaseio.com/';
  ENTERED_DB = `${this.DB_URL}${this.PROJECT_NAME}-entered.json`;
  CLICKED_REG_BTN_DB = `${this.DB_URL}${this.PROJECT_NAME}-clicked-reg-btn.json`;
  SUBMITTED_FORM_DB = `${this.DB_URL}${this.PROJECT_NAME}-submitted-form.json`;
  REGISTERED_DB = `${this.DB_URL}${this.PROJECT_NAME}-registered.json`;
  CLICKED_TG_BTN_DB = `${this.DB_URL}${this.PROJECT_NAME}-clicked-tg-btn.json`;

  async init() {
    this.initUserId();
    await this.onUserEnter();
  }

  initUserId() {
    if (this.userId) {
      return;
    }

    this.userId = this.generateUUID();
  }

  get time() {
    return new Date().getTime();
  }

  getUtmParams() {
    const queryParams = new URLSearchParams(
      window.location.search
    );
    return {
      utmSource: queryParams.get("utm_source") ?? '-',
      utmMedium: queryParams.get("utm_medium") ?? '-',
      utmCampaign: queryParams.get("utm_campaign") ?? '-'
    };
  }

  getUserDeviceInfo() {
    try {
      const userAgent = navigator.userAgent;

      const deviceType = /Mobi|Tablet|iPad|iPhone/.test(userAgent)
        ? (/Tablet|iPad/.test(userAgent) ? 'Tablet' : 'Mobile')
        : 'Desktop';

      const osInfo = (() => {
        if (/Windows NT 10/.test(userAgent)) {
          return 'Windows 10';
        }
        if (/Windows NT 6\.1/.test(userAgent)) {
          return 'Windows 7';
        }
        if (/Windows NT 6\.2/.test(userAgent)) {
          return 'Windows 8';
        }
        if (/Mac OS X/.test(userAgent)) {
          return `MacOS ${userAgent.match(/Mac OS X ([\d_]+)/)?.[1].replace(/_/g, '.')}`;
        }
        if (/Android/.test(userAgent)) {
          return `Android ${userAgent.match(/Android ([\d\.]+)/)?.[1]}`;
        }
        if (/iPhone OS/.test(userAgent)) {
          return `iOS ${userAgent.match(/iPhone OS ([\d_]+)/)?.[1].replace(/_/g, '.')}`;
        }
        if (/Linux/.test(userAgent)) {
          return 'Linux';
        }
        return 'Unknown OS';
      })();

      const browserInfo = (() => {
        if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
          return `Chrome ${userAgent.match(/Chrome\/([\d\.]+)/)?.[1]}`;
        }
        if (/Edge/.test(userAgent)) {
          return `Edge ${userAgent.match(/Edg\/([\d\.]+)/)?.[1]}`;
        }
        if (/Firefox/.test(userAgent)) {
          return `Firefox ${userAgent.match(/Firefox\/([\d\.]+)/)?.[1]}`;
        }
        if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
          return `Safari ${userAgent.match(/Version\/([\d\.]+)/)?.[1]}`;
        }
        return 'Unknown Browser';
      })();

      const screenSize = `${window.screen.width}x${window.screen.height}`;
      const isRetina = window.devicePixelRatio > 1;

      const screenInches = (() => {
        const dpi = window.devicePixelRatio * 96; // taxminiy DPI
        const widthInInches = window.screen.width / dpi;
        const heightInInches = window.screen.height / dpi;
        return Math.sqrt(widthInInches ** 2 + heightInInches ** 2).toFixed(2);
      })();

      return {
        deviceType,
        operatingSystem: osInfo,
        browser: browserInfo,
        screenSize,
        isRetina,
        screenInches
      }
    } catch (e) {
    }
  }

  set userId(userId) {
    localStorage.setItem('userId', userId);
  }

  get userId() {
    return localStorage.getItem('userId') ?? null;
  }

  recordAction(action) {
    localStorage.setItem(action, 'true');
  }

  checkAction(action) {
    return localStorage.getItem(action) ?? null;
  }

  generateUUID() {
    let uuid = "";
    const chars = "0123456789abcdef";

    for (let i = 0; i < 36; i++) {
      if ([8, 13, 18, 23].includes(i)) {
        uuid += "-";
      } else if (i === 14) {
        uuid += "4";
      } else if (i === 19) {
        uuid += chars[(Math.random() * 4) | 8];
      } else {
        uuid += chars[Math.floor(Math.random() * 16)];
      }
    }

    return uuid;
  }

  async onAction(DB_URL, action, data = {userId: this.userId, time: this.time}) {
    if (this.checkAction(action)) {
      return;
    }

    let response = await fetch(DB_URL, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        ...this.getUtmParams(),
        action
      })
    })

    response = await response.json()
    if (response && response.name) {
      this.recordAction(action)
    }
  }

  async onUserEnter() {
    const data = {
      ...this.getUserDeviceInfo(),
      userId: this.userId,
      time: this.time
    }
    await this.onAction(this.ENTERED_DB, 'hasVisited', data);
  }

  async onClickRegBtn() {
    await this.onAction(this.CLICKED_REG_BTN_DB, 'hasClickedRegBtn');
  }

  async onSubmitForm() {
    await this.onAction(this.SUBMITTED_FORM_DB, 'hasSubmittedForm');
  }

  async onRegister(user) {
    const data = {
      user,
      time: this.time,
      userId: this.userId
    }
    await this.onAction(this.REGISTERED_DB, 'hasRegistered', data);
  }

  async onClickTgBtn() {
    await this.onAction(this.CLICKED_TG_BTN_DB, 'hasClickedTgBtn');
  }

  async getStatisticsData() {
    return (await Promise.all([
      (await fetch(this.ENTERED_DB)).json(),
      (await fetch(this.CLICKED_REG_BTN_DB)).json(),
      (await fetch(this.SUBMITTED_FORM_DB)).json(),
      (await fetch(this.REGISTERED_DB)).json(),
      (await fetch(this.CLICKED_TG_BTN_DB)).json(),
    ])).map(dbData => {
      const data = [];
      for (const dbKey in dbData) {
        data.push(dbData[dbKey]);
      }
      return data;
    })
  }
}

(async () => {
  await new Statistics().init();
})();




